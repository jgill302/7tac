import { timingSafeEqual } from "node:crypto";
import { configuration, deliverEmails, rpc } from "../server/services.mjs";
export function createRetryHandler({
  env = process.env,
  fetcher = fetch,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method))
      return res.status(405).json({ error: "Method not allowed" });
    let config;
    try {
      config = configuration(env);
    } catch {
      return res.status(503).json({ error: "Backend not configured" });
    }
    const supplied = Buffer.from(String(req.headers.authorization || ""));
    const expected = Buffer.from(`Bearer ${config.CRON_SECRET}`);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      return res.status(401).json({ error: "Unauthorized" });
    try {
      const result = await deliverEmails(config, null, fetcher);
      await rpc(config, "prune_application_rate_limits", {}, fetcher);
      return res
        .status(result.processed === result.accepted ? 200 : 502)
        .json(result);
    } catch {
      return res.status(503).json({ error: "Email queue retry failed" });
    }
  };
}
export default createRetryHandler();
