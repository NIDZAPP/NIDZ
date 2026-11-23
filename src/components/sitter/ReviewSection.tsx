import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RATINGS, summarise, type Rating, type Review } from "@/data/reviews";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dates";

/** Shown before "show all". Enough to judge the tone; short enough that the
    section does not become the page. */
const VISIBLE = 3;

/**
 * What other people said, and what Nidz can say when nobody has.
 *
 * The cold start is the important half (§46). A sitter with no reviews shows
 * "New on Nidz" and their declared evidence — never `0.0`, never an empty
 * five-star row, and never a hidden section, because a missing section reads
 * as a page that failed to load rather than a sitter nobody has used yet.
 * `summarise` returns `null` for an empty list precisely so this cannot be got
 * wrong by accident.
 *
 * Deliberately not a Google Maps clone (§44). The useful parts are kept — a
 * summary, a distribution, dated entries, the sitter's reply threaded under
 * the review it answers, and a way to see the rest — and the decorative parts
 * are not.
 */
export default function ReviewSection({
  reviews,
  sitterName,
  isDemoFixture,
  headingLevel = "h2",
}: {
  reviews: Review[];
  sitterName: string;
  /** Same rule as the portfolio: one level below the sitter's name. */
  headingLevel?: "h2" | "h3";
  /** The sitter is an example, so their reviews are too. Said once, here,
      rather than on every entry. */
  isDemoFixture: boolean;
}) {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const SectionHeading = headingLevel;
  const [expanded, setExpanded] = useState(false);

  const summary = summarise(reviews);
  const shown = expanded ? reviews : reviews.slice(0, VISIBLE);

  return (
    <section aria-labelledby="sitter-reviews" className="border-t border-border pt-8">
      {/* On an example profile the heading itself says these are examples
          (Audit 1.3 LOT 06): a reader who skims headings must not file six
          invented stays under "Avis" as real opinions. */}
      <SectionHeading id="sitter-reviews" className="text-name font-semibold text-foreground">
        {isDemoFixture && summary ? t("reviews.titleExample") : t("reviews.title")}
      </SectionHeading>
      {isDemoFixture && summary && (
        <p className="mt-2 flex max-w-[64ch] items-start gap-2 text-sm font-medium text-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("reviews.demoNote")}
        </p>
      )}

      {!summary ? (
        /* THE COLD START. Stated as a fact about time, not a verdict about the
           person, and paired with what a reader can use instead. */
        <div className="mt-3">
          <p className="text-base font-medium text-foreground">{t("reviews.none.title")}</p>
          <p className="mt-1 max-w-[64ch] text-sm text-muted-foreground">
            {t("reviews.none.body", { name: sitterName })}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="flex items-baseline gap-2">
              {/* The glyphs round; the announced value does not. Rounding 4.7
                  to five filled stars is a fair visual summary, but telling a
                  screen-reader user "5 out of 5" while the page shows 4.7 is
                  simply a different number. */}
              <Stars value={Math.round(summary.average) as Rating} announce={summary.average} />
              <span className="text-price font-semibold tabular-nums text-foreground">
                {summary.average.toLocaleString(locale, { minimumFractionDigits: 1 })}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">{t("reviews.count", { count: summary.count })}</p>
          </div>

          {/* The shape of the opinion, not just its mean: four fives and a one
              is not a four, and a reader deciding about their animal deserves
              to see that rather than have it averaged away. */}
          <ul role="list" className="mt-4 max-w-[420px] space-y-1.5">
            {[...RATINGS].reverse().map((star) => {
              const n = summary.distribution[star];
              const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
              return (
                <li key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{star}</span>
                  <span
                    aria-hidden="true"
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-track"
                  >
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 shrink-0 text-end tabular-nums text-muted-foreground">{n}</span>
                  <span className="sr-only">{t("reviews.distributionRow", { count: n, star })}</span>
                </li>
              );
            })}
          </ul>

          <ul role="list" className="mt-6">
            {shown.map((review) => (
              <li key={review.id} className="border-t border-border py-5 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-medium text-foreground">
                    <bdi>{review.authorName}</bdi>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt, locale)}
                    {" · "}
                    {t(`care.${review.careType}`)}
                  </p>
                </div>
                <Stars value={review.rating} className="mt-1.5" />
                <p className="mt-2 max-w-[70ch] text-base leading-relaxed text-foreground">{review.body}</p>

                {review.reply && (
                  /* Threaded under the review, indented by a rule on the inline
                     start — a reply is an answer, not a second opinion of equal
                     standing. */
                  <div className="ms-4 mt-4 border-s border-border ps-4">
                    <p className="text-sm font-medium text-foreground">
                      {t("reviews.replyFrom", { name: sitterName })}
                    </p>
                    <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
                      {review.reply.body}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {reviews.length > VISIBLE && !expanded && (
            <Button type="button" variant="outline" className="mt-4" onClick={() => setExpanded(true)}>
              {t("reviews.showAll", { count: reviews.length })}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

/** Rating as stars AND as text. Colour and shape alone never carry meaning
    (§12.2), and a screen reader should hear "4 out of 5", not five icons. */
function Stars({
  value,
  announce,
  className,
}: {
  value: Rating;
  /** What to say, when it differs from what is drawn. */
  announce?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {RATINGS.map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "size-4",
            star <= value ? "fill-primary text-primary" : "text-track",
          )}
        />
      ))}
      <span className="sr-only">{t("reviews.ratingLabel", { value: announce ?? value })}</span>
    </span>
  );
}
