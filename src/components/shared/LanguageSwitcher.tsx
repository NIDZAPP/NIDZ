import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useAppLocale } from "@/hooks/use-locale";
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from "@/i18n";

/**
 * The language chooser — on the ENTRY SCREEN ONLY.
 *
 * §89 takes the selector out of the rest of the product: Nidz follows the
 * device on first launch, and a manual choice lives in Settings. The entry
 * screen is the documented exception, and it is the one that matters: it is
 * exactly where detection may have guessed wrong, and it is the only screen a
 * first-time visitor sees before they have any reason to know Settings exists.
 *
 * Everywhere else there is a Settings link instead — in the header on browsable
 * screens, in the top bar on flow screens.
 *
 * Shows the icon and the language code only. At 320px a full-width trigger does
 * not fit beside the rest of a top bar, so this keeps the 44px touch target and
 * drops the width. There is no wide variant, because nothing is left that would
 * use one.
 *
 * Selecting here writes an EXPLICIT choice (`setLocale`), which is what stops
 * Nidz following the device from then on.
 */
export default function LanguageSwitcher() {
  const { t } = useTranslation();
  /* The shared hook rather than a local `as AppLocale` cast: it validates the
     value instead of asserting it, and i18next can report a region tag. */
  const current = useAppLocale();

  const label = (lng: AppLocale) =>
    lng === "en" ? t("common.english") : lng === "fr" ? t("common.french") : t("common.arabic");

  return (
    <Select value={current} onValueChange={(lng) => setLocale(lng as AppLocale)}>
      <SelectTrigger aria-label={t("common.language")} className="h-11 w-auto gap-2 px-3">
        <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium uppercase">{current}</span>
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((lng) => (
          <SelectItem key={lng} value={lng}>
            {label(lng)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
