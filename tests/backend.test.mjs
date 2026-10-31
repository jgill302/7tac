import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { applicationSchema } from "../shared/applications.mjs";
import { createHandler } from "../api/applications.mjs";
import { createRetryHandler } from "../api/retry-emails.mjs";
import { deliverEmails } from "../server/services.mjs";

const valid = (overrides = {}) => ({
  requestId: randomUUID(),
  type: "vendor",
  season: "late-2026",
  contactName: "Test Applicant",
  organization: "Example Studio",
  email: "test@example.com",
  link: "https://example.com",
  message: "Handmade prints",
  categories: ["Crafts"],
  prices: ["$10–25"],
  space: "6 foot table",
  equipment: "Own table",
  power: "None",
  acknowledgment: true,
  updates: false,
  website: "",
  ...overrides,
});
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-only",
  RESEND_API_KEY: "test-only",
  EMAIL_FROM: "Test <test@example.com>",
  APPLICATION_NOTIFY_EMAIL: "owner@example.com",
  SITE_URL: "https://example.com",
  RATE_LIMIT_SECRET: "a".repeat(32),
  CRON_SECRET: "b".repeat(32),
};
async function request(
  body,
  {
    environment = env,
    fetcher,
    method = "POST",
    origin = env.SITE_URL,
    headers = {},
  } = {},
) {
  let result;
  const res = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      result = { status: this.code, body, headers: this.headers };
      return result;
    },
  };
  await createHandler({ env: environment, fetcher })(
    {
      method,
      body,
      headers: {
        origin,
        "content-type": "application/json",
        "x-real-ip": "192.0.2.1",
        ...headers,
      },
    },
    res,
  );
  return result;
}
test("required and conditional fields, URLs, consent, and season are enforced", () => {
  assert.equal(applicationSchema.safeParse(valid()).success, true);
  for (const override of [
    { email: "bad" },
    { acknowledgment: false },
    { season: "2025" },
    { categories: [] },
    { link: "javascript:alert(1)" },
    { website: "bot" },
    { message: "x".repeat(3001) },
    { categories: ["Food"] },
  ])
    assert.equal(applicationSchema.safeParse(valid(override)).success, false);
  assert.equal(
    applicationSchema.safeParse(
      valid({
        categories: ["Food"],
        onsite: "Packaged snacks",
        permits: "Available",
      }),
    ).success,
    true,
  );
  for (const type of ["artist", "music", "performance", "partner", "idea"]) {
    assert.equal(
      applicationSchema.safeParse(
        valid({
          type,
          format: "Live",
          duration: "30 minutes",
          fee: "Discuss",
          contribution: "Venue",
        }),
      ).success,
      true,
    );
  }
  const data = applicationSchema.parse(
    valid({ type: "idea", categories: ["Food"] }),
  );
  assert.equal(data.categories, undefined);
});
test("unconfigured, cross-origin, unsupported method, malformed and oversize requests never save", async () => {
  const fetcher = () => {
    throw Error("Must not call external services");
  };
  assert.equal(
    (await request(valid(), { environment: {}, fetcher })).status,
    503,
  );
  assert.equal(
    (await request(valid(), { origin: "https://attacker.example", fetcher }))
      .status,
    403,
  );
  assert.equal(
    (await request(valid(), { method: "GET", fetcher })).status,
    405,
  );
  assert.equal((await request("{broken", { fetcher })).status, 400);
  assert.equal(
    (await request(valid({ message: "x".repeat(25000) }), { fetcher })).status,
    413,
  );
  assert.equal(
    (await request(valid({ email: "bad" }), { fetcher })).status,
    400,
  );
});
test("save failure is not success; rate limit, conflict and closed season surface correctly", async () => {
  assert.equal(
    (
      await request(valid(), {
        fetcher: async () => new Response("", { status: 500 }),
      })
    ).status,
    503,
  );
  for (const [status, code] of [
    ["limited", 429],
    ["conflict", 409],
    ["closed", 409],
  ]) {
    assert.equal(
      (
        await request(valid(), {
          fetcher: async () => Response.json({ status }),
        })
      ).status,
      code,
    );
  }
});
test("durable save remains successful when queue retrieval fails; IP is hashed", async () => {
  let calls = 0;
  const result = await request(valid(), {
    fetcher: async (url, options) => {
      calls++;
      if (url.endsWith("submit_application")) {
        const data = JSON.parse(options.body);
        assert.match(data.p_ip_key, /^[a-f0-9]{64}$/);
        assert.equal(data.p_payload.website, undefined);
        return Response.json({ status: "saved" });
      }
      throw Error("Email queue unavailable");
    },
  });
  assert.equal(result.status, 201);
  assert.equal(calls, 2);
});
test("email uses stable idempotency key, correct recipients and explicit failure state", async () => {
  const calls = [];
  const job = {
    id: randomUUID(),
    application_id: randomUUID(),
    lease_token: randomUUID(),
    kind: "receipt",
    email: "test@example.com",
    payload: { season: "2027", message: "<script>evil</script>" },
  };
  await deliverEmails(env, job.application_id, async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith("claim_application_emails")) return Response.json([job]);
    if (url === "https://api.resend.com/emails")
      return new Response("", { status: 503 });
    return Response.json(null);
  });
  assert.equal(calls[1].headers["Idempotency-Key"], `application-${job.id}`);
  const email = JSON.parse(calls[1].body);
  assert.deepEqual(email.to, ["test@example.com"]);
  assert.ok(!email.text.includes("<script>"));
  assert.equal(JSON.parse(calls[2].body).p_sent, false);
});

