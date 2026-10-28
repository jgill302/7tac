# 7TAC RSVP, Outreach, and Motion Specification

## Brand additions
- Palette inspired by the mood of the Nike SB Pigeon Dunk: light and mid concrete grays, charcoal, off-white, subtle warm gray. Purple remains a rare accent reserved primarily for the 7 train mark and Nightmarket ATX navigation. Do not reproduce Nike branding or sneaker artwork.
- Y2K acrylic/frosted-glass panels for selective controls and overlays, with restrained backdrop blur, fine translucent borders, and accessible contrast.
- Add a subtle reading/scroll progress indicator on editorial pages. Prefer CSS-based progress when practical, respect reduced motion, and avoid heavy scroll-driven animation.
- The graffiti train in the navigation remains the primary animated element; other scroll effects should be subtle and purposeful.

## Free RSVP journey
1. Visitor selects a published event with available capacity.
2. Visitor enters email, optional name, and separately chooses whether to subscribe to marketing.
3. Server validates input, applies rate limiting and bot protection, and creates a unique RSVP per event/email.
4. Store event, attendee, RSVP status, ticket ID, check-in state, timestamps and consent record in Supabase.
5. Send transactional confirmation via Resend with event details and an opaque, unpredictable QR ticket token.
6. Offer accessible ticket retrieval/resend flow and manual attendee lookup.
7. Door staff scan QR or search guest list; server validates token, event, cancellation and prior check-in; atomically marks attendance.
8. Support capacity limits, waitlist, cancellation and resend in later iterations.
9. No invented events or issued tickets until real event details and mail configuration exist.

## Database entities
events(id, title, starts_at, venue, poster_url, capacity, status)
attendees(id, email, name, created_at)
rsvps(id, event_id, attendee_id, ticket_token_hash, status, checked_in_at, created_at, unique(event_id, attendee_id))
marketing_consents(id, attendee_id, opted_in, consent_text_version, source, captured_at)
applications(id, type, contact_email, payload, status, created_at)
Email list can be segmented by event and explicit opt-in. Do not treat transactional RSVP as automatic marketing consent.

## Email
- Resend for ticket confirmation, application acknowledgments, sponsor/vendor outreach and opt-in newsletters.
- Verify sender domain, configure SPF/DKIM, suppress bounces, provide unsubscribe in promotional email, and store delivery/error status.
- Use server-side secrets only; never expose Resend API keys or Supabase service-role keys in client bundles.
- If larger volumes arise, use a dedicated email marketing provider or compliant list management with suppression/unsubscribe automation.

## Forms and outreach
- Vendor and sponsor forms are distinct and persist securely.
- Admin dashboard filters applicants by category, status and event, and can send templated personalized follow-ups.
- Never send unsolicited bulk email to scraped addresses. Require review before outreach and honor opt-outs.

## Implementation checkpoints
A. Design tokens and navigation, including responsive train animation.
B. Editorial and event pages with image-backed event list and scroll progress.
C. Supabase migrations and server-side RSVP API.
D. Resend confirmation email and QR ticket.
E. Authenticated check-in/admin UI and QA.
F. Separate marketing opt-in and unsubscribe flows.
All changes in feature branch; do not deploy without approval.
