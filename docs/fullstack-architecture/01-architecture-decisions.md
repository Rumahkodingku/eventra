# 01 — Architecture Decisions

**Status:** Proposed baseline v1.0

## Target topology

```text
Browser --HTTPS--> Reverse Proxy
                      |--> Next.js Web
                      |--> Go/Gin API
                              |--> MySQL (authoritative)
                              |--> Redis (cache / ephemeral)
                              |--> S3-compatible storage
```

Use same-site routing where possible (for example `/api/*` to API) to simplify secure cookie handling.

## Evaluation

| Choice                | Evaluation / required refinement                                                        |
| --------------------- | --------------------------------------------------------------------------------------- |
| Single monorepo       | Good. Turbo orchestrates tasks; Go Modules remain independent.                          |
| Incremental migration | Correct. Move frontend with no behavior changes first.                                  |
| Modular monolith      | Correct; one deployable API with explicit domain boundaries.                            |
| JWT cookies           | Good for browser; requires refresh rotation, revocation, CSRF and correct cookie scope. |
| RBAC                  | Add organization membership and resource ownership checks.                              |
| Guest checkout        | Use random guest principal/claim secret; email is not proof of order ownership.         |
| Payment adapter       | Mock provider first; verify webhooks and make processing idempotent.                    |
| MySQL locking         | Correct source of concurrency safety; Redis locks are never the only guard.             |
| Selective Redis       | Cache public/read data and rate limits; never authoritative inventory/payment.          |
| golang-migrate        | Versioned SQL; avoid production AutoMigrate.                                            |
| OpenAPI               | Canonical contract; generate TS client and check breaking changes in CI.                |
| S3-compatible         | Use server-generated keys, presigned URLs and upload validation.                        |
| Single VPS            | Pragmatic start; requires offsite backup, restore drills and monitoring.                |
| GitHub Actions        | PR CI separated from protected deployment workflow.                                     |
| Production-ready      | Include security, observability, backup/restore, load and concurrency tests.            |
| Zustand               | Keep UI/client state; API/server state belongs in API/query/repository layer.           |
| Latest stable Go      | Pin exact toolchain and image version for reproducible builds.                          |

## Non-negotiable principles

1. MySQL owns orders, inventory, payments, ticket validity and check-in.
2. Redis is disposable; losing it must not corrupt business state.
3. No business logic in Gin handlers; no HTTP dependencies in domain.
4. No client-supplied price/role/stock/payment state is trusted.
5. No long DB transaction across payment/email/object-storage calls.
6. Browser redirect is not proof of payment; verified webhook is.
7. Organizer access checks permission AND organization/resource ownership.
8. Architecture is a plan until implementation gates pass.

## Implementation status

Phases 0–11 and the code-level parts of Phase 12 are implemented on `migration/fullstack`:

- Go API with MySQL/Redis, migrations, identity, catalog, inventory, cart, checkout, orders, mock payment, tickets, check-in, engagement, analytics, and organizer settings.
- Frontend API adapters are the default runtime. `NEXT_PUBLIC_API_MODE=mock` keeps the mock repository for tests.
- API-backed Playwright covers discovery, organizer event CRUD, customer purchase, failure state, wallet, notifications, wishlist, reviews, settings, and check-in.
- Remaining Phase 12 items are infrastructure-dependent: offsite encrypted backups, staging deployment, rollback drill, load tooling, and dashboards/alerts.

## Open vendor decisions

Payment provider, email provider, object storage vendor, VPS/domain/DNS, error tracking and metrics provider. Select behind adapters after small implementation spikes.
