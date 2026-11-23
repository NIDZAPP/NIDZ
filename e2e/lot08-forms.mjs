/* Audit 1.3 LOT 08 — animals, account and form friction. */
import { ACCOUNT, BASE, check, clean, done, open, pickCombobox, seedState, storedState } from "./lib.mjs";

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

/* 3. The account asks only what a request needs; the draft survives a detour
   through Compte and a language change. */
{
  const { page, context } = await open({ state: seedState() });
  await page.goto(`${BASE}/owner/account`);
  await page.waitForSelector("h1");
  check("no date of birth asked", (await page.getByLabel(/Date of birth/).count()) === 0);
  await page.getByLabel("First name").fill("Samir");
  await page.getByRole("link", { name: "Account" }).click();
  await page.waitForURL(/\/settings/);
  await page.getByRole("radio", { name: "French" }).click();
  await page.getByRole("button", { name: "Retour" }).click();
  await page.waitForURL(/\/owner\/account/);
  check("typed name kept across Compte + language change", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.reload();
  await page.waitForSelector("h1");
  check("typed name kept across a reload", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  check("missing last name is named, first name kept", (await page.getByText("Indiquez votre nom.").isVisible().catch(() => false)) || (await page.getByRole("alert").count()) > 0);
  check("…and the first name is still there", (await page.getByLabel("Prénom").inputValue()) === "Samir");
  await page.getByLabel("Nom", { exact: true }).fill("Benali");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/owner/account"));
  const st = await storedState(page);
  check("account created with only the name", st.account?.firstName === "Samir" && st.account?.wilayaId === null);
  check("draft cleared once saved", await page.evaluate(() => sessionStorage.getItem("nidz.draft.owner-account") === null));
  await context.close();
}

/* 4. An animal form keeps its input; validation keeps the rest; a bird gets
   bird questions only. */
{
  const { page, context } = await open({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  await page.goto(`${BASE}/owner/pets/new`);
  await page.waitForSelector("h1");
  await page.getByRole("radio", { name: "Bird", exact: true }).click();
  const birdText = clean(await page.locator("main").innerText());
  check("bird form asks bird questions, not dog ones", birdText.includes("What kind of bird?") && !/Walks a day|Size\b/.test(birdText));
  await page.getByLabel("Its age").fill("2 years");
  await page.getByRole("button", { name: "Save" }).click();
  check("missing name is reported", await page.getByText("Enter your animal's name.").isVisible());
  check("…and the age typed is kept", (await page.getByLabel("Its age").inputValue()) === "2 years");
  await page.reload();
  await page.waitForSelector("h1");
  check("the unsaved animal survives a reload", (await page.getByLabel("Its age").inputValue()) === "2 years" && (await page.getByRole("radio", { name: "Bird", exact: true }).isChecked()));
  await page.getByLabel("Its name").fill("Kiwi");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/owner\/pets$/);
  const st = await storedState(page);
  check("saved once, as a bird", st.pets.length === 1 && st.pets[0].species === "bird" && st.pets[0].name === "Kiwi");
  await page.goto(`${BASE}/owner/pets/new`);
  check("a new form starts empty after a save", (await page.getByLabel("Its name").inputValue()) === "");
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
