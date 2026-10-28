# Nightmarket ATX — Website Feature Brief

## Editorial
- Minimal journal page with categories Culture and Nightmarket ATX.
- Four draft articles in content/blog; editorial review required before public release.
- Avoid inventing event history, venue partnerships, or claims about actual impact.

## Events
- Featured upcoming event plus an image-backed calendar/list hybrid.
- Each event has date, time, venue, city, poster image, alt text, summary, status, RSVP URL, and optional lineup.
- Display a curated event poster behind/adjacent to date information with a legible charcoal overlay. Mobile first; not a conventional month grid.
- No invented upcoming events. Display a designed 'Next date to be announced' state until real details are entered.
- Admin-authenticated editing; images uploaded to controlled storage with attribution/licensing and file limits.

## Applications
Separate routes and database records:
1. /nightmarket/vendors — independent vendor application
2. /nightmarket/sponsors — sponsorship and brand partnership inquiry
3. /nightmarket/artists — optional future artist/DJ application

Provisional vendor fields: name, brand, email, Instagram/site, category, description, product imagery link, needs/footprint, agreement to terms. Reconcile with existing Google Form when available.
Sponsor fields: organization, contact name, email, website, partnership goals, proposed activation, estimated support/budget range (optional), message.
All forms: consent notice, server validation, rate limits/spam controls, accessible status, persistent Supabase records, admin notification, secure access, no public exposure of applicant data.

## Public-facing vendor copy
"Nightmarket ATX is a curated gathering of independent makers, artists, food concepts, and sounds. Participation is selected for originality, presentation, and how each contribution fits the overall experience. We keep opportunities accessible for independent vendors, but spaces are limited and submitting an application does not guarantee placement."

## Partnership copy
"Interested in supporting Nightmarket ATX? We collaborate with aligned brands and organizations on thoughtful sponsorships, activations, and larger-scale partnerships. Each opportunity is considered separately to protect the experience for artists, vendors, and guests."

## Policy clarification
The standard no-booth-fee model applies to accepted independent vendors where event terms allow. Do not imply that commercial sponsors receive the same terms, and do not conceal material fees or conditions. Confirm the final policy before publishing.

## Visual requirements
- Neutral grays and charcoal, purple reserved primarily for 7TAC mark and Nightmarket tab.
- Mostly static site, one animated graffiti 7 train in navigation.
- Events feature image-driven poster calendar, not generic calendar component.
- Accessibility: legible text over images, reduced-motion mode, semantic forms and keyboard access.

## Delivery
Implement in separate feature branch, preview, test and review before merge. No live deployment without authorization.
