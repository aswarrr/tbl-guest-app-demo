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

The customer site resolves the restaurant from a Shopify-style subdomain and filters
published mobile-API branches by `companySlug`.

```env
VITE_TENANT_ROOT_DOMAIN=restaurants.example.com
VITE_DEFAULT_TENANT_SLUG=sizzler-steak-house-and-co
```

Attach `*.restaurants.example.com` to the Vercel project and create the matching
wildcard DNS record. Local and preview builds use `VITE_DEFAULT_TENANT_SLUG`; the
optional `?tenant=` query parameter can override it for testing.

Restaurant branding and unsupported static content live in `src/white-label/config.ts`.
The Sizzler menu is explicitly sample content; restaurant, location, schedule, policy,
availability, hold, and payment data continue to come from existing API endpoints.
