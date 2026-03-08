# Contributing Guide

Contribution standards and workflow for DocuLume.

## Contribution Principles

- Keep changes scoped and reviewable.
- Maintain production-quality coding standards.
- Include tests and documentation for behavior changes.
- Preserve security and operational constraints.

## Development Workflow

1. Fork and clone repository.
2. Create a feature branch from the primary integration branch.
3. Implement changes with tests.
4. Run local validation.
5. Open pull request with clear change description.

## Branch and Commit Conventions

### Branch Naming

- `feature/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`

### Commit Message Conventions

Use conventional commit style:

- `feat:` new functionality
- `fix:` bug resolution
- `docs:` documentation changes
- `refactor:` non-functional structural changes
- `test:` test updates
- `chore:` maintenance tasks

## Local Setup

- Backend setup: [Backend Setup Guide](../backend/SETUP.md)
- Full project setup: [Setup Guide](./SETUP.md)

## Validation Checklist (Pre-PR)

- Relevant tests are added or updated.
- Existing tests pass locally.
- Linting and type checks pass.
- Documentation reflects behavior or workflow changes.
- No secrets or sensitive data are committed.

## Pull Request Requirements

Each pull request should include:

- Problem statement and business/technical context
- Summary of changes
- Testing evidence (commands and outcomes)
- Risk/rollback notes for operationally significant updates

## Security Requirements

- Do not commit credentials, keys, or tokens.
- Follow least-privilege patterns in new integrations.
- Report security vulnerabilities privately to maintainers.

## Support and Questions

- Open a GitHub discussion for design questions.
- Open an issue for defects and reproducible failures.
