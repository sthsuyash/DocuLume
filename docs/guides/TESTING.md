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

## Frontend Test Execution

```bash
cd frontend

# Unit/integration tests
pnpm test

# End-to-end tests
pnpm test:e2e
```

## Coverage Baseline

- Overall target: 80%+
- Service layer target: 85%+
- Critical auth and document workflows: mandatory coverage

## CI Requirements

Before merge:

- Lint and type checks pass
- Backend tests pass
- Frontend tests pass
- Coverage thresholds satisfied

## Test Data and Mocking

- Use deterministic fixtures and factories.
- Mock external provider calls (LLM APIs and third-party services).
- Do not use production API keys or production datasets in tests.

## Security and Performance Testing

### Security Scans

```bash
cd backend
bandit -r app/
semgrep --config=auto app/
```

### Performance Testing

```bash
cd backend/tests/performance
locust -f locustfile.py
```

## Troubleshooting

### Reinitialize Local Dependencies

```bash
docker compose down -v
docker compose up -d postgres redis
```

### Slow Test Diagnostics

```bash
uv run pytest --durations=10
```

### Coverage Report Output

```bash
uv run pytest --cov=app --cov-report=html
```

Open `htmlcov/index.html` for detailed report output.
