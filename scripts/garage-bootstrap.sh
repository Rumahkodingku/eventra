#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACCESS_KEY="${GARAGE_S3_ACCESS_KEY:-GK000000000000000000000000}"
SECRET_KEY="${GARAGE_S3_SECRET_KEY:-0000000000000000000000000000000000000000000000000000000000000000}"
BUCKET="${GARAGE_BUCKET:-eventra-uploads}"
KEY_NAME="${GARAGE_KEY_NAME:-eventra-uploads}"

cd "$ROOT"

for _ in $(seq 1 60); do
  if docker compose exec -T garage /garage status >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

NODE_ID="$(docker compose exec -T garage /garage node id | sed 's/@.*//' | tr -d '\r')"
if [[ -z "$NODE_ID" ]]; then
  echo "Garage node id is empty" >&2
  exit 1
fi

docker compose exec -T garage /garage layout assign -z dc1 -c 1G "$NODE_ID" || true
docker compose exec -T garage /garage layout apply --version 1 || true

docker compose exec -T garage /garage key import "$ACCESS_KEY" "$SECRET_KEY" -n "$KEY_NAME" --yes || true
docker compose exec -T garage /garage key allow "$KEY_NAME" --create-bucket || true
docker compose exec -T garage /garage bucket create "$BUCKET" || true
docker compose exec -T garage /garage bucket allow --read --write --owner --key "$KEY_NAME" "$BUCKET" || true

echo "Garage ready: bucket=$BUCKET key=$KEY_NAME access_key=$ACCESS_KEY"
