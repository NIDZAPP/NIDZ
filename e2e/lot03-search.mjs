/* Audit 1.3 LOT 03 — real hard constraints and useful cards.
   Nidz 1.7: the hard constraints are the animal's category and, where a
   sitter restricts them, its breed or species (§19). Dog size left the
   owner's journey (§9): the size cases are retired, and the same guarantees
   are checked on breeds — Mehdi S. takes only two kinds of parrot. Results
   are ordered nearest first when an area is known (§11), and said so. */
import { ACCOUNT, BASE, check, clean, done, open, pickCombobox, seedState } from "./lib.mjs";

const names = async (page) =>
  (await page.locator("main ul[role=list] > li h2").allInnerTexts()).map((s) => clean(s).trim());
const mainText = async (page) => clean(await page.locator("main").innerText());

/* 1. A breed the sitter does not take: not a result, and the profile says so.
   Retired in Nidz 1.7: « a LARGE dog excludes small/medium-only sitters ». */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=parrot&kind=parrot.macaw`);
  await page.waitForSelector("h1");
  check("macaw: Mehdi (grey parrot and ring-necked parakeet only) is not listed", !(await names(page)).includes("Mehdi S."));
  await page.goto(`${BASE}/search?species=parrot&kind=parrot.ringneck`);
  await page.waitForSelector("h1");
  const text = await mainText(page);
  check("ring-necked parakeet: Mehdi is listed", (await names(page)).includes("Mehdi S."));
  check("…and the reason names the accepted breed", text.includes("Accepts: Rose-ringed parakeet"));
  check("no distance is claimed", !/\bkm\b/.test(text));

  await page.goto(`${BASE}/sitters/mehdi-s?species=parrot&kind=parrot.macaw`);
  await page.waitForSelector("h1");
  const prof = await mainText(page);
  check("Mehdi's profile states the breed mismatch", /Does not match what you are looking for[\s\S]*Does not accept: Macaw/.test(prof));
  await context.close();
}

/* 2. A breed not given: nobody is excluded, nobody is called compatible on it. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=parrot`);
  await page.waitForSelector("h1");
  const text = await mainText(page);
  check("no breed: Mehdi is still listed", (await names(page)).includes("Mehdi S."));
  check("no breed: the screen says some sitters restrict breeds", text.includes("Some sitters accept only certain breeds or species."));
  check("no breed: Mehdi's row asks for the breed rather than claiming a fit", /Mehdi S\.[\s\S]*?Accepts only certain breeds: give the breed or ask/.test(text) && !/Accepts: Rose-ringed/.test(text));
  await page.goto(`${BASE}/sitters/mehdi-s?species=parrot`);
  await page.waitForSelector("h1");
  const prof = await mainText(page);
  check("profile: a breed to confirm is not titled a mismatch", prof.includes("To confirm with this sitter") && !prof.includes("Does not match what you are looking for"));

  await page.goto(`${BASE}/search?species=dog&wilaya=alger`);
  await page.waitForSelector("h1");
  /* The sitters' own headlines are their words and may mention cats; the
     FACTS Nidz states on the row must not. */
  let facts = await mainText(page);
  for (const h of await page.locator("main article p.line-clamp-3").allInnerTexts()) facts = facts.replace(clean(h), "");
  check("dog search: no stated fact about cats on any card", !/\bcats?\b/i.test(facts));
  /* Retired in Nidz 1.7: « the screen says the size is missing ». */
  check("dog search: no size is claimed or asked", !/(small|medium|large) dogs|size is not given/i.test(facts));
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
  await page.goto(`${BASE}/search?species=dog`);
  await page.waitForSelector("h1");
  const priceBlocks = await page.locator("main ul[role=list] > li article > div:last-child").allInnerTexts();
  check("every price carries its unit", priceBlocks.length > 0 && priceBlocks.every((b) => /per (night|visit|walk)/.test(b)), `${priceBlocks.length} rows`);
  const text = await mainText(page);
  /* No area and no account: nothing to be near, so alphabetical. */
  const orderLine = clean(await page.locator("main p[aria-live]").innerText());
  check("no area: the order is stated, and is not 'best match' or price", /alphabetical order/.test(orderLine) && !/best match|price/i.test(orderLine), orderLine);
  const n = await names(page);
  check("no area: alphabetical", n.join("|") === [...n].sort((a, b) => a.localeCompare(b)).join("|"), n.join(", "));
  check("no false 'available'", !/\bavailable\b/i.test(text));
  check("no price order offered while prices are in different units", (await page.getByRole("radio", { name: "Lowest price" }).count()) === 0);

  /* An area: that wilaya first, then the others nearest first (an estimate
     between chefs-lieux, said so), each group in alphabetical order. */
  await page.goto(`${BASE}/search?species=dog&wilaya=alger`);
  await page.waitForSelector("h1");
  const zoneLine = clean(await page.locator("main p[aria-live]").innerText());
  check("with an area: the order says nearest to the area first", /nearest to the area searched first/.test(zoneLine) && !/best match/i.test(zoneLine), zoneLine);
  const near = (await page.locator("main > div ul[role=list]").first().locator("> li h2").allInnerTexts()).map((s) => clean(s).trim());
  check("with an area: the wilaya's sitters come first, alphabetically", near.length > 0 && near.join("|") === [...near].sort((a, b) => a.localeCompare(b)).join("|"), near.join(", "));
  check("farther sitters are a separate, labelled group", await page.getByRole("heading", { name: "Farther away" }).isVisible());

  await page.goto(`${BASE}/search?species=dog&care=walk&wilaya=alger`);
  await page.waitForSelector("h1");
  const before = await page.evaluate(() => history.length);
  await page.getByRole("radio", { name: "Lowest price" }).click();
  await page.waitForURL(/sort=price/);
  /* Price within each distance group: the nearest group stays first. */
  const groups = await page.locator("main ul[role=list]").evaluateAll((lists) =>
    lists
      .map((ul) => [...ul.querySelectorAll(":scope > li article .text-price")].map((p) => Number(p.textContent.replace(/[^\d]/g, ""))))
      .filter((g) => g.length > 0),
  );
  check("price order only when chosen, ascending within each distance group", groups.length > 0 && groups.every((g) => g.every((p, i) => i === 0 || g[i - 1] <= p)), JSON.stringify(groups));
  check("price order is labelled as the owner's choice", (await mainText(page)).includes("your choice"));
  check("changing the order adds no history entry", (await page.evaluate(() => history.length)) === before);
  check("each result has exactly one action", (await page.locator("main ul[role=list] > li").first().locator("a, button").count()) === 1);
  await context.close();
}

