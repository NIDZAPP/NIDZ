/* Audit 1.3 LOT 11 — the two journeys end to end, through the real UI, from
   a fresh browser, in French at 390×844. Screenshots go to $QA_SHOTS when set.
   Rewritten for Nidz 1.7: the account is opened first (welcome → sign-up →
   first choice), the animal journey has its own steps (animal, breed, name,
   needs, place, care), dog sizes are gone (§9), the sitter space opens on
   the feed and the test tools sit in Paramètres › Gestion du compte. The
   checks keep the 1.3 intent: same sitter, same animal, same dates from
   search to sent request; a question changes no status; a decision does. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { BASE, check, clean, done, isoIn, open, pickCombobox, storedState } from "./lib.mjs";

const SHOTS = process.env.QA_SHOTS ?? null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let n = 0;
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${String(++n).padStart(2, "0")}-${name}.png`), fullPage: false });
};
const h1 = async (page) => clean(await page.locator("h1").first().innerText());
const main = async (page) => clean(await page.locator("main").innerText());
const tab = (page, label) => page.locator("nav.md\\:hidden a").filter({ hasText: label });
const continuer = (page) => page.getByRole("button", { name: "Continuer", exact: true });
/* Go to a space through Compte: the row is a button when the space is not the
   current one, and a plain "current" row when it already is. */
async function toSpace(page, space) {
  await page.goto(`${BASE}/account`);
  const label = space === "sitter" ? /Espace pet-sitter/ : /Espace propriétaire/;
  const button = page.getByRole("button", { name: label });
  if (await button.count()) {
    await button.click();
    await page.waitForURL(space === "sitter" ? /\/sitter\/feed/ : (u) => u.pathname === "/");
  }
  if (space === "sitter") await page.goto(`${BASE}/sitter/requests`);
}

const { page, context } = await open({ lang: "fr", viewport: { width: 390, height: 844 } });

/* ======================================================= ACCOUNT FIRST */
await page.goto(`${BASE}/`);
await page.waitForURL(/\/welcome/);
await shot(page, "accueil");
await page.getByRole("link", { name: "Ouvrir un compte" }).click();
await page.getByRole("button", { name: "Continuer avec un numéro de téléphone" }).click();
await page.getByLabel("Numéro de mobile").fill("550123456");
await continuer(page).click();
await page.locator('input[autocomplete="one-time-code"]').fill("123456");
await continuer(page).click();
await page.getByLabel("Prénom").fill("Lina");
await continuer(page).click();
check("ACCOUNT: a missing last name is named and the first name kept", (await page.getByRole("alert").count()) > 0 && (await page.getByLabel("Prénom").inputValue()) === "Lina");
await page.getByLabel("Nom", { exact: true }).fill("Kaci");
await continuer(page).click();
await page.getByRole("button", { name: "Passer cette étape" }).click();
await page.waitForURL(/\/start/);
await shot(page, "premier-choix");
check("ACCOUNT: opened, signed in, then the first choice", (await storedState(page)).signedIn === true);

/* ============================================================ OWNER */
await page.getByRole("button", { name: "Trouver une garde" }).click();
await page.waitForURL(/\/owner\/need\/pet/);
await page.getByRole("button", { name: "Chien", exact: true }).click();
await continuer(page).click();
await page.waitForURL(/need\/breed/);
await page.getByRole("button", { name: "Je ne sais pas" }).click();
await page.waitForURL(/need\/about/);
await page.getByLabel("Comment s'appelle votre animal ?").fill("Milo");
await continuer(page).click();
await page.waitForURL(/need\/needs/);
await page.getByRole("button", { name: "Rien à signaler" }).click();
await page.waitForURL(/need\/location/);
await pickCombobox(page, "Wilaya", "Alger");
await continuer(page).click();
await page.waitForURL(/need\/care/);
await page.getByRole("radio", { name: /Garde chez le pet-sitter/ }).click();
await page.getByLabel("Date de début").fill(isoIn(4));
await page.getByLabel("Date de fin").fill(isoIn(7));
await page.getByRole("button", { name: "Voir les pet-sitters" }).click();
await page.waitForURL(/\/search\?/);
await shot(page, "resultats-chien");
const results = (await page.locator("main ul[role=list] > li h2").allInnerTexts()).map(clean);
check("OWNER: a dog in Algiers, boarding → Amina among the results, nearest first", results.includes("Amina B.") && /proches de la zone|zone recherchée/i.test(await main(page)), results.join(", "));
check("OWNER: no dog size anywhere in the results", !/(petits|moyens|grands) chiens/i.test(await main(page)));

