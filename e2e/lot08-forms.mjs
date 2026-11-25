/* Audit 1.3 LOT 08 — animals, account and form friction (updated for Nidz 1.7). */
import { ACCOUNT, BASE, check, clean, done, open, seedState, storedState } from "./lib.mjs";

/* 1. Discovery needs no account. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/search?species=dog`);
  await page.waitForSelector("h1");
  check("results without an account", !page.url().includes("/auth") && (await page.locator("main ul[role=list] > li").count()) > 0);
  await page.goto(`${BASE}/sitters/amina-b`);
  await page.waitForSelector("h1");
  check("a profile without an account", !page.url().includes("/auth") && clean(await page.locator("h1").innerText()) === "Amina B.");

  /* 2. No photo before discovery. */
  await page.goto(`${BASE}/owner/need/pet`);
  await page.waitForSelector("h1");
  check("need flow: no photo field", (await page.getByText(/photo/i).count()) === 0 && (await page.locator("input[type=file]").count()) === 0);
  await context.close();
}

/* 3. The account form keeps what was typed across a detour through
   Paramètres, a language change and a reload.
   Retired in Nidz 1.7: creating the account HERE (« Create my account »,
   only a name) and the form's settings gear — an account is opened through
   the sign-up journey (§3), and §22 removed the gear from the journeys.
   Without an account this address now forwards to sign-up. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/owner/account?next=%2Fsitters%2Famina-b`);
  await page.waitForURL(/\/register\?next=/);
  check("no account: /owner/account forwards to sign-up, keeping next", page.url().includes(encodeURIComponent("/sitters/amina-b")));
  await context.close();
}
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/account`);
  await page.waitForSelector("h1");
  check("no date of birth asked", (await page.getByLabel(/Date of birth/).count()) === 0);
  await page.getByLabel("First name").fill("Samir");
  await page.getByLabel("Last name").fill("");
  await page.goto(`${BASE}/settings/preferences`);
  await page.getByRole("radio", { name: "French" }).click();
  await page.goBack();
  await page.waitForURL(/\/owner\/account/);
  await page.waitForSelector("h1");
  check("typed name kept across Paramètres + language change", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.reload();
  await page.waitForSelector("h1");
  check("typed name kept across a reload", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  check("missing last name is named, first name kept", (await page.getByText("Indiquez votre nom.").isVisible().catch(() => false)) || (await page.getByRole("alert").count()) > 0);
  check("…and the first name is still there", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.getByLabel("Nom", { exact: true }).fill("Benali");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/owner/account"));
  const st = await storedState(page);
  check("account saved with the new name, still signed in", st.account?.firstName === "Samir" && st.account?.lastName === "Benali" && st.signedIn === true);
  /* Drafts moved to localStorage at Audit 1.3.1 (A-01); both are checked so
     a draft left behind in either is caught. */
  check("draft cleared once saved", await page.evaluate(() => sessionStorage.getItem("nidz.draft.owner-account") === null && localStorage.getItem("nidz.draft.owner-account") === null));
  await context.close();
}

/* 4. An animal form keeps its input; validation keeps the rest; a bird gets
   bird questions only. (Nidz 1.7: the species is a card of the shared grid,
   the age is years / months / unknown, and saving returns to My animals.) */
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/pets/new`);
  await page.waitForSelector("h1");
  await page.getByRole("button", { name: "Bird", exact: true }).click();
  const birdText = clean(await page.locator("main").innerText());
  check("bird form asks bird questions, not dog ones", birdText.includes("European goldfinch") && !/Walks a day|Size\b|dogs$/m.test(birdText));
  await page.getByLabel("Years").selectOption({ label: "2 years" });
  await page.getByRole("button", { name: "Save" }).click();
  check("missing name is reported", await page.getByText("Enter your animal's name.").isVisible());
  check("…and the age chosen is kept", (await page.getByLabel("Years").inputValue()) === "2");
  await page.reload();
  await page.waitForSelector("h1");
  check("the unsaved animal survives a reload", (await page.getByLabel("Years").inputValue()) === "2" && (await page.getByRole("button", { name: "Bird", exact: true }).getAttribute("aria-pressed")) === "true");
  await page.getByLabel("What is your animal called?").fill("Kiwi");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  const st = await storedState(page);
  check("saved once, as a bird", st.pets.length === 1 && st.pets[0].species === "bird" && st.pets[0].name === "Kiwi" && st.pets[0].ageInfo?.years === 2);
  await page.goto(`${BASE}/owner/pets/new`);
  check("a new form starts empty after a save", (await page.getByLabel("What is your animal called?").inputValue()) === "");
  check("no page errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* 5. Vocabulary: a request is sent, never booked or paid. */
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/sitters/amina-b`);
  const actions = (await page.locator("main a, main button").allInnerTexts()).join(" | ");
  check("no 'Book' or 'Pay' action anywhere on a profile", !/\b(Book|Pay|Réserver|Payer)\b/.test(actions));
  await context.close();
}

await done();
