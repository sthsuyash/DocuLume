# Self-hosting

Purpose: concise instructions to run DocuLume in a self-hosted environment.

Quick steps

1. Ensure environment secrets are available (JWT keys, provider keys, DB and Redis URLs).
2. Configure `docker/compose` files for your target topology.
3. Build images and start with the fullstack compose for evaluation.

Validation

- Verify ingress, TLS, and CORS settings. Check health endpoints and end-to-end upload+chat flow.
