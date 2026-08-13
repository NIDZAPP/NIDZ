import { useTranslation } from "react-i18next";

import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n";

/** The current locale, narrowed to one Nidz actually ships. i18next reports
    region tags like `fr-DZ`, and `Localized` records are keyed by base
    language, so every screen was repeating the same split-and-check. */
export function useAppLocale(): AppLocale {
  const { i18n } = useTranslation();
  const base = i18n.language?.split("-")[0] ?? "";
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as AppLocale) : "en";
}
