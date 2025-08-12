import { useTranslation } from "react-i18next";
import i18n, { SUPPORTED_LOCALES, AppLocale } from "@/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const current = (i18n.language as AppLocale) || "en";

  return (
    <Select defaultValue={current} onValueChange={(lng) => i18n.changeLanguage(lng)}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder={t("common.language")} />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LOCALES.map((lng) => (
          <SelectItem key={lng} value={lng}>
            {lng === "en" && t("common.english")}
            {lng === "fr" && t("common.french")}
            {lng === "ar" && t("common.arabic")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
