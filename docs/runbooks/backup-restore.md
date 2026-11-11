# Backup and restore runbook

## Backup

```bash
DB_NAME=eventra MYSQL_PORT=3307 ./scripts/backup-mysql.sh
```

The script writes `backups/<db>-<UTC timestamp>.sql.gz`, uses `mysqldump --single-transaction`, and deletes local dumps older than 7 days. Copy the file off the host after it is created; the script does not upload it.

## Restore drill

```bash
DB_NAME=eventra ./scripts/backup-mysql.sh
./scripts/restore-mysql.sh backups/eventra-<timestamp>.sql.gz eventra_restore
docker compose exec -T mysql mysql -uroot -proot eventra_restore \
  -e "SELECT COUNT(*) AS events FROM events; SELECT COUNT(*) AS orders FROM orders;"
```

## Targets

- RPO: last successful daily backup.
- RTO: time to pull the dump plus MySQL import. Measure on staging; local drill is not a production SLA.

## Limits

- Offsite encrypted storage and automated scheduling depend on the deployment platform and are not implemented in this repository.
- Restore always drops the target database. Never point it at a live database.
