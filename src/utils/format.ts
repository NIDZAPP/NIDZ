export const DZD_FORMATTERS: Record<string, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
  fr: new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
  ar: new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
};

export function formatDZD(amount: number, locale: 'en' | 'fr' | 'ar' = 'en') {
  return (DZD_FORMATTERS[locale] || DZD_FORMATTERS.en).format(amount);
}
