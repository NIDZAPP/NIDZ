/* Audit 1.3 LOT 03 — real hard constraints and useful cards. */
import { ACCOUNT, BASE, check, clean, done, open, seedState } from "./lib.mjs";

const names = async (page) =>
  (await page.locator("main ul[role=list] > li h2").allInnerTexts()).map((s) => clean(s).trim());
const mainText = async (page) => clean(await page.locator("main").innerText());

/* 1. A LARGE dog: sitters who only take small/medium dogs are not results. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=dog&size=large&wilaya=alger`);
  await page.waitForSelector("h1");
  const n = await names(page);
  check("large dog: Youcef (small only) is not listed", !n.includes("Youcef H."), n.join(", "));
  check("large dog: Karim (small/medium) is not listed", !n.includes("Karim B."));
  check("large dog: Amina (all sizes) is listed", n.includes("Amina B."));
  const text = await mainText(page);
  check("large dog: the shared reason names the size", text.includes("Accepts large dogs") && !text.includes("Accepts dogs"));
  check("large dog: no card advertises cats", !/Accepts cats/.test(text));
  check("no distance is claimed", !/\bkm\b/.test(text));

  /* The profile says so too, and does not call it a fit. */
  await page.goto(`${BASE}/sitters/youcef-h?species=dog&size=large&wilaya=alger`);
  await page.waitForSelector("h1");
  const prof = await mainText(page);
  check("Youcef's profile states the size mismatch", /does not take: large dogs/.test(prof));
  await context.close();
}

/* 2. A dog of UNKNOWN size: nobody is excluded, nobody is called compatible on size. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=dog&wilaya=alger`);
  await page.waitForSelector("h1");
  const text = await mainText(page);
  check("unknown size: the screen says the size is missing", text.includes("size is not given"));
  check("unknown size: Youcef's row states his limit", /Youcef H\.[\s\S]*?Dogs: small only/.test(text));
  check("unknown size: no size is claimed as a match", !/Accepts (small|medium|large) dogs/.test(text));
  /* The sitters' own headlines are their words and may mention cats; the
     FACTS Nidz states on the row must not. */
  let facts = text;
  for (const h of await page.locator("main article p.line-clamp-3").allInnerTexts()) facts = facts.replace(clean(h), "");
  check("dog search: no stated fact about cats on any card", !/\bcats?\b/i.test(facts));
  await context.close();
}

