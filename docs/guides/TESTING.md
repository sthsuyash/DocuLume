# Testing Guide

Test strategy and execution guidance for DocuLume.

## Testing Objectives

- Validate functional correctness of API and UI flows.
- Detect regressions before merge and release.
- Enforce minimum quality and coverage baselines.

## Test Layers

- Unit tests: service and utility behavior
- Integration tests: API, database, and cache interactions
- End-to-end tests: user workflows across frontend and backend
- Security/performance suites: targeted non-functional validation

## Backend Test Execution

```bash
cd backend

# Full suite
uv run pytest -v

# With coverage
uv run pytest --cov=app --cov-report=term-missing

# Parallel execution
uv run pytest -n auto
```

### Auth flow

Tests use cookie-based authentication. The test client stores the `access_token` cookie automatically after calling `/api/v1/auth/login`. Do not look for `access_token` in the JSON response body.

### MIME validation

Document upload tests must use real magic bytes. Use `b"%PDF-1.4 ..."` with a `.pdf` filename — plain text bytes with a PDF extension will be rejected.

## Frontend Test Execution

```bash
cd frontend
pnpm test

# End-to-end
pnpm test:e2e
```

## Coverage Baseline

- CI minimum: **70%** (enforced by `--cov-fail-under=70` in CI)
- Service layer target: 80%+
- Critical auth and document workflows: mandatory coverage

## CI Requirements

Before merge:

- Lint and type checks pass
- Backend tests pass with ≥70% coverage
- All three frontend apps build cleanly (`frontend`, `admin-frontend`, `landing`)
- Security scans pass (Bandit, pip-audit)

## Security Scanning

```bash
cd backend

# Static analysis
bandit -r app/

# Dependency vulnerabilities (replaces `safety check` which requires a paid API key)
pip-audit --requirement requirements.txt

# Semgrep (optional)
semgrep --config=auto app/
```

## Performance / Load Testing

Load tests use [Locust](https://locust.io/):

```bash
cd backend/tests/performance

# Interactive UI at http://localhost:8089
locust -f locustfile.py --host=http://localhost:8000

# Headless (CI)
locust -f locustfile.py --host=http://localhost:8000 \
  --users=50 --spawn-rate=5 --run-time=2m --headless
```

Two user classes are defined:
- `UnauthenticatedUser` (weight 2) — health check traffic
- `AuthenticatedUser` (weight 8) — full flow: register → login → list/search/upload documents → logout

Each virtual user registers with a unique random email, so no pre-seeded accounts are required.

## Troubleshooting

### Reinitialize local dependencies

```bash
docker compose down -v
docker compose up -d postgres redis
```

### Slow test diagnostics

```bash
uv run pytest --durations=10
```

### Coverage report output

```bash
uv run pytest --cov=app --cov-report=html
```

Open `htmlcov/index.html` for the detailed report.
