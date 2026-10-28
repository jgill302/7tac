# 7TAC Digital Companions — Design and Technical Specification

## Concept
Original 8-bit/pixel-art mascot collectible linked to an attendee's email-backed account. Not an NFT or blockchain token. Each minted edition has a unique serial (e.g., #0042 of 500) within a clearly defined drop. The character evolves through verified Nightmarket attendance.

## Identity and issuance
- Attendee RSVPs and verifies control of email using a one-time magic link or email code.
- Allocate edition number transactionally from a drop with a fixed edition cap. Prevent concurrent double allocations and duplicate claims per attendee/drop.
- Assign one companion per verified attendee for the inaugural drop; future drops optional.
- A claim can happen on RSVP, but *attendance-only* progression and rewards require verified check-in.
- Never expose attendee email in a public collectible URL, QR payload, image metadata, or share card.
- A numbered edition is an app-managed digital collectible, not cryptographic ownership, and does not imply investment value or resale rights.
- Allow account recovery, email changes, deletion requests, and an explicit policy for collectible retention on deletion.

## Visual language
- Original pixel-art subway companion inspired by NYC 7 train, not licensed characters or sneaker brand graphics.
- Base palette: light gray, steel, charcoal, selective purple accents.
- Pixel-art idle animation: 4–8 frames or lightweight CSS sprite; optional rotating card with CSS 3D transform, not mandatory heavy 3D rendering.
- Respect prefers-reduced-motion and provide a static poster.
- Show edition ID, drop name, attendance stamp count, unlocked cosmetic traits, and next milestone.
- Export shareable PNG/video without personal email.

## Progression (proposed)
0 visits: base companion, unique edition number after claim
1 verified visit: first subway station stamp
3 verified visits: new animation or background
5 verified visits: subway jacket or graffiti accessory
10 verified visits: rare alternate skin and special event badge
Rewards are cosmetic by default; physical perks require availability and published terms. Free event entry and access remain unchanged. Optional paid acceleration is permitted only for pre-final progression; the ultimate evolution requires a verified Nightmarket visit and cannot be purchased.

## Hybrid progression: earn or pay, but show up to complete (confirmed direction)
- **Core rule:** Users can earn intermediate evolution materials through attendance or purchase them as optional digital upgrades. A paid user can reach the penultimate stage, but **ultimate evolution is only unlocked by a verified in-person Nightmarket check-in**. There is no paid bypass, gift, referral shortcut, or administrative auto-upgrade.
- The attendance requirement is **at least one genuine event visit**, with the specific ultimate milestone configurable per drop. Past attendance can count if recorded reliably; don't invent past check-ins.
- An attendee who never pays can reach the same ultimate appearance through participation. A person who pays can advance faster but cannot complete the final form remotely.
- Proposed progression: Stage 1 / Hatchling (free claim); Stage 2 / Street Form (earn 2 activity credits or purchase an upgrade); Stage 3 / Transit Form (earn 5 credits or purchase an upgrade); Stage 4 / Ultimate Form (requires a non-transferable attendance seal from a real Nightmarket event, plus any prior prerequisites). Credit amounts are placeholders, not final pricing.
- Keep stages visually legible in the PS1/N64-style rotating viewer: low-poly silhouettes, 8-bit pixel textures, jewel-case tabs, silhouette of locked final form, and a clearly marked "ATTEND TO UNLOCK" state.
- Avoid gambling, random paid loot boxes, and speculative NFT/asset-value claims. Sell transparent fixed-price digital upgrades with clear descriptions, refund terms, and age-appropriate purchasing controls.
- Use a payment provider such as Stripe Checkout server-side when implemented; verify signed webhooks, make entitlements idempotent, and never trust client-reported payment success.
- Attendance seals are non-transferable and bound to a verified account; check-in must be authenticated by event staff, with deduplication per event and fraud review. A walk-in can register on-site for free and qualify for the ultimate seal.
- Do not conflate buying an RSVP or event admission with digital purchases. Nightmarket entry remains free; purchases are strictly optional.
- Keep privacy-respecting records of purchases, entitlements, check-ins, and evolution state; provide email-based account recovery.

## Suggested schema
companion_drops(id, name, edition_cap, next_serial, opens_at, closes_at, status)
companions(id, attendee_id, drop_id, edition_number, base_variant, created_at, unique(drop_id,edition_number), unique(drop_id,attendee_id))
companion_unlocks(id, companion_id, unlock_key, unlocked_at, unique(companion_id,unlock_key))
Attendance comes from attendance_stamps, with unique(attendee_id,event_id).
companion_progress(companion_id, stage, earned_credits, updated_at)
upgrade_products(id, sku, stage_target, price_cents, currency, active)
purchase_entitlements(id, attendee_id, companion_id, product_id, provider_session_id, granted_at, unique(provider_session_id))
attendance_seals(id, attendee_id, event_id, issued_at, unique(attendee_id,event_id))
evolution_events(id, companion_id, from_stage, to_stage, trigger_type, created_at)
All stage transitions must be validated server-side. Ultimate stage requires a valid attendance seal, regardless of purchases.
Generate serials within database transactions or safe atomic allocation. Validate claims server-side and apply rate limits.

## UX
- RSVP -> confirm email -> claim numbered companion -> receive ticket.
- Check-in -> stamp passport -> companion evolves -> email notification if opted into transactional updates.
- Personal dashboard: My Ticket, My Passport, My Companion, Rewards.
- Public share page is opt-in and uses a random public slug, never email or sensitive identifiers.
- Keep entry open for walk-ins and allow them to claim the same perks through optional door registration.

## Product decisions to confirm
- Edition cap and whether numbers are assigned at verified RSVP or first check-in.
- Whether each event has its own limited drop or there is one inaugural series.
- Artwork production (sprite sheets, traits and backgrounds) and physical reward budget.
- Pricing, intermediate stage thresholds, whether one verified visit suffices for ultimate, and refund rules.

## Status
Design and engineering specification only. No minted collectibles, accounts, or animation implementation yet.
