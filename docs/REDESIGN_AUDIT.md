# Redesign audit — Phase 1

Starting point: design/7tac-visual-direction at b5cf965. Working branch: feature/7tac-v2-redesign. Separate clone avoids changing the unpacked Next.js project beside this checkout.

Read AGENTS.md, all four docs specifications, companion prototypes, original scripts and editorial drafts. Reviewed Voice Website Editing handoff. User selected soft digital artifacts, translucent objects, restrained 3D.

Baseline: Vite 5 build exited successfully with a warning that script.js was not bundled. Production output therefore omitted interactive script. Typecheck failed with three implicit-any errors in companionCatalog.ts. npm audit reported two dependency vulnerabilities. No test or lint script existed.

Architecture: retain Vite and strict TypeScript for the visual phases. Native dialog, CSS/SVG illustration and small modules fit this site's current needs. Next.js migration would not itself provide secure authentication, persistence or ticketing. Backend work remains a separate scope as requested.

Refactor: a single bundled TypeScript entry replaces the duplicate browser script; original perspective graffiti drawing retained in its own module. Unified stylesheet replaces competing legacy overrides. Vite updated and dependency lockfile added. No production services connected.

Reference: Equipment Room (https://equipmentroom.com/) uses progressive discovery around place, music, and events. Its layout/artwork is not reused. The new site uses original SVG train, CSS acrylic case, poster, print and companion studies.

Known production boundary: no real events, account issuance, checkout, QR tickets, application storage, secure admin or email. Old invented event dates and fake successful submissions removed from the main experience. Form preview disabled until persistence exists. Four journal drafts remain explicitly unpublished; hash deep links preview them locally. Production article routes/social metadata are future work.
