export const DZD_FORMATTERS: Record<string, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
  fr: new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
  ar: new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
};

export function formatDZD(amount: number, locale: 'en' | 'fr' | 'ar' = 'en') {
  return (DZD_FORMATTERS[locale] || DZD_FORMATTERS.en).format(amount);
}

/**
 * Wrap a value in Unicode bidi isolates (FSI … PDI) before it is interpolated
 * into a sentence.
 *
 * For strings that end up in a plain-text slot — a page title, an attribute,
 * a toast — where `<bdi>` cannot be used. Without it, "Amina B." inside an
 * Arabic sentence renders as ".Amina B": the trailing period is a neutral
 * character and takes the paragraph's direction.
 */
export function isolate(value: string): string {
  return `\u2068${value}\u2069`;
}

/** A locale-aware "a, b and c". Falls back to a plain comma list on an engine
    without `Intl.ListFormat` rather than throwing in the middle of a render. */
export function formatList(items: string[], locale: 'en' | 'fr' | 'ar' = 'en'): string {
  if (typeof Intl.ListFormat !== 'function') return items.join(locale === 'ar' ? '، ' : ', ');
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
}
