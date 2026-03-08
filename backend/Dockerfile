FROM python:3.13-slim

# Keep Python output unbuffered and make pip quieter and cache-free
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install minimal build dependencies needed for packages that compile native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    cargo \
    rustc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements first to leverage Docker layer caching
COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create runtime directories
RUN mkdir -p storage chroma_data

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
