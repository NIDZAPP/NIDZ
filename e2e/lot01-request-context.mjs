/* Audit 1.3 LOT 01 — the chosen sitter is never lost.
   Amina → service and dates → account → add an animal → back to "Your
   request to Amina B." with the same data; then Back, reload, edit, resume,
   and the incompatible-animal cases.
   Nidz 1.7: the account is opened through the sign-up journey (phone), the
   animal form has the 13-animal grid and no dog size, the unsent request is
   resumed from its Draft card in Requests, and compatibility is by category
   and breed (confirmed / to confirm / incompatible). */
import { ACCOUNT, BASE, check, clean, done, isoIn, loose, open, seedState, storedState } from "./lib.mjs";

const FROM = isoIn(3);
const TO = isoIn(6);
const Q = `species=dog&care=boarding&wilaya=alger&from=${FROM}&to=${TO}`;
const AMINA_TITLE = "Your request to Amina B.";
const h1 = async (page) => clean(await page.locator("h1").innerText());

/* 1. The audit's validation script, from a fresh visitor. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/sitters/amina-b?${Q}`);
  await page.getByRole("link", { name: "Request care" }).first().click();
  await page.waitForURL(/\/register\?next=/);
  check("no account → sign-up, carrying the request as next", page.url().includes(encodeURIComponent("/owner/request/amina-b")));

  /* Retired in Nidz 1.7: the « Create a local account » form (name + wilaya).
     The same detour now goes through the phone sign-up journey. */
  await page.getByRole("button", { name: "Continue with a phone number" }).click();
  await page.getByLabel("Mobile number").fill("550123456");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("First name").fill("Lina");
  await page.getByLabel("Last name").fill("Kaci");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip this step" }).click();
  await page.waitForURL(/\/owner\/request\/amina-b/);
  check("after the account: back on the request to Amina", (await h1(page)).includes(AMINA_TITLE), await h1(page));
  check("not sent through the generic need flow", !page.url().includes("/owner/need"));

  /* No animal yet: the one action is to add it. */
  await page.getByRole("link", { name: "Add my animal" }).click();
  await page.waitForURL(/\/owner\/pets\/new/);
  check("add-animal screen starts on dog (the request's species)", (await page.getByRole("button", { name: "Dog", exact: true }).getAttribute("aria-pressed")) === "true");
  /* Retired in Nidz 1.7: the dog-size question (§9). */
  check("no size question on the animal form", (await page.getByRole("radio", { name: /dogs$/ }).count()) === 0);
  await page.getByLabel("What is your animal called?").fill("Milo");
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
  await page.getByLabel("What is your animal called?").fill("Milo II");
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

  /* Resume from its Draft card (Nidz 1.7 §20.3: drafts live in Requests). */
  await page.goto(`${BASE}/owner/requests`);
  const resume = page.getByRole("link", { name: loose("Your request to Amina B.") });
  check("Requests offers to resume the request to Amina", await resume.isVisible());
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

