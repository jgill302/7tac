import { createHash, createHmac } from "node:crypto";

export function configuration(env = process.env) {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "APPLICATION_NOTIFY_EMAIL",
    "SITE_URL",
    "RATE_LIMIT_SECRET",
    "CRON_SECRET",
  ];
  if (required.some((key) => !env[key]))
    throw new Error("Backend configuration incomplete");
  const site = new URL(env.SITE_URL);
  const database = new URL(env.SUPABASE_URL);
  if (
    site.protocol !== "https:" &&
    site.hostname !== "localhost" &&
    site.hostname !== "127.0.0.1"
  )
    throw Error("SITE_URL must be HTTPS");
  if (database.protocol !== "https:") throw Error("SUPABASE_URL must be HTTPS");
  if (env.RATE_LIMIT_SECRET.length < 32 || env.CRON_SECRET.length < 32)
    throw Error("Secrets must be at least 32 characters");
  return { ...env, SITE_URL: site.origin, SUPABASE_URL: database.origin };
}
export async function rpc(config, name, body, fetcher = fetch) {
  const result = await fetcher(`${config.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: config.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  if (!result.ok) throw Error(`Database request failed (${result.status})`);
  return result.json();
}
export function fingerprint(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
export function rateKey(config, value) {
  return createHmac("sha256", config.RATE_LIMIT_SECRET)
    .update(value)
    .digest("hex");
}

// Jobs are leased in Postgres. Resend's idempotency key also protects a retry after an uncertain network response.
export async function deliverEmails(
  config,
  applicationId = null,
  fetcher = fetch,
) {
  const jobs = await rpc(
    config,
    "claim_application_emails",
    { p_application_id: applicationId },
    fetcher,
  );
  let accepted = 0;
  for (const job of jobs) {
    let sent = false;
    try {
      const owner = job.kind === "owner";
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `application-${job.id}`,
        },
        body: JSON.stringify({
          from: config.EMAIL_FROM,
          to: [owner ? config.APPLICATION_NOTIFY_EMAIL : job.email],
          reply_to: owner ? job.email : config.APPLICATION_NOTIFY_EMAIL,
          subject: owner
            ? "New Nightmarket application"
            : "Nightmarket — application received",
          // Plain text keeps applicant content out of HTML. Receipt intentionally excludes user-supplied links/text.
          text: owner
            ? `Application ${job.application_id}\n\n${JSON.stringify(job.payload, null, 2)}\n\nReview in your private Supabase applications table.`
            : `We received your Nightmarket application.\n\nReference: ${job.application_id}\nSeason: ${job.payload.season}\n\nDates and venues are still to be announced. This confirms receipt, not acceptance or a reserved space. We’ll contact you about next steps.\n\nQuestions? Reply to this email.\n7 Train Art Co.`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      sent = response.ok;
    } catch {
      /* Leave retryable work in the durable queue. */
    }
    await rpc(
      config,
      "finish_application_email",
      { p_id: job.id, p_lease: job.lease_token, p_sent: sent },
      fetcher,
    );
    if (sent) accepted++;
  }
  return { processed: jobs.length, accepted };
}
