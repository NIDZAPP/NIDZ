import { useTranslation } from "react-i18next";

import { communeName, getWilaya } from "@/data/algeria";
import type { MatchReason } from "@/data/criteria";
import type { CareType } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";

/**
 * Compatibility, in the words of the thing that was checked.
 *
 * Lives here rather than inline on a screen because the results register and
 * the profile must say the identical thing about the identical fact — two
 * copies of this switch would disagree within a couple of commits.
 *
 * Never a score. §8.2 is explicit that a concrete explanation beats a fake
 * number, and §8.3 forbids inventing a compatibility percentage outright.
 */
export function useReasonLabel() {
  const { t } = useTranslation();
  const lng = useAppLocale();

  /* Exhaustive by construction: adding a `MatchReason` kind without a label
     here is a type error, not a silent empty token. */
  return (reason: MatchReason): string => {
    switch (reason.kind) {
      case "species":
        return t(`accepts.${reason.species}`);
      case "care":
        return t(`care.${reason.care satisfies CareType}`);
      case "zone": {
        if (reason.level === "wilaya") {
          const wilaya = getWilaya(reason.zone);
          return wilaya ? (wilaya.name[lng] ?? wilaya.name.en) : reason.zone;
        }
        return communeName(reason.zone, lng) ?? reason.zone;
      }
      case "dates":
        return t("search.reason.dates");
      case "noCat":
        return t("search.reason.noCat");
    }
  };
}