/* 3. Incompatible animals are shown with the reason and cannot be sent.
   Retired in Nidz 1.7: the size cases (Youcef, small dogs only; a dog with no
   size). Size left the owner's journey (§9); the same guarantee now holds for
   breeds — Mehdi S. takes only two kinds of parrot. */
{
  const macaw = { id: "pet-mac", name: "Kiwi", age: "", sex: "unknown", notes: "", care: {}, species: "parrot", kindId: "parrot.macaw", details: {} };
  const unknownKind = { id: "pet-coco", name: "Coco", age: "", sex: "unknown", notes: "", care: {}, species: "parrot", kindId: null, details: {} };
  const ringneck = { id: "pet-ring", name: "Zaza", age: "", sex: "unknown", notes: "", care: {}, species: "parrot", kindId: "parrot.ringneck", details: {} };
  const cat = { id: "pet-cat", name: "Mimi", age: "", sex: "unknown", notes: "", care: {}, species: "cat", details: {} };
  const need = { species: "cat", petId: "pet-cat", wilayaCode: null, communeCode: null, dates: null, careType: null, maxPrice: null };
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [macaw, unknownKind, ringneck, cat], need }) });

  await page.goto(`${BASE}/owner/request/mehdi-s?species=parrot&care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("Mehdi: a macaw is shown but disabled", await page.getByRole("radio", { name: /Kiwi/ }).isDisabled());
  check("Mehdi: the reason says only certain breeds", clean(await page.getByRole("radio", { name: /Kiwi/ }).innerText()).includes("accepts only certain breeds, and not"));
  check("Mehdi: an accepted breed is selectable", !(await page.getByRole("radio", { name: /Zaza/ }).isDisabled()));
  check("Mehdi: the need-flow cat is not silently selected", !(await page.getByRole("radio", { name: /Mimi/ }).isChecked()));
  await page.getByRole("radio", { name: /Coco/ }).click();
  check("a parrot with no breed is « to confirm », with what to give", await page.getByText(/accepts only certain breeds: give/).first().isVisible());
  await page.getByRole("radio", { name: /Kiwi/ }).click({ force: true }).catch(() => {});
  check("the macaw cannot become the selected animal", !(await page.getByRole("radio", { name: /Kiwi/ }).isChecked()));
  const st = await storedState(page);
  check("nothing was sent", (st.requests ?? []).length === 0);

  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("Amina: the cat is disabled with a reason", (await page.getByRole("radio", { name: /Mimi/ }).isDisabled()) && clean(await page.getByRole("radio", { name: /Mimi/ }).innerText()).includes("does not accept this kind of animal"));
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 3b. Review findings: changing the dates leaves no stale summary behind;
   a walk is judged on its one visible day; crafted `next` values are inert. */
{
  const dog = { id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", care: {}, species: "dog", details: { size: "medium" } };
  const need = { species: "dog", petId: null, wilayaCode: null, communeCode: null, dates: null, careType: "walk", maxPrice: null };
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [dog], need }) });
  await page.goto(`${BASE}/sitters/amina-b`);
  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  await page.getByRole("link", { name: "Change the service or dates" }).click();
  await page.waitForURL(/\/when/);
  await page.getByLabel("End date").fill(isoIn(8));
  await page.getByRole("button", { name: "See my request" }).click();
  await page.waitForURL((u) => u.pathname === "/owner/request/amina-b" && u.searchParams.get("to") === isoIn(8));
  await page.goBack();
  await page.waitForURL(/\/sitters\/amina-b/);
  check("after changing dates, Back skips the old summary and the form", page.url().includes("/sitters/amina-b"));

  /* need.careType=walk, URL range overlapping Amina's declared days 18–25:
     the walk's single visible day (+15) is free and must be accepted. */
  await page.goto(`${BASE}/owner/request/amina-b/when?from=${isoIn(15)}&to=${isoIn(20)}`);
  await page.waitForSelector("h1");
  await page.getByRole("radio", { name: /Walking/ }).click();
  await page.getByRole("button", { name: "See my request" }).click();
  await page.waitForURL((u) => u.pathname === "/owner/request/amina-b");
  check("a walk is judged on its one visible day", new URL(page.url()).searchParams.get("to") === isoIn(15));

  await page.goto(`${BASE}/auth?next=%2Fowner%2Frequest%2F%25E0%25A4%25A`);
  await page.waitForSelector("h1");
  check("malformed next does not crash the gateway (now sign-up)", !(await page.getByText("Something went wrong").isVisible()));
  await page.goto(`${BASE}/owner/pets/new?next=%2F.%2F%2Fexample.org`);
  await page.getByLabel("What is your animal called?").fill("Nox");
  await page.getByRole("button", { name: "Save" }).click();
  /* Nidz 1.7: My animals is the owner's Home (/owner/pets redirects there). */
  await page.waitForURL((u) => u.pathname === "/");
  check("'/.//host' next is ignored; save lands on My animals", new URL(page.url()).pathname === "/" && new URL(page.url()).host === new URL(BASE).host);
  await page.goto(`${BASE}/owner/pets/pet-rex?next=/owner/pets/new`);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto(`${BASE}/owner/pets/new`);
  check("'add an animal' never opens pre-filled with an existing one", (await page.getByLabel("What is your animal called?").inputValue()) === "");
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 4. Arabic: the title isolates the Latin name. */
{
  const { page, context } = await open({ lang: "ar", state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/request/amina-b?care=boarding&from=${FROM}&to=${TO}`);
  await page.waitForSelector("h1");
  check("AR: summary title in Arabic, RTL", (await h1(page)).includes("طلبك إلى") && (await page.evaluate(() => document.documentElement.dir)) === "rtl");
  /* Guards the Radix bubble-input mirror in src/index.css. */
  check("AR: summary has no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.goto(`${BASE}/owner/request/amina-b/when`);
  await page.waitForSelector("h1");
  check("AR: when-step has no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await context.close();
}

await done();
