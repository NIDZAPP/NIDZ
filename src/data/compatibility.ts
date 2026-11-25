/* ---------------------------------------------------------------------------
   COMPATIBILITY — can THIS animal be put in front of THIS sitter? (Nidz 1.7)

   Replaces the dog-size model. Three answers, never two:

     confirmed     the sitter accepts the category, and either accepts every
                   breed / species of it or listed exactly this one;
     unknown       Nidz cannot tell from the data — the owner's « Autre »
                   animal, a breed the owner did not give (or gave in their own
                   words) when the sitter accepts only some, a sitter's own
                   free-text entry. Shown as « à confirmer », and the owner and
                   the sitter are invited to clarify. Never shown as a match;
     incompatible  the category is not accepted, or the sitter listed the
                   breeds they take and this listed breed is not one of them.

   What compatibility is NOT. It is never a statement about behaviour, health
   or safety: a breed predicts none of those, and no surface may present
   « confirmed » as more than « this sitter says they take this kind of
   animal ». The sitter's declared limits and the owner's declared needs are
   always shown next to it, because they are free text no rule can read.

   Free text never matches automatically (§19.2). « Berger kabyle » typed by
   an owner and « berger kabyle » typed by a sitter are probably the same dog,
   and probably is exactly what « unknown » is for.
   ------------------------------------------------------------------------ */

import { classificationOf } from "./animal-catalogue";
import { getKind } from "./animal-kinds";
import type { KindAcceptance, PetCategory, SitterProfile, Species } from "./types";

/** The animal as matching sees it — a saved pet, a search, a published
    request all reduce to this. */
export type AnimalRef = {
  species: PetCategory;
  /** A listed kind, or null. */
  kindId: string | null;
  /** The owner's own words for the breed, when they typed one. */
  kindOther?: string;
};

export type Compatibility =
  | { level: "confirmed"; scope: "category" | "kind" }
  | { level: "unknown"; reason: "otherCategory" | "kindNotGiven" | "kindFreeText" }
  | { level: "incompatible"; reason: "category" | "kind" };

/** How a sitter accepts one category, or null when they do not accept it. A
    category with no recorded preference — every pre-1.7 profile — is taken
    whole, which is what « j'accepte les chiens » said. */
export function acceptanceOf(sitter: Pick<SitterProfile, "acceptedSpecies" | "acceptedKinds">, species: Species): KindAcceptance | null {
  if (!sitter.acceptedSpecies.includes(species)) return null;
  const entry = sitter.acceptedKinds?.[species];
  if (!entry || entry.mode !== "some" || !classificationOf(species)) return { mode: "all" };
  return entry;
}

export function compatibility(
  sitter: Pick<SitterProfile, "acceptedSpecies" | "acceptedKinds">,
  animal: AnimalRef,
): Compatibility {
  if (animal.species === "other") return { level: "unknown", reason: "otherCategory" };
  const acceptance = acceptanceOf(sitter, animal.species);
  if (!acceptance) return { level: "incompatible", reason: "category" };
  if (acceptance.mode === "all") return { level: "confirmed", scope: "category" };

  const listed = getKind(animal.kindId, animal.species);
  if (listed) {
    if (acceptance.ids.includes(listed.id)) return { level: "confirmed", scope: "kind" };
    /* The sitter also wrote names of their own: one of them might be this
       breed under another spelling. Nidz cannot tell, so it does not claim
       either way. */
    return acceptance.others.length > 0
      ? { level: "unknown", reason: "kindFreeText" }
      : { level: "incompatible", reason: "kind" };
  }
  if (animal.kindOther?.trim()) return { level: "unknown", reason: "kindFreeText" };
  return { level: "unknown", reason: "kindNotGiven" };
}

export function isCompatible(c: Compatibility): boolean {
  return c.level !== "incompatible";
}

/** Order: what is confirmed before what is to be confirmed. */
export function compatibilityRank(c: Compatibility): number {
  return c.level === "confirmed" ? 0 : c.level === "unknown" ? 1 : 2;
}

/** A sitter's acceptance, cleaned: listed ids that belong to the category,
    others trimmed, de-duplicated and bounded. Used by the builder and by
    storage restore, so the two cannot keep different shapes. */
export function normalizeAcceptance(species: Species, value: unknown): KindAcceptance | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (raw.mode === "all") return { mode: "all" };
  if (raw.mode !== "some") return null;
  const ids = Array.isArray(raw.ids)
    ? [...new Set(raw.ids.filter((id): id is string => typeof id === "string" && getKind(id, species) !== null))]
    : [];
  const others = Array.isArray(raw.others)
    ? [
        ...new Set(
          raw.others
            .filter((o): o is string => typeof o === "string")
            .map((o) => o.trim().slice(0, 40))
            .filter(Boolean),
        ),
      ].slice(0, 10)
    : [];
  return { mode: "some", ids, others };
}

/** « Certaines races uniquement » with nothing chosen is not an answer yet:
    it would exclude every animal of the category. */
export function acceptanceComplete(acceptance: KindAcceptance | undefined): boolean {
  return !acceptance || acceptance.mode === "all" || acceptance.ids.length + acceptance.others.length > 0;
}
