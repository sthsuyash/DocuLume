#!/usr/bin/env sh
# PostgreSQL backup script — runs inside a postgres-compatible container.
# Writes a timestamped gzip dump to /backups and removes dumps older than RETAIN_DAYS.
#
# Required env vars:
#   POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
# Optional:
#   RETAIN_DAYS  (default: 7)
#   BACKUP_DIR   (default: /backups)

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting dump of ${POSTGRES_DB} at ${TIMESTAMP}"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "$FILENAME"

echo "[backup] Dump written to ${FILENAME}"

# Remove dumps older than RETAIN_DAYS
find "$BACKUP_DIR" -name "${POSTGRES_DB}_*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
echo "[backup] Cleaned up dumps older than ${RETAIN_DAYS} days"
