/* Audit 1.3 LOT 05 — "Pour publier" vs "Enrichir mon profil", honestly
   counted; no publication without the essentials; preview = public profile;
   edit after publication; Back never re-opens a saved form. */
import { ACCOUNT, BASE, check, clean, done, open, publishedSitter, seedState, storedState } from "./lib.mjs";

const text = async (page) => clean(await page.locator("main").innerText());
const draft = publishedSitter({ services: [], rates: {}, acceptedSpecies: [], acceptedDogSizes: [], housing: { type: null, outdoor: null, residentPets: [], canSeparateAnimals: "unknown", conditions: null } });
draft.published = false;
const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: draft });

{
  const { page, context } = await open({ state });
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  let t = await text(page);
  check("two groups: 'To publish' and 'Add more to your profile'", t.includes("To publish") && t.includes("Add more to your profile"));
  check("publish group counts only its own sections (2 of 4)", t.includes("2 of 4 done."), t.match(/\d+ of \d+ done\./)?.[0]);
  check("enrich group is counted separately and called optional", /0 of 6 filled in, if you wish\./.test(t) && /Optional\./.test(t));
  check("no single 'of 9' total anywhere", !/of 9\b/.test(t));
  check("no preview/publish action while essentials are missing", (await page.getByRole("link", { name: /what owners would see/i }).count()) === 0);

  /* The gate holds even by URL. */
  await page.goto(`${BASE}/sitter/preview`);
  await page.waitForURL(/\/sitter\/profile$/);
  check("cannot reach publication without the essentials", true);

  /* Services: boarding makes the home an essential. Back never reopens the form. */
  await page.getByRole("link", { name: /Services and rates/ }).first().click();
  await page.waitForURL(/\/services/);
  await page.getByRole("checkbox", { name: "Boarding at the sitter's home" }).click();
  await page.getByLabel("Boarding at the sitter's home").fill("900");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  t = await text(page);
  check("boarding adds the home to 'To publish' (3 of 5)", t.includes("3 of 5 done.") && t.includes("Needed because you offer boarding"), t.match(/\d+ of \d+ done\./)?.[0]);
  await page.goBack();
  await page.waitForTimeout(300);
  check("Back from the dashboard does not reopen the saved form", !page.url().includes("/services"), page.url());

  /* Animals: a dog without sizes is not enough. */
  await page.goto(`${BASE}/sitter/profile`);
  await page.getByRole("link", { name: /Animals you accept/ }).first().click();
  await page.getByRole("checkbox", { name: "Dogs" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  check("dog without sizes is refused", await page.getByText("State the dog sizes you can take.").isVisible());
  await page.getByRole("checkbox", { name: "Large dogs" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);

  /* Home. */
  await page.getByRole("link", { name: /Your home/ }).first().click();
  await page.getByRole("radio", { name: "House" }).click();
  await page.getByRole("radio", { name: /Garden|Yard/ }).first().click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  t = await text(page);
  check("all essentials answered (5 of 5)", t.includes("5 of 5 done."));

  /* Preview is the public profile, then publish. */
  await page.getByRole("link", { name: /what owners would see/i }).click();
  await page.waitForURL(/\/sitter\/preview/);
  const preview = clean(await page.locator("main").innerText());
  check("preview shows the declared facts", preview.includes("Lina K.") && /Dogs: large/.test(preview) && /per night/.test(preview));
  check("preview never calls the profile verified", !/\bverified (profile|sitter)\b|profil vérifié/i.test(preview));
  await page.getByRole("button", { name: "Publish my profile" }).click();
  await page.waitForURL(/\/sitter\/published/);
  const st = await storedState(page);
  check("published locally", st.sitter.published === true);

  /* Edit after publication: the public page follows. */
  await page.goto(`${BASE}/sitter/profile/about`);
  await page.getByLabel("In one sentence").fill("Grand jardin, chiens bienvenus.");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  await page.goto(`${BASE}/sitters/sitter-local`);
  await page.waitForSelector("h1");
  check("edit after publication reaches the public profile", (await text(page)).includes("Grand jardin, chiens bienvenus."));

  /* Losing an essential after publication hides the profile from search and says why. */
  await page.goto(`${BASE}/sitter/profile/services`);
  await page.getByRole("checkbox", { name: "Walking" }).click();
  await page.getByLabel("Walking").fill("400");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  check("adding a service keeps the profile publishable", !(await text(page)).includes("now missing"));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* Review findings: a published profile that lost an essential is not
   reachable by link or requestable; the preview's outline never jumps up;
   "Edit" on the preview returns by history. */
{
  const lost = publishedSitter({ services: ["boarding"], rates: { boarding: 900 }, acceptedSpecies: ["dog"], acceptedDogSizes: ["large"], housing: { type: null, outdoor: null, residentPets: [], canSeparateAnimals: "unknown", conditions: null } });
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: lost }) });
  await page.goto(`${BASE}/sitters/sitter-local`);
  check("lost essential: public profile is not served", (await text(page)).includes("This profile does not exist"));
  await page.goto(`${BASE}/owner/request/sitter-local`);
  await page.waitForURL(/\/search/);
  check("lost essential: no request flow", page.url().includes("/search"));
  await page.goto(`${BASE}/settings`);
  check("lost essential: no test request offered", (await page.getByText("Test tools for this demonstration").count()) === 0);
  await context.close();
}
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter: { ...publishedSitter(), published: false } }) });
  await page.goto(`${BASE}/sitter/profile`);
  await page.getByRole("link", { name: /what owners would see/i }).click();
  await page.waitForURL(/\/sitter\/preview/);
  const levels = await page.locator("main h1, main h2, main h3, main h4").evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
  const jumpsUp = levels.slice(levels.indexOf(2) + 1).some((l) => l <= 2);
  check("preview outline: nothing climbs back to h2 after the name", !jumpsUp, levels.join(","));
  await page.getByRole("button", { name: "Edit my profile" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  await page.goBack();
  await page.waitForTimeout(300);
  check("Back from the dashboard does not return to the preview", !page.url().includes("/sitter/preview"), page.url());
  await context.close();
}

/* French: the two group names. */
{
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  const t = await text(page);
  check("FR: 'Pour publier' and 'Enrichir mon profil'", t.includes("Pour publier") && t.includes("Enrichir mon profil"));
  await context.close();
}

await done();
