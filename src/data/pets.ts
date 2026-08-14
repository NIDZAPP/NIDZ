/* ---------------------------------------------------------------------------
   PETS — an owner has 0..N animals, and they are not all the same kind of
   thing.

   Audit 1.2's core domain change (§17-19). Two rules shape everything here.

   ONE: A BIRD IS NOT A DOG WITH DIFFERENT COPY.
   Species-specific facts live in a discriminated union, not in one flat record
   with fields that happen to be blank. "Walks per day" must not exist on a
   budgerigar — not blank, not zero, not hidden by a conditional in a form
   while sitting in the data. The union is what makes that structural instead
   of a rule someone has to remember.

   TWO: UNKNOWN IS AN ANSWER.
   Almost nothing here is a boolean. "Is your dog good with cats?" has three
   honest answers and one of them is "I don't know", which is different from
   "no" and very different from a false left unset. `Declared` carries that,
   and it defaults to `unknown` so that an owner who skipped a question has
   skipped it rather than accidentally answered it. This is the same rule that
   keeps a sitter's unanswered housing type `null` (regression checklist B1).

   PROGRESSIVE (§19): a name and a species make a usable pet. Everything else
   improves how well a sitter can judge whether they can take it. More filled
   fields never mean a better animal, and no surface may imply that.
   ------------------------------------------------------------------------ */

import type { DogSize, Species } from "./types";

/**
 * Yes / no / not answered.
 *
 * Three states because two would force a lie. An owner who has never seen
 * their cat near another cat cannot honestly answer "no", and a sitter reading
 * "no" would decline for a reason that does not exist.
 */
export type Declared = "yes" | "no" | "unknown";
export const DECLARED_OPTIONS: readonly Declared[] = ["yes", "no", "unknown"];

export type PetSex = "female" | "male" | "unknown";
export const PET_SEXES: readonly PetSex[] = ["female", "male", "unknown"];

/* ----------------------------------------------------------- species detail */

export type DogDetails = {
  size: DogSize | null;
  neutered: Declared;
  /** Compatibility, which is the thing a sitter with resident animals most
      needs and the thing an owner is most often unsure about. */
  goodWithDogs: Declared;
  goodWithCats: Declared;
  goodWithChildren: Declared;
  /** How many walks a day the animal is used to. Null means not answered. */
  walksPerDay: number | null;
  /** Free text: pulling, reactive on lead, fine off lead. */
  leashNotes: string;
};

export type CatDetails = {
  neutered: Declared;
  /** Indoor, outdoor or both — the single biggest determinant of what a home
      visit actually involves. */
  living: "indoor" | "outdoor" | "both" | null;
  goodWithCats: Declared;
  goodWithDogs: Declared;
  /** A cat that bolts through an open door is the classic home-visit
      accident, and it is worth its own question rather than a line in notes. */
  escapeRisk: Declared;
  litterNotes: string;
};

export type BirdDetails = {
  /** Budgerigar, canary, cockatiel… free text, because the range is wide and
      a fixed list would be wrong more often than right. */
  kind: string;
  housing: "cage" | "aviary" | null;
  /** What "out of the cage" means for this bird, in the owner's words. */
  outOfCageNotes: string;
  /** Whether the bird can be handled at all. A sitter who cannot pick it up
      needs to know before it is in their house, not after. */
  handling: "handleable" | "limited" | "none" | null;
  escapeRisk: Declared;
  /** Noise and company. A bird alone in a silent room is a welfare question,
      not a preference. */
  socialNotes: string;
};

/* --------------------------------------------------------------- care plan */

/**
 * The private half.
 *
 * Feeding, medication and who to call. §83 keeps this out of any public
 * surface, and Nidz has no public pet profile at all — a pet is described to a
 * sitter as part of a request. Kept in its own record so that "what is shown"
 * and "what is only shared with someone caring for the animal" stay
 * structurally separable rather than separated by discipline (§96).
 */
export type PetCare = {
  feeding: string;
  medication: string;
  vet: string;
  emergencyContact: string;
};

export const EMPTY_CARE: PetCare = { feeding: "", medication: "", vet: "", emergencyContact: "" };

