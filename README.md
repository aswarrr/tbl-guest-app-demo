# Tavlo Guest websites

React 19 + TypeScript + Vite 8 white-label restaurant websites and reservation UI. This is one of three Tavlo repositories; Workspace publishes website configuration and the API persists catalog, availability and bookings. Zero customers and zero revenue; demo data is fictional.

Use Node 22. Copy .env.example to ignored .env and set VITE_API_BASE_URL=http://localhost:4000, VITE_WEBSITE_WORKSPACE_ORIGINS=http://localhost:5173. Run the API and Workspace separately. Public VITE values never contain service keys/passwords.

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
npm run quality
TBL_API_ROOT=../the_tbl_api-revamp npm run test:contract
npm run test:e2e
VITE_API_BASE_URL=https://api.example.invalid npm run build
```

The reserved .invalid URL proves compilation only. Deploy with the actual isolated HTTPS API URL. Production builds reject local/HTTP API origins. quality/build and 29 unit plus four fixture browser tests passed at the verified runtime revision. The Vercel install log reported eight dependency advisories (3 moderate/5 high), not yet reachability-triaged.

The local contract check uses the current sibling the_tbl_api-revamp (npm ci there first); set TBL_API_ROOT for other layouts. CI's standalone checked-in contract avoids private cross-repository checkout credentials. Website consumer contract src/website/contract.ts is generated from Workspace; check it with Workspace's explicit sync tool. Do not edit consumers independently.

Open /demo-cedar-kitchen for the fictional tenant. Routing supports path slug, ?tenant=, configured subdomain and optional default tenant. Custom-domain DNS/certificate lifecycle is not verified. Set the exact Workspace origin for Studio previews.

The actual hosted zero-deposit Guest hold/confirm appeared in Workspace and was cancelled there. No real payment, OTP or notification was sent. The API maximum-advance policy is not fully enforced, and other optional modules remain unverified. Canonical buyer docs (private API access required): [deployment](https://github.com/aswarrr/the_tbl_api-revamp/blob/sale/preparation-2026-10-27/sale/DEPLOYMENT_GUIDE.md), [architecture](https://github.com/aswarrr/the_tbl_api-revamp/blob/sale/preparation-2026-10-27/sale/ARCHITECTURE_OVERVIEW.md), [features](https://github.com/aswarrr/the_tbl_api-revamp/blob/sale/preparation-2026-10-27/sale/FEATURE_MATRIX.md), [limitations](https://github.com/aswarrr/the_tbl_api-revamp/blob/sale/preparation-2026-10-27/sale/KNOWN_LIMITATIONS.md), [actual end-to-end evidence](https://github.com/aswarrr/the_tbl_api-revamp/blob/sale/preparation-2026-10-27/sale/END_TO_END_VERIFICATION.md). These are included locally in the full delivery package. Old production aliases and fixture marketing film are not current runtime evidence. No ongoing seller development/operations commitment.
