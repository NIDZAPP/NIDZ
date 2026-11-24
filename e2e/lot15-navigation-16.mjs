/* Nidz 1.6 — the navigation refactoring.
   Guards the five defects of the 1.5 navigation audit (NAV-01…05) and the
   approved structure: four tabs per side, search under Accueil, animals and
   Paramètres under Compte, Messages as a tab with notifications inside. */
import { ACCOUNT, BASE, check, clean, done, isoIn, open, publishedSitter, seedState, storedState } from "./lib.mjs";

const pet = { id: "pet-rex", name: "Rex", age: "3 ans", sex: "unknown", notes: "", species: "dog", details: { size: "medium" } };
const request = (over = {}) => ({
  id: "req-1",
  createdAt: "2026-11-20T10:00:00.000Z",
  sitterId: "sitter-local",
  pet,
  careType: "boarding",
  dates: { start: isoIn(5), end: isoIn(7) },
  communeCode: "hydra",
  ownerName: "Lina K.",
  displayedRate: { amount: 900, careType: "boarding" },
  status: "pending",
  respondedAt: null,
  ...over,
});
const draftSitter = () => ({ ...publishedSitter(), published: false });
/* The phone bar (the desktop header carries the same list, hidden below md). */
const BAR = "nav.md\\:hidden";
const tabs = async (page) => (await page.locator(`${BAR} li`).allInnerTexts()).map((s) => clean(s).trim());
const current = async (page) =>
  clean((await page.locator(`${BAR} [aria-current='page']`).first().innerText().catch(() => "")).trim());

