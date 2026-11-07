# Neon database setup

| Setting | Value |
| --- | --- |
| Organization | Pushpendra |
| Organization ID | `org-steep-pine-18650897` |
| Project | `sellerside-pro` |
| Project ID | `raspy-thunder-72822748` |
| Region | AWS Asia Pacific (Singapore), `aws-ap-southeast-1` |
| Plan at creation | Free |
| Database | `sellerside` |
| PostgreSQL major version | 18 |
| Branch | `production` |
| Branch ID | `br-patient-mode-azgpdafs` |

[Open project in Neon](https://console.neon.tech/app/projects/raspy-thunder-72822748/)

## Verified on 2026-11-07

- Connection string stored only in the ignored `.env.local` file; PayPal credentials preserved.
- Pooled PostgreSQL connection, with full server-certificate verification in the probe.
- Parameterized temporary write/read returned the expected 6000-cent value.
- Transaction rolled back, leaving no permanent test data.
- Database reported PostgreSQL 18.6.
- `npm run build` passed after installing the PostgreSQL driver.

The current app pages remain sample-only. This verification establishes the database connection; it does not claim that the order screens save to it yet.

## Local tools

Neon CLI 9.1.0 was installed in a separate local tools directory. Account-wide CLI login timed out, and an automatic approval check rejected repeating its broad account-management grant. No account-wide token was saved.

Project-only MCP configuration was installed with OAuth and the project ID pinned in its URL. This writes configuration only; MCP sign-in is still required on first use. Reopen the project in Codex to load newly installed configuration. The `neon` and `neon-postgres` skills were installed locally from official `neondatabase/agent-skills` revision `c466e5a986884da67c965592791884cdcbca60c8`.

## Next application work

1. Add versioned SQL migrations for products, orders, payments, refund approvals, and event history.
2. Use a direct (unpooled) database connection for migrations, and the pooled connection for application requests.
3. Add server-only database queries and authorization checks before replacing sample records.
4. Keep all currency amounts in integer cents and enforce duplicate-payment/refund protection in the database as well as the app.
