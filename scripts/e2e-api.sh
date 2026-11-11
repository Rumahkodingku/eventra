#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${E2E_DB_NAME:-eventra_e2e}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
API_PORT="${E2E_API_PORT:-18080}"
WEB_PORT="${E2E_WEB_PORT:-3100}"
DATABASE_URL="eventra:eventra@tcp(127.0.0.1:${MYSQL_PORT})/${DB_NAME}?parseTime=true&charset=utf8mb4&loc=UTC"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
API_PID=""
WEB_PID=""

cleanup() {
  if [[ -n "$WEB_PID" ]]; then kill -- -"$WEB_PID" 2>/dev/null || true; fi
  if [[ -n "$API_PID" ]]; then kill -- -"$API_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

if curl -sf "http://127.0.0.1:${API_PORT}/api/v1/health/ready" >/dev/null 2>&1; then
  echo "Port ${API_PORT} already serves an API; stop it before running API E2E." >&2
  exit 1
fi
if curl -sf "http://localhost:${WEB_PORT}/" >/dev/null 2>&1; then
  echo "Port ${WEB_PORT} already serves a web app; stop it before running API E2E." >&2
  exit 1
fi

cd "$ROOT"
MYSQL_PORT="$MYSQL_PORT" docker compose up -d mysql redis >/dev/null
for _ in $(seq 1 60); do
  if docker compose ps mysql 2>/dev/null | grep -q healthy; then break; fi
  sleep 2
done

docker compose exec -T mysql mysql -uroot -proot -e \
  "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO 'eventra'@'%'; FLUSH PRIVILEGES;" \
  >/dev/null 2>&1

cd "$ROOT/apps/api"
export APP_ENV=development
export DATABASE_URL REDIS_URL
export MIGRATIONS_DIR=./migrations
go run ./cmd/migrate up >>/tmp/eventra-e2e-migrate.log 2>&1
go run ./cmd/seed >>/tmp/eventra-e2e-seed.log 2>&1
CATALOG_SEED_FILE=./seed/catalog.json go run ./cmd/seed-catalog >>/tmp/eventra-e2e-seed.log 2>&1

HTTP_ADDR=":${API_PORT}" WEB_ORIGIN="http://localhost:${WEB_PORT}" \
  JWT_SECRET=e2e-secret JWT_ACCESS_TTL_MINUTES=60 JWT_REFRESH_TTL_HOURS=720 \
  COOKIE_SECURE=false MOCK_PAYMENT_SECRET=mock-payment-secret \
  setsid go run ./cmd/api >/tmp/eventra-e2e-api.log 2>&1 &
API_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${API_PORT}/api/v1/health/ready" >/dev/null; then break; fi
  sleep 1
done
curl -sf "http://127.0.0.1:${API_PORT}/api/v1/health/ready" >/dev/null

cd "$ROOT/apps/web"
setsid env NEXT_PUBLIC_API_MODE=api \
  NEXT_PUBLIC_API_BASE_URL="http://localhost:${API_PORT}/api/v1" \
  npm run dev -- --port "$WEB_PORT" >/tmp/eventra-e2e-web.log 2>&1 &
WEB_PID=$!

for _ in $(seq 1 90); do
  if curl -sf "http://localhost:${WEB_PORT}/" >/dev/null; then break; fi
  sleep 1
done
curl -sf "http://localhost:${WEB_PORT}/" >/dev/null

E2E_BASE_URL="http://localhost:${WEB_PORT}" \
  npx playwright test e2e/api.spec.ts --project=chromium \
  --config playwright.api.config.ts
