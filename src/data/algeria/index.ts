/* ---------------------------------------------------------------------------
   ALGERIAN GEOGRAPHY — lookup, scoping and search.

   The data lives in `wilayas.ts` and `communes.ts`; its provenance and its
   documented gaps live in `metadata.ts`. This module is the only thing the
   application talks to, so replacing or completing the dataset never touches a
   screen.

   Everything here is derived once at module load. 69 wilayas and 1 541 communes
   is small enough that the indexes cost nothing and large enough that a linear
   `.find()` per keystroke in a combobox would not be free.
   ------------------------------------------------------------------------ */

import type { AppLocale } from "@/i18n";
import type { Localized } from "@/data/types";

import { COMMUNES, type Commune } from "./communes";
import { WILAYAS, type Wilaya } from "./wilayas";

export type { Commune, Wilaya };
export { COMMUNES, WILAYAS };
export { GEOGRAPHY_METADATA, KNOWN_GAPS } from "./metadata";

/* ------------------------------------------------------------------ indexes */

const WILAYA_BY_ID = new Map(WILAYAS.map((w) => [w.id, w]));
const COMMUNE_BY_ID = new Map(COMMUNES.map((c) => [c.id, c]));

/** Communes grouped by wilaya, in source order. Built once rather than
    filtered on every render of a scoped commune list. */
const COMMUNES_BY_WILAYA = COMMUNES.reduce<Map<string, Commune[]>>((acc, commune) => {
  const list = acc.get(commune.wilayaId);
  if (list) list.push(commune);
  else acc.set(commune.wilayaId, [commune]);
  return acc;
}, new Map());

/**
 * Codes used by Audit 1.1, when commune names lived in the locale files and
 * Oran's own commune was called "oran-centre".
 *
 * A bookmarked `/search?commune=oran-centre` — or a request saved in a
 * returning visitor's browser — would otherwise resolve to nothing and be
 * silently treated as "anywhere". Small map, kept because the alternative is
 * losing someone's saved brief without telling them.
 */
const LEGACY_COMMUNE_IDS: Record<string, string> = {
  elBiar: "el-biar",
  babEzzouar: "bab-ezzouar",
  "oran-centre": "oran",
};

/* ------------------------------------------------------------------- lookup */

export function getWilaya(id: string | null | undefined): Wilaya | null {
  return id ? (WILAYA_BY_ID.get(id) ?? null) : null;
}

export function getCommune(id: string | null | undefined): Commune | null {
  return id ? (COMMUNE_BY_ID.get(id) ?? null) : null;
}

export function getWilayaOfCommune(id: string | null | undefined): Wilaya | null {
  const commune = getCommune(id);
  return commune ? getWilaya(commune.wilayaId) : null;
}

/** The communes Nidz carries for this wilaya. Empty is a real answer — see
    `hasCommuneCoverage`, which is how a screen tells "none listed" apart from
    "none exist". */
export function communesOf(wilayaId: string | null | undefined): readonly Commune[] {
  return wilayaId ? (COMMUNES_BY_WILAYA.get(wilayaId) ?? []) : [];
}

/**
 * Whether Nidz has the commune list for this wilaya.
 *
 * Distinct from `communesOf(...).length > 0` on purpose: a screen must be able
 * to say "we do not carry the commune list for this wilaya yet" rather than
 * showing an empty picker that implies the wilaya has no communes.
 */
export function hasCommuneCoverage(wilayaId: string | null | undefined): boolean {
  return getWilaya(wilayaId)?.communeCoverage === "complete";
}

/** Resolves an id from any source — URL, storage, fixture — to a current one,
    or `null` if it names nothing. */
export function normalizeCommuneId(id: string | null | undefined): string | null {
  if (!id) return null;
  const current = LEGACY_COMMUNE_IDS[id] ?? id;
  return COMMUNE_BY_ID.has(current) ? current : null;
}

export function normalizeWilayaId(id: string | null | undefined): string | null {
  if (!id) return null;
  return WILAYA_BY_ID.has(id) ? id : null;
}

/** The wilaya a place is in, from an explicit wilaya or — for records written
    before the commune became optional — from its commune. */
export function wilayaOfPlace(place: { wilayaCode?: string | null; communeCode?: string | null }): string | null {
  return normalizeWilayaId(place.wilayaCode) ?? getWilayaOfCommune(place.communeCode)?.id ?? null;
}

/* --------------------------------------------------------------- validation */

