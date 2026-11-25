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

import { MOVED_KINDS, getKind } from "./animal-kinds";
import type { AppLocale } from "@/i18n";
import { isPetCategory, type DogSize, type PetCategory } from "./types";

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
  /** RETIRED in Nidz 1.7 — no form asks it and no rule reads it. Kept only
      so an answer an owner gave before is not silently deleted; it is shown
      back to them on the animal's sheet, where they can remove it. */
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
  /* The bird's species used to be free text here (`kind`). Since 1.4 it is the
     shared `kindId` / `kindOther` on every pet; `restorePet` moves an old
     answer across into `kindOther`. */
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

/** Every category without a block of its own (rabbit, hamster, reptiles,
    fish, « Autre »…). One open question rather than a dozen invented ones:
    where the animal lives — cage, terrarium, aquarium, hutch, free roaming —
    is the thing a sitter most needs to picture. */
export type HabitatDetails = {
  habitat: string;
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

/**
 * The animal's age (Nidz 1.7 §8.2): years and months, which covers an animal
 * under a year; « estimé » when the owner is not sure; or « je ne sais pas »,
 * a complete answer — nobody is made to invent an age.
 */
export type PetAge =
  | { status: "known" | "estimated"; years: number; months: number }
  | { status: "unknown" };

export const AGE_MAX_YEARS = 60;

/** Whether the owner answered the important-needs step (§10). `nothing` is the
    explicit « Rien à signaler »; `null` is « not asked or skipped ». The text
    itself is `notes`. */
export type NeedsStatus = "nothing" | null;

type PetCommon = {
  id: string;
  name: string;
  /** Free text, the pre-1.7 answer. Kept and shown when `ageInfo` is absent:
      it is what the owner said. New answers go to `ageInfo`. */
  age: string;
  ageInfo: PetAge | null;
  /** The owner's own name for the category when they chose « Autre ».
      Empty for every listed category. */
  otherCategory: string;
  needsStatus: NeedsStatus;
  sex: PetSex;
  /**
   * Breed (dog, cat) or species (bird), from the shared reference list in
   * `animal-kinds.ts`. Null when not answered — the question is optional.
   * DETAIL ONLY: matching never reads it (see that file).
   */
  kindId: string | null;
  /** « Mon animal n'est pas dans la liste » — the owner's own words. */
  kindOther: string;
  /** « Besoins et contraintes importantes » (§10): allergies, medication,
      anxiety, reactivity, diet… in the owner's words. Shown to a sitter
      before they accept, never on any public surface. */
  notes: string;
  /** The owner's photograph of THIS animal — never the catalogue
      illustration. Since 1.7 a small JPEG data URL made on the device
      (`utils/photo.ts`), kept in this browser's storage and never uploaded:
      there is no server. An object URL from an older build is a live preview
      only and is dropped on save. */
  photoUrl?: string;
  care: PetCare;
};

/** The categories with no block of their own, plus « Autre ». */
export type HabitatCategory = Exclude<PetCategory, "dog" | "cat" | "bird">;

export type Pet =
  | (PetCommon & { species: "dog"; details: DogDetails })
  | (PetCommon & { species: "cat"; details: CatDetails })
  | (PetCommon & { species: "bird"; details: BirdDetails })
  | (PetCommon & { species: HabitatCategory; details: HabitatDetails });

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

/** The detail record for a category, with every question unanswered. */
export function emptyDetails(species: "dog"): DogDetails;
export function emptyDetails(species: "cat"): CatDetails;
export function emptyDetails(species: "bird"): BirdDetails;
export function emptyDetails(species: HabitatCategory): HabitatDetails;
export function emptyDetails(species: PetCategory): DogDetails | CatDetails | BirdDetails | HabitatDetails;
export function emptyDetails(species: PetCategory): DogDetails | CatDetails | BirdDetails | HabitatDetails {
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
        housing: null,
        outOfCageNotes: "",
        handling: null,
        escapeRisk: "unknown",
        socialNotes: "",
      };
    default:
      return { habitat: "" };
  }
}

type Common = Omit<PetCommon, never>;

function assemble(common: Common, species: PetCategory): Pet {
  switch (species) {
    case "dog":
      return { ...common, species, details: emptyDetails("dog") };
    case "cat":
      return { ...common, species, details: emptyDetails("cat") };
    case "bird":
      return { ...common, species, details: emptyDetails("bird") };
    default:
      return { ...common, species, details: emptyDetails(species) };
  }
}

export function emptyPet(id: string, species: PetCategory): Pet {
  return assemble(
    {
      id,
      name: "",
      age: "",
      ageInfo: null,
      otherCategory: "",
      needsStatus: null,
      sex: "unknown",
      kindId: null,
      kindOther: "",
      notes: "",
      care: { ...EMPTY_CARE },
    },
    species,
  );
}

/**
 * Change a pet's category without silently carrying facts across.
 *
 * "Good with dogs" answered for a dog is not an answer about the bird it was
 * mistakenly filed as. The common fields survive because a name, an age, a
 * photo and the owner's needs are about the animal; the detail record and the
 * breed are rebuilt empty because they are about the kind of animal.
 */
