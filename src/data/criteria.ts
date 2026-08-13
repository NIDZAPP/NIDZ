/* ---------------------------------------------------------------------------
   THE SEARCH CONTRACT.

   The owner defines a need in the flow; `/search` shows results and lets them
   adjust. Those are two different tasks, but they must not become two
   different models — a dates step whose answer the results ignore, or a filter
   sheet that widens a brief the request summary then narrows back, is the
   product lying to itself.

   So: `SearchCriteria` is single-valued and matches `OwnerNeed` field for
   field. The URL is canonical for results (linkable, and Back works); the
   demo state carries the parts that are nobody else's business — which animal,
   and what it needs.
   ------------------------------------------------------------------------ */

import { normalizeCommuneCode, getWilaya, getWilayaOfCommune } from "./locations";
import { offeredServices, overlapsDeclaredUnavailable, rateFor } from "./demo-sitters";
import {
  CARE_TYPES,
  SPECIES,
  type CareType,
  type DateRange,
  type OwnerNeed,
  type SitterProfile,
  type Species,
} from "./types";
import { isISODate } from "@/utils/dates";

export const PRICE_STEPS = [600, 900, 1200] as const;

export type SearchCriteria = {
  species: Species | null;
  care: CareType | null;
  wilaya: string | null;
  commune: string | null;
  maxPrice: number | null;
  dates: DateRange | null;
};

export const EMPTY_CRITERIA: SearchCriteria = {
  species: null,
  care: null,
  wilaya: null,
  commune: null,
  maxPrice: null,
  dates: null,
};

/**
 * Rules that must hold whatever produced the criteria.
 *
 * A walk is a single day, so it cannot carry an end date. The need flow
 * collapses the range when the service changes, but the filter sheet is a
 * second way to change it, and a rule enforced on one path and not the other
 * is how the two models drift apart again: a walk search would keep filtering
 * availability over a six-day window the user could no longer see or clear.
 * Applied wherever criteria are committed, so there is one rule, not two.
 */
export function normalizeCriteria(c: SearchCriteria): SearchCriteria {
  if (c.care === "walk" && c.dates && c.dates.start !== c.dates.end) {
    return { ...c, dates: { start: c.dates.start, end: c.dates.start } };
  }
  return c;
}

export function parseCriteria(params: URLSearchParams): SearchCriteria {
  const species = params.get("species");
  const care = params.get("care");
  const max = Number(params.get("max"));
  const from = params.get("from");
  const to = params.get("to");
  /* Normalised, not matched exactly, so links written before the commune codes
     were slugified still resolve to the right area rather than silently
     falling back to "anywhere". */
  const commune = normalizeCommuneCode(params.get("commune"));
  const wilaya = commune
    ? (getWilayaOfCommune(commune)?.code ?? null)
    : (getWilaya(params.get("wilaya"))?.code ?? null);

  return normalizeCriteria({
    species: (SPECIES as readonly string[]).includes(species ?? "") ? (species as Species) : null,
    care: (CARE_TYPES as readonly string[]).includes(care ?? "") ? (care as CareType) : null,
    wilaya,
    commune,
    maxPrice: (PRICE_STEPS as readonly number[]).includes(max) ? max : null,
    dates: isISODate(from) && isISODate(to) && from <= to ? { start: from, end: to } : null,
  });
}

export function criteriaToParams(c: SearchCriteria): Record<string, string> {
  const out: Record<string, string> = {};
  if (c.species) out.species = c.species;
  if (c.care) out.care = c.care;
  if (c.commune) out.commune = c.commune;
  else if (c.wilaya) out.wilaya = c.wilaya;
  if (c.maxPrice !== null) out.max = String(c.maxPrice);
  if (c.dates) {
    out.from = c.dates.start;
    out.to = c.dates.end;
  }
  return out;
}

export function criteriaFromNeed(need: OwnerNeed): SearchCriteria {
  return normalizeCriteria({
    species: need.species,
    care: need.careType,
    wilaya: need.wilayaCode,
    commune: need.communeCode,
    maxPrice: need.maxPrice,
    dates: need.dates,
  });
}

/**
 * The reverse direction, so adjusting the filters updates the brief the request
 * summary will later quote. Round-trips exactly: every field of
 * `SearchCriteria` has a counterpart here.
 *
 * `petId` is deliberately absent — it is not a filter, it is not in the URL,
 * and clearing the filters must not throw away the animal the owner described.
 */