export type LocationProblem = "wilayaRequired" | "unknownWilaya" | "communeOutsideWilaya";

/**
 * The ONE rule every location form applies (Audit 1.3.1).
 *
 * The wilaya is required where the form says so; the commune is optional
 * everywhere, for every wilaya — a wilaya alone is always a complete answer.
 * What is never accepted is a value that names nothing, or a commune filed
 * under a wilaya it does not belong to: both would be shown publicly as a
 * place that is not where the person said.
 */
export function checkLocation(
  value: { wilayaCode: string | null; communeCode: string | null },
  { wilayaRequired }: { wilayaRequired: boolean },
): LocationProblem | null {
  if (!value.wilayaCode) {
    if (value.communeCode) return "communeOutsideWilaya";
    return wilayaRequired ? "wilayaRequired" : null;
  }
  if (!getWilaya(value.wilayaCode)) return "unknownWilaya";
  if (value.communeCode && getCommune(value.communeCode)?.wilayaId !== value.wilayaCode) return "communeOutsideWilaya";
  return null;
}

/** "Hydra, Alger" when there is a commune; "Alger" when there is only the
    wilaya — the public line for a place, at the precision it was given. */
export function placeName(
  place: { wilayaCode?: string | null; communeCode?: string | null },
  locale: AppLocale,
): string | null {
  return communeWithWilaya(place.communeCode, locale) ?? wilayaName(wilayaOfPlace(place), locale);
}

/* ---------------------------------------------------------------- rendering */

function localized(name: Localized, locale: AppLocale): string {
  return name[locale] ?? name.en;
}

export function wilayaName(id: string | null | undefined, locale: AppLocale): string | null {
  const wilaya = getWilaya(id);
  return wilaya ? localized(wilaya.name, locale) : null;
}

/** "Hydra" — the approximate zone shown publicly. Nidz holds no exact address
    for anyone, so there is nothing more precise to leak (§27). */
export function communeName(id: string | null | undefined, locale: AppLocale): string | null {
  const commune = getCommune(id);
  return commune ? localized(commune.name, locale) : null;
}

/** "Hydra, Alger" — for a profile header, where the wilaya adds orientation.
    Arabic uses its own comma; the Latin one reads as a foreign glyph. */
export function communeWithWilaya(id: string | null | undefined, locale: AppLocale): string | null {
  const commune = getCommune(id);
  const wilaya = commune ? getWilaya(commune.wilayaId) : null;
  if (!commune || !wilaya) return null;
  return `${localized(commune.name, locale)}${locale === "ar" ? "، " : ", "}${localized(wilaya.name, locale)}`;
}

/* ------------------------------------------------------------------- search */

const ARABIC_DIACRITICS = /[ً-ْـ]/g;

/**
 * Fold a string to something typeable.
 *
 * Someone hunting for "Béjaïa" types "bejaia"; someone hunting for "الجزائر"
 * may type it without harakat, and Arabic has several forms of alef that a
 * keyboard reaches with different effort. Without this the combobox is only
 * usable by people who already know the exact spelling, which defeats the
 * point of searching.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/['’’-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every spelling a row can be found by, folded once at module load rather
    than on every keystroke. */
function searchKeys(name: Localized, id: string): string[] {
  return [...new Set([name.fr, name.en, name.ar, id].map(foldForSearch))].filter(Boolean);
}

const WILAYA_KEYS = new Map(WILAYAS.map((w) => [w.id, searchKeys(w.name, w.id)]));
const COMMUNE_KEYS = new Map(COMMUNES.map((c) => [c.id, searchKeys(c.name, c.id)]));

function matches(keys: string[] | undefined, needle: string): boolean {
  return keys ? keys.some((k) => k.includes(needle)) : false;
}

/** Empty query returns everything, so a combobox opens showing the full list
    rather than nothing until you type. */
export function searchWilayas(query: string): readonly Wilaya[] {
  const needle = foldForSearch(query);
  if (!needle) return WILAYAS;
  return WILAYAS.filter((w) => matches(WILAYA_KEYS.get(w.id), needle));
}

export function searchCommunes(query: string, wilayaId: string | null): readonly Commune[] {
  const pool = wilayaId ? communesOf(wilayaId) : COMMUNES;
  const needle = foldForSearch(query);
  if (!needle) return pool;
  return pool.filter((c) => matches(COMMUNE_KEYS.get(c.id), needle));
}
