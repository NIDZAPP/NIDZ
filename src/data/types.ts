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
import type { CareConditions } from "./care-conditions";
import type { Declared, SharedPet } from "./pets";

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

/**
 * The animals Nidz handles.
 *
 * Audit 1.2 adds `bird` (§16-19). It is a real third species, not a dog with
 * different copy: a bird has a cage or an aviary rather than a garden, is let
 * out rather than walked, and escapes in a way a dog does not. Every form that
 * asks about an animal has to branch on this rather than assume four legs —
 * "number of daily walks" must never appear for a bird.
 *
 * Adding a species to this list does NOT create supply. No demo sitter
 * currently declares that they accept birds, so a bird search finds nobody —
 * which is the honest zero state §33 asks for, not a bug to paper over.
 */
export type Species = "dog" | "cat" | "bird";
export const SPECIES: readonly Species[] = ["dog", "cat", "bird"];

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

/* Audit 1.1 modelled care as four coarse flags — free in the home, separated
   zones, outdoor access, follows the owner's routine. §57 asks for something an
   owner can actually act on, so `CareConditions` in `./care-conditions`
   replaced them: where the animal may go, containment AND ITS REASON, hours
   alone, who is home, sleeping, feeding, enrichment, transport, emergencies,
   and a per-species block for each species the sitter accepts. */

/** A closed date range, ISO `YYYY-MM-DD`, both ends inclusive. */
export type DateRange = { start: string; end: string };

/* ------------------------------------------------------------------ animal */

/* The animal model moved to `./pets` at Audit 1.2, where it became a
   discriminated union over species — a bird has no walk routine and a dog has
   no cage, and the union is what stops either from existing as a blank field.
   Re-exported here so the domain still has one front door.

   The import is type-only in both directions, so the cycle is erased at build
   and exists only for the type checker, which resolves it. */
export type { Declared, Pet, SharedPet } from "./pets";
export type { CareConditions } from "./care-conditions";

/* ------------------------------------------------------------------ sitter */

export type SitterHousing = {
  /** Null until the sitter answers. A non-null seed is indistinguishable from
      a choice, and every surface renders this under "informations fournies par
      le pet-sitter" — so a default pressed through would be published as a
      declaration nobody made. The type carries the distinction so the compiler
      does, too. */
  type: HousingType | null;
  outdoor: OutdoorSpace | null;
  /** Animals already living at the sitter's home — a hard constraint for many
      owners, and the reason "aucun chat déclaré" is a useful compatibility
      fact rather than a badge. */
  residentPets: { species: Species; count: number }[];
  /** Whether the sitter can keep a visiting animal apart from their own (§56).
      The single most useful thing an owner of a nervous animal can know, and
      the difference between "I have a dog" being a dealbreaker or not. */
  canSeparateAnimals: Declared;
  conditions: Localized | null;
};

/**
 * A profession, DECLARED (§40).
 *
 * The list is closed so that "veterinarian" means the same thing on every
 * profile and can be filtered on, rather than being one of forty spellings in
 * a free-text box.
 *
 * TYPING ONE OF THESE VERIFIES NOTHING. Declared profession and verified
 * credential are two different facts and are never merged: there is no
 * credential check in Nidz, so every profile that names a profession is
 * exactly as unverified as one that does not.
 */
export type ProfessionKind =
  | "veterinarian"
  | "vetStudent"
  | "vetAssistant"
  | "trainer"
  | "groomer"
  | "breeder"
  | "shelter"
  | "animalCare"
  | "animalHealth"
  | "other";

export const PROFESSION_KINDS: readonly ProfessionKind[] = [
  "veterinarian",
  "vetStudent",
  "vetAssistant",
  "trainer",
  "groomer",
  "breeder",
  "shelter",
  "animalCare",
  "animalHealth",
  "other",
];

export type ProfessionalBackground = {
  /** `null` means not answered. "No professional background" is `"none"` —
      a real answer, and a different fact from silence. */
  kind: ProfessionKind | "none" | null;
  /** Role, organisation, what they actually did. The sitter's own words. */
  /** Free text, so `Localized` like every other free-text field on a
      profile: a fixture is authored in all three languages, and what a real
      sitter types goes into all three slots via `asLocalized`. */
  detail: Localized;
  /** Years in that field. Null until answered; zero is a real answer. */
  years: number | null;
  /** Whether the sitter says they could produce a document if asked.
      A STATEMENT BY THEM, and the furthest Nidz gets — nothing checks it and
      no badge follows from it (§68). */
  canEvidence: Declared;
};

/**
 * What the sitter says they have done (§54).
 *
 * Concrete questions rather than a number: "six years" says much less about
 * whether someone can give a cat a tablet than "can you give oral medication"
 * does. Every one is three-state, because a sitter who has never been asked to
 * handle a reactive dog cannot honestly answer "no" — and a "no" they did not
 * mean would filter them out of work they could do.
 *
 * Years alone is never a proxy for safety, and nothing ranks on it.
 */
export type SitterExperience = {
  /** Years of caring for animals, as declared. */
  years: number;
  /** Species the sitter says they have the most experience with. */
  species: Species[];
  puppiesKittens: Declared;
  seniors: Declared;
  specialNeeds: Declared;
  oralMedication: Declared;
  multipleAnimals: Declared;
  reactiveAnimals: Declared;
  paidBefore: Declared;
  volunteered: Declared;
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
  /** DECLARED profession (§40). Kept out of `experience` on purpose: one is
      what someone has done, the other is what they are qualified as, and
      merging them is how a declaration starts reading as a credential. */
  professional: ProfessionalBackground;
  services: CareType[];
  /** A rate exists only for a service the sitter actually offers. */
  rates: Partial<Record<CareType, number>>;
  acceptedSpecies: Species[];
  /** Only meaningful when `acceptedSpecies` includes "dog". */
  acceptedDogSizes: DogSize[];
  maxAnimals: number;
  housing: SitterHousing;
  /** How care actually happens in this home (§57). Declared, never observed. */
  care: CareConditions;
  /** Situations and animals the sitter says they cannot accept. Presented as
      the sitter's own limits, never as a warning about the sitter. */
  limits: Localized[];
  /** Periods the sitter has DECLARED unavailable. This is a statement by the
      sitter, not a booking calendar: Nidz holds no reservations, so a date
      outside these ranges means "not declared unavailable", never "confirmed
      free". Every surface that reads this must say so. */
  declaredUnavailable: DateRange[];
  /** Sections the sitter has opened and explicitly saved.
   *
   * Exists for the one section whose complete answer is empty: a sitter with
   * no unavailable period to declare has answered "Periods you cannot take"
   * fully, and their answer is an empty array — indistinguishable from never
   * having opened it. Every other section is judged on the data it collects,
   * which is stronger evidence than a click. Without this the dashboard put a
   * check beside a question the sitter had never seen. */
  confirmedSections: string[];
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
  /** The dog's size when the animal is a dog and the owner gave it. A hard
      matching constraint (Audit 1.3 LOT 03); null when unknown. */
  dogSize: DogSize | null;
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
  dogSize: null,
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
  /**
   * A copy, not a reference: editing the pet later — or deleting it — must not
   * silently rewrite what the sitter was asked to look after.
   *
   * `SharedPet`, not `Pet`: the private care plan (feeding, medication, vet,
   * emergency contact) does not cross to a sitter with a request. §83 keeps
   * that for someone actually caring for the animal, and having the type
   * exclude it means the next person to add a detail block to a summary cannot
   * leak it by accident.
   */
  pet: SharedPet;
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
