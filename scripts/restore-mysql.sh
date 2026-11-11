#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ $# -lt 1 ]]; then
  echo "usage: $0 <backup.sql.gz> [database]" >&2
  exit 1
fi
FILE="$1"
DB_NAME="${2:-eventra_restore}"
MYSQL_PORT="${MYSQL_PORT:-3307}"

cd "$ROOT"
MYSQL_PORT="$MYSQL_PORT" docker compose exec -T mysql \
  mysql -uroot -proot -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
gunzip -c "$FILE" | MYSQL_PORT="$MYSQL_PORT" docker compose exec -T mysql mysql -uroot -proot "$DB_NAME"
echo "restored $FILE into $DB_NAME"
