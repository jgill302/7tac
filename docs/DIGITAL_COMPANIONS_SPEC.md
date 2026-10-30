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

## Random starter assignment and owner-only admin console (confirmed direction)
- Launch with **17 distinct original starter companion archetypes**, not 17 total issued collectibles. Each archetype may have multiple numbered editions. Working starter roster: Platform Pigeon, Fitted Cap, Compact Disc, Subway Ghost, Graffiti Can, Metro Rat, Boombox, Arcade Cabinet, Payphone, Turnstile, Skate Deck, Cassette, Disposable Camera, Sneaker, Streetlight Moth, Pizza Slice, and CRT Monitor. Names/art are placeholders pending creative review.
- A new verified attendee receives one starter type via **server-side cryptographically secure random selection**, from a versioned distribution. Never select using Math.random on the browser or let users manipulate the result. Prevent duplicate claims, retries, and race conditions using an idempotent transactional claim. Record assigned archetype, distribution version, and audit reference.
- Default distribution can be equal across 17 types; owner can edit weights and enable/disable types for **future** claims. Changes must not silently rewrite already issued items. Show exact odds publicly before a free random claim. No paid rerolls or paid random packs; any paid upgrade is a transparent fixed-price item.
- Owner-only admin route (e.g. /admin) must be protected by Supabase Auth and **server-enforced** role-based authorization, not merely hidden in navigation. Use an owner role bound to a verified user UUID, with MFA, short sessions, audit logs, and row-level security. Never store owner password in the repo, browser source, or frontend environment variables.
- God-mode actions: search users by verified email; inspect companion and stamps; assign a chosen starter, grant or revoke intermediate credits, set stage up to the penultimate form, issue cosmetic items, manage rarity weights, create drops, and correct erroneous records with a reason.
- **Ultimate form is normally attendance-gated, including for owner grants.** The sole deliberate exception is a narrowly scoped, owner-only Birthday God Mode window described below. Ordinary admin controls must never bypass the final attendance requirement.
- All admin mutations must execute via trusted server endpoints/database functions with authorization checks, input validation, transactions, and immutable audit entries containing actor, target, before/after values, timestamp, and reason. No client-side privileged database keys. Require confirmation for destructive or bulk changes.
- Include a preview-only admin UI using local mock data while backend access is not configured; clearly label it nonfunctional and never present it as secure administration.

## Birthday God Mode: configurable annual owner override
- Owner requests a special annual window initially configured for **March 2 in America/Chicago**, matching the owner's stated birthday. The date and time zone are **database configuration**, not constants in application code; owner may edit them through a strongly authenticated settings flow.
- Default window: local calendar day March 2, 00:00 inclusive through March 3, 00:00 exclusive in the configured IANA time zone. Compute boundaries server-side with time-zone-aware date handling (including DST); never trust browser clock or client flags.
- During the window, an owner with recent MFA verification may manually grant **Stage 4 / Ultimate** to a selected account without an attendance seal. The grant must be explicitly labeled `birthday_override`, include a reason, and appear in an immutable audit log and recipient's evolution history. It is not represented as a verified visit and does not award a passport stamp.
- Outside the window, the same override endpoint must reject requests even from the owner; owner can still correct real attendance records via a separately audited process. No standing backdoor, hard-coded secret, or frontend-only restriction.
- Changes to birthday configuration require recent MFA, confirmation, audit history, and a delayed effective date (e.g. next calendar year) to prevent moving the window on demand. Owner should be able to change the future date without code deployment.
- Use a single server transaction to check role, MFA freshness, active window, target, and limits; apply evolution and append the audit event. Prevent duplicate or replayed grants. Optional per-window grant quota should be configurable, initially conservative.
- If an override is later revoked, retain the audit trail. Never delete the historical event.

## Evolution model and art budget
- **17 base archetypes**, each with **four major evolution forms** (68 major form designs in total, if all 17 are fully produced). Do not assume 10 different evolutionary forms per archetype.
- **10 verified Nightmarket visits** is a proposed passport milestone track, not a requirement to build ten unique character bodies. At visits 1, 3, 5, and 10, unlock stamps and cosmetic effects such as backgrounds, apparel, animations, alternate textures, or collectible frames.
- Recommended stage path: Stage 1 Base, Stage 2 Street, Stage 3 Transit, Stage 4 Ultimate. Stages 2 and 3 may be earned through credits or fixed-price purchase; Stage 4 requires a real check-in except the auditable birthday override.
- Suggested initial ultimate eligibility: Stage 3 + at least one verified visit; consider 3 visits for stronger event retention. Do not equate the 10-visit passport completion milestone with the ultimate evolution unless explicitly decided.
- Production sequencing: fully illustrate and animate 3 flagship archetypes first; keep remaining 14 as clearly labeled starter previews until their art is completed. Never represent placeholder art as finished.

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
starter_archetypes(id, slug, display_name, active, rarity_weight, art_version)
claim_distribution_versions(id, created_at, weights_snapshot)
admin_audit_log(id, actor_user_id, target_user_id, action, before_json, after_json, reason, created_at)
admin_roles(user_id, role, granted_at)
admin_override_settings(id, owner_user_id, month, day, timezone, effective_from_year, updated_at)
birthday_override_grants(id, owner_user_id, target_companion_id, window_year, reason, created_at, unique(target_companion_id,window_year))
evolution_events.trigger_type includes 'birthday_override'; birthday overrides never create attendance_seals.
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
- Final art and rarity distribution for the 17 archetypes; owner account provisioning and MFA.
- Final ultimate attendance threshold (recommend at least one visit), annual birthday grant quota, and whether the birthday date change requires a cooling-off period.

## Status
Design and engineering specification only. No minted collectibles, accounts, or animation implementation yet.
