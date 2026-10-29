if (document.getElementById("graffiti-canvas")) void import("./graffiti");
import { STARTER_ARCHETYPES, canAdvanceToStage } from "./companionCatalog";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const menu = $<HTMLDialogElement>("navigation");
const toggle = $<HTMLButtonElement>("menu-toggle");
const article = $<HTMLDialogElement>("article-dialog");
let menuClosing = false;
function closeMenu(destination?: string) {
  if (menuClosing) return;
  menuClosing = true;
  menu.classList.add("is-closing");
  window.setTimeout(
    () => {
      menu.close();
      menu.classList.remove("is-closing");
      document.body.classList.remove("modal-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
      menuClosing = false;
      if (destination) {
        location.hash = destination;
        const target = document.querySelector<HTMLElement>(destination);
        target?.setAttribute("tabindex", "-1");
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      }
    },
    matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
  );
}
toggle.addEventListener("click", () => {
  menu.showModal();
  document.body.classList.add("modal-open");
  toggle.setAttribute("aria-expanded", "true");
  $<HTMLButtonElement>("menu-close").focus();
});
$("menu-close").addEventListener("click", () => closeMenu());
menu.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeMenu();
});
menu.querySelectorAll<HTMLAnchorElement>("a").forEach((link) =>
  link.addEventListener("click", (e) => {
    if (link.pathname !== location.pathname) return;
    e.preventDefault();
    closeMenu(link.hash || "#main");
  }),
);
const motion = $<HTMLButtonElement>("motion-toggle");
motion.addEventListener("click", () => {
  const paused = document.body.classList.toggle("motion-paused");
  motion.setAttribute("aria-pressed", String(paused));
  motion.textContent = paused ? "Resume train motion" : "Pause train motion";
});

// Prototype state is intentionally ephemeral. No accounts or entitlements are issued.
const selector = $<HTMLSelectElement>("companion-select");
if (selector) {
  STARTER_ARCHETYPES.forEach((item, i) =>
    selector.add(new Option(item.name, String(i))),
  );
  let companion = 0,
    credits = 0,
    visits = 0,
    stage = 1;
  const forms = ["BASE", "STREET", "TRANSIT", "ULTIMATE"];
  const art = [
    '<svg viewBox="0 0 200 200" aria-hidden="true"><path fill="#b4bbc3" d="M42 122 68 85 97 82 108 47 138 40 155 55 153 87 170 107 155 125 139 146 69 149z"/><path fill="#dce0e2" d="m68 85 29-3 33 39-61 28-27-27z"/><path fill="#8a91a1" d="m97 82 33 39 25 4-16 21-70 3z"/><path fill="#a79ab6" d="m97 82 11-35 10 44 35-4-23 34z"/><path fill="#777e8b" d="m42 122-20 15 47 12z"/><path fill="#584b69" d="M135 56h8v8h-8z"/><path fill="#e1d2b5" d="m153 65 20 9-20 5z"/><path stroke="#777383" stroke-width="6" d="m94 148-2 20H78m42-22 2 22h14"/></svg>',
    '<svg viewBox="0 0 200 200" aria-hidden="true"><path fill="#b6bdc6" d="M43 112V92l17-34 37-15 40 14 22 37v25z"/><path fill="#dde1e4" d="m97 43 40 14 22 37-62-8z"/><path fill="#9ea8b7" d="M43 112 97 86l62 8v25l-69 18z"/><path fill="#858d9e" d="m90 137 69-18 30 15-14 19-53 4-58-24z"/><path fill="#f3f2ef" d="M85 69h27v7l-17 24H85l17-23H85z"/><path stroke="#d1d6dd" fill="none" d="M97 43v43M60 58l15 34"/></svg>',
    '<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="disc-art"><stop stop-color="#a7b9bc"/><stop offset=".4" stop-color="#f0e6ef"/><stop offset=".6" stop-color="#b9adc9"/><stop offset="1" stop-color="#d9e2d5"/></linearGradient></defs><circle cx="100" cy="100" r="76" fill="url(#disc-art)" stroke="#9ca4b2"/><g fill="none" stroke="#f4f3ef" opacity=".6"><circle cx="100" cy="100" r="67"/><circle cx="100" cy="100" r="62"/><circle cx="100" cy="100" r="57"/></g><circle cx="100" cy="100" r="19" fill="#eeedf2" stroke="#a3a6b2"/><path stroke="#fff" stroke-width="12" opacity=".5" d="m49 49 34 34m34 34 35 35"/></svg>',
  ];
  function renderCompanion() {
    const item = STARTER_ARCHETYPES[companion];
    $("companion-index").textContent =
      `${String(companion + 1).padStart(2, "0")} / 17`;
    $("companion-name").textContent = item.name;
    $("companion-art").innerHTML =
      art[companion] ??
      `<span class="placeholder">${String(companion + 1).padStart(2, "0")}</span>`;
    $("companion-art").setAttribute(
      "aria-label",
      `${item.name}: ${companion < 3 ? "original concept illustration" : "numbered placeholder; artwork in development"}`,
    );
    selector.value = String(companion);
  }
  function renderProgress(message = "Preview only. No progress is saved.") {
    if (!$("evolution")) return;
    $("evolution").innerHTML = forms
      .map(
        (form, i) =>
          `<span class="${i + 1 === stage ? "active" : ""}" ${i + 1 === stage ? 'aria-current="step"' : ""}>0${i + 1}<br>${form}</span>`,
      )
      .join("");
    $("progress-status").textContent =
      `${message} ${credits} credits · ${visits}/10 visits · ${forms[stage - 1]}.`;
    $("passport").innerHTML = Array.from(
      { length: 10 },
      (_, i) =>
        `<span class="${i < visits ? "earned" : ""}" aria-label="Visit ${i + 1}: ${i < visits ? "simulated" : "locked"}">${i < visits ? "✓" : i + 1}</span>`,
    ).join("");
  }
  function advance() {
    if (credits >= 2 && stage < 2) stage = 2;
    if (credits >= 5 && stage < 3) stage = 3;
    if (
      canAdvanceToStage({
        targetStage: 4,
        currentStage: stage,
        verifiedAttendanceSeals: visits,
      })
    )
      stage = 4;
  }
  $("companion-prev").onclick = () => {
    companion = (companion + 16) % 17;
    renderCompanion();
  };
  $("companion-next").onclick = () => {
    companion = (companion + 1) % 17;
    renderCompanion();
  };
  selector.onchange = () => {
    companion = Number(selector.value);
    renderCompanion();
  };
  if ($("earn-credit")) {
    $("earn-credit").onclick = () => {
      credits++;
      advance();
      renderProgress("Demo credit added.");
    };
    $("simulate-upgrade").onclick = () => {
      if (stage >= 3) {
        renderProgress("Upgrades cannot bypass attendance.");
        return;
      }
      credits = stage === 1 ? Math.max(2, credits) : 5;
      advance();
      renderProgress("Upgrade simulated; no payment taken.");
    };
    $("simulate-visit").onclick = () => {
      visits = Math.min(10, visits + 1);
      advance();
      renderProgress("Visit simulated; no attendance verified.");
    };
    $("reset-progress").onclick = () => {
      credits = visits = 0;
      stage = 1;
      renderProgress("Demo reset.");
    };
  }
  renderCompanion();
  renderProgress();
}

