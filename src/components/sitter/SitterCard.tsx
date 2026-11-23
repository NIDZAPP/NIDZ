import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { AnimalPortrait } from "@/components/illustrations/animals";
import { MatchReasonList } from "@/components/sitter/match";
import { ProvenanceLabel } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { acceptsEveryDogSize, sizeLimitToState, type MatchReason } from "@/data/criteria";
import { offeredServices, type rateFor } from "@/data/offer";
import { communeName, wilayaName, wilayaOfPlace } from "@/data/algeria";
import {
  CARE_UNIT_KEY,
  localized,
  type CareType,
  type DogSize,
  type Species,
  type SitterProfile,
} from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { formatDZD, formatList } from "@/utils/format";

/**
 * One entry in the results register.
 *
 * A register, not a grid of tiles: entries separated by hairlines on the page
 * ground. §16 ranks space > surface > border > shadow, and a bordered elevated
 * card spends all four at once on a low-importance element.
 *
 * A result card is not a mini profile (§19) — it carries only what decides
 * whether the profile is worth opening.
 *
 * AUDIT 1.3 LOT 03 — THE ANIMAL BEING SEARCHED FOR COMES FIRST. Under the
 * name and the commune, the first line is about the owner's animal: for a dog
 * search, which dog sizes this sitter takes. Other species the sitter also
 * accepts are no longer listed on a dog search — "Accepte les chats" on a
 * dog owner's result was noise presented as a selling point. The headline
 * (the sitter's own words) comes after the facts.
 */
export default function SitterCard({
  sitter,
  rate,
  reasons,
  askedSpecies,
  askedSize = null,
  askedCare,
  /** Carried onto the profile link so the profile can explain the same match
      and offer a real "back to results" link. */
  search,
  showSpeciesEyebrow = true,
  actionVariant = "default",
}: {
  sitter: SitterProfile;
  rate: NonNullable<ReturnType<typeof rateFor>>;
  reasons: MatchReason[];
  askedSpecies: Species | null;
  /** The dog's size, when the search gave one. */
  askedSize?: DogSize | null;
  askedCare: CareType | null;
  search: string;
  showSpeciesEyebrow?: boolean;
  /** Filled on the results register, where opening a profile is the whole
      point of the screen. Outline where the card is a SUGGESTION under a page
      that already has its own dominant action — three filled buttons under a
      filled CTA is four competing primaries (§4.2). */
  actionVariant?: "default" | "outline";
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();

  /* Services the owner did not ask about, as plain text. A service they did
     ask about is already a reason token or was hoisted into the preamble.
     Other SPECIES are deliberately not listed: with no species asked the
     eyebrow already names them, and with one asked they are irrelevant. */
  const rest = offeredServices(sitter)
    .filter((c) => c !== askedCare)
    .map((c) => t(`care.${c}`));

  /* A dog search without a size cannot rule anyone out on size, so the row
     states the sitter's own limit instead of letting silence read as "yes". */
  const limit = sizeLimitToState(sitter, { species: askedSpecies, size: askedSize });
  const sizeNote = limit
    ? t("search.card.sizeLimit", { sizes: formatList(limit.map((size) => t(`sizeShort.${size}`)), lng) })
    : askedSpecies === "dog" && !askedSize && sitter.acceptedSpecies.includes("dog") && acceptsEveryDogSize(sitter)
      ? t("search.card.allSizes")
      : null;

  return (
    <li>
      {/* 1.4: one card per sitter — identity and place, what they say, the
          facts that tell this result apart, where the information came from,
          then the price and the one action on a closing line. The stretched
          link makes the whole card pressable with exactly one tab stop. */}
      <article
        className={cn(
          "surface surface-press relative flex h-full flex-col gap-3 p-4 md:p-5",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        )}
      >
        <div className="flex items-start gap-3.5">
          {/* A monogram, not a stock portrait: §21 and §40 forbid presenting
              stock photography as a real person. Terracotta belongs on the
              PERSON, the one place without a photograph to carry them. */}
          {sitter.photoUrl ? (
            <img src={sitter.photoUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand"
            >
              {sitter.publicName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {/* <bdi> isolates these Latin strings: without it "Youcef H."
                renders as ".Youcef H" in Arabic. */}
            <h2 className="text-name font-semibold text-foreground">
              <bdi>{sitter.publicName}</bdi>
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {/* The commune when the sitter gave one, else their wilaya —
                  never a raw id, never a commune they did not state. */}
              <bdi className="truncate">
                {communeName(sitter.communeCode, lng) ??
                  t("location.wilayaOnly", { name: wilayaName(wilayaOfPlace(sitter), lng) ?? "" })}
              </bdi>
            </p>
          </div>
          {/* The animals they take, as the animals themselves. Dropped when
              species is a criterion: it is then true of every result. */}
          {showSpeciesEyebrow && (
            <p className="flex shrink-0 -space-x-2 rtl:space-x-reverse">
              <span className="sr-only">
                {sitter.acceptedSpecies.map((sp) => t(`speciesPlural.${sp}`)).join(" · ")}
              </span>
              {sitter.acceptedSpecies.map((sp) => (
                <AnimalPortrait key={sp} species={sp} className="size-8 rounded-full ring-2 ring-card" />
              ))}
            </p>
          )}
        </div>

        {sizeNote && <p className="text-sm font-semibold text-foreground">{sizeNote}</p>}

        <p className="line-clamp-3 max-w-[56ch] text-[0.9375rem] leading-relaxed text-foreground">
          {localized(sitter.headline, lng)}
        </p>

        <MatchReasonList reasons={reasons} trailing={rest} />

        {/* One honesty line per entry: where the information came from, and
            whether the person is an example. */}
        <ProvenanceLabel>{sitter.isDemoFixture ? ` · ${t("search.card.demoTag")}` : null}</ProvenanceLabel>

        {/* Price with its unit, and the action. (Price is not the default
            ORDER — see `matchSitters`.) The accessible name keeps the visible
            label as its prefix (WCAG 2.5.3). */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3.5">
          <div className="min-w-0">
            {rate.isFrom && <p className="text-xs text-muted-foreground">{t("search.card.from")}</p>}
            <p className="text-price font-semibold tabular-nums text-foreground">{formatDZD(rate.amount, lng)}</p>
            <p className="text-xs text-muted-foreground">{t(CARE_UNIT_KEY[rate.careType])}</p>
          </div>
          <Button asChild variant={actionVariant}>
            <Link to={{ pathname: `/sitters/${sitter.id}`, search }} className="after:absolute after:inset-0 after:rounded-xl">
              {t("search.card.viewProfile")}
              <span className="sr-only"> — {sitter.publicName}</span>
            </Link>
          </Button>
        </div>
      </article>
    </li>
  );
}
