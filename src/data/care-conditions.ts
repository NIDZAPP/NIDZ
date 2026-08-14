import type { Declared } from "./pets";
import type { Localized, Species } from "./types";

/* ---------------------------------------------------------------------------
   HOW ANIMALS ARE ACTUALLY CARED FOR (§57).

   The audit calls this out as its own section rather than a line in a bio, and
   the reason is that it is the part of a sitter profile an owner cannot infer.
   Two sitters with the same photograph, the same commune and the same price
   can run completely different households: one gives a dog the run of the flat
   and sleeps with it on the bed, the other keeps it in the kitchen and crates
   it at night. Neither is wrong. Only one of them suits any particular animal,
   and an owner who finds out on collection day has been failed by the product,
   not by the sitter.

   THREE RULES HOLD THIS MODULE TOGETHER.

   1. EVERY ANSWER IS DECLARED. Nothing here is observed, checked or scored.
      These are the sitter's own words about their own home, and every surface
      that renders them says so.

   2. NOTHING IS A DEFAULT. Every field starts null or "unknown", because the
      difference between "the animal sleeps in its own room" and "nobody asked"
      is exactly the difference this section exists to expose. A seeded value
      would be published as a declaration nobody made.

   3. CONTAINMENT IS ASKED ABOUT NEUTRALLY AND EXPLAINED. Audit 1.1 left the
      crate out of `CareMethod` entirely, on the reasoning that offering it as
      an option normalises it. That was the wrong fix to a real problem: a
      sitter who crates at night still crates at night, and hiding the question
      only means the owner finds out later. §57 asks for crate and cage use
      AND THE REASON, so the reason travels with the fact — a crate used for
      twenty minutes while the sitter takes a shower and a crate used all night
      are not the same declaration, and an owner can tell them apart only if
      the sitter is given somewhere to say which.

   The per-species blocks exist because the questions genuinely differ. Asking
   a cat sitter how many walks a day is a dead field; asking a bird sitter
   whether the room is safe to fly in is the whole question. A sitter is shown
   only the blocks for the species they accept.
   ------------------------------------------------------------------------ */

/** Where in the home a visiting animal is allowed to be. */
export type MovementScope = "wholeHome" | "someRooms" | "oneRoom";
export const MOVEMENT_SCOPES: readonly MovementScope[] = ["wholeHome", "someRooms", "oneRoom"];

/**
 * Crate, cage or pen use.
 *
 * Ordered from least to most restrictive so the list reads as a scale rather
 * than a menu, and `"never"` is a real answer sitting in the same list rather
 * than an absence.
 */
export type ContainmentUse = "never" | "shortPeriods" | "whenAlone" | "atNight" | "mostOfTheDay";
export const CONTAINMENT_USES: readonly ContainmentUse[] = [
  "never",
  "shortPeriods",
  "whenAlone",
  "atNight",
  "mostOfTheDay",
];

/** Who is at home during the day. The single best predictor of hours alone. */
export type DaytimePresence = "alwaysSomeone" | "mostOfDay" | "morningsEvenings" | "shortVisits";
export const DAYTIME_PRESENCE: readonly DaytimePresence[] = [
  "alwaysSomeone",
  "mostOfDay",
  "morningsEvenings",
  "shortVisits",
];

/** Where the animal sleeps. */
export type SleepingPlace = "sitterRoom" | "livingSpace" | "ownQuietRoom" | "outdoorShelter";
export const SLEEPING_PLACES: readonly SleepingPlace[] = [
  "sitterRoom",
  "livingSpace",
  "ownQuietRoom",
  "outdoorShelter",
];

/** Whose food, and whose schedule. */
export type FeedingPlan = "ownerFoodAndRoutine" | "ownerFoodOwnRoutine" | "sitterProvides";
export const FEEDING_PLANS: readonly FeedingPlan[] = [
  "ownerFoodAndRoutine",
  "ownerFoodOwnRoutine",
  "sitterProvides",
];

