param(
    [string]$BindHost = "0.0.0.0",
    [int]$Port = 8000,
    [ValidateSet("api", "worker", "both")]
    [string]$Mode = "api",
    [switch]$StartInfra,
    [switch]$NoReload,
    [switch]$SkipInfra,
    [switch]$SkipMigrations,
    [string]$WorkerLogLevel = "INFO",
    [int]$MigrationRetries = 20,
    [int]$RetryDelaySeconds = 3
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function Invoke-WithRetry {
    param(
        [scriptblock]$Action,
        [string]$StepName,
        [int]$MaxAttempts,
        [int]$DelaySeconds
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            & $Action
            return
        }
        catch {
            if ($attempt -eq $MaxAttempts) {
                throw "${StepName} failed after $MaxAttempts attempts. $($_.Exception.Message)"
            }

            Write-Host "$StepName attempt $attempt/$MaxAttempts failed. Retrying in $DelaySeconds seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}

function Assert-PortAvailable {
    param(
        [string]$Address,
        [int]$Port
    )

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($null -eq $listeners) {
        return
    }

    $blocked = $false
    foreach ($listener in $listeners) {
        if ($Address -eq "0.0.0.0" -or $Address -eq "::" -or $listener.LocalAddress -eq "0.0.0.0" -or $listener.LocalAddress -eq "::" -or $listener.LocalAddress -eq $Address) {
            $blocked = $true
            break
        }
    }

    if ($blocked) {
        $owners = ($listeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ", "
        throw "Port $Port is already in use by process(es): $owners. Use -Port to choose another port or stop the existing process."
    }
}

Require-Command "uv"

$backendPath = Split-Path -Parent $PSCommandPath
Push-Location $backendPath

try {
    if (-not (Test-Path ".env")) {
        Write-Host "Warning: .env file not found in backend/. Some settings may be missing." -ForegroundColor Yellow
    }

    if ($StartInfra -and -not $SkipInfra) {
        Require-Command "docker"
        Write-Step "Starting PostgreSQL and Redis via backend/docker-compose.yml"
        docker compose up -d postgres redis
    }

    if (-not $SkipMigrations) {
        Write-Step "Running Alembic migrations (upgrade head)"
        Invoke-WithRetry -StepName "Alembic migration" -MaxAttempts $MigrationRetries -DelaySeconds $RetryDelaySeconds -Action {
            uv run python -m alembic upgrade head
            if ($LASTEXITCODE -ne 0) {
                throw "Alembic command exited with code $LASTEXITCODE"
            }
        }
    }

    if ($Mode -eq "worker") {
        Write-Step "Starting Celery worker"
        uv run celery -A app.workers.celery_app worker --loglevel $WorkerLogLevel
        return
    }

    if ($Mode -eq "both") {
        Assert-PortAvailable -Address $BindHost -Port $Port
        Write-Step "Starting Celery worker in background"
        $workerProcess = Start-Process -FilePath "uv" -ArgumentList @(
            "run",
            "celery",
            "-A",
            "app.workers.celery_app",
            "worker",
            "--loglevel",
            $WorkerLogLevel
        ) -PassThru

        try {
            Write-Step "Starting FastAPI backend on ${BindHost}:$Port"
            uv run python -m uvicorn main:app `
                --host $BindHost `
                --port $Port `
                --reload `
                --reload-dir $backendPath
            }
        finally {
            if ($null -ne $workerProcess -and -not $workerProcess.HasExited) {
                Write-Step "Stopping background Celery worker"
                Stop-Process -Id $workerProcess.Id -Force
            }
        }

        return
    }

    Write-Step "Starting FastAPI backend on ${BindHost}:$Port"
    Assert-PortAvailable -Address $BindHost -Port $Port
    uv run python -m uvicorn main:app `
        --host $BindHost `
        --port $Port `
        --reload `
        --reload-dir $backendPath
}
finally {
    Pop-Location
}
