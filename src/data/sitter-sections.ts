import type { SitterProfile } from "./types";

/* ---------------------------------------------------------------------------
   THE SITTER PROFILE, AS SECTIONS (§51).

   Audit 1.1 made this a wizard: eleven questions in a fixed order, each one
   blocking the next. §50 asks for the opposite — modular sections, save and
   resume, a clear sense of what is left, and the freedom to answer the easy
   parts first and come back.

   That difference is not cosmetic. Sitter onboarding is the longest surface in
   the product, and a linear flow means a sitter who cannot answer question
   four tonight cannot answer question nine either. A dashboard lets them get
   most of the way there and finish later, which is how anyone actually fills
   in something this long.

   WHAT "COMPLETE" MEANS HERE, AND WHAT IT DOES NOT.

   It means the section has been answered. It is ADMINISTRATIVE — §118 draws
   this line explicitly, and it applies as hard to a sitter as to an animal:
   completeness is never quality, never trust, never safety and never
   "potential", and nothing may rank on it (§43, §120). A sitter who answered
   six sections honestly is not worse than one who answered eleven.

   `required` marks what a profile needs before it can be published at all —
   the facts without which an owner cannot make a decision. Everything else
   genuinely is optional, and the dashboard says so rather than implying that
   an unfinished section is a failure.
   ------------------------------------------------------------------------ */

export type SitterSection = {
  id: string;
  path: string;
  /** i18n key for the section name. */
  labelKey: string;
  /** i18n key for the one line under it saying what it covers. */
  hintKey: string;
  /** Answered — see the note above about what this does not mean. */
  isAnswered: (profile: SitterProfile) => boolean;
  /** Needed before publishing. */
  required: boolean;
};

/** A section counts as answered when the sitter has given the thing it exists
    to collect — not when every optional field inside it is filled. */
export const SITTER_SECTIONS: readonly SitterSection[] = [
  {
    id: "about",
    path: "/sitter/profile/about",
    labelKey: "sitterSections.about.label",
    hintKey: "sitterSections.about.hint",
    isAnswered: (p) => p.headline.en.trim().length > 0,
    required: true,
  },
  {
    id: "services",
    path: "/sitter/profile/services",
    labelKey: "sitterSections.services.label",
    hintKey: "sitterSections.services.hint",
    /* A service with no price is not something an owner can be quoted for. */
    isAnswered: (p) => p.services.length > 0 && p.services.every((c) => typeof p.rates[c] === "number"),
    required: true,
  },
  {
    id: "animals",
    path: "/sitter/profile/animals",
    labelKey: "sitterSections.animals.label",
    hintKey: "sitterSections.animals.hint",
    isAnswered: (p) => p.acceptedSpecies.length > 0,
    required: true,
  },
  {
    id: "experience",
    path: "/sitter/profile/experience",
    labelKey: "sitterSections.experience.label",
    hintKey: "sitterSections.experience.hint",
    /* Answered once ANY capability question has been given a real answer.
       Years alone does not count: §54 is explicit that a number of years is
       not a proxy for what someone can actually do. */
    isAnswered: (p) =>
      [
        p.experience.puppiesKittens,
        p.experience.seniors,
        p.experience.specialNeeds,
        p.experience.oralMedication,
        p.experience.multipleAnimals,
        p.experience.reactiveAnimals,
        p.experience.paidBefore,
        p.experience.volunteered,
      ].some((value) => value !== "unknown"),
    required: false,
  },
  {
    id: "professional",
    path: "/sitter/profile/professional",
    labelKey: "sitterSections.professional.label",
    hintKey: "sitterSections.professional.hint",
    /* "No professional background" is an answer. Silence is not. */
    isAnswered: (p) => p.professional.kind !== null,
    required: false,
  },
  {
    id: "housing",
    path: "/sitter/profile/housing",
    labelKey: "sitterSections.housing.label",
    hintKey: "sitterSections.housing.hint",
    isAnswered: (p) => p.housing.type !== null && p.housing.outdoor !== null,
    required: false,
  },
  {
    id: "limits",
    path: "/sitter/profile/limits",
    labelKey: "sitterSections.limits.label",
    hintKey: "sitterSections.limits.hint",
    /* Care methods OR stated limits. Both describe how care actually happens,
       and a sitter who has said either has answered the question this section
       asks. */
    isAnswered: (p) => p.careMethods.length > 0 || p.limits.length > 0,
    required: false,
  },
  {
    id: "availability",
    path: "/sitter/profile/availability",
    labelKey: "sitterSections.availability.label",
    hintKey: "sitterSections.availability.hint",
    /* Declaring NO unavailable period is a complete answer, so this cannot
       key on the array being non-empty — that would push sitters to invent a
       busy week to clear a checklist. It keys on the section having been
       saved instead, which is why `confirmedSections` exists. */
    isAnswered: (p) => p.declaredUnavailable.length > 0 || p.confirmedSections.includes("availability"),
    required: false,
  },
  {
    id: "verification",
    path: "/sitter/trust",
    labelKey: "sitterSections.verification.label",
    hintKey: "sitterSections.verification.hint",
    /* Never "answered". There is no verification in Nidz, so this section can
       be visited and read but cannot be completed — and saying otherwise
       would be the exact claim §66 forbids. */
    isAnswered: () => false,
    required: false,
  },
];

export function requiredSections(): readonly SitterSection[] {
  return SITTER_SECTIONS.filter((section) => section.required);
}

/** What still has to be answered before this profile could be published. */
export function missingRequired(profile: SitterProfile): SitterSection[] {
  return requiredSections().filter((section) => !section.isAnswered(profile));
}

export function canPublish(profile: SitterProfile): boolean {
  return missingRequired(profile).length === 0;
}

/**
 * How many sections have been answered.
 *
 * Verification is excluded from the denominator: it can never be answered, so
 * counting it would cap every sitter below 100% forever and turn an honest
 * absence into a permanent failure on their own dashboard.
 */
export function answeredSections(profile: SitterProfile): { answered: number; total: number } {
  const countable = SITTER_SECTIONS.filter((section) => section.id !== "verification");
  return {
    answered: countable.filter((section) => section.isAnswered(profile)).length,
    total: countable.length,
  };
}
