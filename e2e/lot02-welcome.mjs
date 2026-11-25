/* Audit 1.3 LOT 02 — both entries on the first screen, no masked clicks.
   Nidz 1.7: the welcome screen and the first choice. */
import { ACCOUNT, BASE, check, done, open, seedState } from "./lib.mjs";

const inViewport = (page, locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
  });

/* Nidz 1.7 (§2, §4): the welcome screen without a session carries « Open an
   account » and « Sign in »; the two doors of 1.3 (« Find care », « Become a
   pet-sitter ») moved to the first choice, `/start`, shown once an account
   exists. The same guarantees hold for both screens. */
const SIGNED_IN = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } });
const CASES = [
  { lang: "en", viewport: { width: 390, height: 844 }, open: "Open an account", signIn: "Sign in", find: "Find care", become: "Become a pet-sitter" },
  { lang: "fr", viewport: { width: 390, height: 844 }, open: "Ouvrir un compte", signIn: "Se connecter", find: "Trouver une garde", become: "Devenir pet-sitter" },
  { lang: "ar", viewport: { width: 390, height: 844 }, open: "فتح حساب", signIn: "تسجيل الدخول", find: "ابحث عن رعاية", become: "كن حاضناً" },
  { lang: "fr", viewport: { width: 320, height: 568 }, open: "Ouvrir un compte", signIn: "Se connecter", find: "Trouver une garde", become: "Devenir pet-sitter" },
  { lang: "ar", viewport: { width: 320, height: 568 }, open: "فتح حساب", signIn: "تسجيل الدخول", find: "ابحث عن رعاية", become: "كن حاضناً" },
];

const unmasked = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el === top || el.contains(top);
  });

for (const c of CASES) {
  const tag = `${c.lang} ${c.viewport.width}×${c.viewport.height}`;
  {
    const { page, context } = await open({ lang: c.lang, viewport: c.viewport });
    await page.goto(`${BASE}/`);
    await page.waitForURL(/\/welcome/);
    const create = page.getByRole("link", { name: c.open });
    const signIn = page.getByRole("link", { name: c.signIn, exact: true });
    check(`${tag} welcome: "${c.open}" visible without scrolling`, await inViewport(page, create));
    check(`${tag} welcome: "${c.signIn}" visible without scrolling`, await inViewport(page, signIn));
    check(`${tag} welcome: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    /* Nothing covers the page: the element at the centre of each action IS the action. */
    check(`${tag} welcome: no overlay above the actions`, (await unmasked(create)) && (await unmasked(signIn)));
    /* 1.4: an icon-only trigger whose accessible name carries the current
       language ("Langue : Français"), opening a menu. */
    check(`${tag} welcome: language selector reachable`, await page.getByRole("button", { name: /Language|Langue|اللغة/ }).isVisible());
    await context.close();
  }
  {
    const { page, context } = await open({ lang: c.lang, viewport: c.viewport, state: SIGNED_IN });
    await page.goto(`${BASE}/start`);
    const find = page.getByRole("button", { name: c.find });
    const become = page.getByRole("link", { name: c.become });
    check(`${tag} first choice: "${c.find}" visible without scrolling`, await inViewport(page, find));
    check(`${tag} first choice: "${c.become}" visible without scrolling`, await inViewport(page, become));
    check(`${tag} first choice: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    check(`${tag} first choice: no overlay above the actions`, (await unmasked(find)) && (await unmasked(become)));
    await context.close();
  }
}

/* The doors lead where they say, immediately. */
{
  const { page, context } = await open({ lang: "en" });
  await page.goto(`${BASE}/welcome`);
  await page.getByRole("link", { name: "Open an account" }).click();
  await page.waitForURL(/\/register/);
  check("Open an account → sign-up", true);
  await page.goto(`${BASE}/welcome`);
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/login/);
  check("Sign in → sign-in", true);
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}
{
  const { page, context } = await open({ lang: "en", state: SIGNED_IN });
  await page.goto(`${BASE}/start`);
  const t0 = Date.now();
  await page.getByRole("button", { name: "Find care" }).click();
  await page.waitForURL(/\/owner\/need\/pet/);
  check("Find care → need flow, without a timed wait", Date.now() - t0 < 2000);
  await page.goto(`${BASE}/start`);
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
