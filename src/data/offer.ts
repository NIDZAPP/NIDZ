/* ---------------------------------------------------------------------------
   WHAT A SITTER OFFERS — business rules over a `SitterProfile`.

   Moved out of `demo-sitters.ts` at Audit 1.3 LOT 10: these are rules about
   ANY profile (a fixture, the visitor's own, a future server record), and
   leaving them in the fixture file made every screen that priced a service
   import the fake directory to do it. The fixture file now holds fixtures
   only.
   ------------------------------------------------------------------------ */

import type { CareType, DateRange, SitterProfile } from "./types";

/**
 * The services a sitter actually offers.
 *
 * `services` is the declaration and `rates` only supplies prices, so this is
 * the single answer to "what does this person do" — reading `Object.keys(rates)`
 * instead lets the two drift, and a service with no price is not something the
 * owner can be quoted for.
 */
export function offeredServices(sitter: SitterProfile): CareType[] {
  return sitter.services.filter((service) => typeof sitter.rates[service] === "number");
}

function cheapestOf(sitter: SitterProfile, pool: CareType[]) {
  if (pool.length === 0) return null;
  const careType = pool.reduce((a, b) => ((sitter.rates[a] as number) <= (sitter.rates[b] as number) ? a : b));
  return { careType, amount: sitter.rates[careType] as number };
}


/**
 * The rate to display for a given search.
 *
 * The price shown must belong to a service the owner actually asked for.
 * Quoting the cheapest of ALL services when several were requested would
 * headline a 700 DZD walk against a "boarding or home visits" search whose
 * real prices are 1500 and 900 — and `/search` filters on this same amount,
 * so it would also let a sitter through a budget they exceed.
 */
export function rateFor(
  sitter: SitterProfile,
  careTypes: CareType[],
): { amount: number; careType: CareType; isFrom: boolean } | null {
  const offered = offeredServices(sitter);
  const asked = careTypes.filter((c) => offered.includes(c));
  /* Narrow to what was asked when anything was; otherwise the whole offer. */
  const pool = asked.length ? asked : offered;
  const cheapest = cheapestOf(sitter, pool);
  if (!cheapest) return null;
  /* "From" only when the quoted price is one of several the pool contains. */
  return { ...cheapest, isFrom: pool.length > 1 };
}

/**
 * Whether the sitter has DECLARED themselves unavailable over any part of the
 * range. A `false` result means "has not declared this period unavailable" —
 * never "confirmed available". Nidz holds no reservations, so the UI must not
 * upgrade this into a booking guarantee (§6.1, §28).
 */
export function overlapsDeclaredUnavailable(sitter: SitterProfile, dates: DateRange): boolean {
  return sitter.declaredUnavailable.some((u) => u.start <= dates.end && dates.start <= u.end);
}
