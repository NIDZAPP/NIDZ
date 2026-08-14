import { useTranslation } from "react-i18next";
import { Footprints, Hand, Home, Puzzle, UtensilsCrossed, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SPECIES_ICON } from "@/components/shared/species";
import type { PortfolioActivity, PortfolioItem } from "@/data/portfolio";
import { useAppLocale } from "@/hooks/use-locale";
import { formatDate } from "@/utils/dates";

const ACTIVITY_ICON: Record<PortfolioActivity, LucideIcon> = {
  walk: Footprints,
  enrichment: Puzzle,
  homeStay: Home,
  feeding: UtensilsCrossed,
  play: Hand,
  careSetup: Wrench,
};

/**
 * The care portfolio (§47).
 *
 * Practical evidence of how this person actually looks after animals: what a
 * stay involves, how a room is set up, what a walk looks like. Not a social
 * feed — there is no follower count, no like, no comment and no ranking here,
 * because none of those fields exist in the model (§49).
 *
 * WHY THERE ARE NO PHOTOGRAPHS. The portfolio is a photographic feature and
 * Nidz has no consented photography. Filling it with stock images would be
 * worse here than anywhere else in the product, because the whole point of the
 * section is to be evidence — and fabricated evidence is not weaker evidence,
 * it is the opposite. So each entry shows everything a real one carries except
 * the image, and the note says which part is missing. When consented images
 * exist they populate `imageUrl` and nothing else changes.
 *
 * Only `public` items reach this component: `publicItemsFor` filters on the
 * consent state, so a photo whose owner was never asked cannot be rendered by
 * a screen that forgot to check.
 */
export default function PortfolioSection({
  items,
  isDemoFixture,
}: {
  items: PortfolioItem[];
  isDemoFixture: boolean;
}) {
  const { t } = useTranslation();
  const locale = useAppLocale();

  /* Absent rather than empty. A sitter who has not built a portfolio has not
     failed at anything, and an empty grid would read as a broken section. */
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="sitter-portfolio" className="border-t border-border pt-8">
      <h2 id="sitter-portfolio" className="text-name font-semibold text-foreground">
        {t("portfolio.title")}
      </h2>
      <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">{t("portfolio.intro")}</p>

      <ul role="list" className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {items.map((item) => {
          const Activity = ACTIVITY_ICON[item.activity];
          const SpeciesIcon = SPECIES_ICON[item.species];
          return (
            <li key={item.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand"
              >
                <Activity className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-foreground">
                  {t(`portfolio.activity.${item.activity}`)}
                  <span className="inline-flex items-center gap-1 font-normal text-muted-foreground">
                    <SpeciesIcon className="size-3.5" aria-hidden="true" />
                    {t(`species.${item.species}`)}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.caption}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt, locale)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Says which part of this is missing rather than letting the absence of
          images read as a loading failure. */}
      <p className="mt-5 max-w-[64ch] text-sm text-muted-foreground">
        {isDemoFixture ? t("portfolio.noPhotosDemo") : t("portfolio.noPhotos")}
      </p>
    </section>
  );
}