/* ------------------------------------------------ 1. the approved bars */
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [{ ...pet, care: {} }] });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/`);
  check("owner bar: Accueil · Demandes · Messages · Compte", JSON.stringify(await tabs(page)) === JSON.stringify(["Accueil", "Demandes", "Messages", "Compte"]));
  check(
    "Messages is a tab, not a header icon: one visible way to it",
    (await page.locator("a[href='/messages']:visible").count()) === 1 && (await page.locator(`${BAR} a[href='/messages']`).count()) === 1,
  );
  check("Accueil leads with the search", await page.getByRole("link", { name: "Trouver une garde" }).isVisible());
  await page.getByRole("link", { name: "Voir tous les pet-sitters" }).click();
  await page.waitForURL(/\/search$/);
  check("free browsing: every sitter, no account and no brief needed", (await page.locator("main").innerText()).includes("Exemples de pet-sitters"));
  check("results sit under Accueil (tab stays current)", (await current(page)) === "Accueil");
  await page.getByRole("button", { name: "Retour" }).click();
  await page.waitForURL(`${BASE}/`);
  check("results have a Back to Accueil", page.url() === `${BASE}/`);

  await page.getByRole("link", { name: "Compte" }).click();
  await page.waitForURL(/\/account$/);
  check("Compte: the person first", (await page.locator("main").innerText()).includes("Lina Kaci"));
  check("Compte: the animals are here", (await page.getByRole("link", { name: /1 animal/ }).count()) === 1);
  await page.getByRole("link", { name: /1 animal/ }).click();
  await page.waitForURL(/\/owner\/pets$/);
  check("Mes animaux sits under Compte", (await current(page)) === "Compte");
  await page.goBack();
  await page.getByRole("link", { name: "Paramètres" }).click();
  await page.waitForURL(/\/settings$/);
  const settings = clean(await page.locator("main").innerText());
  check("Paramètres: language, and security & privacy together", settings.includes("Langue") && settings.includes("Sécurité et confidentialité") && settings.includes("Recommencer à zéro"));
  check("Paramètres sits under Compte", (await current(page)) === "Compte");
  await page.getByRole("button", { name: "Retour", exact: true }).click();
  await page.waitForURL(/\/account$/);
  check("Back from Paramètres returns to Compte", page.url().endsWith("/account"));

  /* Editing the account from Compte comes back to Compte. */
  await page.getByRole("link", { name: "Modifier mes informations personnelles" }).click();
  await page.waitForURL(/\/owner\/account/);
  await page.getByRole("button", { name: /Enregistrer|Continuer|Créer/ }).last().click();
  await page.waitForURL(/\/account$/);
  check("the account form returns to Compte once saved", page.url().endsWith("/account"));
  check("no errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* Deep links into Help land back on Compte, not on the old settings. */
{
  const { page, context } = await open({ lang: "fr", state: seedState({}) });
  await page.goto(`${BASE}/help`);
  await page.getByRole("button", { name: "Retour" }).click();
  await page.waitForURL(/\/account$/);
  check("Help deep link: Back goes to Compte", page.url().endsWith("/account"));
  check("browsing without an account is a normal state in Compte", (await page.locator("main").innerText()).includes("Vous naviguez sans compte"));
  await context.close();
}

/* -------------------------------------- 2. NAV-01: one way back to a draft */
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "owner", sitter: draftSitter() });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/`);
  await page.getByRole("button", { name: "Passer à mon espace pet-sitter" }).click();
  await page.waitForURL(/\/sitter\//);
  check("NAV-01 Home switch resumes the draft at Mon profil", page.url().endsWith("/sitter/profile"));
  check("the draft has the sitter bar, Mon profil current", (await current(page)) === "Mon profil" && (await tabs(page)).length === 4);
  check("…and says it is not published yet", (await page.locator("main").innerText()).includes("Pas encore publié"));
  await page.getByRole("link", { name: /^Nidz/ }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  check("NAV-01 the logo resumes the same place", page.url().endsWith("/sitter/profile"));
  await page.getByRole("link", { name: "Demandes" }).click();
  await page.waitForURL(/\/sitter\/requests$/);
  check("the inbox says the profile is not visible yet", (await page.locator("main").innerText()).includes("pas encore visible"));
  await page.getByRole("link", { name: "Continuer mon profil" }).click();
  await page.waitForURL(/\/sitter\//);
  check("NAV-01 the inbox resumes the profile, never the sign-up start", page.url().endsWith("/sitter/profile"));
  await page.goto(`${BASE}/account`);
  await page.getByRole("button", { name: /Espace propriétaire/ }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/account`);
  await page.getByRole("button", { name: /Espace pet-sitter/ }).click();
  await page.waitForURL(/\/sitter\//);
  check("NAV-01 Compte's switch lands on the same place", page.url().endsWith("/sitter/profile"));
  await page.goto(`${BASE}/sitter/start`);
  check("the introduction offers to continue, not to start over", await page.getByRole("button", { name: "Continuer mon profil" }).isVisible());
  await context.close();
}

/* An owner account becoming a sitter is not asked its name and number again. */
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/start`);
  await page.getByRole("button", { name: /Commencer|Créer/ }).click();
  await page.waitForURL(/\/sitter\/join\//);
  check("owner account → straight to the area step", page.url().endsWith("/sitter/join/location"));
  await context.close();
}

/* ------------------------------ 3. NAV-02: "published" only while visible */
{
  const hidden = publishedSitter({ services: [], rates: {} });
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "sitter", sitter: hidden });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/published`);
  const text = clean(await page.locator("main").innerText());
  check("NAV-02 a hidden profile is not announced as published", !text.includes("Votre profil est publié") && text.includes("n'est plus visible"));
  check("NAV-02 no link to a public page owners cannot open", (await page.locator("a[href^='/sitters/']").count()) === 0);
  check("NAV-02 the missing essential is a link", (await page.getByRole("link", { name: /Services et tarifs/ }).count()) === 1);
  await page.getByRole("link", { name: "Compléter mon profil" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  check("NAV-02 the action leads to the dashboard", page.url().endsWith("/sitter/profile"));
  check("the dashboard says hidden", (await page.locator("main").innerText()).includes("Masqué des résultats"));
  await page.goto(`${BASE}/sitter/requests`);
  check("the inbox says it no longer appears, with no public link", (await page.locator("main").innerText()).includes("n'apparaît plus") && (await page.locator("main a[href^='/sitters/']").count()) === 0);
  await page.goto(`${BASE}/account`);
  check("Compte offers no public profile while hidden", (await page.getByRole("link", { name: /Mon profil public/ }).count()) === 0);
  await context.close();
}
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "sitter", sitter: publishedSitter() });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/published`);
  check("a listed profile is confirmed as published", (await page.locator("main").innerText()).includes("Votre profil est publié"));
  await page.goto(`${BASE}/account`);
  check("Compte links the public profile while listed", (await page.getByRole("link", { name: /Mon profil public/ }).count()) === 1);
  await context.close();
}

