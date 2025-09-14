# Pending Codex Deliverables — Dine-Serve-Hub

Owner: Codex CLI
Last updated: 2025-09-12

This document tracks the next high‑impact deliverables to harden, validate, and refine the platform. Each item includes scope, concrete acceptance criteria, and notes on risks/dependencies.


## 1) Production CORS/Socket CORS Hardening + Disable Dev Mock Auth
- Scope
  - Restrict `CORS` and `socket.io` CORS to a controlled allowlist when `NODE_ENV=production`.
  - Remove dev-only mock user bypass in `authenticate` middleware for production builds.
- Acceptance Criteria
  - Requests from non‑allowed origins are rejected in production; accepted in development.
  - No code paths allow mock users in production; valid JWT required.
  - Health check and API docs still accessible as configured.
- Notes
  - Files: `backend/src/server.ts`, `backend/src/middleware/auth.ts`.


## 2) Secrets Externalization + Config Validation
- Scope
  - Move all hardcoded credentials/tokens (e.g., Zed Business auth) to environment variables.
  - Rotate any tokens committed historically.
  - Add boot‑time validation to fail fast if required env vars are missing.
- Acceptance Criteria
  - No hardcoded secrets in repository.
  - `npm start` logs a clear config error and exits non‑zero if critical vars are missing.
  - `.env.example` updated with required keys; real `.env*` not tracked.
- Notes
  - Files: `backend/src/services/mpesa.service.ts`, `backend/src/controllers/mpesa-kcb.controller.ts`.


## 3) Scheduled Reports Queue Enablement (Bull/Redis)
- Scope
  - Re‑enable `reportQueue.service` initialization and wire controller “run now”/toggle to the queue.
  - Add simple health/metrics endpoints and logging for queue workers.
- Acceptance Criteria
  - Creating, pausing/resuming, and running a scheduled report triggers a Bull job and email delivery with attachment.
  - Queue stats route returns live counts for waiting/active/completed/failed.
  - Works in Docker; documented Redis requirements.
- Notes
  - Files: `backend/src/services/reportQueue.service.ts`, `backend/src/controllers/scheduler.controller.ts`, `backend/src/server.ts`.


## 4) Payments Hardening: Callback Verification + Idempotency
- Scope
  - Verify callbacks (signature/auth) from MPesa/Zed Business.
  - Enforce idempotency using `CheckoutRequestID` (unique index) or receipt number to avoid duplicate updates.
  - Consolidate MPesa flows to a single service adapter; normalize request/response shapes.
- Acceptance Criteria
  - Duplicate callbacks are safely ignored; PaymentTransaction/order state is consistent.
  - Invalid/unsigned callbacks rejected with 4xx and logged.
  - Happy path: initiate → callback → order paid; negative path: failed callback leaves order unpaid.
- Notes
  - Files: `backend/src/controllers/payment-gateway.controller.ts`, `backend/src/controllers/mpesa-kcb.controller.ts`, `backend/src/services/mpesa.service.ts`, `backend/src/models/PaymentTransaction.ts` (indexing).


## 5) API URL Handling Simplification
- Scope
  - Default to relative `/api` in the frontend and use `VITE_BACKEND_URL` only when necessary.
  - Ensure dev proxy and production Nginx routing consistently support `/api` + `/uploads` + websockets.
- Acceptance Criteria
  - No `net::ERR_CONNECTION_REFUSED` due to host derivation.
  - Local dev: Vite proxy handles `/api` and `/socket.io`.
  - Production: Nginx proxies `/api` and websockets correctly.
- Notes
  - Files: `src/utils/api.ts`, `src/config/api.ts`, `vite.config.ts`, Nginx conf.


## 6) E2E Tests: Dashboard & Inventory Filters
- Scope
  - Add Playwright tests to validate dashboard stats and inventory filters.
  - Cover low‑stock and expiring ingredient filters and the expiring‑badge navigation from Dashboard to Inventory.
- Acceptance Criteria
  - Tests seed minimal data and assert: dashboard shows low‑stock and delivery splits; clicking Expiring badge navigates and lists expiring items.
  - Tests run in CI with dockerized backend + Mongo.
- Notes
  - Files: `tests/e2e/06-performance-accessibility.spec.ts` (or new), seeds under `backend/src/seeds`.


## 7) Delivery Page UI Enhancements (Use Delivery Splits)
- Scope
  - Add status chips/filters (Preparing, Ready, Out for delivery, Delivered Today) using new dashboard delivery splits.
  - Make the list filterable by status; preserve counts in header.
- Acceptance Criteria
  - Switching chips filters the delivery orders list client‑side or server‑side.
  - Counts remain accurate and update on refresh.
- Notes
  - Files: `src/pages/DeliveryService.tsx`, backend routes if server‑side filtering is implemented.


## Prioritization (Recommended)
1. Security & Config (Items 1–2)
2. Payments Hardening (Item 4)
3. Scheduled Reports Queue (Item 3)
4. API URL Simplification (Item 5)
5. E2E Tests for confidence (Item 6)
6. Delivery UI polish (Item 7)


## Dependencies / Risks
- Redis required for queue processing.
- Puppeteer dependencies in container (for PDF). Ensure Chromium libs present.
- Payment provider requirements for signature validation (doc references needed).


## Completion Definition
- All acceptance criteria above met.
- CI runs lint, build, tests (unit + e2e) green.
- Docs updated: `.env.example`, deployment notes, and testing guides.
