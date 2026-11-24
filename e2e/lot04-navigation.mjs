/* Audit 1.3 LOT 04 — one account, two spaces, no dead tab.
   Updated for Nidz 1.6: four tabs per side (Home · Requests · Messages ·
   Account / Requests · My profile · Messages · Account), Compte at /account
   with Paramètres behind its gear, and the sitter bar from the first draft. */
import { ACCOUNT, BASE, check, clean, done, isoIn, open, publishedSitter, seedState, storedState } from "./lib.mjs";

const DEAD = "This screen is not part of the demonstration";
const barLinks = (page) => page.locator("nav.md\\:hidden a");

async function visitEach(page, links, tag) {
  const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  for (const href of hrefs) {
    await page.goto(`${BASE}${href}`);
    await page.waitForSelector("h1");
    const h1 = clean(await page.locator("h1").first().innerText());
    check(`${tag}: ${href} is a real screen`, h1 !== DEAD && !(await page.getByText(DEAD).count()), h1);
  }
  return hrefs;
}

const owner = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: true },
  activeWorkspace: "owner",
  sitter: publishedSitter(),
  requestDraft: { sitterId: "amina-b", search: `care=boarding&from=${isoIn(3)}&to=${isoIn(5)}`, petHandoff: null, updatedAt: "2026-01-01T00:00:00Z" },
  pets: [{ id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "medium" } }],
});

/* 1. Owner space at 390px. */
{
  const { page, context } = await open({ state: owner });
  await page.goto(`${BASE}/`);
  await page.waitForSelector("h1");
  const labels = (await barLinks(page).allInnerTexts()).map((s) => s.trim());
  check("owner bar: Home · Requests · Messages · Account", labels.join("|") === "Home|Requests|Messages|Account", labels.join("|"));
  await visitEach(page, barLinks(page), "owner");
  check("owner bar fits 390px without horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  /* Switch to the sitter space from Compte, then back: nothing is lost. */
  await page.goto(`${BASE}/account`);
  check("Compte (tab root) shows no Back control", (await page.getByRole("button", { name: "Back" }).count()) === 0);
  await page.getByRole("button", { name: /Sitter space/ }).click();
  await page.waitForURL(/\/sitter\/requests/);
  const sitterLabels = (await barLinks(page).allInnerTexts()).map((s) => s.trim());
  check("sitter bar: Requests · My profile · Messages · Account", sitterLabels.join("|") === "Requests|My profile|Messages|Account", sitterLabels.join("|"));
  await visitEach(page, barLinks(page), "sitter");
  await page.goto(`${BASE}/account`);
  await page.getByRole("button", { name: /Owner space/ }).click();
  await page.waitForURL((u) => u.pathname === "/");
  const st = await storedState(page);
  check("switching spaces kept the request draft", st.requestDraft?.sitterId === "amina-b");
  check("switching spaces kept the animals and the sitter profile", st.pets.length === 1 && st.sitter?.published === true);
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 2. Desktop: the same destinations in the header, no orphan settings icon. */
{
  const { page, context } = await open({ viewport: { width: 1280, height: 800 }, state: owner });
  await page.goto(`${BASE}/`);
  await page.waitForSelector("h1");
  const header = page.locator("header nav");
  const labels = (await header.locator("a").allInnerTexts()).map((s) => s.trim());
  check("desktop header: Requests · Messages · Account (the logo is Home)", labels.join("|") === "Requests|Messages|Account", labels.join("|"));
  check("desktop: the mobile bar is hidden", !(await page.locator("nav.md\\:hidden").isVisible()));
  await context.close();
}

/* 3. A sitter whose profile is not published: the sitter bar from the first
   draft (1.6) — Mon profil is a tab root, so no Back control. */
{
  const draft = publishedSitter();
  draft.published = false;
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: draft }) });
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  check("unpublished dashboard: a tab root, no Back control", (await page.getByRole("button", { name: "Back" }).count()) === 0);
  const draftLabels = (await barLinks(page).allInnerTexts()).map((s) => s.trim());
  check("unpublished dashboard: the sitter bar is there", draftLabels.join("|") === "Requests|My profile|Messages|Account", draftLabels.join("|"));
  await context.close();
}

/* 4. Settings opened from a full-screen step (its gear) offers Back into
   that step. */
{
  const { page, context } = await open({ state: owner });
  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${isoIn(3)}&to=${isoIn(5)}`);
  await page.waitForSelector("h1");
  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL(/\/settings/);
  check("Settings from a flow shows Back", await page.getByRole("button", { name: "Back", exact: true }).isVisible());
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  check("…and Back returns to the same request", true);
  await context.close();
}

/* 4b. Review findings: Account keeps the bar you were using; tabs open at the
   top; an unpublished sitter's Compte is not a dead end. */
{
  const { page, context } = await open({ state: owner });
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  await barLinks(page).filter({ hasText: "Account" }).click();
  await page.waitForURL(/\/account/);
  const labels = (await barLinks(page).allInnerTexts()).map((x) => x.trim());
  check("Account from the sitter bar keeps the sitter bar", labels.join("|") === "Requests|My profile|Messages|Account", labels.join("|"));
  check("…and Compte names the sitter space as current", /Sitter space\s*The space you are using now/.test(clean(await page.locator("main").innerText())));

  await page.goto(`${BASE}/search`);
  await page.waitForSelector("h1");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await barLinks(page).filter({ hasText: "Account" }).click();
  await page.waitForURL(/\/account/);
  check("a tab opens its screen at the top", (await page.evaluate(() => window.scrollY)) === 0);
  await context.close();
}
{
  const draft = publishedSitter();
  draft.published = false;
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "sitter", sitter: draft }) });
  await page.goto(`${BASE}/account`);
  await page.waitForSelector("h1");
  check("unpublished sitter: Compte names the sitter space as current", /Sitter space\s*The space you are using now/.test(clean(await page.locator("main").innerText())));
  await page.getByRole("button", { name: /Owner space/ }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto(`${BASE}/account`);
  await page.getByRole("button", { name: /continue it/ }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  check("…and from the owner side, its row resumes the profile", page.url().endsWith("/sitter/profile"));
  await context.close();
}

/* 5. Arabic, 320px. */
{
  const { page, context } = await open({ lang: "ar", viewport: { width: 320, height: 640 }, state: owner });
  await page.goto(`${BASE}/`);
  await page.waitForSelector("h1");
  const labels = await barLinks(page).allInnerTexts();
  check("AR 320: four labelled tabs", labels.length === 4 && labels.every((l) => l.trim().length > 0), labels.join("|"));
  check("AR 320: no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  const smallest = await barLinks(page).evaluateAll((els) => Math.min(...els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height))));
  check("AR 320: every tab is at least 44px", smallest >= 44, `${Math.round(smallest)}px`);
  await context.close();
}

await done();
