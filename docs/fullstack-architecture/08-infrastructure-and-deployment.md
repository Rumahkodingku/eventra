# 08 — Infrastructure and Deployment

**Status:** Proposed baseline v1.0

## Initial topology

Single VPS with Docker Compose: reverse proxy (Caddy/Nginx), Next.js web, Go API, MySQL, Redis, optional worker. S3-compatible storage is external. Only 80/443 public; MySQL/Redis private Docker network only.

## Container rules

Pinned image versions; multi-stage builds; non-root runtime where practical; health checks; named DB volume; restart/resource policies; runtime secrets injected at deploy; production images do not mount source. `.dockerignore` excludes `.git`, `node_modules`, `.next`, Go caches, local env and test artifacts. API migrations run as controlled one-off release job.

## Configuration

Document names in `.env.example` only: `APP_ENV`, `HTTP_ADDR`, web/API origins, DB/Redis URLs, JWT issuer/audience/TTLs, cookie/CSRF settings, S3 endpoint/bucket/credentials, payment provider config and log level. Validate at startup; never commit real `.env` or secrets.

## Redis policy

Use for selective public cache, rate limiting and short-lived ephemeral data. Explicit TTL, invalidation and stampede protection. MySQL remains authority for inventory, order, payment and ticket. Losing Redis must not corrupt transactions.

## Object storage

S3-compatible bucket for event images, organizer logos and exports. Server-generated keys, presigned uploads, MIME/content/size validation, private by default, public delivery only for approved assets, cleanup abandoned uploads and lifecycle/backup policy.

## Observability

Structured JSON logs with request ID; metrics for latency/errors, DB pool, cache, checkout, webhook, reservation expiry and check-in conflicts; tracing where practical; PII-scrubbed error reporting. Separate liveness/readiness. Alert on disk/memory, DB exhaustion, backup failures and webhook failures.

## Backup and recovery

Automated encrypted MySQL backups with offsite copy. Define RPO/RTO. Regularly restore into separate environment. Back up/version object assets. Document recovery order and verify transactional invariants. An untested backup is not verified.

## Deployment workflow

CI validates/tests/builds immutable images by commit SHA → staging → controlled migration → deploy compatible API/web → smoke test → observe → rollback app image or forward-fix schema. Never assume destructive down migration is safe.

## Single VPS caveat

It is a single point of failure. Before public production, plan managed DB if affordable, offsite backup, firewall, SSH key-only, patch policy, monitoring, resource sizing and incident response.
