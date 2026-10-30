# Deploy 7TAC to Vercel

The redesign lives on `feature/7tac-v2-redesign` in `jgill302/7tac`. Do not import `main` expecting this redesign.

## Dashboard setup

1. Import the GitHub repository into Vercel, or select its existing Vercel project.
2. Select `feature/7tac-v2-redesign` for this deployment. For a new project that should publish this branch automatically, set Settings → Environments → Production → Branch Tracking to `feature/7tac-v2-redesign`. Keep existing production tracking unchanged if this is only a preview of an existing live project.
3. Set Root Directory to repository root (`.`). The local folder name `7tac-v2` is not a repository subdirectory.
4. Framework: Vite. Node: 24.x. Install: `npm ci`. Build: `npm run typecheck && npm run build`. Output: `dist`. These are encoded in package.json/vercel.json.
5. Deploy the selected feature branch. No environment variables are required for this frontend.

An import link targeting the feature branch is:
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjgill302%2F7tac%2Ftree%2Ffeature%2F7tac-v2-redesign

Prefer importing the existing repository for ongoing Git integration; the clone workflow may offer to create a new repository.

## Routing

This is a multi-page static site, not a single-page router. Vite emits `dist/index.html` and `dist/nightmarket/index.html`. `trailingSlash: true` normalizes `/nightmarket` to `/nightmarket/`. Do not add a catch-all rewrite to `/index.html`, which would replace the Nightmarket page with the homepage.

After deployment check `/`, `/nightmarket/`, and `/nightmarket/#collectibles`, then hard-refresh Nightmarket. Check the train graphics, sound after a painting gesture, download, menu, and mobile layout. Browser hash article previews do not require server rewrites.

## What is ready

Static design, navigation, Nightmarket page, concept shop, journal drafts, companion simulation, graffiti spray canvas and PNG export. No secrets or backend setup required. Secure application storage, verified RSVP/ticket issuance, account/admin authorization, email and payments are not implemented. Disabled forms and prototype labels remain visible.

## Validation and artifacts

Verified with Node 24: clean `npm ci`, strict typecheck, production build, dependency audit (zero vulnerabilities), and Playwright browser QA across six widths. The Vercel remote build and deployed URL still need verification after dashboard deployment. Windows initially locked a running Vite native module; stopping the owned preview/dev servers allowed a clean install.

`.vercelignore` excludes local authentication, caches, test artifacts, historical prototypes and development-only material from CLI uploads. `.gitignore` also excludes Vercel linking/auth state. No Vercel credentials belong in Git.

References: https://vercel.com/docs/project-configuration/vercel-json and https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
