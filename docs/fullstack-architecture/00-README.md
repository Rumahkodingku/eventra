# Eventra Fullstack Architecture

**Status:** APPROVED BASELINE v1.0 — frozen 2026-11-10

This package extends the existing Eventra product/design baseline (`docs/00`–`docs/16`) with backend and monorepo architecture. It is a specification, not an implementation or production-readiness certification.

## Approved decisions

- Single repository; Turborepo + npm workspaces.
- Incremental migration; preserve current Next.js frontend behavior.
- Next.js 16 / React 19 / TypeScript frontend.
- Go (latest stable, pinned) + Gin + GORM API.
- Modular monolith; MySQL/InnoDB source of truth.
- JWT access/refresh via HttpOnly cookies; RBAC plus organization/resource ownership.
- Guest checkout without forced account creation.
- Payment adapter with mock provider first.
- MySQL transaction/locking/constraints for inventory.
- Selective Redis; golang-migrate; OpenAPI-first generated TypeScript client.
- S3-compatible object storage; Docker; initial single VPS; GitHub Actions.
- Zustand remains for client/UI state, not authoritative server data.

## Repository baseline

The reviewed repository is a completed frontend showcase built with Next.js App Router, React, TypeScript, Tailwind, Zustand, next-intl, Vitest, Playwright and Biome. Its README explicitly states that authentication, payment, inventory authority, email delivery and QR validation are simulated/local. The migration should replace mock repositories progressively, not rebuild the UI.

## Contents

1. `01-architecture-decisions.md`
2. `02-monorepo-and-migration.md`
3. `03-backend-architecture.md`
4. `04-domain-and-business-rules.md`
5. `05-database-design.md`
6. `06-api-contract.md`
7. `07-security-and-identity.md`
8. `08-infrastructure-and-deployment.md`
9. `09-implementation-roadmap.md`
10. `10-frontend-integration.md`
11. `11-implementation-plan.md` — phase-gated migration plan, task packets, interfaces, testing gates and subagent strategy

Vendor choices still open: payment provider, email provider, S3 vendor, VPS/domain/DNS and observability vendor. Final data retention and legal requirements need jurisdictional review.
