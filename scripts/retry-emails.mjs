import { configuration, deliverEmails, rpc } from "../server/services.mjs";
const config = configuration();
let processed = 0,
  accepted = 0;
for (let batch = 0; batch < 10; batch++) {
  const result = await deliverEmails(config);
  processed += result.processed;
  accepted += result.accepted;
  if (!result.processed || result.accepted < result.processed) break;
  // Respect the provider's default request rate between batches.
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
await rpc(config, "prune_application_rate_limits", {});
console.log(
  JSON.stringify({
    processed,
    accepted,
    note: "Check the Supabase outbox for pending or needs_review rows.",
  }),
);
if (processed !== accepted) process.exitCode = 1;
