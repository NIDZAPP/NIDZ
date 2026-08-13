/* ---------------------------------------------------------------------------
   NIDZ DOMAIN TYPES — shared by the demo fixtures, the demo state store and
   every screen. One definition per concept: a request created by an owner and
   a request answered by a sitter are the SAME record, not two shapes.

   Nothing here models a capability Nidz does not have. There is no payment,
   no booking, no verification result, no rating, no review, no response-time
   metric and no platform-observed counter, because no mechanism produces any
   of them (design system §6.1, §8.3, §28).
   ------------------------------------------------------------------------ */

import type { AppLocale } from "@/i18n";

/** Demo content that has to read naturally in all three product languages.
    Place names, sitter bios and declared conditions are DATA, not interface
    copy, so they live with the fixture instead of in the UI locale files —
    an authoritative dataset would arrive carrying its own names. */
export type Localized = Record<AppLocale, string>;

export function localized(value: Localized, locale: AppLocale): string {
  return value[locale] ?? value.en;
}

/** One string in every locale slot.
 *
 * What a sitter types about themselves is their own words, and Nidz does not
 * translate user content — so the same text is what every visitor sees,
 * whichever language the interface is in. The `Localized` shape exists for the
 * FIXTURES, which are authored three times on purpose. */
export function asLocalized(text: string): Localized {
  return { fr: text, en: text, ar: text };
}

/** Demo V1 is dogs and cats only (Audit p.97). */
export type Species = "dog" | "cat";
export const SPECIES: readonly Species[] = ["dog", "cat"];

export type CareType = "boarding" | "atOwner" | "walk";
export const CARE_TYPES: readonly CareType[] = ["boarding", "atOwner", "walk"];

/** The unit belongs to the service, never to the sitter: a nightly rate is
    not the price of a walk. */
export const CARE_UNIT_KEY: Record<CareType, string> = {
  boarding: "care.unit.night",
  atOwner: "care.unit.visit",
  walk: "care.unit.walk",
};

export type DogSize = "small" | "medium" | "large";
export const DOG_SIZES: readonly DogSize[] = ["small", "medium", "large"];

export type HousingType = "apartment" | "house";
export type OutdoorSpace = "none" | "balcony" | "yard" | "garden";

/** How the animals are actually kept. Deliberately no "cage" option: the audit
    (p.414) allows it only when genuinely applicable and explained, and no demo
    sitter uses it, so offering it as a default normalises it. */
export type CareMethod = "freeInHome" | "separatedZones" | "outdoorAccess" | "ownerRoutine";
export const CARE_METHODS: readonly CareMethod[] = [
  "freeInHome",
  "separatedZones",
  "outdoorAccess",
  "ownerRoutine",
];

/** A closed date range, ISO `YYYY-MM-DD`, both ends inclusive. */
export type DateRange = { start: string; end: string };

/* ------------------------------------------------------------------ animal */

export type Pet = {
  id: string;
  name: string;
  species: Species;
  /** Free text, because "8 mois" and "3 ans" are both real answers. */
  age: string;
  size: DogSize | null;
  /** Needs and constraints the owner considers important. */
  notes: string;
  /** Object URL of a locally previewed image. Never uploaded: there is no
      server. Not persisted — an object URL does not survive a reload. */
  photoUrl?: string;
};

/* ------------------------------------------------------------------ sitter */

export type SitterHousing = {
  type: HousingType;
  outdoor: OutdoorSpace;
  /** Animals already living at the sitter's home — a hard constraint for many
      owners, and the reason "aucun chat déclaré" is a useful compatibility
      fact rather than a badge. */
  residentPets: { species: Species; count: number }[];
  conditions: Localized | null;
};

export type SitterExperience = {
  /** Years of caring for animals, as declared. */
  years: number;
  /** Species the sitter says they have the most experience with. */
  species: Species[];
  /** Professional animal experience, when the sitter declares any. */
  professional: Localized | null;
};

/**
 * A public sitter profile.
 *
 * EVERY field is category A of the trust architecture — declared by the
 * sitter (§6 A). There is no `verified`, `rating`, `reviewCount`,
 * `responseTime`, `completedStays` or `online` field, and none may be added
 * until a real, traceable mechanism produces it (§6.1).
 */
