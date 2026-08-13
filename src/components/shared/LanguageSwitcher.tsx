import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n, { SUPPORTED_LOCALES, AppLocale } from "@/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * `compact` shows the icon and the language code only.
 *
 * It exists because the flow screens carry no site header, and a trilingual
 * product whose entire onboarding cannot change language is broken for anyone
 * whose browser reports the wrong locale (§34). At 320px the full trigger plus
 * the 44px back control does not fit, so the compact form keeps the touch
 * target and drops the width instead.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const current = (i18n.language?.split("-")[0] as AppLocale) || "en";

  const label = (lng: AppLocale) =>
    lng === "en" ? t("common.english") : lng === "fr" ? t("common.french") : t("common.arabic");

  return (
    <Select value={current} onValueChange={(lng) => i18n.changeLanguage(lng)}>
      <SelectTrigger
        aria-label={t("common.language")}
        className={cn(compact ? "h-11 w-auto gap-2 px-3" : "w-36")}
      >
        {compact && <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        {compact ? (
          <span className="text-sm font-medium uppercase">{current}</span>
        ) : (
          <SelectValue placeholder={t("common.language")} />
        )}
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
