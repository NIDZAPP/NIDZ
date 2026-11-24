/* Audit 1.3 LOT 07 — a question before a decision, local and honest. */
import { ACCOUNT, BASE, check, clean, done, isoIn, open, publishedSitter, seedState, storedState } from "./lib.mjs";

const pet = { id: "pet-rex", name: "Rex", age: "3 ans", sex: "unknown", notes: "", species: "dog", details: { size: "medium" } };
const request = {
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
};
const state = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: true },
  activeWorkspace: "sitter",
  sitter: publishedSitter(),
  pets: [{ ...pet, care: {} }],
  requests: [request],
});
const FAKE = /message sent|delivered|has been notified|meeting confirmed|rendez-vous confirmé|message envoyé/i;

const { page, context } = await open({ state });

/* Sitter: three choices, and a question changes nothing about the status. */
await page.goto(`${BASE}/sitter/requests`);
await page.waitForSelector("h1");
check("sitter sees Accept, Ask a question and Decline", (await page.getByRole("button", { name: "Accept the request" }).isVisible()) && (await page.getByRole("button", { name: "Ask a question" }).isVisible()) && (await page.getByRole("button", { name: "Decline" }).isVisible()));
await page.getByRole("button", { name: "Ask a question" }).click();
await page.getByRole("button", { name: /Could we meet before the stay/ }).click();
check("a 'meet first' suggestion fills the question, as a question", (await page.getByLabel("Your question to the owner").inputValue()).startsWith("Could we meet"));
check("the composer says nothing is sent", await page.getByText(/This is not sent/).isVisible());
await page.getByRole("button", { name: "Add to the request" }).click();
let st = await storedState(page);
check("question stored on the same request", st.requests[0].thread?.length === 1 && st.requests[0].thread[0].author === "sitter");
check("asking leaves the request pending", st.requests[0].status === "pending");
check("sitter sees the question and that it accepts nothing", (await page.getByText("asking accepts nothing").isVisible()) && (await page.getByText("Awaiting a reply").first().isVisible()));
let text = clean(await page.locator("main").innerText());
check("no claim of delivery, notification or confirmed meeting (sitter)", !FAKE.test(text));
check("context kept: animal, dates and sitter unchanged", st.requests[0].pet.name === "Rex" && st.requests[0].dates.start === request.dates.start && st.requests[0].sitterId === "sitter-local");

/* Reload keeps it. */
await page.reload();
await page.waitForSelector("h1");
check("the question survives a reload", await page.getByText(/Could we meet before the stay/).first().isVisible());

/* Owner: flagged in the list, answerable, still pending. */
await page.goto(`${BASE}/account`);
await page.getByRole("button", { name: /Owner space/ }).click();
await page.goto(`${BASE}/owner/requests`);
check("owner list flags 'A question for you'", await page.getByText("A question for you").isVisible());
await page.getByRole("link", { name: /Rex/ }).first().click();
await page.waitForURL(/\/owner\/requests\/req-1/);
check("owner sees the sitter's question, labelled as the sitter's", (await page.getByText("The sitter", { exact: true }).isVisible()) && (await page.getByText(/Could we meet/).isVisible()));
await page.getByRole("button", { name: "Answer the question" }).click();
await page.getByLabel("Your message to the sitter").fill("Oui, samedi matin à Hydra si cela vous convient.");
await page.getByRole("button", { name: "Add to the request" }).click();
st = await storedState(page);
check("owner's answer added, request still pending", st.requests[0].thread.length === 2 && st.requests[0].thread[1].author === "owner" && st.requests[0].status === "pending");
text = clean(await page.locator("main").innerText());
check("no claim of delivery, notification or confirmed meeting (owner)", !FAKE.test(text));

/* Only a decision changes the status; after it, no more questions. */
await page.goto(`${BASE}/account`);
await page.getByRole("button", { name: /Sitter space/ }).click();
await page.waitForURL(/\/sitter\/requests/);
await page.getByRole("button", { name: "Accept the request" }).click();
st = await storedState(page);
check("accepting is what changes the status", st.requests[0].status === "accepted");
check("no 'Ask a question' once decided", (await page.getByRole("button", { name: "Ask a question" }).count()) === 0);

/* The test tooling is separate from the product. */
await page.goto(`${BASE}/sitters/sitter-local`);
await page.waitForSelector("h1");
check("own public profile no longer carries test instructions", !(await page.getByText(/test request|send yourself/i).count()));
await page.goto(`${BASE}/settings`);
check("Paramètres holds the test tool, labelled as such", (await page.getByText("Test tools for this demonstration").isVisible()) && (await page.getByRole("link", { name: "Address a test request to my profile" }).isVisible()));
check("no page errors", page.errors.length === 0, page.errors.join(" | "));
await context.close();

/* Review findings: no question box towards an example sitter (nobody could
   read it); focus never falls to <body>. */
{
  const toAmina = { ...request, id: "req-amina", sitterId: "amina-b" };
  const { page, context } = await open({ state: seedState({ ...state, activeWorkspace: "owner", requests: [request, toAmina] }) });
  await page.goto(`${BASE}/owner/requests/req-amina`);
  check("example sitter: no 'Ask a question' offered", (await page.getByRole("button", { name: "Ask a question" }).count()) === 0);
  check("example sitter: says why, honestly", await page.getByText(/This sitter is an example: nobody can read/).isVisible());

  await page.goto(`${BASE}/sitter/requests`);
  await page.getByRole("button", { name: "Ask a question" }).click();
  check("opening the composer focuses the field", await page.evaluate(() => document.activeElement?.tagName === "TEXTAREA"));
  await page.getByRole("button", { name: "Cancel" }).click();
  check("cancelling returns focus to 'Ask a question'", await page.evaluate(() => document.activeElement?.textContent?.trim() === "Ask a question"));
  await page.getByRole("button", { name: "Ask a question" }).click();
  await page.getByLabel("Your question to the owner").fill("Une question ?");
  await page.getByRole("button", { name: "Add to the request" }).click();
  check("adding moves focus to the thread heading", await page.evaluate(() => /H[23]/.test(document.activeElement?.tagName ?? "") && document.activeElement?.textContent?.includes("Questions before deciding")));
  await context.close();
}

/* Arabic renders the thread without raw keys. */
{
  const { page, context } = await open({ lang: "ar", state: seedState({ ...state, requests: [{ ...request, thread: [{ id: "m1", author: "sitter", text: "سؤال", createdAt: "2026-11-21T10:00:00Z" }] }] }) });
  await page.goto(`${BASE}/sitter/requests`);
  await page.waitForSelector("h1");
  check("AR: thread renders, no raw key", !/\bclarify\.[a-zA-Z]+/.test(await page.locator("main").innerText()));
  check("AR: no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await context.close();
}

await done();
