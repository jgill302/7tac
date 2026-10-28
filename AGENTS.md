# 7TAC — Project Design and Implementation Guide

## Product identity
7 Train Art Co (7TAC) is a Queens/NYC-rooted creative collective. Nightmarket ATX is a flagship event series, not the entire brand. The website must support editorial storytelling, events, vendor applications, and a future print-on-demand shop.

## Visual direction
- Minimalist, editorial, visually striking; light grays, concrete gray, charcoal, and off-white dominate.
- Purple is an intentionally rare accent, inspired by the NYC 7 subway line. Reserve it primarily for the top-left 7 Train Art Co logo/7 roundel and the **Nightmarket ATX** navigation tab. Do not flood backgrounds, cards, or buttons with purple.
- Layer in NYC 7 train references through line diagrams, platform typography, train silhouettes, subtle metal/concrete textures, station wayfinding, and original graffiti motifs. Keep legibility and whitespace.
- Cultural references: the layered late-90s/early-2000s NYC streetwear energy of Triple Five Soul and Stüssy, interpreted as an original identity; do not copy their logos, artwork, or proprietary graphics.
- Logo: original purple 7-train-inspired mark at top left, accompanied by clean 7 Train Art Co wordmark; graffiti expression can appear in a controlled secondary detail.
- Navigation: a narrow animated train motif moves horizontally through or behind the top navigation, as if a graffiti-tagged subway train is passing. The nav remains readable, clickable, and fixed/stable. Use CSS/SVG animation or a lightweight loop rather than a large GIF when feasible. Never let animation obscure text or interfere with keyboard focus.
- Most of the website should remain visually still; the train motion is the signature animated moment. Avoid pervasive parallax, scrolling animations, and motion overload.
- Offer reduced-motion behavior using prefers-reduced-motion; use a static train illustration for those users. Respect mobile performance.
- Typography: strong sans-serif editorial hierarchy; occasional transit signage or graffiti accents only where they improve character.
- Keep purple in Nightmarket ATX nav treatment while other nav links remain charcoal/gray. Ensure contrast and accessible active/focus states.

## Information architecture
Home | Nightmarket ATX | Shop | Artists / Community | Journal | About / Contact.
- Home: concise manifesto, featured event, select merchandise, NYC-to-Austin story.
- Nightmarket ATX: events, venue/date details, vendor applications, FAQs, optional RSVP/ticket links.
- Shop: small curated print-on-demand collection (tees, hoodies, posters, stickers), Shopify commerce integration as a later phase.
- Community: artist and collaborator profiles.
- Journal: editorial posts.
- Graffiti train: preserve and improve the interactive art experience as a separate feature.

## Engineering direction
- Existing repository is Vite/TypeScript/HTML/CSS; inspect and preserve functional behavior before migration.
- Proposed modernization: Next.js App Router, TypeScript, Tailwind CSS, Supabase for persisted applications/events and admin authentication, Shopify + print-on-demand integration, Vercel hosting.
- Avoid premature complexity. Keep events and vendor data secure; use server-side validation, spam protection, role-based admin access, and no fake success messages.
- Replace in-memory event creation and fake vendor/contact submissions with persisted, verified workflows.
- Build on feature branches and review via pull requests; do not overwrite or deploy production without explicit authorization.
- Google Form fields are not yet available: do not invent an authoritative final schema. Start with a provisional form and reconcile with the existing form when provided.

## Design acceptance criteria
1. Site looks restrained and editorial on mobile and desktop.
2. A single passing graffiti train in the header is the standout motion feature; the rest of the layout is mostly static.
3. Top-left 7TAC logo and Nightmarket ATX tab are the primary purple elements.
4. Navigation works even if animation fails or reduced motion is enabled.
5. Shop and vendor flow are discoverable from Instagram traffic within one tap.
6. All visuals and graffiti assets are original or properly licensed.
