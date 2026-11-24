/* Nidz 1.4 step 5 — Messages before a request, local and honest.
   A conversation is notes kept in this browser: never "sent", "delivered" or
   "read"; unread is per space; only the visitor's own sitter profile can
   answer; an example profile says nobody will read it. */
import { ACCOUNT, BASE, check, clean, done, open, publishedSitter, seedState, storedState } from "./lib.mjs";

const FAKE = /\b(sent|delivered|seen|read by|envoyé|délivré|vu par|lu par)\b|message envoyé|a lu votre/i;
const state = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: true },
  activeWorkspace: "owner",
  sitter: publishedSitter(),
});

const { page, context } = await open({ lang: "fr", state });

/* 1. A profile offers the question; your OWN profile does not (you do not
   ask yourself) — the test detour lives in Compte, like the self-request. */
await page.goto(`${BASE}/sitters/amina-b`);
check("another sitter's profile offers « Poser une question »", (await page.getByRole("link", { name: /Poser une question/ }).count()) > 0);
await page.goto(`${BASE}/sitters/sitter-local`);
check("your own profile does not", (await page.getByRole("link", { name: /Poser une question/ }).count()) === 0);
await page.goto(`${BASE}/settings`);
await page.getByRole("link", { name: "M'écrire un message d'essai" }).click();
await page.waitForURL(/\/messages\/to\/sitter-local/);
let text = clean(await page.locator("body").innerText());
check("own profile: the notice says only your sitter space can answer, on this device", text.includes("votre propre profil de pet-sitter") && text.includes("Rien n'en sort"));
await page.getByLabel(/Votre message/).fill("Bonjour, peut-on se voir avant ?");
await page.getByRole("button", { name: "Ajouter le message" }).click();
await page.waitForURL(/\/messages\/conv-/);
text = clean(await page.locator("body").innerText());
check("the message is shown as yours", text.includes("Bonjour, peut-on se voir avant ?") && text.includes("Vous"));
check("no sent / delivered / read wording in the thread", !FAKE.test(text));
let st = await storedState(page);
check("one conversation, one message", st.conversations.length === 1 && st.conversations[0].messages.length === 1);

/* 2. Writing to the same sitter again opens the same conversation. */
await page.goto(`${BASE}/messages/to/sitter-local`);
await page.waitForURL(/\/messages\/conv-/);
st = await storedState(page);
check("one thread per sitter", st.conversations.length === 1);

/* 3. The sitter space sees it unread, opens it, answers. */
await page.goto(`${BASE}/settings`);
await page.getByRole("button", { name: /Espace pet-sitter/ }).click();
await page.waitForURL(/\/sitter\/requests/);
check("sitter header: 1 unread conversation, in words", await page.getByRole("link", { name: /Messages, 1 conversation non lue/ }).isVisible());
await page.getByRole("link", { name: /Messages, 1 conversation non lue/ }).click();
await page.waitForURL(/\/messages$/);
check("the list says it is unread in words", (await page.locator("main").innerText()).includes("1 non lu"));
await page.getByRole("link", { name: /Lina K\./ }).first().click();
await page.waitForURL(/\/messages\/conv-/);
check("sitter side: the notice says the reply stays here", clean(await page.locator("body").innerText()).includes("personne ne la reçoit"));
await page.getByLabel(/Votre message/).fill("Oui, samedi matin.");
await page.getByRole("button", { name: "Ajouter le message" }).click();
await page.waitForTimeout(300);
st = await storedState(page);
check("the reply is stored as the sitter's", st.conversations[0].messages.at(-1).author === "sitter");
check("opening marked it seen for the sitter space only", st.conversations[0].seen.sitter !== null);

/* 4. Back in the owner space: the reply is unread there, and a notification. */
await page.goto(`${BASE}/settings`);
await page.getByRole("button", { name: /Espace propriétaire/ }).click();
await page.goto(`${BASE}/messages`);
await page.getByRole("tab", { name: /Notifications/ }).click();
text = clean(await page.locator("main").innerText());
check("owner notification derived from the reply", /a écrit 1 nouveau message/.test(text));
check("notifications say nothing is pushed", text.includes("ni SMS, ni e-mail"));
check("no fake delivery wording anywhere", !FAKE.test(text));

/* 5. An example profile: nobody will read it. */
await page.goto(`${BASE}/messages/to/amina-b`);
check("example profile: nobody will read this conversation", clean(await page.locator("body").innerText()).includes("personne ne lira cette conversation"));

check("no page errors", page.errors.length === 0, page.errors.join(" | "));
await context.close();
await done();
