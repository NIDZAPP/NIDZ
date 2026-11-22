/* Audit 1.3 LOT 04 — one account, two spaces, no dead tab. */
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
  check("owner bar: Home · Search · Requests · Animals · Account", labels.join("|") === "Home|Search|Requests|Animals|Account", labels.join("|"));
  await visitEach(page, barLinks(page), "owner");
  check("owner bar fits 390px without horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  /* Switch to the sitter space from Compte, then back: nothing is lost. */
  await page.goto(`${BASE}/settings`);
  check("Compte (tab root) shows no Back control", (await page.getByRole("button", { name: "Back" }).count()) === 0);
  await page.getByRole("button", { name: /Sitter space/ }).click();
  await page.waitForURL(/\/sitter\/requests/);
  const sitterLabels = (await barLinks(page).allInnerTexts()).map((s) => s.trim());
  check("sitter bar: Received · My profile · Account", sitterLabels.join("|") === "Received|My profile|Account", sitterLabels.join("|"));
  await visitEach(page, barLinks(page), "sitter");
  await page.goto(`${BASE}/settings`);
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
  check("desktop header: Search · Requests · Animals · Account", labels.join("|") === "Search|Requests|Animals|Account", labels.join("|"));
  check("desktop: the mobile bar is hidden", !(await page.locator("nav.md\\:hidden").isVisible()));
  await context.close();
}

/* 3. A sitter whose profile is not published: no sitter bar, but a way out. */
{
  const draft = publishedSitter();
  draft.published = false;
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: draft }) });
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  check("unpublished dashboard: Back control present", await page.getByRole("button", { name: "Back" }).isVisible());
  check("unpublished dashboard: account still reachable", await page.getByRole("link", { name: "Account" }).first().isVisible());
  await context.close();
}

/* 4. Compte opened from a full-screen step offers Back into that step. */
{
  const { page, context } = await open({ state: owner });
  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${isoIn(3)}&to=${isoIn(5)}`);
  await page.waitForSelector("h1");
  await page.getByRole("link", { name: "Account" }).click();
  await page.waitForURL(/\/settings/);
  check("Compte from a flow shows Back", await page.getByRole("button", { name: "Back" }).isVisible());
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  check("…and Back returns to the same request", true);
  await context.close();
}

/* 5. Arabic, 320px. */
{
  const { page, context } = await open({ lang: "ar", viewport: { width: 320, height: 640 }, state: owner });
  await page.goto(`${BASE}/`);
  await page.waitForSelector("h1");
  const labels = await barLinks(page).allInnerTexts();
  check("AR 320: five labelled tabs", labels.length === 5 && labels.every((l) => l.trim().length > 0), labels.join("|"));
  check("AR 320: no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  const smallest = await barLinks(page).evaluateAll((els) => Math.min(...els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height))));
  check("AR 320: every tab is at least 44px", smallest >= 44, `${Math.round(smallest)}px`);
  await context.close();
}

await done();
