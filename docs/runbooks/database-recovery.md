# Runbook: Database Recovery

## Restore from backup

Backups are stored in the `db_backups` Docker volume, created daily at 02:00 UTC by the `db-backup` service.

### List available backups

```bash
docker run --rm -v doculume_db_backups:/backups alpine ls -lh /backups
```

### Restore a backup

```bash
# Stop the backend to prevent writes during restore
docker compose stop backend

# Copy the backup out of the volume (replace FILENAME with the actual file)
docker run --rm -v doculume_db_backups:/backups -v $(pwd):/out alpine \
  cp /backups/FILENAME.sql.gz /out/

# Decompress
gunzip FILENAME.sql.gz

# Drop and recreate the database
docker compose exec postgres psql -U ${POSTGRES_USER:-raguser} -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-ragdb};"
docker compose exec postgres psql -U ${POSTGRES_USER:-raguser} -c "CREATE DATABASE ${POSTGRES_DB:-ragdb};"

# Restore
cat FILENAME.sql | docker compose exec -T postgres psql \
  -U ${POSTGRES_USER:-raguser} \
  -d ${POSTGRES_DB:-ragdb}

# Run any pending migrations
docker compose run --rm backend alembic upgrade head

# Restart backend
docker compose start backend
```

### Verify restore

```bash
curl https://api.your-domain.com/api/v1/health/ready
```

## Point-in-time considerations

The backup script does full dumps (no WAL archiving). The most you can lose is the data written since the last backup (up to ~24 hours). For zero data-loss requirements, configure PostgreSQL WAL archiving to S3.
