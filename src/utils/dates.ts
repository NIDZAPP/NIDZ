import type { AppLocale } from "@/i18n";
import type { DateRange } from "@/data/types";

/** ISO `YYYY-MM-DD` in LOCAL time. `toISOString()` would shift the date across
    the UTC boundary, which in Algeria (UTC+1) turns "today" into "yesterday"
    for anything before 01:00. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Parse `YYYY-MM-DD` as a local date. `new Date("2026-08-20")` parses as UTC
    midnight, which renders as the 19th in a negative-offset zone. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}


const DATE_FORMATS: Record<AppLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-DZ", { day: "numeric", month: "long" }),
  fr: new Intl.DateTimeFormat("fr-DZ", { day: "numeric", month: "long" }),
  ar: new Intl.DateTimeFormat("ar-DZ", { day: "numeric", month: "long" }),
};

export function formatDate(iso: string, locale: AppLocale): string {
  return (DATE_FORMATS[locale] ?? DATE_FORMATS.en).format(fromISODate(iso));
}

/** "12 – 16 août". Collapses to a single date when the range is one day, which
    is how a walk is stored (`start === end`). */
export function formatDateRange(range: DateRange, locale: AppLocale): string {
  if (range.start === range.end) return formatDate(range.start, locale);
  return `${formatDate(range.start, locale)} – ${formatDate(range.end, locale)}`;
}
