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

import { normalizeCommuneId, getWilaya, getWilayaOfCommune, wilayaOfPlace } from "./algeria";
import { offeredServices, overlapsDeclaredUnavailable, rateFor } from "./offer";
import {
  CARE_TYPES,
  DOG_SIZES,
  SPECIES,
  type CareType,
  type DateRange,
  type DogSize,
  type OwnerNeed,
  type SitterProfile,
  type Species,
} from "./types";
import type { Pet } from "./pets";
import { isISODate } from "@/utils/dates";

export const PRICE_STEPS = [600, 900, 1200] as const;

/**
 * How results are ordered.
 *
 * `default` is the explainable order (see `matchSitters`): the owner's own
 * commune first, then alphabetical. `price` is an option the owner CHOSE, and
 * the results screen names it as such — Audit 1.3 LOT 03 forbids letting
 * "cheapest first" pass itself off as relevance.
 */
export type SortOrder = "default" | "price";

export type SearchCriteria = {
  species: Species | null;
  /** Only meaningful when `species` is "dog" — `normalizeCriteria` clears it
      otherwise. A hard constraint: a sitter who declared they take only small
      dogs is not shown for a large one (Audit 1.3 LOT 03). */
  size: DogSize | null;
  care: CareType | null;
  wilaya: string | null;
  commune: string | null;
  maxPrice: number | null;
  dates: DateRange | null;
  /** An ordering preference, not a filter: never counted as a criterion. */
  sort: SortOrder;
};

export const EMPTY_CRITERIA: SearchCriteria = {
  species: null,
  size: null,
  care: null,
  wilaya: null,
  commune: null,
  maxPrice: null,
  dates: null,
  sort: "default",
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
  let out = c;
  if (out.care === "walk" && out.dates && out.dates.start !== out.dates.end) {
    out = { ...out, dates: { start: out.dates.start, end: out.dates.start } };
  }
  /* A size is a fact about a dog. Kept with any other species it would filter
     cat sitters on a dog size nobody can see in the brief. */
  if (out.size && out.species !== "dog") out = { ...out, size: null };
  return out;
}

export function parseCriteria(params: URLSearchParams): SearchCriteria {
  const species = params.get("species");
  const size = params.get("size");
  const care = params.get("care");
  const max = Number(params.get("max"));
  const from = params.get("from");
  const to = params.get("to");
  /* Normalised, not matched exactly, so links written before the commune codes
     were slugified still resolve to the right area rather than silently
     falling back to "anywhere". */
  const commune = normalizeCommuneId(params.get("commune"));
  const wilaya = commune
    ? (getWilayaOfCommune(commune)?.id ?? null)
    : (getWilaya(params.get("wilaya"))?.id ?? null);

  return normalizeCriteria({
    species: (SPECIES as readonly string[]).includes(species ?? "") ? (species as Species) : null,
    size: (DOG_SIZES as readonly string[]).includes(size ?? "") ? (size as DogSize) : null,
    care: (CARE_TYPES as readonly string[]).includes(care ?? "") ? (care as CareType) : null,
    wilaya,
    commune,
    maxPrice: (PRICE_STEPS as readonly number[]).includes(max) ? max : null,
    dates: isISODate(from) && isISODate(to) && from <= to ? { start: from, end: to } : null,
    sort: params.get("sort") === "price" ? "price" : "default",
  });
}

export function criteriaToParams(c: SearchCriteria): Record<string, string> {
  const out: Record<string, string> = {};
  if (c.species) out.species = c.species;
  if (c.size) out.size = c.size;
  if (c.care) out.care = c.care;
  if (c.commune) out.commune = c.commune;
  else if (c.wilaya) out.wilaya = c.wilaya;
  if (c.maxPrice !== null) out.max = String(c.maxPrice);
  if (c.dates) {
    out.from = c.dates.start;
    out.to = c.dates.end;
  }
  if (c.sort === "price") out.sort = "price";
  return out;
}

