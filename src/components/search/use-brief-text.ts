import { getKind } from "@/data/animal-kinds";
import { useTranslation } from "react-i18next";

import { communeName, getWilaya } from "@/data/algeria";
import type { SearchCriteria } from "@/data/criteria";
import { CARE_UNIT_KEY, localized } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { formatDateRange } from "@/utils/dates";
import { formatDZD } from "@/utils/format";

/**
 * The owner's brief in words, for the capsule — one source for every screen
 * that carries it (results, profile), so it can never be phrased two ways.
 *
 *   title  — the animal: "Grands chiens" says both facts; "Chien" when the
 *            size was not given; null when no animal is asked.
 *   parts  — only what was actually chosen: care, dates, area, budget (a
 *            budget always with its unit — Audit 1.3 LOT 03).
 */
export function useBriefText(criteria: SearchCriteria): { title: string | null; parts: string[] } {
  const { t } = useTranslation();
  const lng = useAppLocale();

  const kind = criteria.species ? getKind(criteria.kind, criteria.species) : null;
  const title = !criteria.species
    ? null
    : kind
      ? kind.name[lng]
      : criteria.species === "other"
        ? t("catalogue.other")
        : t(`species.${criteria.species}`);

  const zone = criteria.commune
    ? (communeName(criteria.commune, lng) ?? criteria.commune)
    : criteria.wilaya
      ? localized(getWilaya(criteria.wilaya)?.name ?? { en: "", fr: "", ar: "" }, lng)
      : null;

  const parts = [
    ...(criteria.care ? [t(`care.${criteria.care}`)] : []),
    ...(criteria.dates ? [formatDateRange(criteria.dates, lng)] : []),
    ...(zone ? [zone] : []),
    ...(criteria.maxPrice !== null
      ? [
          t("search.filters.upToUnit", {
            price: formatDZD(criteria.maxPrice, lng),
            unit: criteria.care ? t(CARE_UNIT_KEY[criteria.care]) : t("search.filters.perService"),
          }),
        ]
      : []),
  ];

  return { title, parts };
}