/* --------------------------- 4. NAV-03: the Messages view survives a detour */
{
  const at = (d) => `2026-11-2${d}T10:00:00.000Z`;
  const conversation = {
    id: "conv-1",
    sitterId: "sitter-local",
    ownerName: "Lina K.",
    createdAt: at(1),
    context: { pet: null, careType: null, dates: null, communeCode: null },
    messages: [
      { id: "m1", author: "owner", text: "Bonjour", createdAt: at(1) },
      { id: "m2", author: "sitter", text: "Bonjour, avec plaisir.", createdAt: at(2) },
    ],
    seen: { owner: at(1), sitter: at(2) },
  };
  const state = seedState({
    account: ACCOUNT,
    capabilities: { owner: true, sitter: true },
    activeWorkspace: "owner",
    sitter: publishedSitter(),
    conversations: [conversation],
  });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/`);
  check("Messages tab carries the unread count in words", (await page.getByRole("link", { name: /Messages, 1 conversation non lue/ }).count()) === 1);
  await page.getByRole("link", { name: /Messages, 1 conversation non lue/ }).click();
  await page.waitForURL(/\/messages$/);
  await page.getByRole("tab", { name: /Notifications/ }).click();
  await page.waitForURL(/tab=notifications/);
  check("NAV-03 the view is in the address", page.url().includes("tab=notifications"));
  await page.locator("[role=tabpanel] a").first().click();
  await page.waitForURL(/\/messages\/conv-1/);
  await page.getByRole("button", { name: /Retour/ }).click();
  await page.waitForURL(/\/messages/);
  check("NAV-03 Back returns to Notifications", page.url().includes("tab=notifications") && (await page.getByRole("tab", { name: /Notifications/ }).getAttribute("aria-selected")) === "true");
  await page.locator("[role=tabpanel] a").first().click().catch(() => {});
  await page.goto(`${BASE}/messages?tab=notifications`);
  await page.getByRole("tab", { name: /Conversations/ }).click();
  await page.getByRole("link", { name: /Lina K\./ }).first().click();
  await page.waitForURL(/\/messages\/conv-1/);
  await page.goBack();
  check("NAV-03 browser Back returns to Conversations", !page.url().includes("tab=") && (await page.getByRole("tab", { name: /Conversations/ }).getAttribute("aria-selected")) === "true");
  check("no errors", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* ------------------------------- 5. NAV-04: one address per confirmation */
{
  const state = seedState({
    account: ACCOUNT,
    capabilities: { owner: true, sitter: false },
    pets: [{ ...pet, care: {} }],
    requests: [request({ sitterId: "karim-b" })],
  });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/owner/request/amina-b/sent?id=req-1`);
  await page.waitForURL(/\/owner\/request\/karim-b\/sent\?id=req-1/);
  check("NAV-04 a contradictory path is replaced by the request's own sitter", page.url().endsWith("/owner/request/karim-b/sent?id=req-1"));
  check("NAV-04 the screen names that sitter", clean(await page.locator("main").innerText()).includes("Karim"));
  await page.goto(`${BASE}/owner/request/karim-b/sent?id=nope`);
  await page.waitForURL(/\/owner\/requests$/);
  check("NAV-04 an unknown request opens the list", page.url().endsWith("/owner/requests"));
  await context.close();
}

/* ---------------------- 6. NAV-05: no false conflict on a direct join link */
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/join/location`);
  await page.waitForURL(/\/sitter\/start$/);
  check("NAV-05 no profile: the area step opens the introduction instead", page.url().endsWith("/sitter/start"));
  check("NAV-05 no conflict message", !(await page.locator("body").innerText()).toLowerCase().includes("conflit"));
  const st = await storedState(page);
  check("nothing was written on the way", !st?.sitter);
  await context.close();
}

/* ------------------------------------------------------- 7. tab badges */
{
  const asked = request({ sitterId: "amina-b", thread: [{ id: "q1", author: "sitter", text: "Il mange quoi ?", createdAt: "2026-11-21T10:00:00.000Z" }] });
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [{ ...pet, care: {} }], requests: [asked] });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/`);
  check("owner Demandes: a question waiting, in words", (await page.getByRole("link", { name: "Demandes, 1 question attend votre réponse" }).count()) === 1);
  await context.close();
}
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, activeWorkspace: "sitter", sitter: publishedSitter(), requests: [request()] });
  const { page, context } = await open({ lang: "fr", state });
  await page.goto(`${BASE}/sitter/profile`);
  { const t = (await tabs(page)).map((x) => x.replace(/\d+\s*/g, "").trim()); check("sitter bar: Demandes · Mon profil · Messages · Compte", JSON.stringify(t) === JSON.stringify(["Demandes", "Mon profil", "Messages", "Compte"]), t.join("|")); }
  check("sitter Demandes: a request to decide, in words", (await page.getByRole("link", { name: "Demandes, 1 demande attend votre décision" }).count()) === 1);
  await context.close();
}

/* ---------------------------------------- 8. Arabic: same places, mirrored */
{
  const state = seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } });
  const { page, context } = await open({ lang: "ar", viewport: { width: 320, height: 720 }, state });
  await page.goto(`${BASE}/account`);
  check("ar: document is RTL", (await page.evaluate(() => document.documentElement.dir)) === "rtl");
  const box = await page.getByRole("link", { name: "الإعدادات" }).boundingBox();
  check("ar: the gear sits at the inline end (left)", box && box.x < 160);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("ar 320px: no horizontal scroll on Compte", overflow <= 0, `overflow ${overflow}px`);
  check("ar: four tabs", (await tabs(page)).length === 4);
  await context.close();
}

await done();