/* 3. A cat: nothing about dogs comes first. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=cat&wilaya=alger`);
  await page.waitForSelector("h1");
  const text = await mainText(page);
  check("cat search: no dog reason, no dog sizes", !/Accepts dogs|Dogs:|Dogs of every size/.test(text));
  check("cat search: the shared reason is about cats", text.includes("Accepts cats"));
  await context.close();
}

/* 4. Prices, order and availability wording. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=dog&wilaya=alger`);
  await page.waitForSelector("h1");
  const priceBlocks = await page.locator("main ul[role=list] > li article > div:last-child").allInnerTexts();
  check("every price carries its unit", priceBlocks.length > 0 && priceBlocks.every((b) => /per (night|visit|walk)/.test(b)), `${priceBlocks.length} rows`);
  const text = await mainText(page);
  const orderLine = clean(await page.locator("main p[aria-live]").innerText());
  check("default order is stated, and is not 'best match' or price", /alphabetical order/.test(orderLine) && !/best match|price/i.test(orderLine), orderLine);
  const n = await names(page);
  check("default order is alphabetical", n.join("|") === [...n].sort((a, b) => a.localeCompare(b)).join("|"), n.join(", "));
  check("no false 'available'", !/\bavailable\b/i.test(text));
  check("no price order offered while prices are in different units", (await page.getByRole("radio", { name: "Lowest price" }).count()) === 0);

  await page.goto(`${BASE}/search?species=dog&care=walk&wilaya=alger`);
  await page.waitForSelector("h1");
  const before = await page.evaluate(() => history.length);
  await page.getByRole("radio", { name: "Lowest price" }).click();
  await page.waitForURL(/sort=price/);
  const prices = (await page.locator("main ul[role=list] > li article .text-price").allInnerTexts()).map((p) => Number(p.replace(/[^\d]/g, "")));
  check("price order only when chosen, and ascending", prices.every((p, i) => i === 0 || prices[i - 1] <= p), prices.join(","));
  check("price order is labelled as the owner's choice", (await mainText(page)).includes("as you chose"));
  check("changing the order adds no history entry", (await page.evaluate(() => history.length)) === before);
  check("each result has exactly one action", (await page.locator("main ul[role=list] > li").first().locator("a, button").count()) === 1);
  await context.close();
}

/* 5. No results, and clearing the filters. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=bird`);
  await page.waitForSelector("h1");
  check("bird: honest empty state", await page.getByText("No sitter matches these criteria").isVisible());
  await page.getByRole("button", { name: "Clear all criteria" }).click();
  await page.waitForFunction(() => !location.search.includes("species"));
  check("clearing the filters shows the directory again", (await names(page)).length > 0);
  await context.close();
}

/* 6. Need flow: a large dog reaches the results as a large dog. */
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/need/pet`);
  await page.getByRole("radio", { name: "Dog", exact: true }).click();
  await page.getByLabel("Its name").fill("Rex");
  await page.getByRole("radio", { name: "Large dogs" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/need\/location/);
  await page.getByRole("combobox", { name: "Wilaya" }).click();
  await page.getByRole("option", { name: "Algiers", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/need\/care/);
  await page.getByRole("radio", { name: /Boarding/ }).click();
  const d = new Date(); d.setDate(d.getDate() + 3);
  const iso = d.toISOString().slice(0, 10);
  await page.getByLabel("Start date").fill(iso);
  await page.getByLabel("End date").fill(iso);
  await page.getByRole("button", { name: "See the sitters" }).click();
  await page.waitForURL(/\/search\?/);
  check("need flow → search carries size=large", page.url().includes("size=large"));
  check("need flow → Youcef not offered for Rex", !(await names(page)).includes("Youcef H."));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 6b. Review findings: a new dog starts with no size; "a good fit for Rex"
   only when the URL size is Rex's size; the profile states an unknown-size
   limit. */
{
  const small = { id: "pet-s", name: "Rex", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "small" } };
  const need = { species: "dog", dogSize: "large", petId: "pet-s", wilayaCode: null, communeCode: null, dates: null, careType: null, maxPrice: null };
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [small], need }) });
  await page.goto(`${BASE}/owner/need/pet`);
  await page.getByRole("radio", { name: /Another animal/ }).click();
  await page.getByRole("radio", { name: "Dog", exact: true }).click();
  const anyChecked = await page.getByRole("radio", { name: /Small dogs|Medium dogs|Large dogs/ }).evaluateAll((els) => els.some((e) => e.getAttribute("aria-checked") === "true"));
  check("a new dog starts with no size selected", !anyChecked);

  await page.goto(`${BASE}/sitters/amina-b?species=dog&size=large`);
  await page.waitForSelector("h1");
  check("no 'good fit for Rex' when the searched size is not Rex's", !(await mainText(page)).includes("Rex"));
  await page.goto(`${BASE}/sitters/youcef-h?species=dog`);
  await page.waitForSelector("h1");
  check("profile states the size limit when the size is unknown", /size is not given[\s\S]*small only/.test(await mainText(page)));
  await context.close();
}

/* 7. French and Arabic: the new copy resolves. */
for (const lang of ["fr", "ar"]) {
  const { page, context } = await open({ lang, state: seedState() });
  await page.goto(`${BASE}/search?species=dog&wilaya=alger`);
  await page.waitForSelector("h1");
  const text = await mainText(page);
  check(`${lang}: no raw i18n key on the results`, !/\b(search|sizeShort|acceptsSize)\.[a-zA-Z]+/.test(text));
  check(`${lang}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await context.close();
}

await done();
