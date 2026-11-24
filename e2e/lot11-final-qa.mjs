/* Audit 1.3 LOT 11 — the two journeys end to end, through the real UI, from
   a fresh browser, in French at 390×844. Screenshots go to $QA_SHOTS when set. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { BASE, check, clean, done, isoIn, loose, open, pickCombobox, storedState } from "./lib.mjs";

const SHOTS = process.env.QA_SHOTS ?? null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let n = 0;
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${String(++n).padStart(2, "0")}-${name}.png`), fullPage: false });
};
const h1 = async (page) => clean(await page.locator("h1").first().innerText());
const main = async (page) => clean(await page.locator("main").innerText());
const tab = (page, label) => page.locator("nav.md\\:hidden a").filter({ hasText: label });
/* Go to a space through Compte: the row is a button when the space is not the
   current one, and a plain "current" row when it already is. */
async function toSpace(page, space) {
  await page.goto(`${BASE}/account`);
  const label = space === "sitter" ? /Espace pet-sitter/ : /Espace propriétaire/;
  const button = page.getByRole("button", { name: label });
  if (await button.count()) {
    await button.click();
    await page.waitForURL(space === "sitter" ? /\/sitter\/requests/ : (u) => u.pathname === "/");
  } else {
    await page.goto(`${BASE}${space === "sitter" ? "/sitter/requests" : "/"}`);
  }
}

const { page, context } = await open({ lang: "fr", viewport: { width: 390, height: 844 } });

/* ============================================================ OWNER */
await page.goto(`${BASE}/`);
await page.waitForURL(/\/welcome/);
await shot(page, "accueil");
await page.getByRole("button", { name: "Trouver une garde" }).click();
await page.waitForURL(/\/owner\/need\/pet/);
await page.getByRole("radio", { name: "Chien", exact: true }).click();
await page.getByLabel("Son nom").fill("Milo");
await page.getByRole("radio", { name: "Grands chiens" }).click();
await page.getByRole("button", { name: "Continuer" }).click();
await page.waitForURL(/need\/location/);
await pickCombobox(page, "Wilaya", "Alger");
await page.getByRole("button", { name: "Continuer" }).click();
await page.waitForURL(/need\/care/);
await page.getByRole("radio", { name: /Garde chez le pet-sitter/ }).click();
await page.getByLabel("Date de début").fill(isoIn(4));
await page.getByLabel("Date de fin").fill(isoIn(7));
await page.getByRole("button", { name: "Voir les pet-sitters" }).click();
await page.waitForURL(/\/search\?/);
await shot(page, "resultats-grand-chien");
const results = (await page.locator("main ul[role=list] > li h2").allInnerTexts()).map(clean);
check("OWNER: large dog → compatible results only (Amina, Nadia; not Youcef, Karim)", results.includes("Amina B.") && results.includes("Nadia L.") && !results.includes("Youcef H.") && !results.includes("Karim B."), results.join(", "));

await page.getByRole("link", { name: /Voir le profil.*Amina B\./ }).click();
await page.waitForURL(/\/sitters\/amina-b/);
await shot(page, "profil-amina");
check("OWNER: Amina's profile explains the fit for Milo", (await main(page)).includes("Bien adapté à Milo"));
await page.getByRole("link", { name: "Demander une garde" }).filter({ visible: true }).click();
await page.waitForURL(/\/auth\?next=/);
await page.getByRole("link", { name: "Créer un compte local" }).click();
await page.getByLabel("Prénom").fill("Lina");
await page.getByRole("button", { name: "Créer mon compte" }).click();
check("OWNER: invalid form names the missing field and keeps the rest", (await page.getByRole("alert").count()) > 0 && (await page.getByLabel("Prénom").inputValue()) === "Lina");
await page.getByLabel("Nom", { exact: true }).fill("Kaci");
await page.getByRole("button", { name: "Créer mon compte" }).click();
await page.waitForURL(/\/owner\/request\/amina-b/);
await shot(page, "recapitulatif-amina");
check("OWNER: after the account → « Votre demande à Amina B. », same sitter", (await h1(page)) === "Votre demande à Amina B.");
check("OWNER: same animal, service and dates", (await page.getByRole("radio", { name: /Milo/ }).isChecked()) && new URL(page.url()).searchParams.get("from") === isoIn(4) && new URL(page.url()).searchParams.get("care") === "boarding");
await page.getByRole("button", { name: "Envoyer ma demande" }).click();
await page.waitForURL(/\/sent\?id=/);
await shot(page, "demande-envoyee");
check("OWNER: sent screen says it is a demonstration and nothing left the browser", /démonstration/i.test(await main(page)) && /Rien n.a été envoyé|aucun pet-sitter/i.test(await main(page)));
await page.getByRole("link", { name: "Voir ma demande" }).click();
await page.waitForURL(/\/owner\/requests\/req-/);
check("OWNER: request detail shows « En attente »", (await main(page)).includes("En attente"));
await tab(page, "Demandes").click();
await page.waitForURL(/\/owner\/requests$/);
check("OWNER: history lists Milo · Amina B.", /Milo\s*·\s*Amina B\./.test(await main(page)));

