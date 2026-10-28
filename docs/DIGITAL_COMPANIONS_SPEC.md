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
Rewards are cosmetic by default; physical perks require availability and published terms. No pay-to-win or paid entry priority.

## Suggested schema
companion_drops(id, name, edition_cap, next_serial, opens_at, closes_at, status)
companions(id, attendee_id, drop_id, edition_number, base_variant, created_at, unique(drop_id,edition_number), unique(drop_id,attendee_id))
companion_unlocks(id, companion_id, unlock_key, unlocked_at, unique(companion_id,unlock_key))
Attendance comes from attendance_stamps, with unique(attendee_id,event_id).
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

## Status
Design and engineering specification only. No minted collectibles, accounts, or animation implementation yet.