await page.getByRole("link", { name: /Voir le profil.*Amina B\./ }).click();
await page.waitForURL(/\/sitters\/amina-b/);
await shot(page, "profil-amina");
check("OWNER: Amina's profile explains the fit for Milo", (await main(page)).includes("Bien adapté à Milo"));
await page.getByRole("link", { name: "Demander une garde" }).filter({ visible: true }).click();
await page.waitForURL(/\/owner\/request\/amina-b/);
await shot(page, "recapitulatif-amina");
check("OWNER: « Votre demande à Amina B. », same sitter", (await h1(page)) === "Votre demande à Amina B.");
check("OWNER: same animal, service and dates", (await page.getByRole("radio", { name: /Milo/ }).isChecked()) && new URL(page.url()).searchParams.get("from") === isoIn(4) && new URL(page.url()).searchParams.get("care") === "boarding");
await page.getByRole("button", { name: "Envoyer ma demande" }).click();
await page.waitForURL(/\/sent\?id=/);
await shot(page, "demande-envoyee");
check("OWNER: sent screen says it is a demonstration and nothing left the browser", /démonstration/i.test(await main(page)) && /Rien n.a été envoyé|aucun pet-sitter/i.test(await main(page)));
await page.getByRole("link", { name: "Voir ma demande" }).click();
await page.waitForURL(/\/owner\/requests\/req-/);
check("OWNER: request detail shows « En attente »", (await main(page)).includes("En attente"));
await tab(page, "Demandes").click();
await page.waitForURL(/\/owner\/requests/);
await page.getByRole("tab", { name: /Envoyées/ }).click();
check("OWNER: Envoyées lists Milo · Amina B.", /Milo\s*·\s*Amina B\./.test(await main(page)));

/* =========================================================== SITTER */
await tab(page, "Compte").click();
await page.waitForURL(/\/account/);
await page.getByRole("link", { name: /Espace pet-sitter/ }).or(page.getByRole("button", { name: /Espace pet-sitter/ })).first().click();
await page.waitForURL(/\/sitter\/start/);
await page.getByRole("link", { name: "Créer mon profil" }).or(page.getByRole("button", { name: "Créer mon profil" })).first().click();
/* The account already holds the name and the number: straight to the area. */
await page.waitForURL(/\/sitter\/join\/location/);
check("SITTER: the account's name and phone are not asked again", page.url().endsWith("/sitter/join/location"));
await pickCombobox(page, "Wilaya", "Alger");
await pickCombobox(page, "Commune", "Hydra");
await continuer(page).click();
await page.waitForURL(/\/sitter\/profile$/);
check("SITTER: « Pour publier » and « Enrichir mon profil »", (await main(page)).includes("Pour publier") && (await main(page)).includes("Enrichir mon profil"));
await page.getByRole("link", { name: /À propos de vous/ }).first().click();
await page.getByLabel("En une phrase").fill("Je promène les chiens à Hydra.");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await page.getByRole("link", { name: /Services et tarifs/ }).first().click();
await page.getByRole("checkbox", { name: "Promenade" }).click();
await page.getByLabel("Promenade").fill("500");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await page.getByRole("link", { name: /Animaux que vous acceptez/ }).first().click();
await page.getByRole("checkbox", { name: "Chiens", exact: true }).click();
check("SITTER: ticking dogs asks about breeds, « Toutes les races » by default", (await page.getByRole("radio", { name: "Toutes les races" }).getAttribute("aria-checked")) === "true");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await shot(page, "tableau-de-bord-sitter");
check("SITTER: minimum complete (4 sur 4), enrichment optional", (await main(page)).includes("4 sur 4 renseignées."));
await page.getByRole("link", { name: "Voir ce que verraient les propriétaires" }).click();
await page.waitForURL(/\/sitter\/preview/);
await shot(page, "apercu");
check("SITTER: preview = public profile component (glance with price and unit)", /Promenade\s*·\s*500\s?DA\s*par promenade/.test(await main(page)));
await page.getByRole("button", { name: "Publier mon profil" }).click();
await page.waitForURL(/\/sitter\/published/);
check("SITTER: published locally", (await storedState(page)).sitter.published === true);

