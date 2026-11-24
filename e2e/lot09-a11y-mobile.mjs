/* Audit 1.3 LOT 09 — fluidity, mobile, accessibility, identity guards. */
import { ACCOUNT, BASE, check, clean, done, isoIn, open, publishedSitter, seedState } from "./lib.mjs";

const pet = { id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "medium" } };
const req = { id: "req-1", createdAt: "2026-11-20T10:00:00.000Z", sitterId: "amina-b", pet, careType: "boarding", dates: { start: isoIn(5), end: isoIn(7) }, communeCode: "hydra", ownerName: "Lina K.", displayedRate: { amount: 1200, careType: "boarding" }, status: "pending", respondedAt: null };
const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: publishedSitter(), pets: [pet], requests: [req] });
const ROUTES = [
  "/",
  "/search?species=dog&wilaya=alger",
  "/sitters/amina-b?species=dog&care=boarding",
  "/owner/requests",
  "/owner/requests/req-1",
  "/owner/pets",
  "/owner/pets/pet-rex",
  "/account",
  "/settings",
  "/messages?tab=notifications",
  "/help",
  "/owner/need/pet",
  `/owner/request/amina-b?care=boarding&from=${isoIn(3)}&to=${isoIn(5)}`,
  "/sitter/profile",
  "/sitter/requests",
];

async function sweep(page) {
  return page.evaluate(() => {
    const out = { scroll: document.documentElement.scrollWidth > window.innerWidth, small: [], unnamed: 0, h1: document.querySelectorAll("h1").length };
    for (const el of document.querySelectorAll("a, button, [role=radio], [role=checkbox], [role=combobox]")) {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (!b.width || !b.height || s.visibility === "hidden" || el.closest("[aria-hidden=true]")) continue;
      const inlineText = el.tagName === "A" && s.display === "inline";
      if (!inlineText && b.height < 44) out.small.push(`${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}:${Math.round(b.height)}`);
      const name = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent || "").trim();
      if (!name) out.unnamed += 1;
    }
    return out;
  });
}

for (const [lang, width] of [["fr", 320], ["ar", 390], ["fr", 768], ["ar", 1280]]) {
  const { page, context } = await open({ lang, viewport: { width, height: width < 700 ? 700 : 900 }, state });
  const problems = [];
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`);
    const r = await sweep(page);
    if (r.scroll) problems.push(`${route}: horizontal scroll`);
    if (r.small.length) problems.push(`${route}: small targets ${r.small.slice(0, 3).join(", ")}`);
    if (r.unnamed) problems.push(`${route}: ${r.unnamed} unnamed control(s)`);
    if (r.h1 !== 1) problems.push(`${route}: ${r.h1} h1`);
  }
  check(`${lang} ${width}px: ${ROUTES.length} screens — no sideways scroll, 44px targets, named controls, one h1`, problems.length === 0, problems.slice(0, 4).join(" | "));
  check(`${lang} ${width}px: no page errors`, page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
  await context.close();
}

/* The bottom bar replaces the footer on a phone; Help/Policies stay in Compte. */
{
  const { page, context } = await open({ state });
  await page.goto(`${BASE}/owner/pets`);
  check("390px: footer hidden under the bottom bar", !(await page.locator("footer").isVisible()));
  await page.goto(`${BASE}/account`);
  check("390px: Help and Policies reachable from Compte", (await page.getByRole("link", { name: /^Help/ }).isVisible()) && (await page.getByRole("link", { name: /^Policies/ }).isVisible()));
  /* Focus follows navigation to the new screen's heading. */
  await page.locator("nav.md\\:hidden a").filter({ hasText: "Requests" }).click();
  await page.waitForURL(/\/owner\/requests$/);
  const focused = await page
    .waitForFunction(() => document.activeElement?.tagName === "H1", null, { timeout: 5000 })
    .then(() => true, () => false);
  check("after a tab, focus is on the new screen's heading", focused);
  /* One honesty statement on a request, not two. */
  await page.goto(`${BASE}/owner/requests/req-1`);
  const text = clean(await page.locator("main").innerText());
  check("request detail states 'nobody was notified' once", (text.match(/notified|prévenu/g) ?? []).length === 1, String((text.match(/notified/g) ?? []).length));
  await context.close();
}

/* Desktop keeps the footer and its links at 44px. */
{
  const { page, context } = await open({ viewport: { width: 1280, height: 900 }, state });
  await page.goto(`${BASE}/owner/pets`);
  const heights = await page.locator("footer a").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  check("desktop: footer visible with 44px links", heights.length === 3 && heights.every((h) => h >= 44), heights.join(","));
  await context.close();
}

/* Identity of 1.4 (design system amendments 0.1-A/B): the mist ground, Readex
   Pro for both scripts, no Playfair. Reduced motion honoured. */
{
  const { page, context } = await open({ state, reducedMotion: "reduce" });
  await page.goto(`${BASE}/`);
  const look = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, font: getComputedStyle(document.body).fontFamily }));
  check("mist application ground", look.bg === "rgb(237, 242, 240)", look.bg);
  check("Readex Pro first, no Playfair", /^"?Readex Pro/.test(look.font) && !/Playfair/i.test(look.font), look.font);
  const dur = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "animate-fade-in";
    document.body.appendChild(el);
    return getComputedStyle(el).animationDuration;
  });
  check("prefers-reduced-motion shortens animations", dur === "1e-05s" || dur === "0.00001s" || parseFloat(dur) < 0.001, dur);
  await context.close();
}

await done();
