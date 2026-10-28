# 7TAC Community Passport — Feature Specification

## Principle
Free entry remains open to walk-ins. RSVPing is encouraged but never required for admission. Reward participation and return visits without creating a paywall, preferential access, or a gatekeeping experience.

## Flow
- Online RSVP: email, event, optional marketing consent. Issue free QR ticket and digital passport link.
- Door: staff scan QR to check in; an attendee receives one verified stamp per attended event.
- Walk-ins: admit normally; offer an optional door QR registration to receive a passport and same-night stamp. No registration requirement for entry.
- Returning guests: email-based passport retrieval via one-time sign-in link, not public email lookup.
- Prevent repeat stamp claims via unique(event_id, attendee_id) and atomic check-in.
- Use random signed/opaque ticket tokens; no personal data embedded in QR code.
- Support manual staff lookup, offline contingency, privacy controls, deletion requests, and a retention policy.

## Provisional rewards
- RSVP: free digital ticket + collectible visual (not an attendance stamp).
- 1 verified visit: first passport stamp.
- 3 visits: digital artwork.
- 5 visits: optional limited sticker/small perk, while supplies last.
- 10 visits: special collectible or early access to merchandise, never priority over walk-in entry.
All rewards are proposed, subject to operational review; clearly disclose availability and terms.

## Database
passport_profiles(attendee_id, public_display_name nullable, created_at)
attendance_stamps(id, attendee_id, event_id, checked_in_at, unique(attendee_id,event_id))
reward_definitions(id, milestone, reward_type, description, active)
reward_redemptions(id, attendee_id, reward_id, redeemed_at, unique(attendee_id,reward_id))

## UX
- Subway-inspired passport in gray/charcoal, rare purple 7 line roundel.
- Stamps use original station signage / graffiti marks, changing by event.
- Mobile-first QR ticket, passport progress, accessible progress labels, reduced motion.
- Marketing emails only with separate affirmative opt-in; ticket delivery and stamp updates are transactional.

## Future ideas
- Event-specific collectible posters and stamp designs
- Artist collaboration stamps
- Optional referral program only with fraud controls
- Community milestones and personalized event recap

## Status
Specification only; no backend, QR generation, email delivery, or check-in functionality implemented yet.
