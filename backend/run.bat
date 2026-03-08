@echo off
REM Backend startup script for Windows

echo DocuLume Backend - Starting...

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found
    echo Copy .env.example to .env and configure it first
    exit /b 1
)

REM Check if virtual environment exists
if not exist .venv (
    echo Virtual environment not found. Creating...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

REM Run migrations
echo Running database migrations...
alembic upgrade head

REM Start the server
echo Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo OpenAPI docs at: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
