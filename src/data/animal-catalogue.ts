/* ---------------------------------------------------------------------------
   THE ANIMAL CATALOGUE (Nidz 1.7) — one description per category.

   Every screen that lists animals reads this module: the owner's « Votre
   animal » grid, the breed step, the animal sheet, the sitter's accepted
   animals, search filters, the published-request feed and matching. Nothing
   else may hold a list of categories, so adding a fourteenth animal is one
   entry here, one illustration and its translated name — never a hunt for
   `species === "dog" ? … : …` across the app.

   Each category declares:

     - its CLASSIFICATION, the detail level an owner can give and a sitter can
       restrict on — a breed (dog, cat, rabbit, guinea pig), a species (birds,
       parrots, hamsters, fish, reptiles) — or none, where Nidz has no useful
       list (ferret, mouse): the breed step is skipped rather than filled with
       invented categories (§7.3). The lists themselves are `animal-kinds.ts`.
     - the SERVICES that make sense for it. A walk is a dog's; an aquarium is
       looked after where it stands. A service outside this list is not
       offered for the category anywhere: not to an owner, not in a sitter's
       declaration, not in matching.

   Names are interface copy (`species.<id>` in the locale files); the
   illustrations are artwork (`components/illustrations/animal-art.ts`).
   ------------------------------------------------------------------------ */

import { CARE_TYPES, SPECIES, type CareType, type PetCategory, type Species } from "./types";

export type Classification = "breed" | "species";

export type AnimalCategory = {
  id: Species;
  classification: Classification | null;
  /** The services this category can be offered and asked for. */
  services: readonly CareType[];
  /** The family the category belongs to, for grouping in long lists. */
  group: "companion" | "bird" | "smallMammal" | "aquatic" | "reptile";
};

const AWAY_OR_HOME: readonly CareType[] = ["boarding", "atOwner"];

export const ANIMAL_CATALOGUE: readonly AnimalCategory[] = [
  { id: "dog", classification: "breed", services: CARE_TYPES, group: "companion" },
  { id: "cat", classification: "breed", services: AWAY_OR_HOME, group: "companion" },
  /* « Oiseau » is the small cage and aviary birds — canaries, finches,
     budgerigars, cockatiels. Parrots are their own category: they live for
     decades, need daily handling and are not a canary's care. */
  { id: "bird", classification: "species", services: AWAY_OR_HOME, group: "bird" },
  { id: "parrot", classification: "species", services: AWAY_OR_HOME, group: "bird" },
  { id: "rabbit", classification: "breed", services: AWAY_OR_HOME, group: "smallMammal" },
  { id: "guineaPig", classification: "breed", services: AWAY_OR_HOME, group: "smallMammal" },
  { id: "hamster", classification: "species", services: AWAY_OR_HOME, group: "smallMammal" },
  /* No useful classification: fancy-mouse varieties are coat colours, and
     ferret « breeds » are colours too. Neither changes the care. */
  { id: "mouse", classification: null, services: AWAY_OR_HOME, group: "smallMammal" },
  { id: "ferret", classification: null, services: AWAY_OR_HOME, group: "smallMammal" },
  /* An aquarium is not carried across town: fish are cared for where they
     live. */
  { id: "fish", classification: "species", services: ["atOwner"], group: "aquatic" },
  { id: "turtle", classification: "species", services: AWAY_OR_HOME, group: "reptile" },
  { id: "snake", classification: "species", services: AWAY_OR_HOME, group: "reptile" },
  { id: "chameleon", classification: "species", services: AWAY_OR_HOME, group: "reptile" },
];

const BY_ID = new Map(ANIMAL_CATALOGUE.map((entry) => [entry.id, entry]));

/* The catalogue and the union must agree: a category in one and not the
   other would render a card nobody can match, or match an animal nobody can
   pick. Checked once at load, loudly. */
if (ANIMAL_CATALOGUE.length !== SPECIES.length || SPECIES.some((s) => !BY_ID.has(s))) {
  throw new Error("animal-catalogue: ANIMAL_CATALOGUE and SPECIES disagree");
}

export function categoryOf(species: Species): AnimalCategory {
  return BY_ID.get(species) as AnimalCategory;
}

/** The classification an owner is asked about for this animal, or null when
    the breed step is skipped (no list, or « Autre »). */
export function classificationOf(category: PetCategory | null | undefined): Classification | null {
  if (!category || category === "other") return null;
  return categoryOf(category).classification;
}

/** The services that make sense for this animal. « Autre » keeps every
    service open: Nidz cannot say what an unnamed animal needs, and the owner
    and sitter decide together. */
export function servicesFor(category: PetCategory | null | undefined): readonly CareType[] {
  if (!category || category === "other") return CARE_TYPES;
  return categoryOf(category).services;
}

export function serviceFits(category: PetCategory | null | undefined, care: CareType): boolean {
  return servicesFor(category).includes(care);
}

/** The services a sitter can declare, given the categories they accept: the
    union of what those categories allow. A sitter who only accepts fish has
    no « garde chez moi » to offer. */
export function servicesForAccepted(accepted: readonly Species[]): CareType[] {
  if (accepted.length === 0) return [...CARE_TYPES];
  return CARE_TYPES.filter((care) => accepted.some((s) => categoryOf(s).services.includes(care)));
}

/** Bounds for the owner's « Autre » text: something a sitter can read, never
    a paragraph pasted into a name field. */
export const OTHER_CATEGORY_MAX = 40;

export function validOtherCategory(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= OTHER_CATEGORY_MAX && /\p{L}/u.test(trimmed);
}
