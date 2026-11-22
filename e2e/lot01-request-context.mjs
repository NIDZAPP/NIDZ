/* Audit 1.3 LOT 01 — the chosen sitter is never lost.
   Amina → service and dates → account → add an animal → back to "Your
   request to Amina B." with the same data; then Back, reload, edit, resume,
   and the incompatible-animal cases. */
import { ACCOUNT, BASE, check, clean, done, isoIn, loose, open, pickCombobox, seedState, storedState } from "./lib.mjs";

const FROM = isoIn(3);
const TO = isoIn(6);
const Q = `species=dog&care=boarding&wilaya=16&from=${FROM}&to=${TO}`;
const AMINA_TITLE = "Your request to Amina B.";
const h1 = async (page) => clean(await page.locator("h1").innerText());

/* 1. The audit's validation script, from a fresh visitor. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/sitters/amina-b?${Q}`);
  await page.getByRole("link", { name: "Request care" }).first().click();
  await page.waitForURL(/\/auth\?next=/);
  check("no account → sign-in gateway, carrying the request as next", page.url().includes(encodeURIComponent("/owner/request/amina-b")));

  await page.getByRole("link", { name: "Create a local account" }).click();
  await page.getByLabel("First name").fill("Lina");
  await page.getByLabel("Last name").fill("Kaci");
  await page.getByLabel("Date of birth").fill("1990-04-02");
  await pickCombobox(page, "Wilaya", "Algiers");
  await page.getByRole("button", { name: "Create my account" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  check("after the account: back on the request to Amina", (await h1(page)).includes(AMINA_TITLE), await h1(page));
  check("not sent through the generic need flow", !page.url().includes("/owner/need"));

  /* No animal yet: the one action is to add it. */
  await page.getByRole("link", { name: "Add my animal" }).click();
  await page.waitForURL(/\/owner\/pets\/new/);
  check("add-animal screen starts on dog (the request's species)", await page.getByRole("radio", { name: "Dog", exact: true }).isChecked());
  await page.getByLabel("Its name").fill("Milo");
  await page.getByRole("radio", { name: "Large dogs" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b\?/);
  await page.waitForFunction(() => location.search.includes("pet="));
  check("after adding Milo: back on the request to Amina", (await h1(page)).includes(AMINA_TITLE));
  check("Milo is selected", await page.getByRole("radio", { name: /Milo/ }).isChecked());
  const url = new URL(page.url());
  check("same service and dates in the URL", url.searchParams.get("care") === "boarding" && url.searchParams.get("from") === FROM && url.searchParams.get("to") === TO);
  const body = clean(await page.locator("main").innerText());
  check("summary names Amina, boarding and the rate with its unit", body.includes("Amina B.") && body.includes("Boarding at the sitter's home") && /per night/.test(body));

  /* Reload. */
  await page.reload();
  await page.waitForSelector("h1");
  check("reload keeps the same sitter and animal", (await h1(page)).includes(AMINA_TITLE) && (await page.getByRole("radio", { name: /Milo/ }).isChecked()));

  /* Edit the animal from the request. */
  await page.getByRole("link", { name: loose("Edit Milo") }).click();
  await page.waitForURL(/\/owner\/pets\/pet-/);
  await page.getByLabel("Its name").fill("Milo II");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  await page.waitForSelector("h1");
  check("after editing: back on Amina with the renamed animal", (await h1(page)).includes(AMINA_TITLE) && (await page.getByRole("radio", { name: /Milo II/ }).isChecked()));
  const pets = (await storedState(page)).pets;
  check("editing did not create a second animal", pets.length === 1, `${pets.length} pets`);

  /* Back goes to Amina's profile, not to a stale copy of the summary. */
  await page.getByRole("button", { name: "Back" }).first().click();
  await page.waitForURL(/\/sitters\/amina-b/);
  check("Back from the summary → Amina's profile", page.url().includes("/sitters/amina-b") && page.url().includes("care=boarding"));

  /* Resume from Home. */
  await page.goto(`${BASE}/`);
  const resume = page.getByRole("link", { name: loose("Your request to Amina B.") });
  check("Home offers to resume the request to Amina", await resume.isVisible());
  await resume.click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  check("resume → same sitter, same animal", (await h1(page)).includes(AMINA_TITLE) && (await page.getByRole("radio", { name: /Milo II/ }).isChecked()));

  /* Send, and the draft is gone. */
  await page.getByRole("button", { name: "Send my request" }).click();
  await page.waitForURL(/\/sent\?id=/);
  const st = await storedState(page);
  check("request stored for Amina, not another sitter", st.requests.length === 1 && st.requests[0].sitterId === "amina-b");
  check("draft cleared once sent", st.requestDraft === null);
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 2. Arriving with no service or dates: asked for THIS sitter, not the need flow. */
{
  const dog = { id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "medium" } };
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [dog] }) });
  await page.goto(`${BASE}/sitters/amina-b`);
  await page.getByRole("link", { name: "Request care" }).first().click();
  await page.waitForURL(/\/owner\/request\/amina-b\/when/);
  const radios = await page.getByRole("radio").allInnerTexts();
  check("when-step offers only Amina's services", radios.length === 2 && radios.some((r) => r.includes("Boarding")) && radios.some((r) => r.includes("Walking")), radios.join(" / "));
  check("services are priced with their unit", radios.every((r) => /per (night|walk)/.test(r)));
  await page.getByRole("radio", { name: /Boarding/ }).click();
  await page.getByLabel("Start date").fill(FROM);
  await page.getByLabel("End date").fill(TO);
  await page.getByRole("button", { name: "See my request" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b\?/);
  check("→ summary for Amina with the only compatible dog preselected", (await h1(page)).includes(AMINA_TITLE) && (await page.getByRole("radio", { name: /Rex/ }).isChecked()));

  /* A declared-unavailable period is refused, for this sitter. */
  await page.goto(`${BASE}/owner/request/amina-b/when?care=boarding&from=${isoIn(19)}&to=${isoIn(20)}`);
  await page.getByRole("button", { name: "See my request" }).click();
  check("declared-unavailable dates are refused with the sitter's declaration", await page.getByText(/declared unavailable/).first().isVisible());
  await context.close();
}

