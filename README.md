# 7 Train Art Co. — local redesign

Working branch: `feature/application-backend`, built on `feature/7tac-v2-redesign`.

## Run

Node 22.12+ (tested with Node 24). From this checkout:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

## Validate

```sh
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
# In another terminal, with preview running on port 4173:
npm test
```

Browser QA uses Playwright with locally installed Microsoft Edge. Install Edge if unavailable, or change the explicit channel in `tests/browser-qa.mjs` for your environment. `QA_URL` can select another preview origin. Screenshots and the JSON report go to ignored `artifacts/`. No backend credentials are needed.

## Source map

- `index.html`: semantic homepage, dialogs, section destinations, honest preview states.
- `styles.css`: tokens, shared components, responsive rules and reduced motion.
- `src/main.ts`: navigation, catalog/progression preview, source-backed editorial previews.
- `src/companionCatalog.ts`: shared 17-starter catalog and prototype progression guard.
- `src/graffiti.ts`: preserved perspective train drawing, painting and download.
- `train.svg`, `mark.svg`: original navigation illustration and original 7 mark.
- `content/blog/`: editorial drafts, imported into preview dialogs with deep links.
- `prototype/`: retained historical reference prototypes, not built public entrypoints.
- `docs/REDESIGN_AUDIT.md`: baseline, architecture decisions and scope boundaries.

## Production boundaries

The native Nightmarket application form and Vercel/Supabase/Resend backend are implemented locally. Late 2026 and 2027 are planning seasons with exact dates and venues unannounced. Live submissions require account setup, the SQL migration and server environment variables: see [Backend setup](docs/BACKEND_SETUP.md). Without configuration the API reports that applications are not open; it never claims to save an application.

Review applications in the private Supabase dashboard. Branded admin authentication, automated acceptance emails, RSVP/ticket issuance, payments and file uploads remain future work. Companion stages and passport stamps remain ephemeral simulations. Journal posts remain editorial previews.

Fonts currently load Chakra Petch and Space Grotesk from Google Fonts with local fallbacks. Self-host licensed font files before production if eliminating third-party font requests is desired.

Vercel function and daily email retry configuration is included. No live infrastructure, deployment, merge or push was performed.

## Dedicated Nightmarket page

`nightmarket/index.html` is a second Vite build entry, configured in `vite.config.ts`. Open `/nightmarket/` for event details, conditional participation forms and companion/attendance simulations. The homepage keeps a brief Nightmarket invitation, followed immediately by general connection copy. Its archive is a visual selector without attendance controls. The shared runtime handles navigation between pages and loads the drawing module only when a canvas is present.

Latest behavior: the digital archive has been removed entirely from the homepage and appears only in Nightmarket. The drawing tool is a clipped, particle-based spray with subtle drips and optional locally synthesized spray audio. Downloaded PNGs use a small digital watermark. Asset provenance is in `docs/ASSET_SOURCES.md`.

## Vercel

Deployment configuration is in `vercel.json`: Vite, Node 24.x, `npm ci`, typecheck + build, `dist`, and canonical trailing-slash page URLs. Import the **feature/application-backend** branch with **Root Directory `.`**. See `docs/VERCEL_DEPLOYMENT.md` for dashboard instructions and post-deployment checks. No frontend secrets are needed. Server-only environment variables are listed in `.env.example`.

## Application tests

`npm run test:backend` covers server validation, failures and the SQL migration against isolated PostgreSQL (PGlite). `npm run test:form` covers conditional fields, all six viewport widths and browser retry/success behavior against an unconfigured local preview. See `docs/BACKEND_SETUP.md` for the distinction between local tests and the live verification still required.
