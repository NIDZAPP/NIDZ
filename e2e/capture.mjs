/* ---------------------------------------------------------------------------
   Screen captures for design review — not a test.

   Opens the real app with seeded local state and saves one image per screen,
   on a phone and on a desktop, so a redesign can be looked at as a whole and
   compared against an earlier run. `run-all.mjs` skips this file (it only
   runs `lot*.mjs`).

     npx vite --host 127.0.0.1 --port 8080
     node e2e/capture.mjs <out-dir> [lang] [filter]

   `filter` keeps only the screens whose name contains it.
   ------------------------------------------------------------------------ */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ACCOUNT, BASE, isoIn, launch, publishedSitter, seedState } from "./lib.mjs";

const out = process.argv[2] ?? "captures";
const lang = process.argv[3] ?? "fr";
const filter = process.argv[4] ?? "";
mkdirSync(out, { recursive: true });

const rex = {
  id: "pet-rex",
  name: "Rex",
  age: "3 ans",
  sex: "male",
  notes: "",
  species: "dog",
  details: {
    size: "medium",
    neutered: "yes",
    goodWithDogs: "yes",
    goodWithCats: "unknown",
    goodWithChildren: "yes",
    walksPerDay: 2,
    leashNotes: "",
  },
  care: { feeding: "", medication: "", vet: "", emergencyContact: "" },
};
const request = {
  id: "req-1",
  createdAt: "2026-11-20T10:00:00.000Z",
  sitterId: "sitter-local",
  pet: { ...rex, care: undefined },
  careType: "boarding",
  dates: { start: isoIn(5), end: isoIn(7) },
  communeCode: "hydra",
  ownerName: "Lina K.",
  displayedRate: { amount: 900, careType: "boarding" },
  status: "pending",
  respondedAt: null,
};
delete request.pet.care;

const owner = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: false },
  activeWorkspace: "owner",
  pets: [rex],
  need: { species: "dog", dogSize: "medium", petId: "pet-rex", wilayaCode: "alger", communeCode: null, careType: "boarding", dates: null, maxPrice: null },
});
const both = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: true },
  activeWorkspace: "owner",
  pets: [rex],
  sitter: publishedSitter(),
  requests: [request],
});
const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
const petCopy = { ...rex };
delete petCopy.care;
const context = { pet: petCopy, careType: "boarding", dates: { start: isoIn(12), end: isoIn(15) }, communeCode: "hydra" };
both.conversations = [
  {
    id: "conv-1",
    sitterId: "sitter-local",
    ownerName: "Lina K.",
    createdAt: ago(180),
    context,
    messages: [
      { id: "m1", author: "owner", text: "Bonjour ! Rex n'a jamais dormi ailleurs. Est-ce qu'on peut se voir avant ?", createdAt: ago(170) },
      { id: "m2", author: "sitter", text: "Bonjour Lina, avec plaisir. Je peux vous recevoir samedi matin avec Rex.", createdAt: ago(40) },
    ],
    seen: { owner: ago(100), sitter: ago(35) },
  },
  {
    id: "conv-2",
    sitterId: "amina-b",
    ownerName: "Lina K.",
    createdAt: ago(60 * 26),
    context: { ...context, careType: "walk", dates: null },
    messages: [{ id: "m3", author: "owner", text: "Faites-vous des promenades le soir ?", createdAt: ago(60 * 26) }],
    seen: { owner: ago(60 * 26), sitter: null },
  },
];
const sitter = { ...both, activeWorkspace: "sitter" };

const screens = [
  ["welcome", "/welcome", null],
  ["home", "/", seedState()],
  ["home-owner", "/", owner],
  ["need-pet", "/owner/need/pet", seedState()],
  ["need-location", "/owner/need/location", owner],
  ["need-care", "/owner/need/care", owner],
  ["search", "/search?species=dog", owner],
  ["profile", "/sitters/amina-b", owner],
  ["request-when", "/owner/request/amina-b/when", owner],
  ["request-review", `/owner/request/amina-b?care=boarding&from=${isoIn(5)}&to=${isoIn(7)}&pet=pet-rex`, owner],
  ["owner-requests", "/owner/requests", both],
  ["owner-request", "/owner/requests/req-1", both],
  ["pets", "/owner/pets", owner],
  ["pet-new", "/owner/pets/new", owner],
  ["pet-edit", "/owner/pets/pet-rex", owner],
  ["auth", "/auth", seedState()],
  ["owner-account", "/owner/account", seedState()],
  ["settings", "/settings", both],
  ["sitter-start", "/sitter/start", seedState()],
  ["sitter-name", "/sitter/join/name", seedState()],
  ["sitter-requests", "/sitter/requests", sitter],
  ["sitter-profile", "/sitter/profile", sitter],
  ["sitter-animals", "/sitter/profile/animals", sitter],
  ["sitter-services", "/sitter/profile/services", sitter],
  ["sitter-housing", "/sitter/profile/housing", sitter],
  ["help", "/help", owner],
  ["messages", "/messages", both],
  ["thread-owner", "/messages/conv-1", both],
  ["thread-example", "/messages/conv-2", both],
  ["thread-sitter", "/messages/conv-1", sitter],
  ["messages-sitter", "/messages", sitter],
  ["notfound", "/nowhere", owner],
].filter(([name]) => name.includes(filter));

const viewports = [
  ["m", { width: 390, height: 844 }],
  ["d", { width: 1440, height: 900 }],
];

const browser = await launch();
for (const [vp, viewport] of viewports) {
  for (const [name, path, state] of screens) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addInitScript(
      ({ lang, state }) => {
        if (sessionStorage.getItem("__seeded")) return;
        sessionStorage.setItem("__seeded", "1");
        localStorage.clear();
        localStorage.setItem("nidz.lang", lang);
        if (state) localStorage.setItem("nidz.demo", JSON.stringify(state));
      },
      { lang, state },
    );
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}${path}`);
      await page.waitForSelector("h1", { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(out, `${vp}-${name}.jpg`), type: "jpeg", quality: 72, fullPage: process.env.FULL === "1" });
      process.stdout.write(`${vp}-${name} `);
    } catch (e) {
      console.log(`\nFAILED ${vp}-${name}: ${e.message}`);
    }
    await context.close();
  }
}
await browser.close();
console.log("\ndone");
