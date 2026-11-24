import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppLocale } from "@/hooks/use-locale";
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Each language written in itself — an endonym, not a translation. Someone
 * landed in the wrong language has to recognise their own without reading the
 * one they are lost in, so "العربية" stays "العربية" in the French interface.
 * Data, not copy: it never changes with the interface language.
 */
const ENDONYM: Record<AppLocale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

/** Menu order: the two languages of daily life in Algeria first. */
const ORDER: AppLocale[] = ["fr", "ar", "en"];

/**
 * The language chooser, as a single icon (design system amendment 0.1 —
 * « déclencheur icône seule, menu accessible au clic, avec nom accessible »).
 *
 * The trigger shows no code: its accessible name says what it does and which
 * language is current ("Langue : Français"), so a screen reader hears both.
 * The menu is a Radix radio group — arrow keys, Escape, focus return — with
 * each entry marked up in its own language (`lang`), so it is read and
 * shaped correctly.
 *
 * Selecting writes an EXPLICIT choice (`setLocale`), which is what stops Nidz
 * following the device from then on.
 */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const current = useAppLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.languageCurrent", { name: ENDONYM[current] })}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "bg-card text-foreground shadow-pill hover:bg-secondary data-[state=open]:bg-secondary",
          className,
        )}
      >
        <Languages className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">
          {t("common.language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={(lng) => setLocale(lng as AppLocale)}>
          {ORDER.filter((lng) => SUPPORTED_LOCALES.includes(lng)).map((lng) => (
            <DropdownMenuRadioItem key={lng} value={lng} lang={lng}>
              {ENDONYM[lng]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
