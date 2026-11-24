/* ---------------------------------------------------------------------------
   Layout audit — overflow, overlap and truncation, every screen, every width,
   every language (Nidz 1.4 corrections, "Responsive").

   Not a lot: `run-all.mjs` skips it, because a full sweep is several hundred
   page loads. Run it after any change to layout or copy:

     npx vite --host 127.0.0.1 --port 8080
     node e2e/audit-layout.mjs [filter] [--langs=fr,en,ar] [--widths=320,390]

   For each screen × width × language it reports, in the page as rendered:

     overflow   the document scrolls sideways, and the elements responsible
     spill      text that runs out of its own box (a word wider than its
                column, a price pushed past the card edge)
     overlap    two pieces of text — or text and an icon — drawn on top of
                each other, within one layer (a sticky bar passing over the
                page is a layer of its own and is not a collision)
     truncated  text cut by an ellipsis or a line clamp; listed separately,
                because a clamp can be a deliberate teaser

   Rectangles are measured from the TEXT itself (Range.getClientRects), not
   from the boxes around it: "Promenade" running into "600 DA" is invisible to
   box geometry, because both boxes were the right size — the word was not.
   Each rectangle is clipped by every overflow-hiding ancestor first, so a
   closed accordion's content is not reported as overlapping anything.

   Exit code is non-zero when anything other than `truncated` is found.
   ------------------------------------------------------------------------ */
import { ACCOUNT, BASE, isoIn, launch, publishedSitter, seedState } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3).split(",") : fallback;
};
const filter = args.find((a) => !a.startsWith("--")) ?? "";
const LANGS = opt("langs", ["fr", "en", "ar"]);
const WIDTHS = opt("widths", ["320", "360", "414", "768", "1024", "1280", "1440"]).map(Number);
const CONCURRENCY = 4;

/* ------------------------------------------------------------- the states */
const rex = {
  id: "pet-rex",
  name: "Rex",
  age: "3 ans",
  sex: "male",
  notes: "",
  species: "dog",
  details: { size: "medium", neutered: "yes", goodWithDogs: "yes", goodWithCats: "unknown", goodWithChildren: "yes", walksPerDay: 2, leashNotes: "" },
  care: { feeding: "", medication: "", vet: "", emergencyContact: "" },
};
const petCopy = { ...rex };
delete petCopy.care;
const request = {
  id: "req-1",
  createdAt: "2026-11-20T10:00:00.000Z",
  sitterId: "sitter-local",
  pet: petCopy,
  careType: "boarding",
  dates: { start: isoIn(5), end: isoIn(7) },
  communeCode: "hydra",
  ownerName: "Lina K.",
  displayedRate: { amount: 900, careType: "boarding" },
  status: "pending",
  respondedAt: null,
};
/* A sitter with every service, big prices and several limits: the worst case
   the glance and the folds have to hold. */
const text = (s) => ({ en: s, fr: s, ar: s });
const richSitter = publishedSitter({
  services: ["boarding", "atOwner", "walk"],
  rates: { boarding: 12500, atOwner: 11200, walk: 600 },
  acceptedSpecies: ["dog", "cat", "bird"],
  acceptedDogSizes: ["small", "medium"],
  maxAnimals: 3,
  limits: [text("Pas de mâles non castrés."), text("Pas d'animaux réactifs avec les enfants.")],
  about: text("J'ai grandi avec des animaux et je garde ceux de mes voisins depuis des années, dans un appartement calme."),
});
const owner = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: false },
  activeWorkspace: "owner",
  pets: [rex],
  need: { species: "dog", dogSize: "medium", petId: "pet-rex", wilayaCode: "alger", communeCode: null, careType: "boarding", dates: null, maxPrice: null },
});
const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
const both = seedState({
  account: ACCOUNT,
  capabilities: { owner: true, sitter: true },
  activeWorkspace: "owner",
  pets: [rex],
  sitter: richSitter,
  requests: [request],
  conversations: [
    {
      id: "conv-1",
      sitterId: "sitter-local",
      ownerName: "Lina K.",
      createdAt: ago(180),
      context: { pet: petCopy, careType: "boarding", dates: { start: isoIn(12), end: isoIn(15) }, communeCode: "hydra" },
      messages: [
        { id: "m1", author: "owner", text: "Bonjour ! Rex n'a jamais dormi ailleurs. Est-ce qu'on peut se voir avant ?", createdAt: ago(170) },
        { id: "m2", author: "sitter", text: "Bonjour Lina, avec plaisir. Je peux vous recevoir samedi matin.", createdAt: ago(40) },
      ],
      seen: { owner: ago(100), sitter: ago(35) },
    },
  ],
});
const sitter = { ...both, activeWorkspace: "sitter" };
const fresh = seedState();
const req = `care=boarding&from=${isoIn(5)}&to=${isoIn(7)}&pet=pet-rex`;