/** How the animal travels, if it travels at all. */
export type TransportMode = "onFoot" | "ownVehicle" | "taxi" | "noTransport";
export const TRANSPORT_MODES: readonly TransportMode[] = [
  "onFoot",
  "ownVehicle",
  "taxi",
  "noTransport",
];

export type DogCare = {
  /** Walks a day. Null until answered; zero is a real answer and a meaningful
      one — a sitter offering home visits to an elderly dog may walk it none. */
  walksPerDay: number | null;
  /** Typical minutes per walk. */
  walkMinutes: number | null;
  offLeash: Declared;
  /** Access to the sitter's own outdoor space, which `housing.outdoor` only
      says exists — having a yard and letting a visiting dog into it are two
      different declarations. */
  gardenAccess: Declared;
};

export type CatCare = {
  litterBoxes: number | null;
  /** Kept indoors for the whole stay. The answer an owner of an indoor cat
      needs before anything else. */
  indoorOnly: Declared;
  /** Somewhere to retreat to. A cat with nowhere to hide in an unfamiliar home
      is the most common cause of a stay going wrong. */
  hidingSpaces: Declared;
};

export type BirdCare = {
  /** Hours out of the cage on a normal day. */
  outOfCageHours: number | null;
  /** Windows shut, fans off, no other animal in the room. The actual hazards,
      asked as one question because they are one habit. */
  flightSafeRoom: Declared;
  coversAtNight: Declared;
};

export type CareConditions = {
  movement: MovementScope | null;
  /** Rooms that are off limits, in the sitter's words. Free text because the
      honest answer is "the bedroom and the balcony", not an enum. */
  restrictedRooms: Localized;
  containment: {
    use: ContainmentUse | null;
    /** Why. Carried WITH the fact — see rule 3 above. Only meaningful when
        `use` is set and is not `"never"`. */
    reason: Localized;
  };
  /** The longest the animal would normally be left alone, in hours. */
  maxHoursAlone: number | null;
  presence: DaytimePresence | null;
  sleeping: SleepingPlace | null;
  feeding: FeedingPlan | null;
  /** Play, company, what the day actually looks like. */
  enrichment: Localized;
  transport: TransportMode[];
  emergency: {
    /** Whether the sitter says they could get an animal to a vet. */
    canReachVet: Declared;
    /** What they would do. Free text: a plan is a sequence, not a checkbox. */
    plan: Localized;
  };
  dog: DogCare;
  cat: CatCare;
  bird: BirdCare;
};

const emptyLocalized = (): Localized => ({ en: "", fr: "", ar: "" });

export function emptyCareConditions(): CareConditions {
  return {
    movement: null,
    restrictedRooms: emptyLocalized(),
    containment: { use: null, reason: emptyLocalized() },
    maxHoursAlone: null,
    presence: null,
    sleeping: null,
    feeding: null,
    enrichment: emptyLocalized(),
    transport: [],
    emergency: { canReachVet: "unknown", plan: emptyLocalized() },
    dog: { walksPerDay: null, walkMinutes: null, offLeash: "unknown", gardenAccess: "unknown" },
    cat: { litterBoxes: null, indoorOnly: "unknown", hidingSpaces: "unknown" },
    bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
  };
}

/* ----------------------------------------------------------------- storage */

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;

const declared = (value: unknown): Declared =>
  value === "yes" || value === "no" ? value : "unknown";

/** A count out of storage: a whole number in range, or not answered. */
const count = (value: unknown, max: number): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : null;

const text = (value: unknown): Localized => {
  if (typeof value === "string") return { en: value, fr: value, ar: value };
  if (typeof value !== "object" || value === null) return emptyLocalized();
  const raw = value as Record<string, unknown>;
  const pick = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return { en: pick("en"), fr: pick("fr"), ar: pick("ar") };
};

