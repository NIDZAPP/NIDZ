/* Audit 1.3 LOT 06 — a profile readable in a few seconds, one component for
   the owner's page and the sitter's preview. */
import { ACCOUNT, BASE, check, clean, done, open, publishedSitter, seedState } from "./lib.mjs";

const inFirstScreen = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });

{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/sitters/amina-b?species=dog&size=large&care=boarding&wilaya=alger`);
  await page.waitForSelector("h1");
  const main = page.locator("main");
  check("first screen: the name", await inFirstScreen(page.locator("h1")));
  check("first screen: the commune", await inFirstScreen(main.getByText("Hydra, Algiers").first()));
  check("first screen: a concrete reason", await inFirstScreen(main.getByText("Accepts large dogs").first()));
  check("first screen: animals and dog sizes", await inFirstScreen(main.getByText("Dogs of every size").first()));
  check("first screen: a service with its price and unit", await inFirstScreen(main.getByText(/Boarding at the sitter's home · DZD\s?1,200 per night/).first()));
  const ctas = page.getByRole("link", { name: "Request care" });
  let visible = 0;
  for (let i = 0; i < (await ctas.count()); i++) if (await ctas.nth(i).isVisible()) visible += 1;
  check("exactly one visible 'Request care', on the first screen", visible === 1 && (await inFirstScreen(ctas.filter({ visible: true }).first())));
  const text = clean(await main.innerText());
  check("limits come right after the glance, before 'About'", text.indexOf("What I cannot accept") > 0 && text.indexOf("What I cannot accept") < text.indexOf("About"));
  check("example reviews say they are examples in the heading", text.includes("Reviews — examples"));
  check("the page says the person does not exist", text.includes("This person does not exist"));
  check("nothing claims verification", !/\bverified (identity|profile|sitter)\b/i.test(text));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* The sitter's preview is the same component: same glance block. */
{
  const draft = publishedSitter();
  draft.published = false;
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: draft }) });
  await page.goto(`${BASE}/sitter/preview`);
  await page.waitForSelector("h1");
  const text = clean(await page.locator("main").innerText());
  check("preview shows the same 'at a glance' facts", text.includes("Animals accepted") && text.includes("Services and rates") && /DZD\s?900 per night/.test(text));
  check("own profile carries no example marker", !text.includes("This person does not exist"));
  await context.close();
}

/* Arabic, 390px. */
{
  const { page, context } = await open({ lang: "ar", state: seedState() });
  await page.goto(`${BASE}/sitters/youcef-h?species=dog`);
  await page.waitForSelector("h1");
  check("AR: no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  check("AR: no raw i18n key", !/\b(profile|reviews)\.[a-zA-Z]+/.test(await page.locator("main").innerText()));
  await context.close();
}

await done();
