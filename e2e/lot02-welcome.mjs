/* Audit 1.3 LOT 02 — both entries on the first screen, no masked clicks. */
import { BASE, check, done, open } from "./lib.mjs";

const inViewport = (page, locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
  });

const CASES = [
  { lang: "en", viewport: { width: 390, height: 844 }, find: "Find care", become: "Become a pet-sitter" },
  { lang: "fr", viewport: { width: 390, height: 844 }, find: "Trouver une garde", become: "Devenir pet-sitter" },
  { lang: "ar", viewport: { width: 390, height: 844 }, find: "ابحث عن رعاية", become: "كن حاضناً" },
  { lang: "fr", viewport: { width: 320, height: 568 }, find: "Trouver une garde", become: "Devenir pet-sitter" },
  { lang: "ar", viewport: { width: 320, height: 568 }, find: "ابحث عن رعاية", become: "كن حاضناً" },
];

for (const c of CASES) {
  const tag = `${c.lang} ${c.viewport.width}×${c.viewport.height}`;
  const { page, context } = await open({ lang: c.lang, viewport: c.viewport });
  await page.goto(`${BASE}/`);
  await page.waitForURL(/\/welcome/);
  const find = page.getByRole("button", { name: c.find });
  const become = page.getByRole("link", { name: c.become });
  check(`${tag}: "${c.find}" visible without scrolling`, await inViewport(page, find));
  check(`${tag}: "${c.become}" visible without scrolling`, await inViewport(page, become));
  check(`${tag}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  /* Nothing covers the page: the element at the centre of each action IS the action. */
  const hit = await find.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el === top || el.contains(top);
  });
  check(`${tag}: no overlay above the actions`, hit);
  /* 1.4: an icon-only trigger whose accessible name carries the current
     language ("Langue : Français"), opening a menu. */
  check(`${tag}: language selector reachable`, await page.getByRole("button", { name: /Language|Langue|اللغة/ }).isVisible());
  await context.close();
}

/* The two doors lead where they say, immediately. */
{
  const { page, context } = await open({ lang: "en" });
  await page.goto(`${BASE}/welcome`);
  const t0 = Date.now();
  await page.getByRole("button", { name: "Find care" }).click();
  await page.waitForURL(/\/owner\/need\/pet/);
  check("Find care → need flow, without a timed wait", Date.now() - t0 < 2000);
  await page.goto(`${BASE}/welcome`);
  await page.getByRole("link", { name: "Become a pet-sitter" }).click();
  await page.waitForURL(/\/sitter\/start/);
  check("Become a pet-sitter → sitter introduction", true);
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* A keyboard user's first Tab lands on something visible. */
{
  const { page, context } = await open({ lang: "fr" });
  await page.goto(`${BASE}/welcome`);
  await page.keyboard.press("Tab");
  const visible = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && Number(s.opacity) > 0;
  });
  check("first Tab focuses a visible control", visible);
  await context.close();
}

await done();