/* name, path, state, open every fold after load */
const SCREENS = [
  ["welcome", "/welcome", null],
  ["home", "/", fresh],
  ["home-owner", "/", owner],
  ["need-pet", "/owner/need/pet", fresh],
  ["need-location", "/owner/need/location", owner],
  ["need-care", "/owner/need/care", owner],
  ["search", "/search?species=dog&size=medium&care=boarding&wilaya=alger", owner],
  ["search-empty", "/search", fresh],
  ["profile", "/sitters/amina-b?species=dog&size=medium&care=boarding&wilaya=alger", owner],
  ["profile-open", "/sitters/amina-b", owner, true],
  ["profile-karim", "/sitters/karim-t", owner, true],
  ["profile-own", "/sitters/sitter-local", both, true],
  ["request-when", "/owner/request/amina-b/when", owner],
  ["request-review", `/owner/request/amina-b?${req}`, owner],
  ["request-sent", `/owner/request/amina-b/sent?${req}`, both],
  ["owner-requests", "/owner/requests", both],
  ["owner-request", "/owner/requests/req-1", both],
  ["pets", "/owner/pets", owner],
  ["pet-new", "/owner/pets/new", owner],
  ["pet-edit", "/owner/pets/pet-rex", owner],
  ["auth", "/auth", fresh],
  ["owner-account", "/owner/account", fresh],
  ["account", "/account", both],
  ["account-sitter", "/account", sitter],
  ["account-guest", "/account", fresh],
  ["settings", "/settings", both],
  ["settings-sitter", "/settings", sitter],
  ["help", "/help", owner],
  ["policies", "/policies", owner],
  ["sitter-start", "/sitter/start", fresh],
  ["sitter-name", "/sitter/join/name", fresh],
  ["sitter-phone", "/sitter/join/phone", fresh],
  ["sitter-location", "/sitter/join/location", fresh],
  ["sitter-requests", "/sitter/requests", sitter],
  ["sitter-profile", "/sitter/profile", sitter],
  ["sitter-about", "/sitter/profile/about", sitter],
  ["sitter-experience", "/sitter/profile/experience", sitter],
  ["sitter-professional", "/sitter/profile/professional", sitter],
  ["sitter-services", "/sitter/profile/services", sitter],
  ["sitter-animals", "/sitter/profile/animals", sitter],
  ["sitter-housing", "/sitter/profile/housing", sitter],
  ["sitter-care", "/sitter/profile/care", sitter],
  ["sitter-limits", "/sitter/profile/limits", sitter],
  ["sitter-availability", "/sitter/profile/availability", sitter],
  ["sitter-trust", "/sitter/trust", sitter],
  ["sitter-preview", "/sitter/preview", sitter, true],
  ["sitter-published", "/sitter/published", sitter],
  ["messages", "/messages", both],
  ["messages-notifications", "/messages?tab=notifications", both],
  ["thread", "/messages/conv-1", both],
  ["thread-new", "/messages/to/amina-b", both],
  ["notfound", "/nowhere", owner],
  ["not-available", "/admin", owner],
].filter(([name]) => name.includes(filter));

