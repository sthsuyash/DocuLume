# Encryption

Purpose: brief guidance for encryption at rest and in transit.

Recommendations

- Use TLS for all external communications (HTTPS). Terminate TLS at the ingress/load balancer.
- Encrypt persistent storage and backups using a managed KMS where available.
- Rotate encryption keys on a regular schedule and maintain secure key custody.

Validation

- Verify HTTPS is enforced and certificates are valid.
- Check backups are stored encrypted and accessible only to authorized systems.
