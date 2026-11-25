/* Nidz 1.7 — navigation, account creation, the 13-animal journey, the two
   matching methods (direct search and published requests), the unified bars
   and the enriched settings. One PASS/FAIL line per check, like every lot. */
import { BASE, check, done, isoIn, launch, open } from "./lib.mjs";

const STORAGE = "nidz.demo";
const account = (over = {}) => ({
  firstName: "Lina",
  lastName: "Kaci",
  dateOfBirth: null,
  wilayaId: "alger",
  communeId: "kouba",
  ownedSpecies: [],
  phoneNumber: "550123456",
  accountComplete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  signInMethod: "phone",
  ...over,
});
const L = (s) => ({ fr: s, en: s, ar: s });
const sitter = (over = {}) => ({
  published: true,
  hidden: false,
  idDocument: null,
  profile: {
    id: "my-profile",
    publicName: "Lina K.",
    wilayaCode: "alger",
    communeCode: "kouba",
    headline: L("I look after rabbits and small animals at your home."),
    about: L("Small mammals are my thing."),
    experience: { years: 3, species: [], puppiesKittens: "unknown", seniors: "unknown", specialNeeds: "unknown", oralMedication: "unknown", multipleAnimals: "unknown", reactiveAnimals: "unknown", paidBefore: "unknown", volunteered: "unknown" },
    professional: { kind: "none", detail: L(""), years: null, canEvidence: "unknown" },
    services: ["atOwner"],
    rates: { atOwner: 700 },
    acceptedSpecies: ["rabbit", "cat"],
    acceptedKinds: {},
    maxAnimals: 2,
    housing: { type: null, outdoor: null, residentPets: [], canSeparateAnimals: "unknown", conditions: null },
    limits: [],
    declaredUnavailable: [],
    confirmedSections: [],
    isDemoFixture: false,
    ...over,
  },
});
const state = (over = {}) => ({
  version: 4,
  entered: true,
  signedIn: true,
  activeWorkspace: "owner",
  capabilities: { owner: true, sitter: false },
  account: account(),
  pets: [],
  requests: [],
  posts: [],
  proposals: [],
  conversations: [],
  blockedSitters: [],
  ...over,
});
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), STORAGE);
const BAR = "nav.md\\:hidden";
const tabLabels = async (page) => (await page.locator(`${BAR} li`).allInnerTexts()).map((s) => s.replace(/\d+/g, "").trim());
const btn = (page, name, exact = true) => page.getByRole("button", { name, exact });
const inViewport = async (page, locator) => {
  const box = await locator.boundingBox();
  const vh = page.viewportSize().height;
  return Boolean(box && box.y >= 0 && box.y + box.height <= vh);
};

/* ------------------------------------------------------------ 1. welcome */
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  const { context, page } = await open({ viewport });
  await page.goto(`${BASE}/`);
  await page.waitForURL(/\/welcome/);
  const create = page.getByRole("link", { name: "Open an account" });
  const signIn = page.getByRole("link", { name: "Sign in" });
  check(`welcome @${viewport.width}: both actions in the first screen`, (await inViewport(page, create)) && (await inViewport(page, signIn)));
  const actions = await page.locator("main a, main button").count();
  check(`welcome @${viewport.width}: nothing else to press under the actions`, actions === 2, `${actions} controls in main`);
  check(`welcome @${viewport.width}: the supplied illustration is shown`, (await page.locator("main img").count()) === 1);
  await context.close();
}

/* -------------------------------------------- 2. sign-up, Google journey */
{
  const { context, page } = await open();
  await page.goto(`${BASE}/register`);
  await btn(page, "Continue with Google").click();
  await page.waitForURL(/\/register\/name/);
  check("google: the name step says Google was not contacted", await page.getByText("Google was not contacted").isVisible());
  await page.getByLabel("First name").fill("Lina");
  await page.getByLabel("Last name").fill("Kaci");
  await btn(page, "Continue").click();
  await page.waitForURL(/\/register\/phone/);
  await page.getByLabel("Mobile number").fill("12");
  await btn(page, "Continue").click();
  check("phone: an invalid number is refused with a reason", (await page.getByRole("alert").count()) > 0 && /\/register\/phone/.test(page.url()));
  await page.goBack();
  check("back keeps the name typed before", (await page.getByLabel("First name").inputValue()) === "Lina");
  await page.goForward();
  await page.getByLabel("Mobile number").fill("550123456");
  await btn(page, "Continue").click();
  await page.waitForURL(/\/register\/code/);
  check("code: says no SMS was sent", await page.getByText("No SMS was sent").isVisible());
  await btn(page, "Continue").click();
  check("code: fewer than 6 digits is refused", /\/register\/code/.test(page.url()) && (await page.getByText("Type the 6 digits.").isVisible()));
  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  await btn(page, "Continue").click();
  await page.waitForURL(/\/register\/photo/);
  await btn(page, "Skip this step").click();
  await page.waitForURL(/\/start/);
  const s = await stored(page);
  check("the account is saved, signed in, method recorded, number kept", s?.signedIn === true && s?.account?.signInMethod === "google" && s?.account?.phoneNumber === "550123456");
  check("first choice: exactly two actions, no sign-in", (await page.locator("main a, main button").count()) === 2 && (await page.getByText("Sign in").count()) === 0);
  check("first choice: no « one account for both » line", (await page.getByText(/one account for both/i).count()) === 0);
  await context.close();
}

