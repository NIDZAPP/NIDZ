/* ---------------------------------------------------------------------------
   Browser checks for Nidz — a deliberately small harness.

   There is no test framework in this repository (see CLAUDE.md). These
   scripts drive the real app in Chromium through Playwright and print one
   PASS / FAIL line per check, so a run can be read and quoted as-is. They are
   regression guards for the journeys Audit 1.3 names, not a coverage suite.

   Run against a server you started yourself:
     npx vite --host 127.0.0.1 --port 8080      (or: npm run preview)
     node e2e/run-all.mjs        (or one lot: node e2e/lot01-request-context.mjs)
   NIDZ_URL overrides the address.
   ------------------------------------------------------------------------ */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/* Resolved with `require` so a globally installed Playwright (the one this
   environment ships with a matching browser) is found as well as a local
   one. */
const { chromium } = require("playwright");

export const BASE = process.env.NIDZ_URL ?? "http://127.0.0.1:8080";

/** A date `days` from today, ISO `YYYY-MM-DD`, in local time. */
export function isoIn(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The smallest stored state that skips the introduction. */
export function seedState(extra = {}) {
  return { version: 3, entered: true, ...extra };
}

export const ACCOUNT = {
  firstName: "Lina",
  lastName: "Kaci",
  dateOfBirth: "1990-04-02",
  wilayaId: "alger",
  communeId: null,
  ownedSpecies: ["dog"],
  phoneNumber: "",
  accountComplete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

let browser;
const results = [];

export async function launch() {
  browser ??= await chromium.launch();
  return browser;
}

/**
 * A fresh context. `state` (an object) is written to localStorage once, before
 * the app's first script runs — and only once, so a reload inside the test
 * reads what the app itself saved rather than the seed again.
 */
export async function open({ viewport = { width: 390, height: 844 }, lang = "en", state = null, reducedMotion } = {}) {
  const b = await launch();
  const context = await b.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  await context.addInitScript(
    ({ lang, state }) => {
      if (sessionStorage.getItem("__seeded")) return;
      sessionStorage.setItem("__seeded", "1");
      localStorage.clear();
      if (lang) localStorage.setItem("nidz.lang", lang);
      if (state) localStorage.setItem("nidz.demo", JSON.stringify(state));
    },
    { lang, state },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.errors = errors;
  return { context, page };
}

export function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/** Pick an option in a Nidz `Combobox` by its visible label. */
export async function pickCombobox(page, labelText, optionText) {
  await page.getByRole("combobox", { name: labelText }).click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
}

export async function storedState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("nidz.demo") ?? "null"));
}

export async function done() {
  await browser?.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}

/** Interpolated names carry Unicode bidi isolates (U+2066–2069) so that a
    Latin name renders correctly inside Arabic. They are invisible but part of
    the text, so text assertions strip them and name lookups tolerate them. */
export const clean = (s) => String(s).replace(/[⁦-⁩]/g, "");
export function loose(text) {
  const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp([...text].map(esc).join("[\\u2066-\\u2069]*"));
}

/** A published local sitter profile — the smallest record the app restores. */
export function publishedSitter(extra = {}) {
  const text = (s) => ({ en: s, fr: s, ar: s });
  return {
    profile: {
      id: "sitter-local",
      publicName: "Lina K.",
      communeCode: "hydra",
      headline: text("I look after dogs at home."),
      about: text(""),
      services: ["boarding"],
      rates: { boarding: 900 },
      acceptedSpecies: ["dog"],
      acceptedDogSizes: ["small", "medium", "large"],
      maxAnimals: 1,
      limits: [],
      declaredUnavailable: [],
      housing: { type: "house", outdoor: "yard", residentPets: [], canSeparateAnimals: "unknown", conditions: null },
      isDemoFixture: false,
      ...extra,
    },
    published: true,
    idDocument: null,
  };
}