export function criteriaFromNeed(need: OwnerNeed): SearchCriteria {
  return normalizeCriteria({
    species: need.species,
    /* Storage is untrusted: only a size this build knows reaches a filter. */
    size: (DOG_SIZES as readonly (string | null)[]).includes(need.dogSize) ? need.dogSize : null,
    care: need.careType,
    wilaya: need.wilayaCode,
    commune: need.communeCode,
    maxPrice: need.maxPrice,
    dates: need.dates,
    sort: "default",
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
    dogSize: c.size,
    careType: c.care,
    wilayaCode: c.wilaya,
    communeCode: c.commune,
    maxPrice: c.maxPrice,
    dates: c.dates,
  };
}

export function activeCriteriaCount(c: SearchCriteria): number {
  return [c.species, c.size, c.care, c.commune ?? c.wilaya, c.maxPrice, c.dates].filter(
    (v) => v !== null && v !== undefined,
  ).length;
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
  /** The dog size that was asked for, and that this sitter declared they
      take. Never emitted for an unknown size: silence is not a match. */
  | { kind: "size"; size: DogSize }
  | { kind: "care"; care: CareType }
  /** `level` records WHAT was matched. A wilaya-wide search matched the
      wilaya, not the commune — naming the commune there would both repeat the
      location already printed under the sitter's name and imply the owner
      asked for that commune. */
  | { kind: "zone"; zone: string; level: "commune" | "wilaya" }
  /** An ABSENCE, not a confirmation: the sitter has not declared this period
      unavailable. Nidz holds no reservations. Every surface that renders this
      must keep it in a lower visual register than the facts a sitter actively
      declared, or four check marks in a row read as four confirmations. */
  | { kind: "dates" };
/* Audit 1.3 removed `noCat` ("Aucun chat déclaré au domicile"). It was added
   to every dog search although no owner had said anything about cats — a line
   about cats on a dog search, which is the pattern the field test flagged —
   and it was selective: a resident DOG, which matters more to a visiting dog,
   was never mentioned. Resident animals are stated on the profile, in full. */

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

  /* "Accepts large dogs" already says "accepts dogs": one reason, not two
     (Audit 1.3 LOT 06 — one or two concrete reasons, not a token list). */
  if (c.species === "dog" && c.size && sitter.acceptedSpecies.includes("dog") && sitter.acceptedDogSizes.includes(c.size)) {
    reasons.push({ kind: "size", size: c.size });
  } else if (c.species && sitter.acceptedSpecies.includes(c.species)) {
    reasons.push({ kind: "species", species: c.species });
  }
  if (c.care && offeredServices(sitter).includes(c.care)) {
    reasons.push({ kind: "care", care: c.care });
  }
  /* Zone is reported whenever location narrowed the search, including a
     wilaya-only search — otherwise the thing that shortened the list is the
     one thing never explained. */
  if (c.commune && sitter.communeCode === c.commune) {
    reasons.push({ kind: "zone", zone: sitter.communeCode, level: "commune" });
  } else if (!c.commune && c.wilaya && wilayaOfPlace(sitter) === c.wilaya) {
    reasons.push({ kind: "zone", zone: c.wilaya, level: "wilaya" });
  }
  if (c.dates && !overlapsDeclaredUnavailable(sitter, c.dates)) {
    reasons.push({ kind: "dates" });
  }
  return reasons;
}

export type SearchResult = {
  sitter: SitterProfile;
  rate: NonNullable<ReturnType<typeof rateFor>>;
  reasons: MatchReason[];
};

/**
 * Hard constraints, then an order that can be stated in one sentence
 * (§8.1, §116).
 *
 * WHAT ORDERS THE RESULTS, AND WHAT DELIBERATELY DOES NOT.
 *
 * Filtering is hard compatibility only: species, dog size, service, area,
 * budget, and a period the sitter has declared unavailable. A fact the owner
 * has not given (a dog's size) excludes nobody — it is not a mismatch — but it
 * is not reported as a match either; the card states the sitter's own limit
 * instead (Audit 1.3 LOT 03).
 *
 * Then the DEFAULT order is
 *
 *   1. sitters in the owner's OWN commune, when Nidz knows it and the search
 *      was not already narrowed to one commune;
 *   2. alphabetical by public name.
 *
 * Alphabetical is deliberate. It is neutral and anyone can check it; it makes
 * no claim that the first row is the "best match", which Nidz has no basis to
 * say. Audit 1.2 used price as the second tier, and Audit 1.3 LOT 03 names the
 * problem with that: cheapest-first quietly passes itself off as relevance.
 * Price ordering is still available — as an option the owner picks
 * (`sort: "price"`), and the screen says it was their choice.
 *
 * Proximity is expressed as a shared administrative area, never as a distance.
 * Nidz has no coordinates for anything (see docs/NIDZ-1.2-MAP-AND-LOCATION.md),
 * so "2.1 km away" would be a precision claim with nothing behind it, while
 * "in your commune" is a fact.
 *
 * Nothing else ranks, and each omission is a decision:
 *
 *   - REPUTATION and RESPONSE TIME: Nidz measures neither. There is no data.
 *   - PROFILE COMPLETENESS: it would rank a fuller profile above a better
 *     match, and it would push every new sitter to the bottom permanently —
 *     the fairness failure §120 names. Completeness is administrative (§118).
 *   - EXPERIENCE YEARS: a soft preference the owner did not express. Sorting on
 *     it silently answers a question nobody asked.
 *   - WEIGHTED SCORES: §116 rules out inventing weights for sophistication's
 *     sake. Two tiers, both statable in one sentence, is the whole ranking, and
 *     the results screen states it.
 */
/**
 * Identity of a reason, for deduplication.
 *
 * The VALUE has to be part of the key, not just the kind. Keying `zone` on the
 * kind alone made every sitter's commune look like the same reason, so a
 * wilaya-wide search decided the zone was universal and stated one sitter's
 * commune as true of all of them.
 */
export function reasonKey(reason: MatchReason): string {
  switch (reason.kind) {
    case "species":
      return `species:${reason.species}`;
    case "size":
      return `size:${reason.size}`;
    case "care":
      return `care:${reason.care}`;
    case "zone":
      return `zone:${reason.level}:${reason.zone}`;
    /* Listed explicitly rather than caught by `default`, so the next reason
       kind that carries a value cannot silently key on its kind alone and
       re-create the bug this docblock describes. */
    case "dates":
      return reason.kind;
  }
}

/**
 * Reasons derived from an ABSENCE rather than from something the sitter said.
 *
 * "Has not declared these dates unavailable" is true of a sitter who simply
 * never answered the question. Presenting
 * them with the same tick and tint as facts a sitter actively declared would
 * turn silence into confirmation, so every surface renders them one register
 * down (§6.1).
 */
export function isAbsenceReason(reason: MatchReason): boolean {
  return reason.kind === "dates";
}

/**
 * Split the reasons into the ones true of every result and the ones that vary.
 *
 * With hard-constraint-only matching, every criteria-derived reason is true of
 * every survivor by construction. A fact identical on all rows carries no
 * discriminating signal (§5.2) and costs three lines of tokens per row on a
 * 390px screen — the "mosaïque de badges" §19 forbids by name. So the shared
 * ones are stated once above the register, and only what actually distinguishes
 * one sitter from another stays on the row.
 */
export function partitionReasons(results: SearchResult[]): {
  universal: MatchReason[];
  perResult: Map<string, MatchReason[]>;
} {
  const perResult = new Map<string, MatchReason[]>();
  if (results.length === 0) return { universal: [], perResult };

  const counts = new Map<string, { reason: MatchReason; n: number }>();
  for (const { reasons } of results) {
    for (const reason of reasons) {
      const key = reasonKey(reason);
      const entry = counts.get(key);
      if (entry) entry.n += 1;
      else counts.set(key, { reason, n: 1 });
    }
  }

  /* A fact shared by one row is not shared — it is that row's. Hoisting it
     would leave the only entry on the page with no explanation at all, two
     blocks below the sentence that explains it. */
  if (results.length < 2) {
    for (const { sitter, reasons } of results) perResult.set(sitter.id, reasons);
    return { universal: [], perResult };
  }

  const universalKeys = new Set<string>();
  const universal: MatchReason[] = [];
  for (const [key, v] of counts) {
    if (v.n === results.length) {
      universalKeys.add(key);
      universal.push(v.reason);
    }
  }

  for (const { sitter, reasons } of results) {
    perResult.set(
      sitter.id,
      reasons.filter((r) => !universalKeys.has(reasonKey(r))),
    );
  }

  return { universal, perResult };
}

export function matchSitters(
  sitters: SitterProfile[],
  c: SearchCriteria,
  /** The owner's own commune, when they have told Nidz. Used only to break
      ties — never to filter, because someone looking for care in a commune
      they are travelling to is a normal case. */
  homeCommune: string | null = null,
  /** The interface language, so "alphabetical" means the same thing the
      sentence above the list says, whatever the browser's own locale. */
  locale = "en",
): SearchResult[] {
  /* A no-op when the search already names a commune: every result is in it. */
  const nearBy = c.commune ? null : homeCommune;
  const collator = new Intl.Collator(locale, { sensitivity: "base" });

  return sitters
    .flatMap<SearchResult>((sitter) => {
      const rate = rateFor(sitter, c.care ? [c.care] : []);
      if (!rate) return [];

      if (c.species && !sitter.acceptedSpecies.includes(c.species)) return [];
      if (c.species === "dog" && c.size && !sitter.acceptedDogSizes.includes(c.size)) return [];
      if (c.care && !offeredServices(sitter).includes(c.care)) return [];
      /* A commune search keeps only sitters who named that commune; a sitter
         who gave only their wilaya is found by a search of that wilaya, never
         presented as being in a commune they did not state. */
      if (c.commune && sitter.communeCode !== c.commune) return [];
      if (!c.commune && c.wilaya && wilayaOfPlace(sitter) !== c.wilaya) return [];
      if (c.maxPrice !== null && rate.amount > c.maxPrice) return [];
      /* A period the sitter has DECLARED unavailable is a statement by them,
         and excluding it is honest. The reverse is not: not-declared-busy is
         never "confirmed available", and the results screen must say so. */
      if (c.dates && overlapsDeclaredUnavailable(sitter, c.dates)) return [];

      return [{ sitter, rate, reasons: reasonsFor(sitter, c) }];
    })
    .sort((a, b) => {
      if (nearBy) {
        const aNear = a.sitter.communeCode === nearBy ? 0 : 1;
        const bNear = b.sitter.communeCode === nearBy ? 0 : 1;
        if (aNear !== bNear) return aNear - bNear;
      }
      /* Prices are only comparable in ONE unit. With no service chosen each
         sitter is quoted on their cheapest service — a walk against a night —
         so a price order would rank units, not prices. A stale `sort=price`
         without a service therefore falls back to the default order. */
      if (c.sort === "price" && c.care && a.rate.amount !== b.rate.amount) {
        return a.rate.amount - b.rate.amount;
      }
      return collator.compare(a.sitter.publicName, b.sitter.publicName);
    });
}

/**
 * The dog sizes a sitter restricts to, when the owner searched for a dog
 * WITHOUT giving its size. Null when the size was given (the filter already
 * guarantees it), when the sitter takes every size, or when the search is not
 * about a dog. The card states this limit so an unknown size is never read as
 * "this sitter will take my dog".
 */
export function sizeLimitToState(
  sitter: SitterProfile,
  c: Pick<SearchCriteria, "species" | "size">,
): DogSize[] | null {
  if (c.species !== "dog" || c.size) return null;
  if (!sitter.acceptedSpecies.includes("dog") || acceptsEveryDogSize(sitter)) return null;
  const sizes = DOG_SIZES.filter((size) => sitter.acceptedDogSizes.includes(size));
  /* A dog sitter with NO declared size (only possible through hand-edited
     storage) has nothing statable: "Dogs:  only" is not a sentence. */
  return sizes.length > 0 ? sizes : null;
}

/** Whether the home-commune tie-break actually changed anything, so the
    results screen can state the order truthfully instead of claiming a rule
    that did not apply. */
export function usedHomeCommune(
  results: SearchResult[],
  c: SearchCriteria,
  homeCommune: string | null,
): boolean {
  if (!homeCommune || c.commune) return false;
  return results.some((r) => r.sitter.communeCode === homeCommune);
}

/* ------------------------------------------------------------- pet ↔ sitter */

/**
 * Whether ONE particular animal can be put in front of ONE particular sitter.
 *
 * The request flow's hard constraint, and deliberately three-valued. Species
 * and declared dog size are facts on both sides, so a mismatch is certain and
 * the animal cannot be sent. But a dog whose size the owner never gave is not
 * proven compatible with a sitter who only takes small dogs — an absent answer
 * is not a match (Audit 1.3, LOT 03) — and it is not proven incompatible
 * either. That case is `unknown`, and the request screen asks for the missing
 * fact instead of guessing it.
 *
 * A sitter who accepts every size needs no answer, so `unknown` only arises
 * when the sitter actually restricts sizes.
 */
export type PetFit =
  | { fits: true }
  | { fits: false; reason: "species" }
  | { fits: false; reason: "size"; accepted: DogSize[] }
  | { fits: "unknown"; reason: "sizeUnknown"; accepted: DogSize[] };

/** Every declared size, in the canonical order, for a sitter who restricts. */
export function acceptsEveryDogSize(sitter: SitterProfile): boolean {
  return DOG_SIZES.every((size) => sitter.acceptedDogSizes.includes(size));
}

export function petFit(pet: Pet, sitter: SitterProfile): PetFit {
  if (!sitter.acceptedSpecies.includes(pet.species)) return { fits: false, reason: "species" };
  if (pet.species !== "dog" || acceptsEveryDogSize(sitter)) return { fits: true };

  const accepted = DOG_SIZES.filter((size) => sitter.acceptedDogSizes.includes(size));
  const size = pet.details.size;
  if (size === null) return { fits: "unknown", reason: "sizeUnknown", accepted };
  return accepted.includes(size) ? { fits: true } : { fits: false, reason: "size", accepted };
}