export function needPatchFromCriteria(c: SearchCriteria): Partial<OwnerNeed> {
  return {
    species: c.species,
    careType: c.care,
    wilayaCode: c.wilaya,
    communeCode: c.commune,
    maxPrice: c.maxPrice,
    dates: c.dates,
  };
}

export function activeCriteriaCount(c: SearchCriteria): number {
  return [c.species, c.care, c.commune ?? c.wilaya, c.maxPrice, c.dates].filter((v) => v !== null && v !== undefined)
    .length;
}

/**
 * Why this sitter fits.
 *
 * Concrete facts the owner asked about, not a score. §8.2 is explicit:
 * "explication concrète > précision numérique fictive", and §8.3 forbids
 * inventing a compatibility percentage. Every reason here is a hard constraint
 * that was checked, expressed in the words of the thing that was checked.
 */
export type MatchReason =
  | { kind: "species"; species: Species }
  | { kind: "care"; care: CareType }
  | { kind: "zone"; zone: string }
  /** An ABSENCE, not a confirmation: the sitter has not declared this period
      unavailable. Nidz holds no reservations. Every surface that renders this
      must keep it in a lower visual register than the facts a sitter actively
      declared, or four check marks in a row read as four confirmations. */
  | { kind: "dates" }
  | { kind: "noCat" };

/**
 * Why this sitter fits, verified fact by fact against the sitter.
 *
 * Every check here is independent of the filter that produced the criteria.
 * `matchSitters` could get away with echoing the criteria back, because it
 * filters first — a profile page cannot: `/sitters/karim-b?species=cat` is a
 * URL anyone can type, and echoing would print "Accepte les chats" about a
 * dog-only sitter. A reason is only ever emitted when the sitter's own data
 * says so.
 */
export function reasonsFor(sitter: SitterProfile, c: SearchCriteria): MatchReason[] {
  const reasons: MatchReason[] = [];

  if (c.species && sitter.acceptedSpecies.includes(c.species)) {
    reasons.push({ kind: "species", species: c.species });
  }
  if (c.care && offeredServices(sitter).includes(c.care)) {
    reasons.push({ kind: "care", care: c.care });
  }
  /* Zone is reported whenever location narrowed the search, including a
     wilaya-only search — otherwise the thing that shortened the list is the
     one thing never explained. */
  if (c.commune && sitter.communeCode === c.commune) {
    reasons.push({ kind: "zone", zone: sitter.communeCode });
  } else if (!c.commune && c.wilaya && getWilayaOfCommune(sitter.communeCode)?.code === c.wilaya) {
    reasons.push({ kind: "zone", zone: sitter.communeCode });
  }
  if (c.dates && !overlapsDeclaredUnavailable(sitter, c.dates)) {
    reasons.push({ kind: "dates" });
  }
  /* Only meaningful for a cat-free home when a dog owner asked, and only
     because the sitter declared their resident animals. */
  if (c.species === "dog" && !sitter.housing.residentPets.some((p) => p.species === "cat")) {
    reasons.push({ kind: "noCat" });
  }

  return reasons;
}

export type SearchResult = {
  sitter: SitterProfile;
  rate: NonNullable<ReturnType<typeof rateFor>>;
  reasons: MatchReason[];
};

/**
 * Hard constraints only (§8.1). Nothing is ranked by reputation, distance or
 * responsiveness, because Nidz measures none of those — the order is the price
 * actually displayed, and the results screen says so.
 */
export function matchSitters(sitters: SitterProfile[], c: SearchCriteria): SearchResult[] {
  return sitters
    .flatMap<SearchResult>((sitter) => {
      const rate = rateFor(sitter, c.care ? [c.care] : []);
      if (!rate) return [];

      if (c.species && !sitter.acceptedSpecies.includes(c.species)) return [];
      if (c.care && !offeredServices(sitter).includes(c.care)) return [];
      if (c.commune && sitter.communeCode !== c.commune) return [];
      if (!c.commune && c.wilaya && getWilayaOfCommune(sitter.communeCode)?.code !== c.wilaya) return [];
      if (c.maxPrice !== null && rate.amount > c.maxPrice) return [];
      /* A period the sitter has DECLARED unavailable is a statement by them,
         and excluding it is honest. The reverse is not: not-declared-busy is
         never "confirmed available", and the results screen must say so. */
      if (c.dates && overlapsDeclaredUnavailable(sitter, c.dates)) return [];

      return [{ sitter, rate, reasons: reasonsFor(sitter, c) }];
    })
    .sort((a, b) => a.rate.amount - b.rate.amount);
}