export function withSpecies(pet: Pet, species: PetCategory): Pet {
  if (pet.species === species) return pet;
  const { id, name, age, ageInfo, sex, notes, needsStatus, photoUrl, care } = pet;
  return assemble(
    {
      id,
      name,
      age,
      ageInfo,
      sex,
      notes,
      needsStatus,
      photoUrl,
      care,
      kindId: null,
      kindOther: "",
      otherCategory: species === "other" ? pet.otherCategory : "",
    },
    species,
  );
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
  const shared = [
    pet.ageInfo || pet.age.trim() ? "x" : "",
    pet.sex !== "unknown" ? "x" : "",
    pet.kindId || pet.kindOther.trim() ? "x" : "",
    pet.notes.trim() || pet.needsStatus ? "x" : "",
    pet.photoUrl ? "x" : "",
  ];
  /* The retired dog size is not a question any more, so it counts neither
     as answered nor as missing. */
  const { size: _size, ...rest } = pet.details as Record<string, unknown>;
  const detail = Object.values(pet.species === "dog" ? rest : (pet.details as Record<string, unknown>)).map((value) => {
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

/** The breed or species in words, in the interface language — the listed
    name, else the owner's own words, else null (not answered). */
export function kindLabel(pet: Pick<Pet, "species" | "kindId" | "kindOther">, locale: AppLocale): string | null {
  const kind = getKind(pet.kindId, pet.species);
  if (kind) return kind.name[locale];
  return pet.kindOther.trim() || null;
}

/** Whether the owner has said anything about important needs — text, or the
    explicit « Rien à signaler ». A sitter reads « non renseigné » otherwise. */
export function needsAnswered(pet: Pick<Pet, "notes" | "needsStatus">): boolean {
  return pet.notes.trim().length > 0 || pet.needsStatus === "nothing";
}

export function clampAge(value: PetAge): PetAge {
  if (value.status === "unknown") return value;
  const years = Math.max(0, Math.min(AGE_MAX_YEARS, Math.floor(value.years || 0)));
  const months = Math.max(0, Math.min(11, Math.floor(value.months || 0)));
  return { status: value.status, years, months };
}

function restoreAge(value: unknown): PetAge | null {
  if (!isRecord(value)) return null;
  if (value.status === "unknown") return { status: "unknown" };
  if (value.status !== "known" && value.status !== "estimated") return null;
  const years = typeof value.years === "number" ? value.years : 0;
  const months = typeof value.months === "number" ? value.months : 0;
  if (!Number.isFinite(years) || !Number.isFinite(months)) return null;
  const age = clampAge({ status: value.status, years, months });
  /* « 0 years 0 months » says nothing: treated as not answered. */
  return age.status !== "unknown" && age.years === 0 && age.months === 0 ? null : age;
}

/** A stored photo is kept only when it is an image data URL of reasonable
    size; an object URL from an older build points at nothing after a reload. */
export function restorePhoto(value: unknown): string | undefined {
  return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(value) && value.length < 400_000
    ? value
    : undefined;
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

  let species: PetCategory | null = isPetCategory(raw.species) ? raw.species : null;
  if (!species) return null;

  /* Absent on anything saved before Audit 1.2 — hence the fallback to an empty
     record rather than a cast. */
  const detail = isRecord(raw.details) ? raw.details : {};

  /* A grey parrot or a conure saved as a « bird » before 1.7 is a parrot:
     the owner's own answer says so (see `MOVED_KINDS`). Its bird questions
     have no parrot counterpart and are left behind, except the owner's own
     words about its cage, carried into the open habitat line. The cage /
     aviary CHOICE is not turned into text: written once into storage it
     would stay in one language whatever the reader's (review 1.7). */
  const moved = MOVED_KINDS[str(raw.kindId)];
  let carriedHabitat = "";
  if (moved && species === moved.from) {
    species = moved.to;
    carriedHabitat = str(detail.outOfCageNotes);
  }

  const common = {
    id,
    name: str(raw.name),
    age: str(raw.age),
    ageInfo: restoreAge(raw.ageInfo),
    otherCategory: species === "other" ? str(raw.otherCategory).slice(0, 40) : "",
    needsStatus: raw.needsStatus === "nothing" ? ("nothing" as const) : null,
    sex: oneOf(raw.sex, PET_SEXES) ?? "unknown",
    /* Only an id that belongs to THIS category survives; anything else is
       dropped rather than shown as a breed. */
    kindId: getKind(str(raw.kindId), species)?.id ?? null,
    /* Before 1.4 a bird's species was free text on `details.kind`: it is the
       owner's own words, so it moves across unchanged. */
    kindOther: str(raw.kindOther) || (species === "bird" ? str(detail.kind) : ""),
    notes: str(raw.notes),
    photoUrl: restorePhoto(raw.photoUrl),
    care: isRecord(raw.care)
      ? {
          feeding: str(raw.care.feeding),
          medication: str(raw.care.medication),
          vet: str(raw.care.vet),
          emergencyContact: str(raw.care.emergencyContact),
        }
      : { ...EMPTY_CARE },
  };
  if (!common.photoUrl) delete (common as { photoUrl?: string }).photoUrl;

  switch (species) {
    case "dog":
      return {
        ...common,
        species,
        details: {
          /* Retired, but an answer the owner gave is not deleted. */
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
          housing: oneOf(detail.housing, ["cage", "aviary"] as const),
          outOfCageNotes: str(detail.outOfCageNotes),
          handling: oneOf(detail.handling, ["handleable", "limited", "none"] as const),
          escapeRisk: declared(detail.escapeRisk),
          socialNotes: str(detail.socialNotes),
        },
      };
    default:
      return { ...common, species, details: { habitat: str(detail.habitat) || carriedHabitat } };
  }
}