/* =========================================================== SITTER */
await tab(page, "Compte").click();
await page.waitForURL(/\/account/);
await page.getByRole("link", { name: /Espace pet-sitter/ }).click();
await page.waitForURL(/\/sitter\/start/);
await page.getByRole("link", { name: "Créer mon profil" }).or(page.getByRole("button", { name: "Créer mon profil" })).first().click();
/* 1.6: the owner account already holds the name and the number, so the
   sitter is not asked for them again — straight to the area. */
await page.waitForURL(/\/sitter\/join\/location/);
check("SITTER: an owner account skips the name and phone steps", page.url().endsWith("/sitter/join/location"));
await pickCombobox(page, "Wilaya", "Alger");
await pickCombobox(page, "Commune", "Hydra");
await page.getByRole("button", { name: "Continuer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
check("SITTER: dashboard separates « Pour publier » and « Enrichir mon profil »", (await main(page)).includes("Pour publier") && (await main(page)).includes("Enrichir mon profil"));
await page.getByRole("link", { name: /À propos de vous/ }).first().click();
await page.getByLabel("En une phrase").fill("Je promène les grands chiens à Hydra.");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await page.getByRole("link", { name: /Services et tarifs/ }).first().click();
await page.getByRole("checkbox", { name: "Promenade" }).click();
await page.getByLabel("Promenade").fill("500");
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await page.getByRole("link", { name: /Animaux que vous acceptez/ }).first().click();
await page.getByRole("checkbox", { name: "Chiens", exact: true }).click();
await page.getByRole("checkbox", { name: "Grands chiens" }).click();
await page.getByRole("button", { name: "Enregistrer" }).click();
await page.waitForURL(/\/sitter\/profile$/);
await shot(page, "tableau-de-bord-sitter");
check("SITTER: minimum complete (4 sur 4), enrichment optional", (await main(page)).includes("4 sur 4 renseignées."));
await page.getByRole("link", { name: "Voir ce que verraient les propriétaires" }).click();
await page.waitForURL(/\/sitter\/preview/);
await shot(page, "apercu");
/* 1.4: the service and its price sit in two columns, so innerText breaks
   the line between them; the facts checked are the same. */
check("SITTER: preview = public profile component (glance with price and unit)", /Promenade\s*·\s*500\s?DA\s*par promenade/.test(await main(page)));
await page.getByRole("button", { name: "Publier mon profil" }).click();
await page.waitForURL(/\/sitter\/published/);
check("SITTER: published locally", (await storedState(page)).sitter.published === true);

/* A request reaches the sitter: through the separated test tool. */
await page.goto(`${BASE}/settings`);
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
await page.waitForURL(/\/owner\/requests$/);
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
await page.goto(`${BASE}/owner/requests`);
check("OWNER: the request to Amina is still « En attente » (nobody answers examples)", /Milo\s*·\s*Amina B\.[\s\S]*?En attente/.test(await main(page)));
check("no page errors across both journeys", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
await context.close();

/* ======================================================== EDGE CASES */
{
  const { page, context } = await open({ lang: "fr" });
  await page.goto(`${BASE}/sitters/youcef-h?species=dog&size=large`);
  check("EDGE: Youcef + large dog → mismatch stated, no 'Bien adapté'", /n'accepte pas : grands chiens/.test(await main(page)) && !(await main(page)).includes("Bien adapté"));
  await page.goto(`${BASE}/search?species=cat`);
  const catFacts = await main(page);
  check("EDGE: cat search states nothing about dogs as a reason", !/Accepte les chiens|Chiens :/.test(catFacts));
  await page.goto(`${BASE}/search?species=bird`);
  check("EDGE: no result → honest empty state with 'Effacer tous les critères'", (await page.getByText("Aucun pet-sitter ne correspond à ces critères").isVisible()) && (await page.getByRole("button", { name: "Effacer tous les critères" }).isVisible()));
  await page.goto(`${BASE}/owner/request/amina-b?care=walk&from=${isoIn(3)}&to=${isoIn(3)}`);
  await page.waitForURL(/\/auth/);
  check("EDGE: request without an account → gateway carrying the request", page.url().includes(encodeURIComponent("/owner/request/amina-b")));
  await context.close();
}

await done();
