#!/bin/bash
# Backend startup script for Linux/Mac

set -e

echo "DocuLume Backend - Starting..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found"
    echo "Copy .env.example to .env and configure it first"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d .venv ]; then
    echo "Virtual environment not found. Creating..."
    python -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the server
echo "Starting FastAPI server..."
echo "API will be available at: http://localhost:8000"
echo "OpenAPI docs at: http://localhost:8000/docs"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