/* ---------------------------------------------------------------- the pet */

type PetCommon = {
  id: string;
  name: string;
  /** Free text, because "8 months" and "3 years" are both real answers and an
      owner of a rescue animal often genuinely does not know. */
  age: string;
  sex: PetSex;
  /** Anything the owner considers important that the structured fields do not
      cover. Shown to a sitter with the request. */
  notes: string;
  /** Object URL of a locally previewed image. Never uploaded: there is no
      server. Never persisted — an object URL points at nothing after a
      reload. */
  photoUrl?: string;
  care: PetCare;
};

export type Pet =
  | (PetCommon & { species: "dog"; details: DogDetails })
  | (PetCommon & { species: "cat"; details: CatDetails })
  | (PetCommon & { species: "bird"; details: BirdDetails });

/**
 * A pet as it may be SHARED with a sitter: everything except the care plan.
 *
 * `Omit` on a union collapses it into one intersection, which would lose the
 * `species`/`details` correlation that the whole model rests on — hence the
 * distributive form. The point is that a request cannot carry feeding,
 * medication, vet and emergency contact by accident: §83 keeps those for
 * someone actually caring for the animal, and a type is the only version of
 * that rule which survives the next person adding a field to a summary.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type SharedPet = DistributiveOmit<Pet, "care">;

/** Drop the private half. Used at the one point a pet crosses from the owner
    to a sitter. */
export function forSharing(pet: Pet): SharedPet {
  const { care: _care, ...shared } = pet;
  return shared as SharedPet;
}

/** The detail record for a species, with every question unanswered. */
export function emptyDetails(species: "dog"): DogDetails;
export function emptyDetails(species: "cat"): CatDetails;
export function emptyDetails(species: "bird"): BirdDetails;
export function emptyDetails(species: Species): DogDetails | CatDetails | BirdDetails;
export function emptyDetails(species: Species): DogDetails | CatDetails | BirdDetails {
  switch (species) {
    case "dog":
      return {
        size: null,
        neutered: "unknown",
        goodWithDogs: "unknown",
        goodWithCats: "unknown",
        goodWithChildren: "unknown",
        walksPerDay: null,
        leashNotes: "",
      };
    case "cat":
      return {
        neutered: "unknown",
        living: null,
        goodWithCats: "unknown",
        goodWithDogs: "unknown",
        escapeRisk: "unknown",
        litterNotes: "",
      };
    case "bird":
      return {
        kind: "",
        housing: null,
        outOfCageNotes: "",
        handling: null,
        escapeRisk: "unknown",
        socialNotes: "",
      };
  }
}

export function emptyPet(id: string, species: Species): Pet {
  const common = { id, name: "", age: "", sex: "unknown" as const, notes: "", care: { ...EMPTY_CARE } };
  switch (species) {
    case "dog":
      return { ...common, species: "dog", details: emptyDetails("dog") };
    case "cat":
      return { ...common, species: "cat", details: emptyDetails("cat") };
    case "bird":
      return { ...common, species: "bird", details: emptyDetails("bird") };
  }
}

/**
 * Change a pet's species without silently carrying facts across.
 *
 * "Good with dogs" answered for a dog is not an answer about the bird it was
 * mistakenly filed as. The common fields survive because a name and an age are
 * about the animal; the detail record is rebuilt empty because it is about the
 * kind of animal.
 */
export function withSpecies(pet: Pet, species: Species): Pet {
  if (pet.species === species) return pet;
  const { id, name, age, sex, notes, photoUrl, care } = pet;
  const common = { id, name, age, sex, notes, photoUrl, care };
  switch (species) {
    case "dog":
      return { ...common, species: "dog", details: emptyDetails("dog") };
    case "cat":
      return { ...common, species: "cat", details: emptyDetails("cat") };
    case "bird":
      return { ...common, species: "bird", details: emptyDetails("bird") };
  }
}

/* ------------------------------------------------------------ completeness */

