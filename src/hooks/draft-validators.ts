import { isISODate } from "@/utils/dates";
import type { DateRange } from "@/data/types";

/* Validators for `useDraftField`, for the values `conformTo` cannot judge by
   shape alone: a closed list of answers, or an array of records. Each returns
   null to REJECT what came out of storage, and the field falls back to the
   saved value. */

/** One value from a closed list. */
export const oneOf =
  <T extends string>(values: readonly T[]) =>
  (raw: unknown): T | null =>
    (values as readonly unknown[]).includes(raw) ? (raw as T) : null;

/** Several values from a closed list; anything else in the array is dropped. */
export const listOf =
  <T extends string>(values: readonly T[]) =>
  (raw: unknown): T[] | null =>
    Array.isArray(raw) ? values.filter((v) => raw.includes(v)) : null;

/** A record of strings keyed by a closed list — e.g. a typed price per service. */
export const stringsKeyedBy =
  <K extends string>(keys: readonly K[]) =>
  (raw: unknown): Partial<Record<K, string>> | null => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const out: Partial<Record<K, string>> = {};
    for (const key of keys) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof v === "string") out[key] = v;
    }
    return out;
  };

/** A record of closed-list answers keyed by a closed list. */
export const answersKeyedBy =
  <K extends string, V extends string>(keys: readonly K[], values: readonly V[]) =>
  (raw: unknown, fallback: Record<K, V>): Record<K, V> | null => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const out = { ...fallback };
    for (const key of keys) {
      const v = (raw as Record<string, unknown>)[key];
      if ((values as readonly unknown[]).includes(v)) out[key] = v as V;
    }
    return out;
  };

const isRange = (v: unknown): v is DateRange =>
  typeof v === "object" &&
  v !== null &&
  isISODate((v as DateRange).start) &&
  isISODate((v as DateRange).end) &&
  (v as DateRange).start <= (v as DateRange).end;

/** Date ranges, each checked as the thing a screen will format. */
export const dateRanges = (raw: unknown): DateRange[] | null =>
  Array.isArray(raw) ? raw.filter(isRange).map(({ start, end }) => ({ start, end })) : null;

/** A single range, or nothing chosen yet. Rejecting returns the fallback. */
export const dateRangeOrNull = (raw: unknown): DateRange | null =>
  isRange(raw) ? { start: raw.start, end: raw.end } : null;