export type SitterProfile = {
  id: string;
  /** Public identity is a first name plus an initial (§27). Nidz never shows
      a full legal name or an exact address on a public profile. */
  publicName: string;
  communeCode: string;
  headline: Localized;
  about: Localized;
  experience: SitterExperience;
  services: CareType[];
  /** A rate exists only for a service the sitter actually offers. */
  rates: Partial<Record<CareType, number>>;
  acceptedSpecies: Species[];
  /** Only meaningful when `acceptedSpecies` includes "dog". */
  acceptedDogSizes: DogSize[];
  maxAnimals: number;
  housing: SitterHousing;
  careMethods: CareMethod[];
  /** Situations and animals the sitter says they cannot accept. Presented as
      the sitter's own limits, never as a warning about the sitter. */
  limits: Localized[];
  /** Periods the sitter has DECLARED unavailable. This is a statement by the
      sitter, not a booking calendar: Nidz holds no reservations, so a date
      outside these ranges means "not declared unavailable", never "confirmed
      free". Every surface that reads this must say so. */
  declaredUnavailable: DateRange[];
  /** The sitter's own photograph, as an object URL.
   *
   * Never uploaded — there is no server — and never persisted, because an
   * object URL points at nothing after a reload. Present only for a profile
   * the visitor built in this session. The fixtures deliberately have none:
   * stock photography presented as a real person's profile is an anti-pattern
   * (§21, §40), so they render a monogram instead. */
  photoUrl?: string;
  /** True for every profile shipped as a fixture. A profile the user builds
      in the sitter flow is false — it is their own data, not an example. */
  isDemoFixture: boolean;
};

/* -------------------------------------------------------------------- need */

/**
 * What the owner is looking for.
 *
 * Built up across the need flow and mirrored into the `/search` URL, which
 * stays canonical for results so they remain linkable and Back keeps working.
 * Every field is single-valued and optional — the same shape `/search` parses,
 * so the brief the owner defined and the filters they adjust against the
 * results cannot disagree.
 *
 * `petId` is the part that is NOT in the URL: an animal's name and needs are
 * the owner's, not a shareable query.
 */
export type OwnerNeed = {
  species: Species | null;
  petId: string | null;
  wilayaCode: string | null;
  communeCode: string | null;
  dates: DateRange | null;
  careType: CareType | null;
  /** Not asked for in the flow — it is a filter, added from the results. Kept
      here so the brief and the URL round-trip without losing it. */
  maxPrice: number | null;
};

export const EMPTY_NEED: OwnerNeed = {
  species: null,
  petId: null,
  wilayaCode: null,
  communeCode: null,
  dates: null,
  careType: null,
  maxPrice: null,
};

/* ----------------------------------------------------------------- request */

/**
 * Demo request statuses. There is deliberately no "completed": nothing in the
 * demo can observe that a stay happened, so a completed state would be a
 * fabricated lifecycle (Audit p.304 — "Terminée uniquement si ce cycle existe
 * réellement").
 */
export type RequestStatus = "pending" | "accepted" | "declined";

export type CareRequest = {
  id: string;
  createdAt: string;
  sitterId: string;
  /** A copy, not a reference: editing the pet later must not silently rewrite
      what the sitter was asked to look after. */
  pet: Pet;
  careType: CareType;
  dates: DateRange;
  /** The OWNER's area — what a sitter needs in order to answer a home visit or
      a walk. Null when the search was wilaya-wide and no commune was given:
      absent is honest, the sitter's own commune in this slot would not be. */
  communeCode: string | null;
  /** Owner's public identity on the request, same convention as the sitter. */
  ownerName: string;
  /** The rate displayed to the owner when they sent the request, so the
      summary stays truthful if the fixture changes. No money moves. */
  displayedRate: { amount: number; careType: CareType } | null;
  status: RequestStatus;
  respondedAt: string | null;
};

/** The one country code this demonstration handles. Not a selector: nothing
    here does anything with a phone number, so a control that changes nothing
    would be worse than an honest constant. */
export const PHONE_PREFIX = "+213";