/* A request reaches the sitter: through the separated test tool. */
await page.goto(`${BASE}/settings/account`);
await page.getByRole("link", { name: "M'adresser une demande d'essai" }).click();
await page.waitForURL(/\/when/);
await page.getByRole("radio", { name: /Promenade/ }).click();
await page.getByLabel("Date de la promenade").fill(isoIn(6));
await page.getByRole("button", { name: "Voir ma demande" }).click();
await page.waitForURL((u) => /^\/owner\/request\/[^/]+$/.test(u.pathname));
await page.getByRole("button", { name: "Envoyer ma demande" }).click();
await page.waitForURL(/\/sent\?id=/);

await toSpace(page, "sitter");
check("SITTER: the request is received", (await main(page)).includes("Milo"));
await page.getByRole("button", { name: "Poser une question" }).click();
await page.getByRole("button", { name: /Pourrions-nous nous rencontrer/ }).click();
await page.getByRole("button", { name: "Ajouter à la demande" }).click();
await shot(page, "question-locale");
let st = await storedState(page);
const selfReq = st.requests.find((r) => r.sitterId === st.sitter.profile.id);
check("SITTER: local question added, request still « En attente »", selfReq.thread.length === 1 && selfReq.status === "pending");

await toSpace(page, "owner");
await tab(page, "Demandes").click();
await page.waitForURL(/\/owner\/requests/);
await page.getByRole("tab", { name: /Envoyées/ }).click();
check("OWNER: « Une question pour vous » on the list", (await main(page)).includes("Une question pour vous"));
await page.getByRole("link", { name: /Une question pour vous/ }).click();
await page.getByRole("button", { name: "Répondre à la question" }).click();
await page.getByLabel("Votre message au pet-sitter").fill("Oui, samedi matin.");
await page.getByRole("button", { name: "Ajouter à la demande" }).click();

await toSpace(page, "sitter");
await page.getByRole("button", { name: "Accepter la demande" }).click();
st = await storedState(page);
check("SITTER: accepting changes the status", st.requests.find((r) => r.id === selfReq.id).status === "accepted");

await toSpace(page, "owner");
await page.goto(`${BASE}/owner/requests/${selfReq.id}`);
await shot(page, "statut-proprietaire");
check("OWNER: status coherent (« Acceptée ») and explained as not a booking", (await main(page)).includes("Acceptée") && /pas une réservation|ni réservation/i.test(await main(page)));
await page.goto(`${BASE}/owner/requests?tab=sent`);
check("OWNER: the request to Amina is still « En attente » (nobody answers examples)", /Milo\s*·\s*Amina B\.[\s\S]*?En attente/.test(await main(page)));
check("no page errors across both journeys", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
await context.close();

/* ======================================================== EDGE CASES */
{
  const { page, context } = await open({ lang: "fr" });
  /* Retired in Nidz 1.7: « Youcef + large dog ». The same guarantee on breeds. */
  await page.goto(`${BASE}/sitters/mehdi-s?species=parrot&kind=parrot.macaw`);
  check("EDGE: Mehdi + a macaw → mismatch stated, no 'Bien adapté'", (await main(page)).includes("Ne correspond pas à ce que vous cherchez") && !(await main(page)).includes("Bien adapté"));
  await page.goto(`${BASE}/search?species=cat`);
  const catFacts = await main(page);
  check("EDGE: cat search states nothing about dogs as a reason", !/Accepte les chiens|Chiens :/.test(catFacts));
  await page.goto(`${BASE}/search?species=parrot&kind=parrot.macaw`);
  check("EDGE: no result → honest empty state with 'Effacer tous les critères'", (await page.getByText("Aucun pet-sitter ne correspond à ces critères").isVisible()) && (await page.getByRole("button", { name: "Effacer tous les critères" }).isVisible()));
  await page.goto(`${BASE}/owner/request/amina-b?care=walk&from=${isoIn(3)}&to=${isoIn(3)}`);
  await page.waitForURL(/\/register\?next=/);
  check("EDGE: request without an account → sign-up carrying the request", page.url().includes(encodeURIComponent("/owner/request/amina-b")));
  await context.close();
}

await done();
