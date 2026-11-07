# SellerSide Pro

An order and refund assistant for sellers who receive customer requests in chat. Home bakers are our first example audience.

## Current state

- Local Next.js preview: searchable AG Grid order dashboard, preset order walkthrough, customer-page preview, sample refund calculation and review.
- The preview uses fictional sample records. No AI requests, database persistence, checkout, or refunds are connected to these sample records.
- The separate sandbox integration probe has successfully created and captured a USD 60 test payment and completed a USD 15 partial refund. This is a manual integration result, not an automated test assertion.
- PayPal approval/cancellation return pages now explain the next step without assuming payment succeeded.
- A Neon PostgreSQL project has been created, and an encrypted database connection plus a transactional write/read probe have passed. The UI still uses samples; saved-order routes are the next implementation step.

## Run locally

Requires Node.js 22 or 24 (the initial build is checked on Node 22). No service credentials are needed for the sample screens.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The preview server binds to the local computer only. Customer sample: `/order/sample`.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

## PayPal sandbox integration probe

Copy `.env.example` to `.env.local` and privately fill in sandbox app credentials. Never publish credentials or `.local` records. The probe hardcodes PayPal's sandbox endpoint and cannot target live payments.

```sh
node scripts/paypal-smoke.mjs create
# Open the returned URL and approve as a distinct sandbox PERSONAL buyer.
node scripts/paypal-smoke.mjs status
node scripts/paypal-smoke.mjs capture
node scripts/paypal-smoke.mjs refund --approve-test-refund
node scripts/paypal-smoke.mjs status
```

The test order is USD 60; the refund is USD 15. Only sandbox money is used. State and request IDs persist in ignored `.local/paypal-smoke.json`; preserve that file when retrying an uncertain request to avoid changing the request identity. Run status after a timeout. This is an operator integration probe, not the eventual production payment service. The return page does not capture automatically.

## Planned connections

```mermaid
flowchart LR
  Seller[Seller reviews pasted message] --> App[Next.js app]
  App --> AI[Gemini: proposes structured order]
  App --> Rules[App calculations and approval rules]
  Rules --> DB[PostgreSQL on Neon]
  Rules --> PayPal[PayPal sandbox APIs]
  Customer[Customer order page] --> PayPal
  PayPal --> Updates[Verified webhook updates]
  Updates --> DB
```

Next: PostgreSQL order records and approval controls, the provider-independent AI module, then integrate the tested payment actions into real saved orders. Hosting remains undecided pending free-plan eligibility and quota checks.

## Database connection setup

See [the Neon setup record](docs/neon-setup.md) for the non-secret project identifiers and verification result.

Privately set `DATABASE_URL` in `.env.local` to your pooled connection string, then run:

```sh
npm run db:check
```

The probe verifies TLS, checks the database name, writes and reads a temporary record with parameterized SQL, then rolls back. It creates no permanent test data. Real connection strings and passwords must not be committed.

The project-level `.codex/config.toml` pins Neon MCP to this project and contains no API key. It requires OAuth sign-in on first use. Local `neon` and `neon-postgres` guidance is installed separately and excluded from application source. Account-wide CLI authentication has not been completed.

## License

MIT. Third-party dependencies retain their respective licenses.