/* 3. Incompatible animals are shown with the reason and cannot be sent. */
{
  const big = { id: "pet-big", name: "Titan", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "large" } };
  const unsized = { id: "pet-nos", name: "Flou", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: null } };
  const cat = { id: "pet-cat", name: "Mimi", age: "", sex: "unknown", notes: "", care: {}, species: "cat", details: {} };
  const need = { species: "cat", petId: "pet-cat", wilayaCode: null, communeCode: null, dates: null, careType: null, maxPrice: null };
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [big, unsized, cat], need }) });

  await page.goto(`${BASE}/owner/request/youcef-h?species=dog&care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("Youcef: large dog shown but disabled", await page.getByRole("radio", { name: /Titan/ }).isDisabled());
  check("Youcef: reason names the accepted size", clean(await page.getByRole("radio", { name: /Titan/ }).innerText()).toLowerCase().includes("small dogs"));
  check("Youcef: the need-flow cat is not silently selected", !(await page.getByRole("radio", { name: /Mimi/ }).isChecked()));
  await page.getByRole("radio", { name: /Flou/ }).click();
  check("unsized dog → asks for the size", await page.getByRole("link", { name: loose("Give Flou's size") }).isVisible());
  await page.getByRole("button", { name: "Send my request" }).click();
  const st = await storedState(page);
  check("unsized dog cannot be sent to a small-dogs-only sitter", (st.requests ?? []).length === 0);

  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("Amina: the cat is disabled with a reason", (await page.getByRole("radio", { name: /Mimi/ }).isDisabled()) && clean(await page.getByRole("radio", { name: /Mimi/ }).innerText()).includes("does not take cats"));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 4. Arabic: the title isolates the Latin name. */
{
  const { page, context } = await open({ lang: "ar", state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("AR: summary title in Arabic, RTL", (await h1(page)).includes("طلبك إلى") && (await page.evaluate(() => document.documentElement.dir)) === "rtl");
  await context.close();
}

await done();
