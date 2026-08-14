/**
 * The locale gate: `npm run check:locales`.
 *
 * Nidz ships in three languages and the compiler cannot see inside a JSON
 * file, so nothing else in the toolchain catches a missing string — it shows
 * up in the browser as a raw key like `sitterSections.answered` where a
 * sentence should be, and only in the one language nobody happened to open.
 * Both bugs this script exists to catch were found that way rather than by
 * `tsc` or ESLint.
 *
 * Three checks:
 *
 *  1. PARITY — every key in one locale exists in the other two.
 *  2. PLURALS — a key with plural forms defines every category the locale's
 *     own Intl.PluralRules can produce. i18next does NOT fall back from a
 *     missing `_one` to `_other`; it renders the key.
 *  3. USAGE — every literal `t("…")` in `src/` resolves.
 *
 * Keys built from a template literal (`t(`profession.${kind}`)`) are invisible
 * to check 3. Adding one means adding its whole family by hand.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["en", "fr", "ar"];
/** Every CLDR plural category, for splitting `key_one` into `key` + `one`. */
const SUFFIX = /_(zero|one|two|few|many|other)$/;

const load = (l) => JSON.parse(readFileSync(`src/locales/${l}.json`, "utf8"));

const flatten = (obj, prefix = "", out = new Set()) => {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
    else out.add(path);
  }
  return out;
};

const keys = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))]));
/* Compare the base key: a locale legitimately has more plural forms than
   another (Arabic has six, English two), and that is not a parity failure. */
const bases = Object.fromEntries(
  LOCALES.map((l) => [l, new Set([...keys[l]].map((k) => k.replace(SUFFIX, "")))]),
);

let failures = 0;
const report = (lines) => {
  failures += lines.length;
  for (const line of lines) console.log(line);
};

/* 1. parity, in both directions against English. */
for (const other of ["fr", "ar"]) {
  for (const [from, to] of [["en", other], [other, "en"]]) {
    const missing = [...bases[from]].filter((k) => !bases[to].has(k));
    if (missing.length) {
      console.log(`\n${missing.length} key(s) in ${from} missing from ${to}:`);
      report(missing.slice(0, 40).map((k) => `   ${k}`));
    }
  }
}

/* 2. plural completeness, per locale. */
for (const locale of LOCALES) {
  const required = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  const families = new Map();
  for (const key of keys[locale]) {
    const match = key.match(SUFFIX);
    if (!match) continue;
    const base = key.replace(SUFFIX, "");
    if (!families.has(base)) families.set(base, new Set());
    families.get(base).add(match[1]);
  }
  for (const [base, have] of families) {
    const gaps = required.filter((c) => !have.has(c));
    if (gaps.length) {
      console.log(`\n${locale}: ${base} is missing plural form(s): ${gaps.join(", ")}`);
      failures += gaps.length;
    }
  }
}

/* 3. every literal key used in the app resolves. */
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
};
walk("src");

const used = new Map();
for (const file of files) {
  for (const m of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g)) {
    if (!used.has(m[1])) used.set(m[1], file);
  }
}
const unresolved = [...used].filter(([k]) => !bases.en.has(k));
if (unresolved.length) {
  console.log(`\n${unresolved.length} literal t() key(s) with no entry in en:`);
  report(unresolved.map(([k, f]) => `   ${k} ← ${f}`));
}

console.log(failures === 0 ? "\nlocales OK" : `\nlocale check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
