/* Audit 1.3.1 — A-01 drafts that outlive the screen, A-02 saves that are
   confirmed or refused out loud, A-19 tabs that do not overwrite each other,
   and the sitter's wilaya / commune.

   Several checks need TWO tabs on one storage, which `open()` in lib.mjs
   cannot give: it reseeds on every new tab. `tabs()` below seeds once per
   CONTEXT — the browser profile both tabs share. */
import { ACCOUNT, BASE, check, clean, done, launch, pickCombobox, publishedSitter, seedState, storedState } from "./lib.mjs";

const text = async (page) => clean(await page.locator("main").innerText());

async function tabs({ state, lang = "en", viewport = { width: 390, height: 844 } } = {}) {
  const browser = await launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(
    ({ lang, state }) => {
      if (localStorage.getItem("__e2e_seeded")) return;
      localStorage.clear();
      localStorage.setItem("__e2e_seeded", "1");
      if (lang) localStorage.setItem("nidz.lang", lang);
      if (state) localStorage.setItem("nidz.demo", JSON.stringify(state));
    },
    { lang, state },
  );
  const newTab = async (path) => {
    const page = await context.newPage();
    page.errors = [];
    page.on("pageerror", (e) => page.errors.push(String(e)));
    await page.goto(`${BASE}${path}`);
    await page.waitForSelector("h1");
    return page;
  };
  return { context, newTab };
}

/* Make this tab's writes of the demo record fail, as a full quota or blocked
   storage does — or let them through again. Drafts are left alone. */
const breakStorage = (page) =>
  page.evaluate(() => {
    const w = window;
    w.__setItem ??= Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "nidz.demo") throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      return w.__setItem.call(this, k, v);
    };
  });
const repairStorage = (page) =>
  page.evaluate(() => {
    if (window.__setItem) Storage.prototype.setItem = window.__setItem;
  });

const sitterDraft = () => {
  const s = publishedSitter({ services: [], rates: {}, acceptedSpecies: [], acceptedDogSizes: [] });
  s.published = false;
  return s;
};
const sitterState = (sitter = sitterDraft()) =>
  seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: true }, sitter });

