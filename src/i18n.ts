import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

const resources = { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } } as const;

export const SUPPORTED_LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Where an EXPLICIT language choice is stored.
 *
 * The distinction this key exists to make (§89): a language Nidz guessed from
 * the device is not the same fact as a language the person chose, and only the
 * second should survive as a preference.
 *
 * Until Audit 1.2 the detector cached whatever it detected under `i18nextLng`,
 * which collapsed the two — after one visit there was no way to tell a guess
 * from a decision, and no way to go back to following the device. Detection is
 * now cacheless (`caches: []`) and this key is written only by `setLocale`,
 * which is called only from Settings.
 */
export const LOCALE_KEY = "nidz.lang";

/** The key i18next's detector used to write to on its own. Read once, then
    removed — see `adoptLegacyChoice`. */
const LEGACY_LOCALE_KEY = "i18nextLng";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Carry a 1.1 visitor's language across.
 *
 * Their `i18nextLng` may have been a real choice or merely a cached guess, and
 * nothing recorded which. Adopting it is the better of the two errors: if it
 * was a choice it is preserved, and if it was a guess, re-detection would
 * almost always produce the same value anyway. The legacy key is then removed
 * so the ambiguity does not outlive the migration.
 */
function adoptLegacyChoice(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(LEGACY_LOCALE_KEY);
    if (!legacy) return;
    if (!window.localStorage.getItem(LOCALE_KEY)) {
      const base = legacy.split("-")[0];
      if (isAppLocale(base)) window.localStorage.setItem(LOCALE_KEY, base);
    }
    window.localStorage.removeItem(LEGACY_LOCALE_KEY);
  } catch {
    /* Private mode or a full quota: the visitor follows their device instead,
       which is the same behaviour as a first visit. */
  }
}

/** Record an explicit choice and apply it. The only writer of `LOCALE_KEY`. */
export function setLocale(locale: AppLocale): void {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* Storage unavailable — the choice still applies for this session. */
  }
  void i18n.changeLanguage(locale);
}

/** Whether the current language was chosen rather than guessed. Settings uses
    it to say which of the two is happening, instead of implying a decision the
    visitor never made. */
export function hasExplicitLocale(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return isAppLocale(window.localStorage.getItem(LOCALE_KEY));
  } catch {
    return false;
  }
}

/** `dir` and `lang` on <html>. The direction attribute is the ONE mechanism the
    styles key on — Tailwind's `rtl:` variant compiles to `[dir="rtl"]`, and
    `src/index.css` uses the same selector — so there is no companion class to
    keep in step. */
function updateDir(lng: string) {
  /* Compared on the BASE language. `supportedLngs` normally folds `ar-DZ` down
     to `ar`, but detection is the only thing setting the initial language now,
     and an exact `lng === "ar"` test would leave an Arabic reader on a
     region-tagged device with an unmirrored layout. `useAppLocale` already
     splits the same way. */
  const base = lng.split("-")[0];
  const html = document.documentElement;
  html.setAttribute("lang", base);
  html.setAttribute("dir", base === "ar" ? "rtl" : "ltr");
}

adoptLegacyChoice();

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
      /* Exactly two sources, and that is deliberate.
         §89 asks for one rule the interface can state plainly: Nidz follows
         your device until you choose, and after that it keeps your choice.
         `querystring` was a third source that Settings could not describe —
         someone arriving on a shared `?lng=ar` link would be told Nidz was
         "following your device's language" while it was doing nothing of the
         kind. Removed rather than papered over with a third status string for a
         path nothing in the product links to. */
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_KEY,
      /* Never write on detection. Caching here is what made a guess look like a
         decision; `setLocale` is the only writer. */
      caches: [],
    },
  })
  .then(() => updateDir(i18n.language));

i18n.on("languageChanged", (lng) => updateDir(lng));

export default i18n;