// Build editorial previews from the existing source drafts, not invented publication records.
const sources = import.meta.glob("../content/blog/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const drafts = Object.values(sources).map((source) => {
  const field = (name: string) =>
    source.match(new RegExp(`^${name}: "(.*)"`, "m"))?.[1] ?? "";
  return {
    title: field("title"),
    slug: field("slug"),
    category: field("category"),
    body: source.split("---").slice(2).join("---").trim(),
  };
});
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const visibleDrafts = drafts.filter((post) =>
  document.body.dataset.page === "nightmarket"
    ? post.category === "Nightmarket ATX"
    : post.category !== "Nightmarket ATX",
);
$("journal-list").innerHTML = visibleDrafts
  .map(
    (post, i) =>
      `<a class="journal-row" href="#journal/${post.slug}"><span class="label">NOTE 00${i + 1}<br>${escapeHtml(post.category)}</span><h3>${escapeHtml(post.title)}</h3><span class="label">EDITORIAL DRAFT</span><span class="arrow" aria-hidden="true">↗</span></a>`,
  )
  .join("");
function showArticle() {
  const slug = location.hash.replace("#journal/", "");
  const post = visibleDrafts.find((item) => item.slug === slug);
  if (!post) {
    if (article.open) article.close();
    return;
  }
  $("article-content").innerHTML =
    `<span class="label article-meta">${escapeHtml(post.category)} / UNPUBLISHED DRAFT</span><h2 id="article-title">${escapeHtml(post.title)}</h2>` +
    post.body
      .split(/\r?\n\r?\n/)
      .filter((p) => !p.startsWith("# "))
      .map((p) => `<p>${escapeHtml(p.replace(/^\*|\*$/g, ""))}</p>`)
      .join("");
  if (!article.open) article.showModal();
  document.body.classList.add("modal-open");
  document.title = `${post.title} — 7TAC Journal draft`;
}
function closeArticle() {
  article.close();
  history.replaceState(null, "", "#journal");
}
$("article-close").onclick = closeArticle;
article.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  document.title =
    document.body.dataset.page === "nightmarket"
      ? "Nightmarket ATX — 7 Train Art Co."
      : "7TAC — Based in the Essence.";
  if (location.hash.startsWith("#journal/"))
    history.replaceState(null, "", "#journal");
});
window.addEventListener("hashchange", showArticle);
showArticle();
$("contact-form")?.addEventListener("submit", (e) => e.preventDefault());