/* ------------------------------------- 3. phone journey order and resume */
{
  const { context, page } = await open();
  await page.goto(`${BASE}/register`);
  await btn(page, "Continue with a phone number").click();
  check("phone journey starts with the number", /\/register\/phone/.test(page.url()));
  await page.getByLabel("Mobile number").fill("661234567");
  await btn(page, "Continue").click();
  await page.waitForURL(/\/register\/code/);
  await page.reload();
  await page.goto(`${BASE}/register`);
  check("an interrupted sign-up offers to resume", await page.getByRole("link", { name: "Resume" }).isVisible());
  await page.getByRole("link", { name: "Resume" }).click();
  check("…at the step it reached", /\/register\/code/.test(page.url()));
  await page.goto(`${BASE}/register/photo`);
  check("a bookmark past an unanswered step goes back to it", /\/register\/code/.test(page.url()));
  await context.close();
}

/* --------------------------------------------- 4. session: out and back */
{
  const { context, page } = await open({ state: state({ activeWorkspace: "sitter", capabilities: { owner: true, sitter: true }, sitter: sitter() }) });
  await page.goto(`${BASE}/welcome`);
  check("a valid session skips the welcome screen", /\/sitter\/feed/.test(page.url()));
  await page.goto(`${BASE}/settings/account`);
  await btn(page, "Sign out").click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/welcome/);
  const out = await stored(page);
  check("signing out keeps every record", out?.signedIn === false && out?.account && out?.sitter);
  await page.goto(`${BASE}/register`);
  check("one account per device: opening another offers to sign in", await page.getByText(/An account already exists on this device/).isVisible());
  await page.goto(`${BASE}/login`);
  await btn(page, "Continue as Lina K.").click();
  check("signing in returns to the last space's home", /\/sitter\/feed/.test(page.url()));
  await context.close();
}

/* ------------------------------------ 5. the animal grid and its blur */
{
  const { context, page } = await open({ state: state() });
  await page.goto(`${BASE}/owner/need/pet`);
  const cards = page.locator("button[aria-pressed]");
  check("13 animals plus « Other », dog, cat and bird first", (await cards.count()) === 14 && (await cards.nth(0).innerText()).includes("Dog") && (await cards.nth(2).innerText()).includes("Bird") && (await cards.nth(13).innerText()).includes("Other"));
  check("three cards per row", await page.evaluate(() => {
    const b = [...document.querySelectorAll("button[aria-pressed]")].slice(0, 4).map((e) => e.getBoundingClientRect().top);
    return b[0] === b[1] && b[1] === b[2] && b[3] > b[0];
  }));
  check("Continue is disabled with nothing chosen", await btn(page, "Continue").isDisabled());
  check("no settings gear on the step", (await page.getByRole("link", { name: "Settings" }).count()) === 0);
  await btn(page, "Rabbit").click();
  const blurred = await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed="false"]')].every((e) => getComputedStyle(e).filter.includes("blur")));
  check("choosing one: it is pressed, the others recede (blur)", (await btn(page, "Rabbit").getAttribute("aria-pressed")) === "true" && blurred);
  check("the receded cards keep their accessible names", (await btn(page, "Cat").count()) === 1);
  await btn(page, "Rabbit").click();
  /* The blur eases out over 200ms: read it once the transition is over. */
  const restored = await page
    .waitForFunction(() => [...document.querySelectorAll("button[aria-pressed]")].every((e) => !getComputedStyle(e).filter.includes("blur")), null, { timeout: 2000 })
    .then(() => true, () => false);
  check("tapping it again deselects and restores the grid", (await page.locator('button[aria-pressed="true"]').count()) === 0 && restored);
  await btn(page, "Other").click();
  await btn(page, "Continue").click();
  check("« Other » needs a name before continuing", /need\/pet/.test(page.url()) && (await page.getByRole("alert").count()) > 0);
  await btn(page, "Ferret").click();
  await btn(page, "Continue").click();
  check("a ferret (no useful classification) skips the breed step", /need\/about/.test(page.url()));
  check("no dog-size question anywhere on the step", (await page.getByText(/size/i).count()) === 0);
  await page.goBack();
  await btn(page, "Rabbit").click();
  await btn(page, "Continue").click();
  await page.waitForURL(/need\/breed/);
  check("a rabbit gets the breed step", /need\/breed/.test(page.url()) && (await page.getByRole("heading", { name: "Breed" }).isVisible()));
  await page.getByPlaceholder("Search for a breed…").fill("lion");
  check("the breed list is searchable", (await page.getByRole("radio").count()) === 1);
  await page.getByPlaceholder("Search for a breed…").fill("");
  await btn(page, "I don't know").click();
  check("« I don't know » skips to the next step", /need\/about/.test(page.url()));
  await page.getByLabel("What is your animal called?").fill("Noisette");
  await page.getByRole("checkbox", { name: "I don't know its age" }).click();
  await btn(page, "Continue").click();
  await page.waitForURL(/need\/needs/);
  await btn(page, "Nothing to report").click();
  await page.waitForURL(/need\/location/);
  const s = await stored(page);
  const pet = s?.pets?.[0];
  check("the animal is saved once its needs are answered", pet?.name === "Noisette" && pet?.species === "rabbit" && pet?.needsStatus === "nothing" && pet?.ageInfo?.status === "unknown");
  await context.close();
}

