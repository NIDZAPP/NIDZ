/* ---------------------------------------------------------------------------
   ALGERIAN LOCATIONS — REPLACEABLE DATA BOUNDARY.

   This module is a DELIBERATELY PARTIAL launch subset, not a reference
   dataset. It exists so that screens depend on `WILAYAS` rather than on a
   hard-coded list of place names, and so an authoritative dataset can replace
   the contents of this one file without touching a single screen.

   Design system §29 is explicit about two things:
     - never hard-code "48 wilayas" — the territorial division has changed and
       is changing again (a 69-wilaya reform is in transition), so this is
       external data that goes stale, not a constant;
     - never advertise national coverage that produces empty results. Nidz
       launches concentrated: enough supply and demand in one area first.

   So no count is ever rendered, no screen says "toutes les wilayas", and the
   location step tells the user plainly which areas this demonstration covers.
   ------------------------------------------------------------------------ */

import type { AppLocale } from "@/i18n";
import type { Localized } from "./types";

export type Commune = {
  /** Stable slug. Survives a rename; safe in a URL. */
  code: string;
  name: Localized;
};

export type Wilaya = {
  code: string;
  name: Localized;
  communes: Commune[];
};

/** Launch subset: the areas this demonstration actually has sitters in.
    Extending it is a data edit — no screen changes. */
export const WILAYAS: Wilaya[] = [
  {
    code: "alger",
    name: { fr: "Alger", en: "Algiers", ar: "الجزائر" },
    communes: [
      { code: "hydra", name: { fr: "Hydra", en: "Hydra", ar: "حيدرة" } },
      { code: "el-biar", name: { fr: "El Biar", en: "El Biar", ar: "الأبيار" } },
      { code: "kouba", name: { fr: "Kouba", en: "Kouba", ar: "القبة" } },
      { code: "bab-ezzouar", name: { fr: "Bab Ezzouar", en: "Bab Ezzouar", ar: "باب الزوار" } },
      { code: "birkhadem", name: { fr: "Birkhadem", en: "Birkhadem", ar: "بئر خادم" } },
      { code: "cheraga", name: { fr: "Chéraga", en: "Cheraga", ar: "الشراقة" } },
    ],
  },
  {
    code: "oran",
    name: { fr: "Oran", en: "Oran", ar: "وهران" },
    communes: [
      { code: "oran-centre", name: { fr: "Oran Centre", en: "Oran Centre", ar: "وهران المركز" } },
      { code: "bir-el-djir", name: { fr: "Bir El Djir", en: "Bir El Djir", ar: "بئر الجير" } },
      { code: "es-senia", name: { fr: "Es Sénia", en: "Es Senia", ar: "السانية" } },
    ],
  },
];

const COMMUNE_INDEX = new Map<string, { commune: Commune; wilaya: Wilaya }>(
  WILAYAS.flatMap((wilaya) => wilaya.communes.map((commune) => [commune.code, { commune, wilaya }])),
);

/** Codes used before this module existed, when commune names lived in the
    locale files. A bookmarked `/search?commune=elBiar` would otherwise fall
    back to "all areas" without saying so. */
const LEGACY_CODES: Record<string, string> = {
  elBiar: "el-biar",
  babEzzouar: "bab-ezzouar",
};

/** Resolves a code from any source — URL, storage, fixture — to a current one,
    or `null` if it names nothing. */
export function normalizeCommuneCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const current = LEGACY_CODES[code] ?? code;
  return COMMUNE_INDEX.has(current) ? current : null;
}

export function getWilaya(code: string | null | undefined): Wilaya | null {
  if (!code) return null;
  return WILAYAS.find((w) => w.code === code) ?? null;
}

export function getCommune(code: string | null | undefined): Commune | null {
  if (!code) return null;
  return COMMUNE_INDEX.get(code)?.commune ?? null;
}

export function getWilayaOfCommune(code: string | null | undefined): Wilaya | null {
  if (!code) return null;
  return COMMUNE_INDEX.get(code)?.wilaya ?? null;
}

/** "Hydra" — the approximate zone shown publicly. Nidz holds no exact address
    for anyone, so there is nothing more precise to leak (§27). */
export function communeName(code: string | null | undefined, locale: AppLocale): string | null {
  const commune = getCommune(code);
  return commune ? commune.name[locale] ?? commune.name.en : null;
}

/** "Hydra, Alger" — for a profile header, where the wilaya adds orientation. */
export function communeWithWilaya(code: string | null | undefined, locale: AppLocale): string | null {
  const entry = code ? COMMUNE_INDEX.get(code) : undefined;
  if (!entry) return null;
  const commune = entry.commune.name[locale] ?? entry.commune.name.en;
  const wilaya = entry.wilaya.name[locale] ?? entry.wilaya.name.en;
  return `${commune}, ${wilaya}`;
}
