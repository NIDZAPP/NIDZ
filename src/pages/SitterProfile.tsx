import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import { DemoNotice } from "@/components/shared/trust";
import SitterProfileView, { QuotedRate } from "@/components/sitter/SitterProfileView";
import { Button } from "@/components/ui/button";
import { parseCriteria, reasonsFor } from "@/data/criteria";
import { offeredServices, rateFor } from "@/data/demo-sitters";
import { communeName, getWilaya } from "@/data/locations";
import { localized } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";
import { formatDZD } from "@/utils/format";

/**
 * The owner's view of a sitter.
 *
 * Kept inside the site layout rather than turned into a flow screen: it is a
 * browsable, shareable, deep-linkable destination, and stripping the header
 * would remove the wordmark, the language switcher and the way back into the
 * rest of the product.
 *
 * The search that led here travels in the query string, so a reloaded or
 * shared link still explains the same match and still offers a real link back
 * to the results.
 */
export default function SitterProfile() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useDemo();
  const { sitter, isOwnProfile } = useSitter(id);

  const paramKey = searchParams.toString();
  const criteria = useMemo(() => parseCriteria(new URLSearchParams(paramKey)), [paramKey]);

  /* An unpublished draft is not a public profile. `useSitter` resolves it so
     the sitter's own preview can render, but this route serves the public and
     `profile.notFoundBody` already promises the distinction. */
  const publicallyVisible = sitter && (!isOwnProfile || state.sitter?.published);

  if (!sitter || !publicallyVisible) {
    return (
      <div className="container py-12 md:py-20">
        <Helmet>
          <title>
            {t("common.appName")} — {t("profile.notFoundTitle")}
          </title>
        </Helmet>
        <div className="mx-auto max-w-[640px]">
          <EmptyState
            /* This state IS the page, so it carries its heading. */
            headingLevel="h1"
            title={t("profile.notFoundTitle")}
            body={t("profile.notFoundBody")}
            action={
              <Button asChild variant="outline">
                <Link to="/search">{t("profile.backToSearch")}</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const hasCriteria = Boolean(
    criteria.species || criteria.care || criteria.commune || criteria.wilaya || criteria.dates,
  );
  /* Recomputed from the sitter's own data rather than trusted from the URL:
     `?species=cat` on a dog-only sitter must not print "Accepte les chats". */
  const reasons = reasonsFor(sitter, criteria);
  const zoneLabel = criteria.commune
    ? (communeName(criteria.commune, lng) ?? criteria.commune)
    : criteria.wilaya
      ? localized(getWilaya(criteria.wilaya)?.name ?? { en: "", fr: "", ar: "" }, lng)
      : "";

  /* What the visitor asked for that this sitter does not do. Volunteering the
     mismatch is the whole positioning — an owner who learns here that this
     person takes only dogs has been told something useful. */
  /* Only quoted when the sitter actually offers what was asked for. Otherwise
     `rateFor` falls back to their whole offer, and the pinned bar would price
     a different service than the one the owner searched for, beside a CTA. */
  const quotable = !criteria.care || offeredServices(sitter).includes(criteria.care);
  const rate = quotable ? rateFor(sitter, criteria.care ? [criteria.care] : []) : null;

  /* Every criterion the visitor set that this sitter does not satisfy. Derived
     from the same reasons the fit section uses, so the two halves of the
     section cannot contradict each other, and covering ALL the criteria —
     a location or a budget that does not match is exactly as useful to know
     as a species that does not. */
  const zoneAsked = criteria.commune ?? criteria.wilaya;
  const mismatches = [
    ...(criteria.species && !sitter.acceptedSpecies.includes(criteria.species)
      ? [t("profile.mismatch.species", { species: t(`species.${criteria.species}`) })]
      : []),
    ...(criteria.care && !offeredServices(sitter).includes(criteria.care)
      ? [t("profile.mismatch.care", { care: t(`care.${criteria.care}`) })]
      : []),
    ...(zoneAsked && !reasons.some((r) => r.kind === "zone")
      ? [t("profile.mismatch.zone", { zone: zoneLabel })]
      : []),
    ...(criteria.dates && !reasons.some((r) => r.kind === "dates") ? [t("profile.mismatch.dates")] : []),
    ...(criteria.maxPrice !== null && rate && rate.amount > criteria.maxPrice
      ? [t("profile.mismatch.price", { price: formatDZD(criteria.maxPrice, lng) })]
      : []),
  ];

  /* The pet's name is only used when the criteria still describe that animal.
     An owner who defined a need for their cat and then opened a dog search
     must not be told a dog sitter is "bien adapté à Mimi". */
  const pet = state.pets.find((p) => p.id === state.need.petId) ?? null;
  const petName = pet && state.need.species === criteria.species ? pet.name : null;

  /* Your own profile does not invite you to request care from yourself; it
     offers the thing you would actually want from this page. */
  const cta = isOwnProfile ? (
    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
      <Link to="/sitter/profile/about">{t("sitterFlow.preview.edit")}</Link>
    </Button>
  ) : (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <Link to={{ pathname: `/owner/request/${sitter.id}`, search: paramKey }}>{t("profile.cta")}</Link>
    </Button>
  );

  return (
    <div>
      <Helmet>
        <title>
          {t("common.appName")} — {sitter.publicName}
        </title>
        <meta name="description" content={localized(sitter.headline, lng)} />
      </Helmet>

      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-[1120px]">
          {/* A real link, not history.back(): a shared URL has no results page
              behind it, and this reconstructs the exact result set. */}
          {hasCriteria && (
            <Link
              to={{ pathname: "/search", search: paramKey }}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              {t("profile.backToResults")}
            </Link>
          )}

          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="min-w-0 xl:pe-12">
              {/* The honesty layer belongs on this page too, not only on
                  /search: these links are shareable, so a visitor can land here
                  first and see a complete, plausible profile of a person who
                  does not exist. */}
              {sitter.isDemoFixture && (
                <DemoNotice className="mb-8" title={t("search.demo.title")} body={t("search.demo.body")} />
              )}
              <SitterProfileView
                sitter={sitter}
                hasCriteria={hasCriteria}
                reasons={reasons}
                mismatches={mismatches}
                petName={petName}
              />
            </div>

            {/* Desktop: a sticky rail carrying the quoted rate and the action.
                Mobile mounts the pinned bar below instead — exactly one of the
                two is ever displayed, so there is never a second tab stop for
                the same action. */}
            <aside className="hidden xl:sticky xl:top-24 xl:block xl:border-s xl:border-border xl:ps-12">
              {rate && (
                <QuotedRate amount={rate.amount} careType={rate.careType} isFrom={rate.isFrom} className="mb-4" />
              )}
              {cta}
            </aside>
          </div>
        </div>
      </div>

      {/* The bar carries the price as well as the action: without it the number
          scrolls away and the owner taps blind. */}
      <div
        /* `has-pinned-action-sm` and not the unconditional class: `:has()`
           matches the document tree, so `xl:hidden` would not stop the rule
           applying at desktop widths where the rail, not this bar, carries the
           action — reinstating the dead gap the scoping exists to avoid. */
        className="has-pinned-action-sm sticky bottom-0 z-30 border-t border-border bg-background xl:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container flex items-center gap-4 py-3">
          {rate && (
            <QuotedRate amount={rate.amount} careType={rate.careType} isFrom={rate.isFrom} className="flex-1" />
          )}
          <div className="shrink-0">{cta}</div>
        </div>
      </div>
    </div>
  );
}