/* ------------------------------------------------------------ A-01 drafts */
{
  const { context, newTab } = await tabs({ state: sitterState() });
  let page = await newTab("/sitter/profile/about");
  await page.getByLabel("In one sentence").fill("Je garde les chats chez moi.");
  await page.getByLabel(/How many years/).fill("4");
  await page.reload();
  await page.waitForSelector("h1");
  check("sitter form: typed answers survive a reload", (await page.getByLabel("In one sentence").inputValue()) === "Je garde les chats chez moi." && (await page.getByLabel(/How many years/).inputValue()) === "4");
  check("…and the screen says the draft is not saved yet", await page.getByText("It isn't saved yet.", { exact: false }).isVisible());
  const st = await storedState(page);
  check("…while the saved profile is unchanged", st.sitter.profile.headline.en === "I look after dogs at home.");

  /* Closing the app: the tab goes, a new one opens later. */
  await page.close();
  page = await newTab("/sitter/profile/about");
  check("sitter form: survives closing and reopening the app", (await page.getByLabel("In one sentence").inputValue()) === "Je garde les chats chez moi.");

  /* Moving between screens and back. */
  await page.goto(`${BASE}/sitter/profile`);
  await page.waitForSelector("h1");
  await page.goto(`${BASE}/sitter/profile/about`);
  await page.waitForSelector("h1");
  check("sitter form: survives navigating away and back", (await page.getByLabel("In one sentence").inputValue()) === "Je garde les chats chez moi.");

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  const saved = await storedState(page);
  check("saving commits the draft…", saved.sitter.profile.headline.en === "Je garde les chats chez moi." && saved.sitter.profile.experience.years === 4);
  check("…and removes it", await page.evaluate(() => localStorage.getItem("nidz.draft.sitter-about") === null));
  await page.goto(`${BASE}/sitter/profile/about`);
  await page.waitForSelector("h1");
  check("no 'draft' notice once saved", (await page.locator("[data-draft-restored]").count()) === 0);

  /* Discarding a draft goes back to what is saved. */
  await page.getByLabel("In one sentence").fill("Brouillon à jeter");
  await page.reload();
  await page.waitForSelector("h1");
  await page.getByRole("button", { name: "Discard this draft" }).click();
  check("discarding a draft shows the saved answer again", (await page.getByLabel("In one sentence").inputValue()) === "Je garde les chats chez moi.");
  check("no page errors (sitter drafts)", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

{
  /* Owner forms: the animal form and the need flow. */
  const { context, newTab } = await tabs({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  let page = await newTab("/owner/pets/new");
  await page.getByRole("radio", { name: "Cat", exact: true }).click();
  await page.getByLabel("Its name").fill("Mimi");
  await page.close();
  page = await newTab("/owner/pets/new");
  check("owner animal form: survives closing and reopening", (await page.getByLabel("Its name").inputValue()) === "Mimi" && (await page.getByRole("radio", { name: "Cat", exact: true }).getAttribute("aria-checked")) === "true");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/owner\/pets$/);
  const st = await storedState(page);
  const mimi = st.pets.find((p) => p.name === "Mimi");
  check("…and saves once, under one id", st.pets.filter((p) => p.name === "Mimi").length === 1 && mimi?.species === "cat");

  /* Need flow: wilaya chosen, not yet continued. */
  await page.goto(`${BASE}/owner/need/pet`);
  await page.waitForSelector("h1");
  await page.getByRole("radio", { name: "Mimi" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/need\/location/);
  await pickCombobox(page, "Wilaya", "Oran");
  await page.reload();
  await page.waitForSelector("h1");
  check("need flow: chosen wilaya survives a reload", clean(await page.getByRole("combobox", { name: "Wilaya" }).innerText()).includes("Oran"));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/need\/care/);
  await page.getByRole("radio", { name: /Boarding/ }).first().click();
  await page.goBack();
  await page.waitForURL(/\/need\/location/);
  await page.goForward();
  await page.waitForSelector("h1");
  check("need flow: care choice survives Back / Forward", (await page.getByRole("radio", { name: /Boarding/ }).first().getAttribute("aria-checked")) === "true");
  check("no page errors (owner drafts)", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

/* --------------------------------------------------- A-02 failed saves */
{
  const { context, newTab } = await tabs({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  const page = await newTab("/owner/pets/new");
  await page.getByLabel("Its name").fill("Rex");
  await breakStorage(page);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(300);
  const alert = page.locator("[data-save-failure=storage]");
  check("refused write: the form stays", page.url().includes("/owner/pets/new"));
  check("…says nothing was saved", (await alert.isVisible()) && /Couldn't save this information\./.test(clean(await alert.innerText())));
  check("…keeps what was typed", (await page.getByLabel("Its name").inputValue()) === "Rex");
  check("…stores nothing", ((await storedState(page)).pets ?? []).length === 0);
  check("…offers a retry", await page.getByRole("button", { name: "Try again" }).isVisible());
  /* Mobile: the action bar is pinned; the message must be on screen. */
  const box = await alert.boundingBox();
  const bar = await page.locator(".has-pinned-action > div.sticky.bottom-0").boundingBox();
  check("…and is visible above the pinned action bar (390×844)", box && bar && box.y >= 0 && box.y < bar.y, JSON.stringify({ alert: box?.y, bar: bar?.y }));
  check("…with focus on it", await page.evaluate(() => document.activeElement?.hasAttribute("data-save-failure")));
  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForTimeout(300);
  check("retry while storage still refuses: still not saved", page.url().includes("/owner/pets/new") && ((await storedState(page)).pets ?? []).length === 0);
  check("…and the repeated failure is announced again (focus back on the message)", await page.evaluate(() => document.activeElement?.hasAttribute("data-save-failure")));
  await repairStorage(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForURL(/\/owner\/pets$/);
  check("retry once storage works: saved and moved on", (await storedState(page)).pets.some((p) => p.name === "Rex"));
  await context.close();
}

{
  /* Publishing and sending a request: never a success screen for nothing. */
  const sitter = publishedSitter();
  sitter.published = false;
  const { context, newTab } = await tabs({ state: sitterState(sitter) });
  const page = await newTab("/sitter/preview");
  await breakStorage(page);
  await page.getByRole("button", { name: "Publish my profile" }).click();
  await page.waitForTimeout(300);
  check("refused publish: no 'published' screen", page.url().includes("/sitter/preview") && (await storedState(page)).sitter.published === false);
  check("…and the reason is shown", await page.locator("[data-save-failure=storage]").isVisible());
  await repairStorage(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForURL(/\/sitter\/published/);
  check("…retry publishes", (await storedState(page)).sitter.published === true);

  const st = await storedState(page);
  await page.evaluate((s) => localStorage.setItem("nidz.demo", JSON.stringify(s)), { ...st, pets: [{ id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", species: "dog", details: { size: "medium" } }] });
  await page.goto(`${BASE}/owner/request/sitter-local?care=boarding&from=2031-03-01&to=2031-03-03&pet=pet-rex`);
  await page.waitForSelector("h1");
  await breakStorage(page);
  await page.getByRole("button", { name: "Send my request" }).click();
  await page.waitForTimeout(300);
  check("refused request: not reported as sent", !page.url().includes("/sent") && ((await storedState(page)).requests ?? []).length === 0);
  await repairStorage(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForURL(/\/sent/);
  check("…retry sends exactly one", (await storedState(page)).requests.length === 1);
  await context.close();
}

/* ------------------------------------------------------------- A-19 tabs */
{
  const { context, newTab } = await tabs({ state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false } }) });
  const tabA = await newTab("/owner/pets/new");
  const tabB = await newTab("/owner/pets/new");
  await tabA.getByLabel("Its name").fill("Mimi");
  await tabB.getByLabel("Its name").fill("Rex");
  await tabA.getByRole("button", { name: "Save" }).click();
  await tabA.waitForURL(/\/owner\/pets$/);
  await tabB.getByRole("button", { name: "Save" }).click();
  await tabB.waitForURL(/\/owner\/pets$/);
  const names = (await storedState(tabB)).pets.map((p) => p.name).sort();
  check("two tabs adding animals: both are kept", JSON.stringify(names) === JSON.stringify(["Mimi", "Rex"]), names.join(","));
  await tabA.waitForTimeout(300);
  check("the first tab shows the second tab's animal without a reload", (await text(tabA)).includes("Rex"));

  /* The same animal edited in both tabs. */
  const rex = (await storedState(tabA)).pets.find((p) => p.name === "Rex");
  await tabA.goto(`${BASE}/owner/pets/${rex.id}`);
  await tabA.waitForSelector("h1");
  await tabB.goto(`${BASE}/owner/pets/${rex.id}`);
  await tabB.waitForSelector("h1");
  await tabB.getByLabel("Its name").fill("Rexy");
  await tabB.getByRole("button", { name: "Save" }).click();
  await tabB.waitForURL(/\/owner\/pets$/);
  await tabA.getByLabel("Its age").fill("3 years");
  await tabA.getByRole("button", { name: "Save" }).click();
  await tabA.waitForTimeout(300);
  check("same animal edited in two tabs: the second save is a conflict", (await tabA.locator("[data-save-failure=conflict]").isVisible()) && tabA.url().includes(rex.id));
  check("…the other tab's change is still saved", (await storedState(tabA)).pets.find((p) => p.id === rex.id).name === "Rexy");
  await tabA.getByRole("button", { name: "Use the saved version" }).click();
  check("…'use the saved version' shows it", (await tabA.getByLabel("Its name").inputValue()) === "Rexy");
  await tabA.getByLabel("Its age").fill("3 years");
  await tabA.getByRole("button", { name: "Save" }).click();
  await tabA.waitForURL(/\/owner\/pets$/);
  const final = (await storedState(tabA)).pets.find((p) => p.id === rex.id);
  check("…and both edits end up kept", final.name === "Rexy" && final.age === "3 years");
  check("no page errors (two tabs)", tabA.errors.length === 0 && tabB.errors.length === 0, [...tabA.errors, ...tabB.errors].join(" | "));
  await context.close();
}

{
  /* A stale tab doing something unrelated never erases what another saved. */
  const { context, newTab } = await tabs({ state: sitterState(publishedSitter()) });
  const stale = await newTab("/settings");
  const fresh = await newTab("/owner/pets/new");
  await fresh.getByLabel("Its name").fill("Kiwi");
  await fresh.getByRole("radio", { name: "Bird", exact: true }).click();
  await fresh.getByRole("button", { name: "Save" }).click();
  await fresh.waitForURL(/\/owner\/pets$/);
  await stale.getByRole("radio", { name: /Sitter/ }).first().click().catch(() => {});
  await stale.goto(`${BASE}/sitter/profile/limits`);
  await stale.waitForSelector("h1");
  await stale.getByRole("button", { name: "Save" }).click();
  await stale.waitForURL(/\/sitter\/profile$/);
  check("a stale tab saving its own section keeps the other tab's animal", (await storedState(stale)).pets.some((p) => p.name === "Kiwi"));
  await context.close();
}

/* --------------------------------------------- Wilaya and commune (sitter) */
{
  const fresh = sitterDraft();
  fresh.profile.communeCode = "";
  fresh.profile.publicName = "";
  const { context, newTab } = await tabs({ state: sitterState(fresh) });
  const page = await newTab("/sitter/join/location");
  await page.getByRole("button", { name: "Continue" }).click();
  check("no wilaya: registration asks for it", await page.getByText("Choose the wilaya where you offer your services.").isVisible());

  /* Every wilaya offers its communes — a sample from each era of the map. */
  for (const [wilaya, commune] of [["Adrar", "Reggane"], ["Tindouf", "Tindouf"], ["Aflou", "Sebgag"], ["Bou Saâda", "El Hamel"], ["Djanet", "Djanet"], ["Relizane", "Mazouna"]]) {
    await pickCombobox(page, "Wilaya", wilaya);
    await page.getByRole("combobox", { name: /Commune/ }).click();
    const has = await page.getByRole("option", { name: commune, exact: true }).count();
    await page.keyboard.press("Escape");
    check(`${wilaya}: communes are listed (${commune})`, has === 1);
  }
  check("the commune field is labelled optional", (await page.getByText("Commune (optional)").count()) > 0);

  /* A wilaya alone is enough to continue. */
  await pickCombobox(page, "Wilaya", "Aflou");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  let st = await storedState(page);
  check("wilaya only: registration continues", st.sitter.profile.wilayaCode === "aflou" && st.sitter.profile.communeCode === "");
  const identityDone = await page
    .getByRole("link", { name: /Your public name and area — answered/ })
    .first()
    .waitFor({ timeout: 5000 })
    .then(() => true, () => false);
  check("…and the identity section counts as done", identityDone);

  /* A commune can still be given, and must belong to the wilaya. */
  await page.goto(`${BASE}/sitter/join/location`);
  await page.waitForSelector("h1");
  check("saved wilaya is shown again", clean(await page.getByRole("combobox", { name: "Wilaya" }).innerText()).includes("Aflou"));
  await pickCombobox(page, "Commune (optional)", "Sebgag");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/sitter\/profile$/);
  st = await storedState(page);
  check("wilaya + commune: both saved", st.sitter.profile.wilayaCode === "aflou" && st.sitter.profile.communeCode === "sebgag");
  check("no page errors (location)", page.errors.length === 0, page.errors.join(" | "));
  await context.close();
}

{
  /* A published wilaya-only sitter is found by a wilaya search and shown with
     the wilaya, never a commune it did not state. French labels too. */
  const s = publishedSitter({ communeCode: "", wilayaCode: "aflou" });
  const { context, newTab } = await tabs({ state: sitterState(s), lang: "fr" });
  const page = await newTab("/search?wilaya=aflou");
  const t = await text(page);
  check("wilaya search finds the wilaya-only sitter", t.includes("Lina K."));
  check("…shown as the wilaya, never as a commune", /Lina K\.[\s\S]{0,80}Aflou \(wilaya\)/.test(t));
  await page.goto(`${BASE}/sitter/join/location`);
  await page.waitForSelector("h1");
  check("FR: 'Commune (facultatif)' and 'Ne pas préciser de commune'", (await page.getByText("Commune (facultatif)").count()) > 0 && clean(await page.getByRole("combobox", { name: /Commune/ }).innerText()).includes("Ne pas préciser de commune"));
  await context.close();
}

{
  /* Arabic (RTL), desktop width: the same rule, the same copy keys. */
  const fresh = sitterDraft();
  fresh.profile.communeCode = "";
  const { context, newTab } = await tabs({ state: sitterState(fresh), lang: "ar", viewport: { width: 1280, height: 900 } });
  const page = await newTab("/sitter/join/location");
  check("AR: page is RTL", (await page.evaluate(() => document.documentElement.dir)) === "rtl");
  await page.getByRole("button", { name: "متابعة" }).click();
  check("AR: wilaya required message", await page.getByText("اختر الولاية التي تقدّم فيها خدماتك.").isVisible());
  check("AR: commune labelled optional", (await page.getByText("البلدية (اختياري)").count()) > 0);
  await context.close();
}

{
  /* Owner need flow: wilaya only continues, as before, in every wilaya. */
  const { context, newTab } = await tabs({
    state: seedState({ account: ACCOUNT, capabilities: { owner: true, sitter: false }, pets: [{ id: "pet-rex", name: "Rex", age: "", sex: "unknown", notes: "", species: "dog", details: { size: "medium" } }], need: { species: "dog", petId: "pet-rex", dogSize: "medium", wilayaCode: null, communeCode: null, dates: null, careType: null, maxPrice: null } }),
  });
  const page = await newTab("/owner/need/location");
  await pickCombobox(page, "Wilaya", "El Abiodh Sidi Cheikh");
  await page.getByRole("combobox", { name: /Commune/ }).click();
  check("owner: a 2026 wilaya lists its communes", (await page.getByRole("option", { name: "Boussemghoun", exact: true }).count()) === 1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/need\/care/);
  check("owner: wilaya without commune continues", (await storedState(page)).need.wilayaCode === "el-abiodh-sidi-cheikh");
  await context.close();
}

await done();
