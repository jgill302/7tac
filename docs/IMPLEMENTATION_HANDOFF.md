# Redesign implementation handoff

The owner selected **soft digital artifacts: translucent objects and restrained 3D**, then confirmed **keep this restrained acrylic direction** after seeing the built desktop preview.

## Phase record

| Phase | Implemented | Commit | Main files |
| --- | --- | --- | --- |
| 1: Audit/foundation | Inspected design history, AGENTS and specifications; ran baseline; retained Vite; fixed catalog typing; updated vulnerable build tooling; added lockfile | cb36d05f4c55a310555937e3866adfd6f0d1e1c2 | package.json, package-lock.json, .gitignore, src/companionCatalog.ts, docs/REDESIGN_AUDIT.md |
| 2: Navigation | Original 7 mark, two closed-header controls, native modal directory, focus containment/restoration, Escape, scroll lock, close transition, full-width original seamless train, motion pause and reduced motion | cbeaee9e422cde1830866fd615859b207ed60ba2 | index.html, styles.css, src/main.ts, train.svg, mark.svg |
| 3: Homepage | Acrylic disc-case composition, editorial hierarchy, transmission module, routes to brand/event/objects/archive/journal, original poster and print study, responsive layouts | cbeaee9e422cde1830866fd615859b207ed60ba2 | index.html, styles.css, src/main.ts |
| 4: Companion preview integration | Shared 17 archetypes, four-stage simulator, separate ten-visit passport, original pigeon/cap/disc studies, remaining art explicitly unfinished | cbeaee9e422cde1830866fd615859b207ed60ba2 | src/main.ts, src/companionCatalog.ts, index.html, styles.css |
| 5: Content/front-end groundwork | Honest next-event state, shop concept, four source-backed unpublished reading previews, disabled provisional application preview, preserved/fixed graffiti drawing/export | cbeaee9e422cde1830866fd615859b207ed60ba2 | index.html, src/main.ts, src/graffiti.ts; removed unused script.js |

Phases 4–5 are frontend prototypes/groundwork, not completed production services. Phases 2–3 share one implementation commit because the shared markup, styles and entrypoint form a coherent change.

## Actual validation

- `npm run typecheck`: pass.
- `npm run build`: pass, no missing-script warning. Production JS approximately 16.8 kB before gzip, 7.2 kB gzip; CSS approximately 23.3 kB before gzip, 6.6 kB gzip.
- `npm test`: pass against the built production preview using Playwright and installed Microsoft Edge.
- Widths 320, 375, 390, 768, 1024 and 1440: no page horizontal overflow; menu fits horizontally; focus containment, Escape return focus and scroll lock pass.
- Additional checks: two header controls, menu destination, advancing train frames, actual reduced-motion emulation, all 17 starters, Ultimate prerequisite, draft article navigation, drawing/clear/download, disabled unconnected form, valid section destinations, no console exceptions/errors.
- `npm audit`: zero vulnerabilities.
- `git diff --check`: pass after formatting.
- No lint configuration existed; strict typecheck, formatting and browser checks were used. No claim of a separate lint pass.

## Review artifacts

Ignored local `artifacts/` contains:

- `homepage-desktop.jpg`, `homepage-mobile.jpg`
- `navigation-1440.jpg`, `navigation-390.jpg`
- `train-frame-1.png`, `train-frame-2.png` (closed navbar and separate animation frames)
- `nightmarket.jpg`, `companion.jpg`
- `qa-results.json`

No browser video was recorded. Mobile touch hardware, Safari, Firefox, screen-reader use and comprehensive WCAG auditing remain untested. Keyboard and reduced motion behavior were tested in Chromium/Edge.

## Remaining work and limitations

