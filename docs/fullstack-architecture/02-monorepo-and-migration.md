# 02 — Monorepo and Migration

**Status:** Proposed baseline v1.0

## Target layout

```text
eventra/
├── apps/
│   ├── web/                 # Existing Next.js app
│   └── api/                 # Go + Gin
│       ├── cmd/api/
│       ├── internal/platform/
│       ├── internal/modules/
│       ├── migrations/
│       ├── openapi/
│       └── go.mod
├── packages/
│   ├── api-client/          # Generated from OpenAPI
│   └── config/              # Shared tooling config, only where useful
├── infra/
│   ├── docker/
│   └── proxy/
├── docs/
├── .github/workflows/
├── package.json
├── package-lock.json
├── turbo.json
└── docker-compose.yml
```

Use npm workspaces for Node apps/packages. Go dependencies stay in `apps/api/go.mod`; Turbo invokes Go commands but does not manage Go modules. Do not hand-maintain duplicate API types in `packages/types`; generate the client/types from OpenAPI.

## Migration sequence

### Stage 0 — Baseline

Record current commit, clean working tree, routes, env assumptions; run frontend build, typecheck, lint, unit and E2E tests.

### Stage 1 — Move frontend

Move current frontend into `apps/web` with minimal changes. Move package manifest; establish root workspaces/lockfile; update config paths, scripts, Playwright, Biome, TS paths, CI and README. Preserve `src`, `public`, assets and route behavior.

**Exit:** same frontend behavior and tests pass from clean checkout.

### Stage 2 — API skeleton

Add pinned Go toolchain, Gin bootstrap, config validation, structured logger, request IDs, graceful shutdown, health/readiness, MySQL/Redis connections and Docker development services.

**Exit:** API starts locally; migrations bootstrap clean DB; secrets are not committed.

### Stage 3 — Contract

Add OpenAPI 3.1, lint/validation, generated TS client and breaking-change check.

### Stage 4 — Vertical slices

Identity/RBAC → public catalog → organizer events → ticket types/inventory → guest/cart/checkout → orders/payment → ticket/check-in → notifications/reviews/analytics.

### Stage 5 — Hardening

Security review, concurrency/load tests, observability, backup/restore, rollback and runbooks.

## Guardrails

- Structural move is a dedicated PR with no product changes.
- Keep existing routes, UI, theme, i18n, assets and tests.
- Replace mock repositories behind existing interfaces.
- No silent mock fallback in production.
- Keep Go and Node dependency management separate.
- Exclude `.git`, `node_modules`, `.next`, Go caches and `.env` from Docker context.
- Avoid duplicate lockfiles and cyclic module imports.
