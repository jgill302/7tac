import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const output = new URL("../artifacts/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => {
  const NativeAudio = window.AudioContext;
  window.AudioContext = class extends NativeAudio {
    constructor(...args) {
      super(...args);
      window.__sprayAudio = this;
    }
    createGain() {
      const gain = super.createGain();
      window.__sprayGain = gain;
      return gain;
    }
  };
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const base = process.env.QA_URL || "http://127.0.0.1:4173";
const results = [];
const shot = (name) =>
  page.screenshot({
    path: new URL(name + ".jpg", output).pathname.replace(/^\/([A-Z]:)/, "$1"),
    type: "jpeg",
    quality: 90,
    animations: "disabled",
  });
try {
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.locator(".site-header a, .site-header button").count(),
    2,
  );
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
    await page
      .getByRole("button", { name: "Open 7TAC navigation", exact: true })
      .click();
    assert.equal(
      await page
        .locator("#menu-close")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "hidden",
    );
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await page.evaluate(
        () => !!document.activeElement.closest("#navigation"),
      ),
      true,
      "focus escaped modal",
    );
    const geometry = await page
      .locator("#navigation nav")
      .evaluate((el) => ({ width: el.scrollWidth, visible: el.clientWidth }));
    assert.ok(geometry.width <= geometry.visible, `menu overflow at ${width}`);
    if (width === 390 || width === 1440) await shot(`navigation-${width}`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector("#navigation").open,
    );
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      await page
        .locator("#menu-toggle")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    if (width === 390) await shot("homepage-mobile");
    results.push({
      width,
      overflow: false,
      menuFocus: true,
      escapeRestoresFocus: true,
    });
  }
  await shot("homepage-desktop");
  await page.locator(".site-header").screenshot({
    path: new URL("train-frame-1.png", output).pathname.replace(
      /^\/([A-Z]:)/,
      "$1",
    ),
  });
  const position = await page
    .locator(".train-panorama")
    .evaluate((el) => getComputedStyle(el).backgroundPositionX);
  await page.waitForTimeout(350);
  assert.notEqual(
    await page
      .locator(".train-panorama")
      .evaluate((el) => getComputedStyle(el).backgroundPositionX),
    position,
  );
  await page.locator(".site-header").screenshot({
    path: new URL("train-frame-2.png", output).pathname.replace(
      /^\/([A-Z]:)/,
      "$1",
    ),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".train-panorama")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "Open 7TAC navigation", exact: true })
    .click();
  await page.locator('#navigation nav a[href="/nightmarket/"]').click();
  await page.waitForFunction(() => !document.querySelector("#navigation").open);
  assert.equal(new URL(page.url()).pathname, "/nightmarket/");
  await page.reload();
  await page.locator(".game-case").waitFor();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      true,
      `Nightmarket overflow at ${width}`,
    );
    assert.equal(
      await page
        .locator(".market-poster h2")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      true,
      `poster text clipping at ${width}`,
    );
    assert.equal(
      await page
        .locator(".game-spine")
        .evaluate((el) => el.scrollHeight <= el.clientHeight),
      true,
      "spine content fits",
    );
    if (width === 390) await shot("nightmarket-mobile");
  }
  await page.locator("#nightmarket").scrollIntoViewIfNeeded();
  await shot("nightmarket");
  assert.ok(
    await page.getByText("To be announced", { exact: true }).isVisible(),
  );
  await page.locator("#collectibles").scrollIntoViewIfNeeded();

  assert.equal(await page.locator("#companion-select").count(), 0);
  assert.equal(await page.locator("#simulate-upgrade").count(), 0);
  for (const name of ["Compact Disc", "Fitted Cap", "Platform Pigeon"]) {
    await page.locator("#companion-next").click();
    assert.equal(await page.locator("#companion-name").textContent(), name);
  }
  await page.locator("#companion-prev").click();
  assert.equal(
    await page.locator("#companion-name").textContent(),
    "Fitted Cap",
  );
  await shot("companion");
  await page.locator(".journal-row").first().click();
  await page.locator("#article-dialog").waitFor({ state: "visible" });
  assert.match(
    await page.locator("#article-content").textContent(),
    /UNPUBLISHED DRAFT/,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.body.classList.contains("modal-open"),
  );
  assert.equal(
    await page.evaluate(() => document.body.classList.contains("modal-open")),
    false,
  );

  for (const [key, title] of [
    ["vendor", "Vendor application"],
    ["artist", "Artist application"],
    ["music", "DJ / music application"],
    ["performance", "Live performance application"],
    ["partner", "Partner inquiry"],
    ["idea", "Share an idea"],
  ]) {
    await page.locator('[data-application="' + key + '"]').click();
    assert.equal(await page.locator("#application-title").textContent(), title);
    assert.equal(await page.locator("#contact-form select").inputValue(), key);
    assert.equal(
      await page.locator("#application-preview").getAttribute("open"),
      "",
    );
  }
  await page.locator("#application-preview summary").click();
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await shot("participation-desktop");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await shot("participation-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });

  assert.equal(await page.locator("#contact-form button").isDisabled(), true);
  await page.goto(base);
  assert.equal(await page.locator("#nightmarket + #contact").count(), 1);
  await page.locator("#nightmarket").scrollIntoViewIfNeeded();
  await shot("homepage-nightmarket-connection");
  assert.equal(await page.locator("#simulate-upgrade").count(), 0);
  assert.equal(await page.locator("#contact-form").count(), 0);
  await page.locator('#graffiti-canvas[data-ready="true"]').waitFor();
  await page.locator("#graffiti-canvas").scrollIntoViewIfNeeded();
  const canvas = page.locator("#graffiti-canvas");
  const before = await canvas.evaluate((el) => el.toDataURL());
  const box = await canvas.boundingBox();
  assert.equal(
    await page.locator("#collectibles").count(),
    0,
    "archive only belongs on Nightmarket",
  );
  const px = (x) => box.x + (x * box.width) / 980,
    py = (y) => box.y + (y * box.height) / 420;
  await page.mouse.move(px(100), py(80));
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
  assert.ok(
    (await canvas.evaluate((el) => el.toDataURL())) === before,
    "outside train must remain untouched",
  );
  await canvas.evaluate((el) => {
    window.__paintBase = el.getContext("2d").getImageData(0, 0, 980, 420).data;
  });
  await page.mouse.move(px(400), py(205));
  await page.mouse.down();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__sprayAudio.state), "running");
  assert.ok(
    (await page.evaluate(() => window.__sprayGain.gain.value)) > 0.05,
    "spray sound starts during paint",
  );
  await page.mouse.up();
  const wet = await canvas.evaluate((el) => el.toDataURL());
  await page.waitForTimeout(800);
  assert.ok(
    (await canvas.evaluate((el) => el.toDataURL())) !== wet,
    "wet paint should drip slightly after release",
  );
  assert.ok(
    (await page.evaluate(() => window.__sprayGain.gain.value)) < 0.005,
    "spray sound stops on release",
  );
  await page.mouse.move(px(700), py(265));
  await page.mouse.down();
  await page.mouse.move(px(720), py(330), { steps: 12 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(900);
  const changed = await canvas.evaluate((el) => {
    const context = el.getContext("2d"),
      after = context.getImageData(0, 0, 980, 420).data,
      base = window.__paintBase;
    const mask = new Path2D();
    mask.roundRect(28.24, 129.1, 915.72, 151.7, 9);
    let inside = 0,
      outside = 0;
    for (let y = 0; y < 420; y++)
      for (let x = 0; x < 980; x++) {
        const i = (y * 980 + x) * 4;
        if (
          after[i] !== base[i] ||
          after[i + 1] !== base[i + 1] ||
          after[i + 2] !== base[i + 2]
        ) {
          if (context.isPointInPath(mask, x + 0.5, y + 0.5)) inside++;
          else outside++;
        }
      }
    return { inside, outside };
  });
  assert.ok(changed.inside > 200, "spray deposits textured pigment");
  assert.equal(changed.outside, 0, "spray and drips are clipped to train");
  await page.locator("#spray-sound").click();
  await page.mouse.move(px(550), py(210));
  await page.mouse.down();
  await page.waitForTimeout(200);
  assert.ok(
    (await page.evaluate(() => window.__sprayGain.gain.value)) < 0.005,
    "mute silences spray",
  );
  await page.mouse.up();
  await shot("spray-paint");
  await page.locator("#clear-canvas").click();
  assert.ok(
    (await canvas.evaluate((el) => el.toDataURL())) === before,
    "clear should restore original canvas",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-canvas").click();
  const downloaded = await downloadPromise;
  await downloaded.saveAs(
    new URL("graffiti-export.png", output).pathname.replace(
      /^\/([A-Z]:)/,
      "$1",
    ),
  );
  assert.equal(downloaded.suggestedFilename(), "7tac-graffiti-train.png");

  const broken = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .filter(
          (a) =>
            !a.hash.startsWith("#journal/") &&
            !document.getElementById(a.hash.slice(1)),
        )
        .map((a) => a.hash),
    );
  assert.deepEqual(broken, []);
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("qa-results.json", output),
    JSON.stringify(
      {
        base,
        viewports: results,
        checks: [
          "production runtime",
          "two header controls",
          "focus containment",
          "Escape and return focus",
          "cross-page menu navigation and direct Nightmarket reload",
          "Nightmarket six widths and poster text fits",
          "homepage connection immediately after Nightmarket",
          "event progression and applications confined to Nightmarket",
          "train movement",
          "reduced motion",
          "three curated objects, forward and reverse wrap",
          "six role-specific application previews",
          "journal draft navigation",
          "spray density, slight drips, strict train mask, sound graph and mute, clear and download",
          "disabled unconnected form",
          "all hash destinations",
          "no console errors",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: six widths, navigation, motion, companions, journal, graffiti, forms, links, console.",
  );
} finally {
  await browser.close();
}
