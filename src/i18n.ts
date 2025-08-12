import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

const resources = { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } } as const;

export const SUPPORTED_LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = typeof SUPPORTED_LOCALES[number];

function updateDir(lng: string) {
  const isRTL = lng === "ar";
  const html = document.documentElement;
  html.setAttribute("lang", lng);
  html.setAttribute("dir", isRTL ? "rtl" : "ltr");
  html.classList.toggle("rtl", isRTL);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "querystring", "navigator"],
      caches: ["localStorage"],
    },
  })
  .then(() => updateDir(i18n.language));

i18n.on("languageChanged", (lng) => updateDir(lng));

export default i18n;
