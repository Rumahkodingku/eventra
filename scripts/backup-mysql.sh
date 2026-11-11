#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${DB_NAME:-eventra}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$ROOT"
MYSQL_PORT="$MYSQL_PORT" docker compose exec -T mysql \
  mysqldump -uroot -proot --single-transaction --routines --triggers "$DB_NAME" \
  | gzip >"$FILE"

find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +7 -delete
echo "$FILE"
