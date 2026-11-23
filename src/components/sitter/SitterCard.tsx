import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { MatchReasonList } from "@/components/sitter/match";
import { ProvenanceLabel } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { acceptsEveryDogSize, sizeLimitToState, type MatchReason } from "@/data/criteria";
import { offeredServices, type rateFor } from "@/data/offer";
import { communeName } from "@/data/algeria";
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
    <li className="border-b border-border">
      <article
        className={cn(
          "relative grid rounded-md px-3 py-6 transition-colors md:py-8",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          /* Gated so the wash does not stick after a tap. */
          "[@media(hover:hover)]:hover:bg-secondary",
          /* Mobile: identity beside the entry, price on a second row.
             Desktop: adds the price axis as a third column. */
          "grid-cols-[40px_minmax(0,1fr)] gap-x-3",
          "md:grid-cols-[48px_minmax(0,1fr)_190px] md:gap-x-6",
        )}
      >
        {/* A monogram, not a stock portrait: §21 and §40 both forbid presenting
            stock photography as a real person's profile. Kept at this size on
            the profile too, where it reads as a recognition mark carried over
            from this row rather than as a substitute for a face. */}
        {sitter.photoUrl ? (
          <img src={sitter.photoUrl} alt="" className="size-10 rounded-sm object-cover md:size-12" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-sm bg-brand-soft text-base font-semibold text-brand md:size-12 md:text-name"
          >
            {sitter.publicName.charAt(0)}
          </span>
        )}

        <div className="min-w-0">
          {/* Species as a filing system: scanning the column shows the page is
              organised around animals before it is organised around people.
              Dropped when species is a criterion, because then it is true of
              every row and the preamble has already said so. */}
          {showSpeciesEyebrow && (
            <p className="eyebrow">
              {sitter.acceptedSpecies.map((sp) => t(`speciesPlural.${sp}`)).join(" · ")}
            </p>
          )}
          {/* <bdi> isolates these Latin strings: without it "Youcef H." renders
              as ".Youcef H" in Arabic, the trailing period being neutral. */}
          <h2 className={cn("text-name font-semibold text-foreground", showSpeciesEyebrow && "mt-1.5")}>
            <bdi>{sitter.publicName}</bdi>
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <bdi className="truncate">{communeName(sitter.communeCode, lng) ?? sitter.communeCode}</bdi>
          </p>

          {sizeNote && <p className="mt-3 text-sm font-medium text-foreground">{sizeNote}</p>}

          <MatchReasonList className="mt-3" reasons={reasons} trailing={rest} />

          <p className="mt-3 line-clamp-3 max-w-[56ch] text-base leading-relaxed text-foreground">
            {localized(sitter.headline, lng)}
          </p>

          {/* One honesty line per entry: where the information came from, and
              whether the person is an example. */}
          <ProvenanceLabel className="mt-3">
            {sitter.isDemoFixture ? ` · ${t("search.card.demoTag")}` : null}
          </ProvenanceLabel>
        </div>

        {/* Price on its own axis, always with its unit: at md+ the amounts line
            up in one column, so prices compare at a glance without the row
            reading as a pricing card. (Price is not the default ORDER — see
            `matchSitters`.) */}
        <div className="col-span-2 mt-4 flex items-end justify-between gap-4 md:col-span-1 md:mt-0 md:block md:text-end">
          <div>
            {rate.isFrom && <p className="text-sm text-muted-foreground">{t("search.card.from")}</p>}
            <p className="text-price font-semibold tabular-nums text-foreground">{formatDZD(rate.amount, lng)}</p>
            <p className="text-sm text-muted-foreground">{t(CARE_UNIT_KEY[rate.careType])}</p>
          </div>
          {/* The entry's only action. The stretched pseudo element makes the
              whole row clickable while keeping exactly one tab stop. The name
              is in the accessible name via sr-only, so the visible label stays
              a prefix of it (WCAG 2.5.3). */}
          <Button asChild variant={actionVariant} className="md:mt-4">
            <Link to={{ pathname: `/sitters/${sitter.id}`, search }} className="after:absolute after:inset-0">
              {t("search.card.viewProfile")}
              <span className="sr-only"> — {sitter.publicName}</span>
            </Link>
          </Button>
        </div>
      </article>
    </li>
  );
}