/**
 * Care conditions out of storage, field by field (checklist B2).
 *
 * `legacy` carries Audit 1.1's four `careMethods` flags, so a sitter who has a
 * half-finished draft in this browser does not lose what they had. Only the
 * two flags with an unambiguous target are mapped: `freeInHome` and
 * `separatedZones` say where the animal may go, and nothing else does.
 * `outdoorAccess` and `ownerRoutine` are DROPPED rather than guessed at —
 * outdoor access is already carried by `housing.outdoor`, and "follows the
 * owner's routine" is not the same statement as any of the feeding plans.
 * Inventing a declaration during a migration is what checklist B3 forbids, and
 * a dropped answer is recoverable by re-answering one question.
 */
export function restoreCareConditions(value: unknown, legacy: unknown): CareConditions {
  /* Every field below defaults to unanswered on its own, so a completely
     absent record needs no special case — it simply produces the empty one. */
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  const obj = (v: unknown): Record<string, unknown> =>
    typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  const containment = obj(raw.containment);
  const emergency = obj(raw.emergency);
  const dog = obj(raw.dog);
  const cat = obj(raw.cat);
  const bird = obj(raw.bird);

  let movement = oneOf(raw.movement, MOVEMENT_SCOPES);
  if (movement === null && Array.isArray(legacy)) {
    if (legacy.includes("freeInHome")) movement = "wholeHome";
    else if (legacy.includes("separatedZones")) movement = "someRooms";
  }

  return {
    movement,
    restrictedRooms: text(raw.restrictedRooms),
    containment: {
      use: oneOf(containment.use, CONTAINMENT_USES),
      reason: text(containment.reason),
    },
    maxHoursAlone: count(raw.maxHoursAlone, 24),
    presence: oneOf(raw.presence, DAYTIME_PRESENCE),
    sleeping: oneOf(raw.sleeping, SLEEPING_PLACES),
    feeding: oneOf(raw.feeding, FEEDING_PLANS),
    enrichment: text(raw.enrichment),
    transport: Array.isArray(raw.transport)
      ? TRANSPORT_MODES.filter((m) => (raw.transport as unknown[]).includes(m))
      : [],
    emergency: { canReachVet: declared(emergency.canReachVet), plan: text(emergency.plan) },
    dog: {
      walksPerDay: count(dog.walksPerDay, 12),
      walkMinutes: count(dog.walkMinutes, 300),
      offLeash: declared(dog.offLeash),
      gardenAccess: declared(dog.gardenAccess),
    },
    cat: {
      litterBoxes: count(cat.litterBoxes, 10),
      indoorOnly: declared(cat.indoorOnly),
      hidingSpaces: declared(cat.hidingSpaces),
    },
    bird: {
      outOfCageHours: count(bird.outOfCageHours, 24),
      flightSafeRoom: declared(bird.flightSafeRoom),
      coversAtNight: declared(bird.coversAtNight),
    },
  };
}

/** Which per-species blocks a sitter is asked about, given what they accept. */
export function speciesBlocksFor(acceptedSpecies: readonly Species[]): Species[] {
  return (["dog", "cat", "bird"] as const).filter((s) => acceptedSpecies.includes(s));
}

/**
 * Has this section been answered?
 *
 * Any one of the shared questions counts. Requiring all of them would mean a
 * sitter who answered nine and skipped the tenth is shown the same "not
 * answered" as one who opened nothing, which is both false and discouraging.
 */
export function careAnswered(care: CareConditions): boolean {
  return (
    care.movement !== null ||
    care.containment.use !== null ||
    care.maxHoursAlone !== null ||
    care.presence !== null ||
    care.sleeping !== null ||
    care.feeding !== null ||
    care.transport.length > 0 ||
    care.emergency.canReachVet !== "unknown"
  );
}

/**
 * The containment answer needs its reason (§57).
 *
 * The one place this section refuses to save silently: "I crate the dog" with
 * no reason is the declaration most likely to be misread, in both directions.
 * `"never"` needs nothing.
 */
export function containmentNeedsReason(care: CareConditions): boolean {
  return (
    care.containment.use !== null &&
    care.containment.use !== "never" &&
    care.containment.reason.en.trim().length === 0
  );
}