/* 5. No results, and clearing the filters. (1.7: birds have a sitter now;
   a macaw has none.) */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=parrot&kind=parrot.macaw`);
  await page.waitForSelector("h1");
  check("macaw: honest empty state", await page.getByText("No sitter matches these criteria").isVisible());
  await page.getByRole("button", { name: "Clear all criteria" }).click();
  await page.waitForFunction(() => !location.search.includes("species"));
  check("clearing the filters shows the directory again", (await names(page)).length > 0);
  await context.close();
}

/* 6. Need flow: the breed reaches the results.
   Retired in Nidz 1.7: « a large dog reaches the results as size=large »,
   and 6b (a new dog starts with no size; size-based « good fit for Rex »). */
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/need/pet`);
  await page.getByRole("button", { name: "Parrot", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/need\/breed/);
  await page.locator('input[type="search"]').fill("macaw");
  await page.getByRole("radio", { name: "Macaw" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/need\/about/);
  await page.getByLabel("What is your animal called?").fill("Kiwi");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/need\/needs/);
  await page.getByRole("button", { name: "Nothing to report" }).click();
  await page.waitForURL(/need\/location/);
  await pickCombobox(page, "Wilaya", "Algiers");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/need\/care/);
  await page.getByRole("radio", { name: /Boarding/ }).click();
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const iso = d.toISOString().slice(0, 10);
  await page.getByLabel("Start date").fill(iso);
  await page.getByLabel("End date").fill(iso);
  await page.getByRole("button", { name: "See the sitters" }).click();
  await page.waitForURL(/\/search\?/);
  check("need flow → search carries the breed", page.url().includes("kind=parrot.macaw"));
  check("need flow → Mehdi not offered for Kiwi", !(await names(page)).includes("Mehdi S."));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 7. French and Arabic: the new copy resolves. */
for (const lang of ["fr", "ar"]) {
  const { page, context } = await open({ lang, state: seedState() });
  for (const q of ["species=dog&wilaya=alger", "species=parrot"]) {
    await page.goto(`${BASE}/search?${q}`);
    await page.waitForSelector("h1");
    const text = await mainText(page);
    check(`${lang} ${q}: no raw i18n key on the results`, !/\b(search|explore|compat|catalogue|species)\.[a-zA-Z]+/.test(text));
    check(`${lang} ${q}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  await context.close();
}

await done();
