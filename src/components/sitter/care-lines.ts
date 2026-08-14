import type { TFunction } from "i18next";

import type { CareConditions } from "@/data/care-conditions";
import type { Declared } from "@/data/pets";
import { localized, type Species } from "@/data/types";
import type { AppLocale } from "@/i18n";

/**
 * The care section of a public profile, as sentences (§57, §20).
 *
 * Sentences rather than chips, and blocks rather than one long list, because
 * §20's question is "can I picture concretely how my animal will be looked
 * after" — four tokens cannot answer it, and thirty ungrouped ones are worse.
 *
 * ONLY ANSWERED QUESTIONS APPEAR. A skipped question produces no line at all,
 * never "not specified": a profile listing fifteen blanks reads as a failing
 * grade for a sitter who simply has not finished, and §118 keeps completeness
 * away from quality. `unknown` is a skip; `"no"` is an ANSWER and does appear,
 * because "the cat is not kept indoors" is exactly what an indoor cat's owner
 * needs to read.
 *
 * A block with no answered questions is dropped by the caller.
 */
export type CareBlock = { id: string; title: string; lines: string[] };

export function careLines(
  care: CareConditions,
  acceptedSpecies: readonly Species[],
  t: TFunction,
  lng: AppLocale,
): CareBlock[] {
  /** A yes/no answer, or nothing when the question was skipped. */
  const yesNo = (value: Declared, key: string) =>
    value === "unknown" ? null : t(key, { answer: t(`pets.declared.${value}`) });

  const text = (value: { en: string; fr: string; ar: string }) => {
    const written = localized(value, lng).trim();
    return written.length > 0 ? written : null;
  };

  /* `false` as well as `null`: a `x !== null && t(...)` guard yields one and a
     `x && t(...)` guard the other, and both mean "not answered". */
  const keep = (lines: (string | null | false)[]) =>
    lines.filter((l): l is string => typeof l === "string" && l.length > 0);

  const blocks: CareBlock[] = [
    {
      id: "home",
      title: t("sitterCare.blocks.inTheHome"),
      lines: keep([
        care.movement && t(`profile.care.movement.${care.movement}`),
        text(care.restrictedRooms) &&
          t("profile.care.restrictedRooms", { rooms: text(care.restrictedRooms) }),
        care.sleeping && t(`profile.care.sleeping.${care.sleeping}`),
      ]),
    },
    {
      id: "containment",
      title: t("sitterCare.blocks.containment"),
      /* The reason is not optional dressing on this one. `SectionCare` refuses
         to save a containment answer without it, so the two always travel
         together — the fact alone is the version most likely to be misread. */
      lines: keep([
        care.containment.use && t(`profile.care.containment.${care.containment.use}`),
        care.containment.use && care.containment.use !== "never" ? text(care.containment.reason) : null,
      ]),
    },
    {
      id: "day",
      title: t("sitterCare.blocks.theDay"),
      lines: keep([
        care.presence && t(`profile.care.presence.${care.presence}`),
        care.maxHoursAlone !== null &&
          t("profile.care.maxHoursAlone", { count: care.maxHoursAlone }),
        care.feeding && t(`profile.care.feeding.${care.feeding}`),
        text(care.enrichment),
      ]),
    },
  ];

  if (acceptedSpecies.includes("dog")) {
    blocks.push({
      id: "dog",
      title: t("sitterCare.blocks.dogs"),
      lines: keep([
        care.dog.walksPerDay !== null && t("profile.care.dog.walks", { count: care.dog.walksPerDay }),
        care.dog.walkMinutes !== null &&
          t("profile.care.dog.minutes", { count: care.dog.walkMinutes }),
        yesNo(care.dog.offLeash, "profile.care.dog.offLeash"),
        yesNo(care.dog.gardenAccess, "profile.care.dog.garden"),
      ]),
    });
  }

  if (acceptedSpecies.includes("cat")) {
    blocks.push({
      id: "cat",
      title: t("sitterCare.blocks.cats"),
      lines: keep([
        care.cat.litterBoxes !== null && t("profile.care.cat.litter", { count: care.cat.litterBoxes }),
        yesNo(care.cat.indoorOnly, "profile.care.cat.indoor"),
        yesNo(care.cat.hidingSpaces, "profile.care.cat.hiding"),
      ]),
    });
  }

  if (acceptedSpecies.includes("bird")) {
    blocks.push({
      id: "bird",
      title: t("sitterCare.blocks.birds"),
      lines: keep([
        care.bird.outOfCageHours !== null &&
          t("profile.care.bird.outOfCage", { count: care.bird.outOfCageHours }),
        yesNo(care.bird.flightSafeRoom, "profile.care.bird.flightSafe"),
        yesNo(care.bird.coversAtNight, "profile.care.bird.covers"),
      ]),
    });
  }

  blocks.push({
    id: "outside",
    title: t("sitterCare.blocks.outsideAndEmergencies"),
    lines: keep([
      care.transport.length > 0 &&
        t("profile.care.transport", {
          modes: care.transport.map((m) => t(`sitterCare.transport.${m}`)).join(" · "),
        }),
      yesNo(care.emergency.canReachVet, "profile.care.canReachVet"),
      text(care.emergency.plan),
    ]),
  });

  return blocks.filter((block) => block.lines.length > 0);
}
