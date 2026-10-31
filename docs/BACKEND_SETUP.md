# Activate Nightmarket applications

Implementation branch: `feature/application-backend` in this repository (`7tac-v2` locally). This replaces the disabled application preview with a native conditional form. It has not been deployed or connected to live accounts.

## Morning checklist

1. Create a **Supabase** project. In SQL Editor, run `supabase/migrations/202610310001_applications.sql` once. It creates private applications, planning seasons, rate limits and an email outbox in one transaction. It also installs server-only database functions. No anonymous or signed-in browser user gets access to applicant data.
2. Copy the project URL and **legacy service-role API key** from Supabase project settings into Vercel environment variables. This key is server-only; do not use a public/anonymous key here. Never put it in a `VITE_` variable, browser code or Git.
3. Create **Resend**, add a domain you own (a sending subdomain such as `mail.7trainart.co` works), add the DNS records Resend provides and wait for verification. Create a sending API key. Set `EMAIL_FROM` to an address on that exact verified domain.
4. In Vercel, use this repository root (`.`), Vite, Node 24, and the existing build settings. Add **every variable in `.env.example`**. `APPLICATION_NOTIFY_EMAIL` defaults in the example to the business email from the original form; change it if needed. `SITE_URL` must be the exact canonical website origin, e.g. `https://7trainart.co`, with no path. Preview deployments need their own matching `SITE_URL` and ideally a separate test database/Resend configuration.
5. Generate two separate random secrets for `RATE_LIMIT_SECRET` and `CRON_SECRET`. Each must be at least 32 characters. A local Node command is `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Paste the results directly into environment settings; do not commit them.
6. Deploy the feature branch to a preview first, then run the live verification below. Production publication remains a separate step.

No Google Forms, Sheets, Zapier, paid form builder, or separate web server is required. The original Google Form is unchanged; its old records are not imported automatically.

## What is implemented

- Six application paths: vendor, artist, DJ/music, live performance, partner and idea.
- Shared client/server validation. Food, beverage and experience vendors see additional onsite/permit questions. Other paths see relevant space, equipment, duration, fee or contribution questions.
- Late 2026 and 2027 **planning windows**, not invented event dates. Exact dates, venues, vendor fees and load-in times remain unannounced. Close a season by setting `application_seasons.accepting` to false. To add another season, update `shared/applications.mjs`, add its database row and update event copy. When actual dates are confirmed, reconcile both the public event details and form before asking applicants to commit.
- Atomic application + two-email outbox insertion. Receipt and owner notification are attempted immediately after saving. Saving is authoritative; email failure never deletes the application.
- Server-only credentials, same-origin submission checks, a honeypot, bounded inputs, and persistent quotas of 10 submissions per IP and 3 per email per UTC hour. Rate-limit identifiers are HMAC hashes; raw IPs are not stored in the database. Old quota rows are pruned by the worker.
- Idempotent retries using a per-form UUID and payload fingerprint. Unchanged retries within the open form reuse that UUID. Editing after an uncertain result or starting a new page is a new submission; this is not deduplication by person/email across all visits.
- Real loading, validation, unavailable, retry and receipt states. No fake success when accounts are absent. Answers remain in the open tab on failure and are not saved to browser storage.
- Optional future-event email consent is stored in `payload.updates`, separately from application correspondence. It does not subscribe applicants to a broadcast campaign or send marketing emails.

## Review applications

Use Supabase Table Editor → `applications`, ordered by `created_at` descending. Filter by `season`, `type` or `status`; expand `payload` for answers. Use `internal_notes` for private review notes.

Status options: pending, reviewing, accepted, declined, waitlisted, archived. Changing status does **not** send acceptance/rejection emails. Reply to an owner notification to contact the applicant using the configured Reply-To. Collect exact attendance/load-in commitments, permits and other documents after acceptance. A branded admin login, automated decision emails, uploads, RSVP/ticketing and payments are not part of this submission backend.

The applicant receipt contains a reference and explicitly says receipt is not acceptance. Owner messages contain submitted answers as plain text. `sent` in the outbox means Resend accepted the API request, not proof that the recipient read it or that it reached the inbox. Check Resend logs for delivery/bounces.

## Email recovery

The protected `/api/retry-emails/` endpoint claims up to two eligible jobs per run. Vercel's built-in daily cron is configured for 12:00 UTC and supplies `Authorization: Bearer CRON_SECRET`. Vercel Hobby permits daily schedules, so this is a low-volume fallback, not a prompt retry guarantee. Cron executes on production deployments; test the endpoint manually in preview. On a plan supporting frequent cron, change the schedule to every 10 minutes for prompt automatic recovery.

For an outage or backlog, put the same server settings in ignored `.env.local` and run:

```sh
npm run email:retry
```

This processes up to 20 eligible jobs and prints counts without applicant information. Failed attempts become eligible again after five minutes. You can also POST to `/api/retry-emails/` with the Bearer secret from a trusted server; never expose that secret in the browser or a URL. A 502 response means at least one provider send failed; the saved applications remain intact.

The database leases jobs to avoid concurrent sends; stable Resend idempotency keys protect uncertain retries. After five attempts or 23 hours from the first attempt, unresolved jobs become `needs_review` rather than risk duplicates after Resend's 24-hour deduplication window. A daily fallback may encounter that boundary, so inspect the outbox after outages. Do not blindly reset these jobs: check Resend delivery logs first. If already accepted, mark the job sent; if confirmed never sent, reset its attempts and first-attempt timestamp and set it pending/available now. Keep recipients, sender and email templates stable while jobs are pending because changing the payload under an existing idempotency key can cause a conflict.

## Local development and validation

`npm run dev` and `npm run preview` include a local `/api/applications` adapter. Without credentials it returns a truthful 503. With a test `.env.local`, set `SITE_URL` to the exact local origin, restart the server, and use a test database and recipient. Local retry runs through `npm run email:retry`; Vercel owns the production cron endpoint.

```sh
npm run typecheck
npm run build
npm run test:backend
npm run preview -- --host 127.0.0.1
# In another terminal:
npm run test:form
npm test
```

`test:form` expects an unconfigured local backend, then mocks provider success/failure in the browser. It never sends real applications or email. Backend tests execute the migration with an isolated PGlite PostgreSQL engine and mock HTTP providers. Tests do not substitute for live Supabase/Vercel verification.

## Live verification after setup

1. Submit a clearly labeled test application using your own email and the deployed site's canonical origin.
2. Verify one matching database row and exactly two outbox jobs; check both receipt and owner inboxes and Resend's delivery log.
3. Submit the same POST with the same request ID and answers again: it should return the existing reference without adding a row or sending duplicate email. Do this only with your test application.
4. Verify an anonymous Supabase client cannot read or insert into any application tables or invoke submission/queue functions. The server is the only write path.
5. Confirm the unauthenticated retry endpoint returns 401. Check the authorized retry endpoint and cron registration.
6. In a test environment, make Resend unavailable, submit, and verify that the application persists with pending email jobs. Restore the key, wait five minutes, and run the retry script.
7. Confirm phone links, URLs, conditional required fields, confirmation text and mobile keyboard behavior on a real phone.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Resend domain verification](https://resend.com/docs/dashboard/domains/introduction), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
