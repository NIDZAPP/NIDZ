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

import { normalizeCommuneId, getWilaya, getWilayaOfCommune, wilayaDistanceKm, wilayaOfPlace } from "./algeria";
import { serviceFits } from "./animal-catalogue";
import { getKind } from "./animal-kinds";
import { compatibility, compatibilityRank, type AnimalRef, type Compatibility } from "./compatibility";
import { offeredServices, overlapsDeclaredUnavailable, rateFor } from "./offer";
import {
  CARE_TYPES,
  isPetCategory,
  type CareType,
  type DateRange,
  type OwnerNeed,
  type PetCategory,
  type SitterProfile,
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
  /** The animal's category; « other » only for a saved animal of that kind. */
  species: PetCategory | null;
  /** A listed breed / species of that category (Nidz 1.7, replacing the dog
      size). It decides compatibility with a sitter who accepts only some
      kinds; `normalizeCriteria` drops a kind that is not of the category. */
  kind: string | null;
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
  kind: null,
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
  /* A breed belongs to its category: « Persan » kept on a dog search would
     filter dog sitters on a cat breed nobody can see in the brief. */
  if (out.kind && (!out.species || !getKind(out.kind, out.species))) out = { ...out, kind: null };
  /* A service the animal cannot have — a walk for a cat, boarding for an
     aquarium — is not a search anyone can mean. */
  if (out.care && out.species && !serviceFits(out.species, out.care)) out = { ...out, care: null };
  return out;
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
  const commune = normalizeCommuneId(params.get("commune"));
  const wilaya = commune
    ? (getWilayaOfCommune(commune)?.id ?? null)
    : (getWilaya(params.get("wilaya"))?.id ?? null);

  return normalizeCriteria({
    species: isPetCategory(species) ? species : null,
    /* An old `size=` link is simply ignored: dog size no longer filters. */
    kind: params.get("kind"),
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
  if (c.kind) out.kind = c.kind;
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
    species: isPetCategory(need.species) ? need.species : null,
    kind: typeof need.kindId === "string" ? need.kindId : null,
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
    kindId: c.kind,
    careType: c.care,
    wilayaCode: c.wilaya,
    communeCode: c.commune,
    maxPrice: c.maxPrice,
    dates: c.dates,
  };
}

export function activeCriteriaCount(c: SearchCriteria): number {
  return [c.species, c.kind, c.care, c.commune ?? c.wilaya, c.maxPrice, c.dates].filter(
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
  | { kind: "species"; species: PetCategory }
  /** The listed breed / species asked for, which this sitter accepts —
      either because they named it, or because they accept every kind of the
      category. Never emitted when the kind was not given: silence is not a
      match. */
  | { kind: "kind"; kindId: string; species: PetCategory }
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

  /* « Accepte les Sloughis » already says « accepte les chiens »: one reason,
     not two (Audit 1.3 LOT 06). Only CONFIRMED compatibility is a reason —
     « à confirmer » is stated on the card, never as a tick. */
  if (c.species) {
    const fit = compatibility(sitter, { species: c.species, kindId: c.kind });
    if (fit.level === "confirmed" && c.kind) reasons.push({ kind: "kind", kindId: c.kind, species: c.species });
    else if (fit.level === "confirmed") reasons.push({ kind: "species", species: c.species });
  }
  if (c.care && offeredServices(sitter).includes(c.care)) {
    reasons.push({ kind: "care", care: c.care });
  }
  /* Zone is reported for the place that was matched: the commune asked for,
     or the wilaya — never a commune the owner did not ask about. */
  if (c.commune && sitter.communeCode === c.commune) {
    reasons.push({ kind: "zone", zone: sitter.communeCode, level: "commune" });
  } else if (c.wilaya && wilayaOfPlace(sitter) === c.wilaya) {
    reasons.push({ kind: "zone", zone: c.wilaya, level: "wilaya" });
  }
  if (c.dates && !overlapsDeclaredUnavailable(sitter, c.dates)) {
    reasons.push({ kind: "dates" });
  }
  return reasons;
}

/* ---------------------------------------------------------------- proximity */

/** Where results are ordered from: the zone searched, else the owner's own
    area when they gave one. */
export type Origin = { wilayaCode: string | null; communeCode: string | null };

/**
 * How near a place is to the origin, as an ORDERING key (Nidz 1.7 §11, §13).
 *
 *   tier 0  the same commune;
 *   tier 1  the same wilaya;
 *   tier 2  another wilaya — `km` is the approximate distance between the two
 *           chefs-lieux (`algeria/positions.ts`), used only to order;
 *   tier 3  no origin, or a place Nidz cannot locate.
 *
 * Never rendered as a distance: Nidz has no position for any home, so « à
 * 2,1 km » would be a precision claim with nothing behind it. The screens say
 * « dans votre commune », « dans votre wilaya », « plus loin ».
 */
export type Proximity = { tier: 0 | 1 | 2 | 3; km: number };

export function proximity(origin: Origin | null, place: { wilayaCode?: string | null; communeCode?: string | null }): Proximity {
  const originWilaya = origin ? (origin.wilayaCode ?? getWilayaOfCommune(origin.communeCode)?.id ?? null) : null;
  if (!origin || !originWilaya) return { tier: 3, km: Number.POSITIVE_INFINITY };
  const placeWilaya = wilayaOfPlace(place);
  if (!placeWilaya) return { tier: 3, km: Number.POSITIVE_INFINITY };
  if (origin.communeCode && place.communeCode === origin.communeCode) return { tier: 0, km: 0 };
  if (placeWilaya === originWilaya) return { tier: 1, km: 0 };
  return { tier: 2, km: wilayaDistanceKm(originWilaya, placeWilaya) };
}

export function compareProximity(a: Proximity, b: Proximity): number {
  if (a.tier !== b.tier) return a.tier - b.tier;
  return a.km === b.km ? 0 : a.km < b.km ? -1 : 1;
}

export type SearchResult = {
  sitter: SitterProfile;
  rate: NonNullable<ReturnType<typeof rateFor>>;
  reasons: MatchReason[];
  /** Confirmed or « à confirmer » — an incompatible sitter is never a result. */
  compat: Compatibility;
  proximity: Proximity;
};

/**
 * Hard constraints, then an order that can be stated in one sentence
 * (§8.1, §116).
 *
 * WHAT ORDERS THE RESULTS, AND WHAT DELIBERATELY DOES NOT.
 *
 * Filtering is hard compatibility only (Nidz 1.7): an animal the sitter does
 * not accept (`compatibility.ts`), a service they do not offer, a budget, and
 * a period the sitter has declared unavailable. A fact the owner has not
 * given — the breed, for a sitter who takes only some — excludes nobody, but
 * it is not reported as a match either: the card says « à confirmer ».
 *
 * The zone is no longer a filter: « Nidz affiche d'abord les pet-sitters
 * proches ». The DEFAULT order is
 *
 *   1. nearness to the zone searched (or to the owner's own area): same
 *      commune, same wilaya, then other wilayas nearest first by the
 *      approximate distance between their chefs-lieux;
 *   2. confirmed compatibility before « à confirmer »;
 *   3. alphabetical by public name.
 *
 * Alphabetical is deliberate. It is neutral and anyone can check it; it makes
 * no claim that the first row is the "best match", which Nidz has no basis to
 * say. Audit 1.2 used price as the second tier, and Audit 1.3 LOT 03 names the
 * problem with that: cheapest-first quietly passes itself off as relevance.
 * Price ordering is still available — as an option the owner picks
 * (`sort: "price"`), and the screen says it was their choice.
 *
 * Proximity is SHOWN as a shared administrative area, never as a distance.
 * The only coordinates Nidz holds are approximate chef-lieu positions, used to
 * order other wilayas; "2.1 km away" would be a precision claim with nothing
 * behind it, while "in your commune" is a fact.
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
 *     sake. Three tiers, each statable in one sentence, is the whole ranking,
 *     and the results screen states it.
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
    case "kind":
      return `kind:${reason.kindId}`;
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
  /** The owner's own area, when they have told Nidz. Orders results when the
      search names no zone; never filters, because someone looking for care
      somewhere they are travelling to is a normal case. */
  home: Origin | null = null,
  /** The interface language, so "alphabetical" means the same thing the
      sentence above the list says, whatever the browser's own locale. */
  locale = "en",
): SearchResult[] {
  const origin: Origin | null = c.commune || c.wilaya ? { wilayaCode: c.wilaya, communeCode: c.commune } : home;
  const collator = new Intl.Collator(locale, { sensitivity: "base" });

  return sitters
    .flatMap<SearchResult>((sitter) => {
      const rate = rateFor(sitter, c.care ? [c.care] : []);
      if (!rate) return [];

      const compat: Compatibility = c.species
        ? compatibility(sitter, { species: c.species, kindId: c.kind })
        : { level: "confirmed", scope: "category" };
      if (compat.level === "incompatible") return [];
      if (c.care && !offeredServices(sitter).includes(c.care)) return [];
      if (c.maxPrice !== null && rate.amount > c.maxPrice) return [];
      /* A period the sitter has DECLARED unavailable is a statement by them,
         and excluding it is honest. The reverse is not: not-declared-busy is
         never "confirmed available", and the results screen must say so. */
      if (c.dates && overlapsDeclaredUnavailable(sitter, c.dates)) return [];

      return [{ sitter, rate, reasons: reasonsFor(sitter, c), compat, proximity: proximity(origin, sitter) }];
    })
    .sort((a, b) => {
      /* 1. Nearest first: commune, wilaya, then other wilayas by the
         approximate distance between chefs-lieux (Nidz 1.7). */
      const near = compareProximity(a.proximity, b.proximity);
      if (near !== 0) return near;
      /* 2. What is confirmed before what is to be confirmed. */
      const fit = compatibilityRank(a.compat) - compatibilityRank(b.compat);
      if (fit !== 0) return fit;
      /* Prices are only comparable in ONE unit. With no service chosen each
         sitter is quoted on their cheapest service — a walk against a night —
         so a price order would rank units, not prices. A stale `sort=price`
         without a service therefore falls back to the default order. */
      if (c.sort === "price" && c.care && a.rate.amount !== b.rate.amount) {
        return a.rate.amount - b.rate.amount;
      }
      /* 3. Alphabetical: neutral, checkable, and no claim that the first row
         is « the best ». */
      return collator.compare(a.sitter.publicName, b.sitter.publicName);
    });
}

/** Whether ordering was by a place at all, and whether anything sits outside
    the origin wilaya — so the results can say « plus loin » truthfully. */
export function splitByDistance(results: SearchResult[]): { near: SearchResult[]; farther: SearchResult[]; unplaced: boolean } {
  const unplaced = results.length > 0 && results.every((r) => r.proximity.tier === 3);
  if (unplaced) return { near: results, farther: [], unplaced };
  return {
    near: results.filter((r) => r.proximity.tier <= 1),
    farther: results.filter((r) => r.proximity.tier >= 2),
    unplaced,
  };
}

/* ------------------------------------------------------------- pet ↔ sitter */

/** A saved animal as matching sees it. */
export function petRef(pet: Pick<Pet, "species" | "kindId" | "kindOther">): AnimalRef {
  return { species: pet.species, kindId: pet.kindId, kindOther: pet.kindOther };
}

/**
 * Whether ONE particular animal can be put in front of ONE particular sitter —
 * the request flow's hard constraint, three-valued (see `compatibility.ts`).
 * An incompatible animal cannot be sent; an « à confirmer » one can, and the
 * request says what is to be confirmed instead of guessing it.
 */
export function petFit(pet: Pick<Pet, "species" | "kindId" | "kindOther">, sitter: SitterProfile): Compatibility {
  return compatibility(sitter, petRef(pet));
}