test("Postgres migration: private storage, atomic insert, duplicate retry, quotas, leases and expiry", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610310001_applications.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const id = randomUUID();
    const payload = applicationSchema.parse(valid());
    const submit = async (key, hash = "same", ip = "ip", email = "email") =>
      (
        await db.query(
          "select public.submit_application($1,$2,$3,$4,$5) as result",
          [key, payload, hash, ip, email],
        )
      ).rows[0].result.status;
    assert.equal(await submit(id), "saved");
    assert.equal(await submit(id), "saved");
    assert.equal(await submit(id, "changed"), "conflict");
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.application_email_outbox",
        )
      ).rows[0].n,
      2,
    );
    const leased = (
      await db.query("select * from public.claim_application_emails($1)", [id])
    ).rows;
    assert.equal(leased.length, 2);
    assert.equal(
      (
        await db.query("select * from public.claim_application_emails($1)", [
          id,
        ])
      ).rows.length,
      0,
    );
    await db.query("select public.finish_application_email($1,$2,true)", [
      leased[0].id,
      randomUUID(),
    ]);
    assert.equal(
      (
        await db.query(
          "select state from public.application_email_outbox where id=$1",
          [leased[0].id],
        )
      ).rows[0].state,
      "sending",
    );
    await db.query("select public.finish_application_email($1,$2,true)", [
      leased[0].id,
      leased[0].lease_token,
    ]);
    assert.equal(
      (
        await db.query(
          "select state from public.application_email_outbox where id=$1",
          [leased[0].id],
        )
      ).rows[0].state,
      "sent",
    );
    await db.exec(
      "update public.application_email_outbox set first_attempt_at = now()-interval '24 hours', available_at=now()-interval '1 minute' where state='sending'",
    );
    assert.equal(
      (
        await db.query("select * from public.claim_application_emails($1)", [
          id,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from public.application_email_outbox where state='needs_review'",
        )
      ).rows[0].n,
      1,
    );
    assert.equal(await submit(randomUUID()), "saved");
    assert.equal(await submit(randomUUID()), "saved");
    assert.equal(await submit(randomUUID()), "limited");
    await db.exec(
      "update public.application_seasons set accepting=false where id='late-2026'",
    );
    assert.equal(
      await submit(randomUUID(), "same", "otherip", "otheremail"),
      "closed",
    );
    for (const role of ["anon", "authenticated"]) {
      assert.equal(
        (
          await db.query(
            `select has_table_privilege('${role}','public.applications','select') as allowed`,
          )
        ).rows[0].allowed,
        false,
      );
      assert.equal(
        (
          await db.query(
            `select has_function_privilege('${role}','public.submit_application(uuid,jsonb,text,text,text)','execute') as allowed`,
          )
        ).rows[0].allowed,
        false,
      );
    }
  } finally {
    await db.close();
  }
});

test("full handler + Postgres submission and retry send exactly two provider requests", async () => {
  const db = new PGlite();
  let emails = [];
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610310001_applications.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const fetcher = async (url, options) => {
      const body = JSON.parse(options.body);
      if (url === "https://api.resend.com/emails") {
        emails.push(body);
        return Response.json({ id: randomUUID() });
      }
      const name = url.split("/").at(-1);
      const signatures = {
        submit_application: [
          "p_id",
          "p_payload",
          "p_hash",
          "p_ip_key",
          "p_email_key",
        ],
        claim_application_emails: ["p_application_id"],
        finish_application_email: ["p_id", "p_lease", "p_sent"],
      };
      const args = signatures[name];
      assert.ok(args);
      const rows = await db.query(
        `select * from public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")})`,
        args.map((key) => body[key]),
      );
      return Response.json(
        name === "submit_application"
          ? rows.rows[0].submit_application
          : name === "claim_application_emails"
            ? rows.rows
            : null,
      );
    };
    const data = valid();
    assert.equal((await request(data, { fetcher })).status, 201);
    assert.equal((await request(data, { fetcher })).status, 201);
    assert.equal(emails.length, 2);
    assert.deepEqual(emails.map((email) => email.to[0]).sort(), [
      "owner@example.com",
      "test@example.com",
    ]);
    assert.equal(
      (await db.query("select count(*)::int n from public.applications"))
        .rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from public.application_email_outbox where state='sent'",
        )
      ).rows[0].n,
      2,
    );
    const rls = (
      await db.query(
        "select relrowsecurity from pg_class where relname in ('applications','application_seasons','application_rate_limits','application_email_outbox')",
      )
    ).rows;
    assert.equal(rls.length, 4);
    assert.ok(rls.every((row) => row.relrowsecurity));
  } finally {
    await db.close();
  }
});

test("retry endpoint requires secret and reports provider failure", async () => {
  const invoke = async (authorization, fetcher) => {
    let output;
    const res = {
      setHeader() {},
      status(status) {
        this.code = status;
        return this;
      },
      json(body) {
        output = { status: this.code, body };
      },
    };
    await createRetryHandler({ env, fetcher })(
      { method: "POST", headers: { authorization } },
      res,
    );
    return output;
  };
  assert.equal(
    (
      await invoke("", () => {
        throw Error("No requests allowed");
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await invoke("Bearer wrong", () => {
        throw Error("No requests allowed");
      })
    ).status,
    401,
  );
  const result = await invoke(`Bearer ${env.CRON_SECRET}`, async (url) => {
    if (url.endsWith("claim_application_emails"))
      return Response.json([
        {
          id: randomUUID(),
          application_id: randomUUID(),
          lease_token: randomUUID(),
          kind: "owner",
          email: "test@example.com",
          payload: {},
        },
      ]);
    if (url === "https://api.resend.com/emails")
      return new Response("", { status: 429 });
    return Response.json(null);
  });
  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { processed: 1, accepted: 0 });
});