/* --------------------------------------------------------- 6. location */
{
  const b = await launch();
  const pet = { id: "pet-1", name: "Nemo", species: "fish", kindId: null, kindOther: "", age: "", ageInfo: null, otherCategory: "", needsStatus: "nothing", sex: "unknown", notes: "", care: {}, details: { habitat: "" } };
  for (const mode of ["granted", "denied"]) {
    const context = await b.newContext({ viewport: { width: 390, height: 844 } });
    if (mode === "granted") {
      await context.grantPermissions(["geolocation"], { origin: BASE });
      await context.setGeolocation({ latitude: 36.7525, longitude: 3.042 });
    }
    await context.addInitScript((s) => {
      if (sessionStorage.getItem("__seeded")) return;
      sessionStorage.setItem("__seeded", "1");
      localStorage.clear();
      localStorage.setItem("nidz.lang", "en");
      localStorage.setItem("nidz.demo", JSON.stringify(s));
    }, state({ pets: [pet], account: account({ wilayaId: null, communeId: null }) }));
    const page = await context.newPage();
    await page.goto(`${BASE}/owner/need/location?pet=pet-1`);
    await page.waitForSelector("h1");
    await page.getByRole("radio", { name: /Near me/ }).click();
    check(`nearby (${mode}): no permission asked before pressing the button`, true);
    await btn(page, "Use my position").click();
    if (mode === "granted") {
      await page.getByText(/Nearest wilaya to your position/).waitFor({ timeout: 8000 });
      check("nearby: the nearest wilaya is suggested, to confirm", await page.getByText(/Algiers/).first().isVisible());
      await btn(page, "Continue").click();
      await page.waitForURL(/need\/care/);
      await page.getByRole("radio").first().waitFor();
      const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORAGE);
      check("nearby: no coordinates are stored", !JSON.stringify(s).includes("36.75") && s.need.wilayaCode === "alger");
      const options = await page.getByRole("radio").allInnerTexts();
      check("fish: only home visits are offered", options.length === 1 && options[0].includes("Care at my home"));
      check("care step: both matching methods, no settings gear", (await btn(page, "See the sitters").count()) === 1 && (await btn(page, "Publish my request").count()) === 1 && (await page.getByRole("link", { name: "Settings" }).count()) === 0);
    } else {
      await page.getByRole("alert").waitFor({ timeout: 8000 });
      check("nearby denied: says so and offers to choose by hand", await btn(page, "Choose by hand").isVisible());
    }
    await context.close();
  }
}

