# 7 Train Art Co. — local redesign

Working branch: `feature/7tac-v2-redesign`, based on `design/7tac-visual-direction` at `b5cf965`.

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

This is a local frontend redesign, not a deployed service. Event details are unannounced. No registration, ticket, email, payment, claim, attendance or application is recorded. Contact/application fields are disabled; there is no fake successful submission. Companion stages and passport stamps are explicitly ephemeral simulations; only three starter concept illustrations exist, with numbered placeholder studies for the other fourteen.

Supabase/Resend/commerce integration and owner administration require their own backend implementation phase. No admin endpoint or client-side privileged bypass is enabled. Birthday override exists only in the specification and must be server-authorized, MFA-protected and audited before use. Journal drafts use hash-based reading previews; published article routes, per-article social metadata and confirmed publication dates remain future work.

Fonts currently load Chakra Petch and Space Grotesk from Google Fonts with local fallbacks. Self-host licensed font files before production if eliminating third-party font requests is desired.

No deployment configuration or live infrastructure was changed. No merge or push was performed.

## Dedicated Nightmarket page

`nightmarket/index.html` is a second Vite build entry, configured in `vite.config.ts`. Open `/nightmarket/` for event details, participation previews and companion/attendance simulations. The homepage keeps a brief Nightmarket invitation, followed immediately by general connection copy. Its archive is a visual selector without attendance controls. The shared runtime handles navigation between pages and loads the drawing module only when a canvas is present.

Latest behavior: the digital archive has been removed entirely from the homepage and appears only in Nightmarket. The drawing tool is a clipped, particle-based spray with subtle drips and optional locally synthesized spray audio. Downloaded PNGs use a small digital watermark. Asset provenance is in `docs/ASSET_SOURCES.md`.

## Vercel

Deployment configuration is in `vercel.json`: Vite, Node 24.x, `npm ci`, typecheck + build, `dist`, and canonical trailing-slash page URLs. Import the **feature/7tac-v2-redesign** branch with **Root Directory `.`**. See `docs/VERCEL_DEPLOYMENT.md` for dashboard instructions and post-deployment checks. No frontend environment variables are needed.
