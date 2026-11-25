import { careAnswered } from "./care-conditions";
import { acceptanceComplete } from "./compatibility";
import { wilayaOfPlace } from "./algeria";
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

   TWO GROUPS, COUNTED SEPARATELY (Audit 1.3 LOT 05).

   The 1.2 dashboard said "3 sections sur 9" while publication needed exactly
   three, so a sitter read the nine as an obligation. The sections are now
   split:

     POUR PUBLIER — what an owner needs to judge the offer at all, and the
     only thing publication checks:
       - who and where: the public name (first name and initial) and the
         commune — never an address;
       - the presentation sentence;
       - services, each with its price and unit;
       - the animals accepted and, per category, every breed / species or
         only some (Nidz 1.7 — dog sizes are no longer asked);
       - the HOME — but only for a sitter who offers boarding. An animal that
         sleeps at the sitter's place is the one case where the housing, the
         outdoor space and the animals already living there are a hard
         constraint for the owner ("limites critiques suivant le service").
         For visits and walks it is optional enrichment.

     ENRICHIR MON PROFIL — genuinely optional, counted on its own line, and
     never a condition of publication: experience, professional background,
     how the animals are cared for, limits, declared unavailability, and the
     verification page (which can be read but never "completed", because
     Nidz verifies nothing).

   A complete profile is not a verified profile, and no copy may say it is.
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
  /** Whether this section is needed before THIS profile can be published.
      Absent means never — the section belongs to "Enrichir mon profil". A
      function, because one section (the home) is required only for some
      services. */
  requiredFor?: (profile: SitterProfile) => boolean;
  /** Excluded from the enrichment count: a section that cannot be answered
      (verification) must not cap anyone below "all" forever. */
  uncounted?: boolean;
};

const ALWAYS = () => true;

/** A section counts as answered when the sitter has given the thing it exists
    to collect — not when every optional field inside it is filled. */
export const SITTER_SECTIONS: readonly SitterSection[] = [
  {
    id: "identity",
    /* The join step that sets both the public name (from the account) and the
       area; it returns here. The wilaya is what is required — the commune is
       optional for every wilaya (Audit 1.3.1), so a profile with a wilaya and
       no commune is complete. */
    path: "/sitter/join/location",
    labelKey: "sitterSections.identity.label",
    hintKey: "sitterSections.identity.hint",
    isAnswered: (p) => p.publicName.trim().length > 0 && wilayaOfPlace(p) !== null,
    requiredFor: ALWAYS,
  },
  {
    id: "about",
    path: "/sitter/profile/about",
    labelKey: "sitterSections.about.label",
    hintKey: "sitterSections.about.hint",
    isAnswered: (p) => p.headline.en.trim().length > 0,
    requiredFor: ALWAYS,
  },
  {
    id: "services",
    path: "/sitter/profile/services",
    labelKey: "sitterSections.services.label",
    hintKey: "sitterSections.services.hint",
    /* A service with no price is not something an owner can be quoted for. */
    isAnswered: (p) => p.services.length > 0 && p.services.every((c) => typeof p.rates[c] === "number"),
    requiredFor: ALWAYS,
  },
  {
    id: "animals",
    path: "/sitter/profile/animals",
    labelKey: "sitterSections.animals.label",
    hintKey: "sitterSections.animals.hint",
    /* Species, and for dogs the sizes: a dog sitter with no declared size
       cannot be matched on size at all (Audit 1.3 LOT 03). */
    isAnswered: (p) =>
      /* Nidz 1.7: a category, and for each one that has a breed or species
         list, « toutes » or at least one chosen kind — « certaines
         uniquement » with nothing ticked would exclude every animal. */
      p.acceptedSpecies.length > 0 && p.acceptedSpecies.every((s) => acceptanceComplete(p.acceptedKinds?.[s])),
    requiredFor: ALWAYS,
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
  },
  {
    id: "professional",
    path: "/sitter/profile/professional",
    labelKey: "sitterSections.professional.label",
    hintKey: "sitterSections.professional.hint",
    /* "No professional background" is an answer. Silence is not. */
    isAnswered: (p) => p.professional.kind !== null,
  },
  {
    id: "housing",
    path: "/sitter/profile/housing",
    labelKey: "sitterSections.housing.label",
    hintKey: "sitterSections.housing.hint",
    isAnswered: (p) => p.housing.type !== null && p.housing.outdoor !== null,
    /* Required only when the animal would sleep at the sitter's home. */
    requiredFor: (p) => p.services.includes("boarding"),
  },
  {
    id: "care",
    path: "/sitter/profile/care",
    labelKey: "sitterSections.care.label",
    hintKey: "sitterSections.care.hint",
    /* §57 asks what an owner cannot infer from anything else on the profile,
       so it is the one optional section the dashboard puts first among the
       optional ones. */
    isAnswered: (p) => careAnswered(p.care),
  },
  {
    id: "limits",
    path: "/sitter/profile/limits",
    labelKey: "sitterSections.limits.label",
    hintKey: "sitterSections.limits.hint",
    isAnswered: (p) => p.limits.length > 0,
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
    uncounted: true,
  },
];

/** The sections THIS profile must answer before it can be published. */
export function publishSections(profile: SitterProfile): SitterSection[] {
  return SITTER_SECTIONS.filter((section) => section.requiredFor?.(profile) === true);
}

/** Everything else: optional, and never a condition of publication. */
export function enrichSections(profile: SitterProfile): SitterSection[] {
  return SITTER_SECTIONS.filter((section) => section.requiredFor?.(profile) !== true);
}

/** What still has to be answered before this profile could be published. */
export function missingRequired(profile: SitterProfile): SitterSection[] {
  return publishSections(profile).filter((section) => !section.isAnswered(profile));
}

export function canPublish(profile: SitterProfile): boolean {
  return missingRequired(profile).length === 0;
}

/**
 * The two counts, each over its own group only.
 *
 * Administrative, never a score (§118). The enrichment count leaves out the
 * verification page, which can never be answered: counting it would cap
 * every sitter below "all" forever.
 */
export function sectionCounts(profile: SitterProfile): {
  publish: { answered: number; total: number };
  enrich: { answered: number; total: number };
} {
  const publish = publishSections(profile);
  const enrich = enrichSections(profile).filter((section) => !section.uncounted);
  return {
    publish: { answered: publish.filter((s) => s.isAnswered(profile)).length, total: publish.length },
    enrich: { answered: enrich.filter((s) => s.isAnswered(profile)).length, total: enrich.length },
  };
}

/** Where every section returns to. */
export const SITTER_DASHBOARD = "/sitter/profile";

/** Router state on a link from the dashboard into a section editor. It tells
    the editor that the entry behind it IS the dashboard, so saving can pop
    history back to it — otherwise each save pushed a second dashboard on top
    of the form, and Back from the dashboard re-opened the form just saved
    (Audit 1.3 LOT 05: "retours et reprise corrects"). */
export const FROM_DASHBOARD = { fromDashboard: true } as const;

export function cameFromDashboard(state: unknown): boolean {
  return (
    typeof state === "object" && state !== null && (state as { fromDashboard?: unknown }).fromDashboard === true
  );
}
