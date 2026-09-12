# TBL Guest App

Guest-facing React application for browsing active TBL branches, viewing public opening
hours and policies, and starting reservation holds in each branch's local timezone.

## Local development

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the revamped API origin.

```bash
npm install
npm run dev
```

## Quality and contract checks

```bash
npm run quality
npm run test:contract
npm run test:e2e
```

- `quality` runs the zero-warning lint gate, TypeScript checking, and Vitest service and
  normalization tests.
- `test:contract` executes the guest hold payload against the adjacent revamped API's
  real validation schema and reservation mapper. The default API path is
  `../the_tbl_api - REVAMP`; set `TBL_API_ROOT` when the repositories live elsewhere.
- `test:e2e` starts Vite and runs deterministic Playwright tests against mocked API
  boundaries. Google Chrome must be installed, or update the Playwright browser channel
  for the target environment.

Production builds require `VITE_API_BASE_URL`:

```bash
npm run build
```

## White-label tenant routing

Each restaurant is served from its own path segment:

```text
https://tbl-guest-app.vercel.app/sizzler-steak-house-and-co
```

The slug is read from the route (`/:companySlug`) and everything on the page
comes from the API: branding from `GET /api/companies/slug/:slug`, locations
from `GET /api/mobile/branches?companySlug=...`, and the published menu from
`GET /api/mobile/tenants/:companySlug/menu`. All three are public reads.

The host root lists the restaurants that have a published site. A restaurant
with no published menu simply has no Menu link.

Subdomain resolution still works as a fallback, so a custom domain can be
pointed at this build later without a rewrite:

```env
VITE_TENANT_ROOT_DOMAIN=restaurants.example.com
```

Every restaurant shares one brand-neutral palette; identity comes from the
restaurant's own logo and photography. Nothing in the database stores a
per-restaurant palette yet.
