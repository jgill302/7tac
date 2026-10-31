import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_URL || "http://127.0.0.1:4173";
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${base}/nightmarket/`);
  await page.locator('[data-application="vendor"]').click();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      true,
      `overflow at ${width}`,
    );
  }
  assert.match(
    await page.locator('[name="season"]').textContent(),
    /Late 2026.*2027/s,
  );
  await page.getByLabel("Food", { exact: true }).check();
  assert.equal(await page.locator('[name="onsite"]').isVisible(), true);
  await page.locator('[name="type"]').selectOption("music");
  assert.equal(await page.locator('[name="onsite"]').isVisible(), false);
  assert.equal(await page.locator('[name="duration"]').isVisible(), true);
  await page.locator('[name="type"]').selectOption("vendor");
  assert.equal(await page.locator('[name="onsite"]').isVisible(), true);
  await page.getByLabel("Food", { exact: true }).uncheck();
  await page.getByLabel("Crafts", { exact: true }).check();
  await page.getByLabel("$10–25", { exact: true }).check();
  for (const [name, value] of Object.entries({
    contactName: "QA Applicant",
    organization: "QA Studio",
    email: "qa@example.com",
    link: "https://example.com",
    message: "Independent prints",
    space: "6 foot table",
    equipment: "Own table and chairs",
    power: "None",
  }))
    await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('[name="acknowledgment"]').check();
  // Actual local API fails honestly before accounts exist; keep answers intact.
  await page
    .getByRole("button", { name: "Send application", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#application-status")
      .textContent.includes("not open yet"),
  );
  assert.equal(
    await page.locator('[name="organization"]').inputValue(),
    "QA Studio",
  );
  const requests = [];
  await page.route("**/api/applications", async (route) => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1)
      return route.fulfill({
        status: 503,
        json: { error: "Temporary outage. Retry with your answers unchanged." },
      });
    return route.fulfill({
      status: 201,
      json: {
        id: requests.at(-1).requestId,
        message: "Application received. This is not acceptance.",
      },
    });
  });
  await page
    .getByRole("button", { name: "Send application", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#application-status")
      .textContent.includes("Temporary outage"),
  );
  await page
    .getByRole("button", { name: "Send application", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#application-status")
      .textContent.includes("Your reference"),
  );
  assert.equal(requests[0].requestId, requests[1].requestId);
  assert.equal(requests[1].onsite, undefined);
  assert.equal(requests[1].updates, false);
  assert.equal(
    await page
      .getByRole("button", { name: "Application received", exact: true })
      .isDisabled(),
    true,
  );
  await page.unroute("**/api/applications");
  await page.reload();
  await page.locator('[data-application="vendor"]').click();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator("#application-preview").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: new URL(
        `../artifacts/application-${width}.png`,
        import.meta.url,
      ).pathname.replace(/^\/([A-Z]:)/, "$1"),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: six viewport widths, conditional fields, real unconfigured API, retained answers, stable retry ID, mocked receipt, no JS errors.",
  );
} finally {
  await browser.close();
}