/* ------------------------------------------------------- the measurement */
function measure() {
  const vw = document.documentElement.clientWidth;
  const out = { overflow: [], spill: [], overlap: [], truncated: [] };
  const describe = (el) => {
    const t = (el.innerText || el.textContent || el.getAttribute?.("aria-label") || "").trim().replace(/\s+/g, " ");
    const tag = el.tagName.toLowerCase();
    return `${tag}${el.id ? `#${el.id}` : ""} "${t.slice(0, 60)}"`;
  };
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
      if (e.getAttribute("aria-hidden") === "true" && e.closest("[data-radix-popper-content-wrapper]")) return false;
    }
    return true;
  };
  /* The layer an element is drawn in: the nearest fixed or sticky ancestor. */
  const layerOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === "fixed" || p === "sticky") return e;
    }
    return null;
  };
  /* Intersect a rect with every element from `from` upward that clips — for
     a text run that includes its own element: a `truncate` span clips its
     own text, and the hidden part is not drawn anywhere. */
  const clip = (rect, from) => {
    let { left, top, right, bottom } = rect;
    for (let e = from; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      const cx = s.overflowX !== "visible" || s.clipPath !== "none";
      const cy = s.overflowY !== "visible" || s.clipPath !== "none";
      if (!cx && !cy) continue;
      const r = e.getBoundingClientRect();
      if (cx) {
        left = Math.max(left, r.left);
        right = Math.min(right, r.right);
      }
      if (cy) {
        top = Math.max(top, r.top);
        bottom = Math.min(bottom, r.bottom);
      }
    }
    return { left, top, right, bottom };
  };
  const area = (r) => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);

  /* 1. Sideways scrolling. */
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) {
    const culprits = [];
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const c = clip(r, el.parentElement);
        if (c.right > vw + 1 || c.left < -1) {
          /* Only the outermost offender, not every child of it. */
          if (!culprits.some((p) => p.contains(el))) culprits.push(el);
        }
      }
    }
    out.overflow.push(`scrollWidth ${sw} > ${vw}: ${culprits.slice(0, 4).map(describe).join(" | ")}`);
  }

  /* 2. Collect text runs and icons. */
  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.data.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest("script,style,noscript,.sr-only,[hidden]")) continue;
    if (!visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      const c = clip(r, el);
      if (c.right - c.left < 2 || c.bottom - c.top < 2) continue;
      runs.push({ el, rect: c, raw: r, kind: "text", layer: layerOf(el), label: n.data.trim().slice(0, 40) });
    }
  }
  for (const svg of document.body.querySelectorAll("svg")) {
    if (!visible(svg)) continue;
    const r = svg.getBoundingClientRect();
    if (r.width < 4) continue;
    const c = clip(r, svg.parentElement);
    if (c.right - c.left < 2 || c.bottom - c.top < 2) continue;
    runs.push({ el: svg, rect: c, raw: r, kind: "icon", layer: layerOf(svg), label: "[icon]" });
  }

  /* 3. Spill: text drawn outside the box of the block that holds it. */
  for (const run of runs) {
    if (run.kind !== "text") continue;
    let box = run.el;
    while (box && getComputedStyle(box).display === "inline") box = box.parentElement;
    if (!box) continue;
    const b = box.getBoundingClientRect();
    /* The DRAWN text: what a clipping ancestor hides is not spilling. */
    const r = run.rect;
    if (r.right > b.right + 1.5 || r.left < b.left - 1.5) {
      out.spill.push(`"${run.label}" spills ${Math.round(Math.max(r.right - b.right, b.left - r.left))}px out of ${describe(box)}`);
    }
  }

  /* 4. Overlap between unrelated runs of the same layer. */
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i];
      const b = runs[j];
      if (a.kind === "icon" && b.kind === "icon") continue;
      if (a.el === b.el || a.layer !== b.layer) continue;
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const inter = {
        left: Math.max(a.rect.left, b.rect.left),
        right: Math.min(a.rect.right, b.rect.right),
        top: Math.max(a.rect.top, b.rect.top),
        bottom: Math.min(a.rect.bottom, b.rect.bottom),
      };
      const w = inter.right - inter.left;
      const h = inter.bottom - inter.top;
      /* Line boxes of stacked lines overlap by a few pixels wherever the
         line height is tighter than the font's box; a collision covers a
         real share of the smaller run's height. */
      const shorter = Math.min(a.rect.bottom - a.rect.top, b.rect.bottom - b.rect.top);
      if (w > 2 && h > Math.max(4, shorter * 0.4) && area(inter) > 12) {
        out.overlap.push(`"${a.label}" × "${b.label}" (${Math.round(w)}×${Math.round(h)}px)`);
      }
    }
  }

  /* 5. Truncation: an ellipsis or a clamp that is actually cutting. */
  for (const el of document.body.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    const clamp = s.webkitLineClamp && s.webkitLineClamp !== "none";
    const ellipsis = s.textOverflow === "ellipsis";
    if (!clamp && !ellipsis) continue;
    if (!visible(el) || el.closest(".sr-only")) continue;
    if (ellipsis && el.scrollWidth > el.clientWidth + 1) out.truncated.push(`ellipsis: ${describe(el)}`);
    else if (clamp && el.scrollHeight > el.clientHeight + 1) out.truncated.push(`clamp ${s.webkitLineClamp}: ${describe(el)}`);
  }

  for (const k of Object.keys(out)) out[k] = [...new Set(out[k])];
  return out;
}

/* ------------------------------------------------------------------ run */
const browser = await launch();
const jobs = [];
for (const lang of LANGS) for (const width of WIDTHS) for (const screen of SCREENS) jobs.push({ lang, width, screen });

const findings = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { lang, width, screen } = jobs[next++];
    const [name, path, state, openFolds] = screen;
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
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
      await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      if (openFolds) {
        for (const b of await page.locator('button[aria-expanded="false"][data-state="closed"]').all()) {
          if (await b.isVisible()) await b.click().catch(() => {});
        }
      }
      await page.waitForTimeout(150);
      const out = await page.evaluate(measure);
      for (const [kind, list] of Object.entries(out)) {
        for (const item of list) findings.push({ kind, lang, width, name, item });
      }
    } catch (e) {
      findings.push({ kind: "error", lang, width, name, item: e.message.split("\n")[0] });
    }
    await context.close();
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();

/* Group identical findings across widths and languages, so one bug is one
   line with the places it shows up. */
const grouped = new Map();
for (const f of findings) {
  const key = `${f.kind} | ${f.name} | ${f.item.replace(/\(\d+×\d+px\)|\d+px/g, "")}`;
  const g = grouped.get(key) ?? { ...f, where: new Set() };
  g.where.add(`${f.lang}@${f.width}`);
  grouped.set(key, g);
}
const order = ["error", "overflow", "overlap", "spill", "truncated"];
const rows = [...grouped.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.name.localeCompare(b.name));
for (const g of rows) console.log(`${g.kind.toUpperCase().padEnd(9)} ${g.name.padEnd(20)} ${g.item}\n          at ${[...g.where].join(" ")}`);
const blocking = rows.filter((g) => g.kind !== "truncated").length;
console.log(`\n${jobs.length} renders · ${blocking} layout problem(s) · ${rows.length - blocking} truncation(s)`);
process.exitCode = blocking ? 1 : 0;