- Supabase authorization/data model, verified email/RSVP, opaque QR passes, Resend delivery and authenticated check-in.
- Secure stored vendor/artist/sponsor/contact submissions and authorized review. Current form preview deliberately cannot submit.
- Owner admin with server-side roles, MFA and audit logs; constrained birthday override and delayed settings changes. No privileged mutations currently exist.
- Published article routes, date/metadata management, editorial review, actual event data and past-event archive content. Current journal uses hash deep links into clearly labeled draft dialogs.
- Commerce backend evaluation/integration (Shopify considered in original brief), real product details/assets and checkout. No test product is purchasable.
- Finish companion form artwork; current three originals are concept studies, not all 68 production forms.
- Fonts currently use Google Fonts with fallback fonts; offline appearance can differ.

No main modifications, remote pushes, merges, production connections or deployments were performed. Local clone: `C:/Users/jas/Downloads/7tac-main/7tac-v2`. See README for startup and QA commands.

## Revision — Nightmarket separation and train references

- Kept the acrylic CD hero; shortened landing-page copy and reduced the archive to a visual preview.
- Added the built `/nightmarket/` entrypoint for event details, provisional applications, attendance/companion simulation, and Nightmarket editorial drafts. General culture drafts remain on the homepage.
- Put the compact connection section immediately after the homepage Nightmarket feature.
- Darkened the collective section to graphite, with pale text and a darker route plaque.
- Restyled the event cover as a PlayStation-era jewel case with PlayStation spine treatment and M/Mature concept-cover badge.
- Used the supplied train photos and GIFs as visual references for original SVG steel, grime, windows, broad painted letters and coupling details. Reference media is not copied into the public build.
- Changed the carriage period from 15 seconds / 960px to 3.2 seconds / 1200px on desktop; mobile uses 900px per cycle. Reduced motion and pause remain supported. SVG aspect behavior explicitly fills the tile to prevent repeat gaps.
- Graffiti canvas now uses the same weathered carriage artwork. Clear and PNG export remain functional.
- Validation: production build, strict TypeScript and browser QA pass. Both pages checked at 320, 375, 390, 768, 1024 and 1440px. Added route/reload, poster clipping, event-content isolation and immediate contact-order assertions. No console errors.
- Screenshots refreshed in `artifacts/`, including `nightmarket-mobile.jpg` and `homepage-nightmarket-connection.jpg`.
- Application, ticket and purchase services remain unconnected. No deployment or main changes.

## Revision — reference case, spray paint and Nightmarket archive

- Rebuilt the concept sleeve with a transparent rim, black hinge, upright four-color PlayStation symbol, larger vertical spine title, region strip and spine-mounted M badge. Matched the supplied blank case and Silent Hill spacing while retaining original Nightmarket cover artwork. External logo provenance is in ASSET_SOURCES.md.
- Removed the entire digital archive section from the homepage. Its route and all 17 companion previews now live inside Nightmarket. Added a short explanation of the intended email-verified RSVP collectible; issuance remains unavailable and explicitly labeled.
- Replaced several thin train scribbles with `7tac` and `ATXXX` lettering and a small, low-contrast `jasg.ill` signature.
- Replaced the line brush with frame-paced spray particles. Holding builds pigment and produces short, animated drips. An exact carriage-body mask clips particles and drips, excluding the platform and coupler. Pointer capture supports mouse/touch/pen; release, cancellation, loss of focus and hidden tabs stop spraying.
- Added locally synthesized filtered-noise spray audio, started only after a paint gesture, with a mute toggle. Automated browser checks confirm the audio graph runs and its gain rises/stops correctly; device speaker output was not listened to directly.
- Download watermark is now 13px Chakra Petch (monospace fallback), subdued graphite, bottom-right; the previous oversized purple watermark is gone. Inspected the exported PNG.
- Clear restores a saved pixel-exact base image and cancels unfinished drips.
- Verified: strict TypeScript, production build and Playwright checks. Both pages pass six requested widths; poster/spine fit, archive isolation, event progression, menu focus, reduced motion, spray pigment/drips, zero changed pixels outside the train, sound gain/mute, clear and PNG download all pass. No browser console errors.
- Updated screenshots include `nightmarket.jpg`, `nightmarket-mobile.jpg`, `spray-paint.jpg` and `graffiti-export.png`.