/**
 * How much of this pet's profile has been filled in.
 *
 * ADMINISTRATIVE ONLY. §118's rule applies to animals as much as to sitters:
 * this is a count of answered questions, and it must never be labelled quality,
 * health, suitability or care. An owner who answered three questions honestly
 * has not got a worse animal than one who answered ten.
 *
 * It exists for exactly one purpose — telling an owner what a sitter still
 * cannot see about their animal, so they can decide whether to say more.
 */
export function answeredCount(pet: Pet): { answered: number; total: number } {
  const shared = [pet.age.trim(), pet.sex !== "unknown" ? "x" : "", pet.notes.trim()];
  const detail = Object.values(pet.details as Record<string, unknown>).map((value) => {
    if (value === null || value === "unknown") return "";
    if (typeof value === "string") return value.trim();
    return String(value);
  });
  const all = [...shared, ...detail];
  return { answered: all.filter(Boolean).length, total: all.length };
}

/** A pet a sitter can actually be asked about: it has a name. Everything else
    is optional by design (§19). */
export function isUsable(pet: Pet): boolean {
  return pet.name.trim().length > 0;
}

/* --------------------------------------------------------------- storage */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const declared = (value: unknown): Declared =>
  value === "yes" || value === "no" ? value : "unknown";

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/**
 * Read one pet out of untrusted storage, from ANY version Nidz has shipped.
 *
 * Two jobs at once, deliberately in one place:
 *
 *  1. Validation. `localStorage` is user-writable, so a stored pet is input,
 *     not state. Anything that is not a usable record is discarded rather than
 *     handed to a screen that will read `.details.size` off it and crash.
 *
 *  2. Migration. Audit 1.1 and the first half of 1.2 stored a flat pet with a
 *     top-level `size` and no species detail at all. A dog saved then keeps its
 *     size — that is a fact the owner actually gave — and every question the
 *     old shape never asked comes back `unknown`, which is the honest answer
 *     for a question nobody was ever put. Nothing is inferred: a dog is not
 *     assumed good with cats because the field is missing.
 */
export function restorePet(raw: unknown): Pet | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  if (!id) return null;

  const species = oneOf(raw.species, ["dog", "cat", "bird"] as const);
  if (!species) return null;

  const common = {
    id,
    name: str(raw.name),
    age: str(raw.age),
    sex: oneOf(raw.sex, PET_SEXES) ?? "unknown",
    notes: str(raw.notes),
    care: isRecord(raw.care)
      ? {
          feeding: str(raw.care.feeding),
          medication: str(raw.care.medication),
          vet: str(raw.care.vet),
          emergencyContact: str(raw.care.emergencyContact),
        }
      : { ...EMPTY_CARE },
  };

  /* Absent on anything saved before Audit 1.2 — hence the fallback to an empty
     record rather than a cast. */
  const detail = isRecord(raw.details) ? raw.details : {};

  switch (species) {
    case "dog":
      return {
        ...common,
        species,
        details: {
          /* The one field that survives the old flat shape. */
          size: oneOf(detail.size ?? raw.size, ["small", "medium", "large"] as const),
          neutered: declared(detail.neutered),
          goodWithDogs: declared(detail.goodWithDogs),
          goodWithCats: declared(detail.goodWithCats),
          goodWithChildren: declared(detail.goodWithChildren),
          walksPerDay: typeof detail.walksPerDay === "number" ? detail.walksPerDay : null,
          leashNotes: str(detail.leashNotes),
        },
      };
    case "cat":
      return {
        ...common,
        species,
        details: {
          neutered: declared(detail.neutered),
          living: oneOf(detail.living, ["indoor", "outdoor", "both"] as const),
          goodWithCats: declared(detail.goodWithCats),
          goodWithDogs: declared(detail.goodWithDogs),
          escapeRisk: declared(detail.escapeRisk),
          litterNotes: str(detail.litterNotes),
        },
      };
    case "bird":
      return {
        ...common,
        species,
        details: {
          kind: str(detail.kind),
          housing: oneOf(detail.housing, ["cage", "aviary"] as const),
          outOfCageNotes: str(detail.outOfCageNotes),
          handling: oneOf(detail.handling, ["handleable", "limited", "none"] as const),
          escapeRisk: declared(detail.escapeRisk),
          socialNotes: str(detail.socialNotes),
        },
      };
  }
}