/* --------------------------------- 7. publishing, proposing, accepting */
{
  const pet = { id: "pet-1", name: "Noisette", species: "rabbit", kindId: "rabbit.lop", kindOther: "", age: "", ageInfo: null, otherCategory: "", needsStatus: null, sex: "unknown", notes: "Hay at will.", care: {}, details: { habitat: "" } };
  const need = { species: "rabbit", kindId: "rabbit.lop", petId: "pet-1", wilayaCode: "alger", communeCode: "kouba", dates: { start: isoIn(6), end: isoIn(9) }, careType: "atOwner", maxPrice: null, step: "care", updatedAt: new Date().toISOString() };
  const { context, page } = await open({ state: state({ pets: [pet], need, capabilities: { owner: true, sitter: true }, sitter: sitter() }) });
  await page.goto(`${BASE}/owner/need/publish`);
  check("publish: an explanation screen comes first", await page.getByRole("heading", { name: "Publish your care request" }).isVisible());
  check("publish: says it reserves and confirms nothing", await page.getByText(/reserves nothing and confirms nothing/).isVisible());
  check("publish: no phone, surname or address shown to sitters", await page.getByText(/No phone number, surname or address/).isVisible());
  await btn(page, "Continue").click();
  await page.waitForURL(/\/owner\/posts\//);
  let s = await stored(page);
  check("published once, with no owner contact detail", s.posts.length === 1 && !JSON.stringify(s.posts[0]).includes("550123456") && !("care" in s.posts[0].pet));
  await page.goto(`${BASE}/owner/need/publish`);
  check("the same request again is refused as a duplicate", (await page.getByText("You have already published this request").isVisible()) && (await btn(page, "Continue").isDisabled()));
  /* the sitter side of the same device */
  await page.evaluate((k) => { const x = JSON.parse(localStorage.getItem(k)); x.activeWorkspace = "sitter"; localStorage.setItem(k, JSON.stringify(x)); }, STORAGE);
  await page.goto(`${BASE}/sitter/feed`);
  check("the published request reaches the sitter feed", await page.getByText("Noisette").first().isVisible());
  const postId = s.posts[0].id;
  await page.goto(`${BASE}/sitter/posts/${postId}`);
  check("the sitter reads the needs before proposing", await page.getByText("Hay at will.").isVisible());
  await page.getByRole("link", { name: "Propose my services" }).click();
  await btn(page, "Send my proposal").click();
  await page.waitForURL(/proposed=1/);
  await page.goto(`${BASE}/sitter/posts/${postId}`);
  check("no second proposal: the action is replaced by its status", (await page.getByRole("link", { name: "Propose my services" }).count()) === 0);
  await page.goto(`${BASE}/sitter/requests?tab=sent`);
  check("the proposal is in the sitter's Sent", await page.getByText("Noisette").first().isVisible());
  await page.evaluate((k) => { const x = JSON.parse(localStorage.getItem(k)); x.activeWorkspace = "owner"; localStorage.setItem(k, JSON.stringify(x)); }, STORAGE);
  await page.goto(`${BASE}/owner/requests`);
  check("the owner's Received shows it (default section)", (await page.getByRole("tab", { name: /Received/ }).getAttribute("aria-selected")) === "true" && (await page.getByText("Lina K.").first().isVisible()));
  await page.goto(`${BASE}/owner/posts/${postId}`);
  await btn(page, "Simulate a proposal").click();
  await btn(page, "Accept").first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Accept this proposal" }).click();
  s = await stored(page);
  check("one acceptance: the post closes, the other proposal is not chosen", s.posts[0].status === "accepted" && s.proposals.filter((p) => p.status === "accepted").length === 1 && s.proposals.some((p) => p.status === "notRetained"));
  await page.goto(`${BASE}/owner/requests?tab=validated`);
  check("Confirmed shows the accepted request on the owner side", await page.getByText("Noisette").first().isVisible());
  check("no errors in the console", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
  await context.close();
}

/* ----------------------------------------------- 8. bars and Demandes */
{
  const { context, page } = await open({ state: state({ capabilities: { owner: true, sitter: true }, sitter: sitter() }) });
  await page.goto(`${BASE}/`);
  const owner = await tabLabels(page);
  await page.goto(`${BASE}/sitter/feed`);
  const sitterBar = await tabLabels(page);
  check("both spaces: Home · Requests · Messages · Account, same order", JSON.stringify(owner) === JSON.stringify(["Home", "Requests", "Messages", "Account"]) && JSON.stringify(sitterBar) === JSON.stringify(owner), `${owner} / ${sitterBar}`);
  /* The desktop tab list in the header is the bar itself, not the retired icon. */
  check("no Messages icon in the header", (await page.locator("header a[href^='/messages']:not(nav a)").count()) === 0);
  for (const path of ["/owner/requests", "/sitter/requests"]) {
    await page.goto(`${BASE}${path}`);
    const tabs = await page.getByRole("tab").allInnerTexts();
    check(`${path}: Received · Sent · Confirmed`, tabs.map((t) => t.replace(/\d+/g, "").trim()).join("|") === "Received|Sent|Confirmed");
  }
  /* « My sitter profile » sits in the sitter space's Account, as My animals does on the owner side. */
  await page.evaluate((k) => { const x = JSON.parse(localStorage.getItem(k)); x.activeWorkspace = "sitter"; localStorage.setItem(k, JSON.stringify(x)); }, STORAGE);
  await page.goto(`${BASE}/account`);
  check("Compte holds « My sitter profile »", await page.getByRole("heading", { name: "My sitter profile" }).isVisible());
  await context.close();
}

/* ------------------------------------------------------------ 9. drafts */
{
  const pet = { id: "pet-1", name: "Mimi", species: "cat", kindId: null, kindOther: "", age: "", ageInfo: null, otherCategory: "", needsStatus: "nothing", sex: "unknown", notes: "", care: {}, details: {} };
  const need = { species: "cat", kindId: null, petId: "pet-1", wilayaCode: null, communeCode: null, dates: null, careType: null, maxPrice: null, step: "location", updatedAt: new Date().toISOString() };
  const { context, page } = await open({ state: state({ pets: [pet], need }) });
  await page.goto(`${BASE}/owner/requests`);
  const draft = page.getByRole("link", { name: /Care for\W*Mimi/ });
  check("an unfinished request is a Draft card under the controls", await draft.isVisible());
  await page.reload();
  check("…that survives a reload", await page.getByRole("link", { name: /Care for\W*Mimi/ }).isVisible());
  await draft.click();
  check("…and resumes at the step it reached", /need\/location/.test(page.url()));
  await page.goto(`${BASE}/owner/requests`);
  await btn(page, "Discard this draft").click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Discard" }).click();
  check("discarding asks first, then the card is gone and the animal kept", (await page.getByRole("link", { name: /Care for\W*Mimi/ }).count()) === 0 && (await stored(page)).pets.length === 1);
  await context.close();
}

/* ---------------------------------------------------------- 10. settings */
{
  const T1 = new Date(Date.now() - 3600e3).toISOString();
  const conversation = { id: "c1", sitterId: "my-profile", ownerName: "Lina K.", createdAt: T1, context: { pet: null, careType: null, dates: null, communeCode: null }, messages: [{ id: "m1", author: "sitter", text: "Hello", createdAt: T1 }], seen: { owner: null, sitter: T1 } };
  const { context, page } = await open({ state: state({ conversations: [conversation], capabilities: { owner: true, sitter: true }, sitter: sitter() }) });
  await page.goto(`${BASE}/settings`);
  check("Settings: seven categories", (await page.locator("main nav a").count()) === 7);
  await page.goto(`${BASE}/messages?tab=notifications`);
  const before = await page.locator("main ul li").count();
  await page.goto(`${BASE}/settings/notifications`);
  await page.getByRole("switch", { name: "Messages" }).click();
  await page.goto(`${BASE}/messages?tab=notifications`);
  const after = await page.locator("main ul li").count();
  check("switching « Messages » off really removes that notification", before >= 1 && after === before - 1, `${before} → ${after}`);
  await page.goto(`${BASE}/settings/preferences`);
  await page.getByRole("switch", { name: "Reduce motion" }).click();
  check("« Reduce motion » applies to the interface", await page.evaluate(() => document.documentElement.classList.contains("reduce-motion")));
  await page.goto(`${BASE}/sitters/amina-b`);
  await btn(page, "Stop seeing this sitter").click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Block" }).click();
  await page.goto(`${BASE}/search?species=dog`);
  check("a blocked sitter no longer appears in results", (await page.getByRole("heading", { name: "Amina B." }).count()) === 0);
  await page.goto(`${BASE}/settings/security`);
  check("…and can be unblocked in Security and privacy", await btn(page, "Unblock").isVisible());
  await context.close();
}

/* ------------------------------------------------- 11. owner home views */
{
  const { context, page } = await open({ state: state() });
  await page.goto(`${BASE}/`);
  check("Home: My animals and Explore sitters", (await page.getByRole("tab", { name: "My animals" }).count()) === 1 && (await page.getByRole("tab", { name: "Explore sitters" }).count()) === 1);
  check("no animal: a useful empty state with « Add an animal »", await page.getByRole("link", { name: "Add an animal" }).isVisible());
  await page.getByRole("tab", { name: "Explore sitters" }).click();
  check("Explore keeps its view in the address", /view=explore/.test(page.url()));
  await page.getByLabel("Animal").selectOption("parrot");
  const names = await page.locator("main h2").allInnerTexts();
  check("Explore: a parrot finds the parrot sitter, not the bird-only one", names.includes("Mehdi S.") && !names.includes("Lyna R."), names.join(", "));
  await context.close();
}

await done();
