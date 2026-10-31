import { applicationSchema } from "../shared/applications.mjs";
import {
  configuration,
  rpc,
  fingerprint,
  rateKey,
  deliverEmails,
} from "../server/services.mjs";

export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const respond = (status, body) => res.status(status).json(body);
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return respond(405, { error: "Method not allowed." });
    }
    let config;
    try {
      config = configuration(env);
    } catch {
      return respond(503, {
        error:
          "Applications are not open yet. Your answers have not been submitted. Please try again later.",
      });
    }
    if (req.headers.origin !== config.SITE_URL)
      return respond(403, {
        error: "Please submit from the Nightmarket website.",
      });
    if (
      !String(req.headers["content-type"] || "").startsWith("application/json")
    )
      return respond(415, { error: "Expected JSON." });
    let body;
    try {
      if (
        Number(req.headers["content-length"]) > 24000 ||
        Buffer.byteLength(
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body || {}),
        ) > 24000
      )
        return respond(413, { error: "Application is too large." });
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return respond(400, { error: "Invalid application data." });
    }
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success)
      return respond(400, {
        error: "Please check the highlighted fields.",
        fields: parsed.error.flatten().fieldErrors,
      });
    const data = parsed.data;
    const { requestId, website, ...payload } = data;
    // Vercel sets x-real-ip. Never trust client-supplied x-forwarded-for for a rate limit.
    const ip =
      req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
    let saved;
    try {
      saved = await rpc(
        config,
        "submit_application",
        {
          p_id: requestId,
          p_payload: payload,
          p_hash: fingerprint(payload),
          p_ip_key: rateKey(config, `ip:${ip}`),
          p_email_key: rateKey(config, `email:${payload.email}`),
        },
        fetcher,
      );
    } catch {
      return respond(503, {
        error:
          "We could not confirm your submission. Please retry with your answers unchanged; retries will not create duplicates.",
      });
    }
    if (saved.status === "limited") {
      res.setHeader("Retry-After", "3600");
      return respond(429, {
        error: "Too many applications. Please try again in an hour.",
      });
    }
    if (saved.status === "conflict")
      return respond(409, {
        error:
          "This submission reference was already used with different answers. Reload to start a new application.",
      });
    if (saved.status === "closed")
      return respond(409, {
        error:
          "Applications for that season are closed. Please choose another season.",
      });
    if (saved.status !== "saved")
      return respond(503, {
        error: "We could not confirm your submission. Please try again.",
      });
    try {
      await deliverEmails(config, requestId, fetcher);
    } catch {
      console.warn("Application saved; notification queue needs retry.");
    }
    return respond(201, {
      id: requestId,
      message:
        "Application received. We’ll review it and contact you. This is not a confirmation of acceptance. An email receipt is queued.",
    });
  };
}
export default createHandler();
