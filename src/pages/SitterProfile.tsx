import { useMemo } from "react";
import { Ban, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";

import BackButton from "@/components/shared/BackButton";
import EmptyState from "@/components/shared/EmptyState";
import { DemoNotice } from "@/components/shared/trust";
import BriefCapsule from "@/components/search/BriefCapsule";
import { useBriefText } from "@/components/search/use-brief-text";
import SitterProfileView, { QuotedRate } from "@/components/sitter/SitterProfileView";
import { Button } from "@/components/ui/button";
import { parseCriteria, petFit, reasonsFor } from "@/data/criteria";
import { hasSession } from "@/data/navigation";
import ConfirmAction from "@/components/shared/ConfirmAction";
import { compatibility } from "@/data/compatibility";
import { getKind } from "@/data/animal-kinds";
import { isPubliclyListed } from "@/data/repository";
import { offeredServices, rateFor } from "@/data/offer";
import { communeName, getWilaya } from "@/data/algeria";
import { CARE_UNIT_KEY, localized } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";
import { formatDZD, formatList } from "@/utils/format";

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
  const { state, commit } = useDemo();
  const { sitter, isOwnProfile } = useSitter(id);

  const paramKey = searchParams.toString();
  const criteria = useMemo(() => parseCriteria(new URLSearchParams(paramKey)), [paramKey]);
  const brief = useBriefText(criteria);

  /* An unpublished draft is not a public profile. `useSitter` resolves it so
     the sitter's own preview can render, but this route serves the public and
     `profile.notFoundBody` already promises the distinction. */
  const publicallyVisible = sitter && isPubliclyListed(state, sitter);

  if (!sitter || !publicallyVisible) {
    return (
      <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
        <Helmet>
          <title>
            {t("common.appName")} — {t("profile.notFoundTitle")}
          </title>
        </Helmet>
        <div className="mx-auto max-w-[720px]">
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
    criteria.species || criteria.kind || criteria.care || criteria.commune || criteria.wilaya || criteria.dates,
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
  /* Compatibility with the animal asked about, three-valued (Nidz 1.7). */
  const askedFit = criteria.species ? compatibility(sitter, { species: criteria.species, kindId: criteria.kind }) : null;
  const askedKind = criteria.species && criteria.species !== "other" ? getKind(criteria.kind, criteria.species) : null;
  const mismatches = [
    ...(askedFit?.level === "incompatible" && askedFit.reason === "category" && criteria.species !== "other"
      ? [t("profile.mismatch.species", { species: t(`species.${criteria.species}`) })]
      : []),
    ...(askedFit?.level === "incompatible" && askedFit.reason === "kind" && askedKind
      ? [t("profile.mismatch.kind", { kind: askedKind.name[lng] })]
      : []),
    ...(criteria.care && !offeredServices(sitter).includes(criteria.care)
      ? [t("profile.mismatch.care", { care: t(`care.${criteria.care}`) })]
      : []),
    ...(zoneAsked && !reasons.some((r) => r.kind === "zone")
      ? [t("profile.mismatch.zone", { zone: zoneLabel })]
      : []),
    ...(criteria.dates && !reasons.some((r) => r.kind === "dates") ? [t("profile.mismatch.dates")] : []),
    ...(criteria.maxPrice !== null && rate && rate.amount > criteria.maxPrice
      ? [
          t("profile.mismatch.price", {
            /* Never a price without its unit (Audit 1.3 LOT 03). */
            price: `${formatDZD(criteria.maxPrice, lng)} ${
              criteria.care ? t(CARE_UNIT_KEY[criteria.care]) : t("search.filters.perService")
            }`,
          }),
        ]
      : []),
  ];

  /* The pet's name is only used when the criteria still describe that animal
     AND this sitter can verifiably take it. An owner who defined a need for
     their cat and then opened a dog search must not be told a dog sitter is
     "bien adapté à Mimi" — and nor must the owner of a large dog be told it
     about a sitter who takes only small ones, or about one whose size limit
     cannot be checked because the dog's size was never given (Audit 1.3
     LOT 03: "Bien adapté à Milo" only when the reasons are in the data). */
  const pet = state.pets.find((p) => p.id === state.need.petId) ?? null;
  const petName =
    pet &&
    pet.species === criteria.species &&
    petFit(pet, sitter).level === "confirmed" &&
    /* …and the breed being searched for is this animal's, so the fit heading
       and the breed token below it are about the same animal. */
    (!criteria.kind || pet.kindId === criteria.kind)
      ? pet.name
      : null;

  /* « À confirmer » is stated inside the fit section, rather than leaving
     « Accepte les chiens » to read as « will take your dog » (§19.2). */
  const uncertain = askedFit?.level === "unknown" ? [t(`compat.owner.unknown.${askedFit.reason}`)] : [];

  const canBlock = !isOwnProfile && hasSession(state);

  /* Your own profile does not invite you to request care from yourself; it
     offers the thing you would actually want from this page. The demo action
     below it is what makes the sitter side reachable at all — see the notice
     rendered with it. */
  const cta = isOwnProfile ? (
    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
      <Link to="/sitter/profile">{t("sitterFlow.preview.edit")}</Link>
    </Button>
  ) : (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <Link to={{ pathname: `/owner/request/${sitter.id}`, search: paramKey }}>{t("profile.cta")}</Link>
    </Button>
  );

  /* Messages before a request (1.4): one thread per sitter, carrying the
     brief as its context. Not on your own profile. */
  const askHref = `/messages/to/${sitter.id}${paramKey ? `?${paramKey}` : ""}`;

  /* THE BRIEF CAPSULE rides here too (direction contract): the question this
     profile is being read against. "Modifier" goes back to the same results
     with the editor open. Only when the visitor actually searched. */
  const capsule = hasCriteria ? (
    <BriefCapsule
      species={criteria.species}
      title={brief.title ?? t("search.brief.anySpecies")}
      parts={brief.parts}
      emptyText={t("search.context.refine")}
      actionText={t("search.context.edit")}
      actionLabel={t("search.context.editLabel")}
      to={{ pathname: "/search", search: paramKey }}
      state={{ editBrief: true }}
    />
  ) : null;

  return (
    <div>
      <Helmet>
        <title>
          {t("common.appName")} — {sitter.publicName}
        </title>
        <meta name="description" content={localized(sitter.headline, lng)} />
      </Helmet>

      <div className="container pb-10 pt-2 md:pb-16 md:pt-6">
        <div className="mx-auto max-w-[1120px]">
          {/* Unconditional at Audit 1.2 (§86). It used to appear only when the
              URL carried search criteria, so a profile opened from a shared
              link — the most likely way a stranger arrives here — had no way
              back at all inside an installed PWA, which shows no browser
              chrome.

              `BackButton` pops real history when this app put something behind
              us, so returning lands on the exact results the visitor left. The
              fallback reconstructs that result set from the URL for anyone who
              arrived cold. */}
          <BackButton
            fallback={hasCriteria ? `/search?${paramKey}` : "/search"}
            /* Named only when the URL actually carries a result set. `useBack`
               pops real history first, so a profile opened from Home, from a
               request, or by a sitter looking at their own listing would
               otherwise read "Back to results" and go somewhere else. A control
               that states a destination has to keep the promise. */
            label={hasCriteria ? t("profile.backToResults") : undefined}
          />
          {capsule && <div className="mb-3 xl:hidden">{capsule}</div>}

          <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-6">
            <div className="min-w-0">
              {/* The "send yourself a test request" control left this page at
                  Audit 1.3 LOT 07: test instructions do not belong in the
                  product's own screens. It lives in Compte, under "Outils de
                  test", explicitly separate. */}
              <SitterProfileView
                /* The honesty layer belongs on this page too, not only on
                   /search: these links are shareable, so a visitor can land
                   here first and see a complete, plausible profile of a person
                   who does not exist. Placed right after the key facts (Audit
                   1.3 LOT 06) — still on the first screen, and no longer
                   pushing the identity and the offer below it. */
                ledeAside={
                  sitter.isDemoFixture ? (
                    <DemoNotice title={t("profile.demo.title")} body={t("profile.demo.body")} />
                  ) : undefined
                }
                sitter={sitter}
                hasCriteria={hasCriteria}
                reasons={reasons}
                mismatches={mismatches}
                uncertain={uncertain}
                petName={petName}
              />
              {/* The same safety control below the rail's breakpoint, where
                  the rail is not drawn: one of the two is ever displayed. */}
              {canBlock && (
                <div className="mt-8 border-t border-border pt-4 xl:hidden">
                  <BlockControl sitterId={sitter.id} name={sitter.publicName} />
                </div>
              )}
            </div>

            {/* Desktop: a sticky rail carrying the quoted rate and the action.
                Mobile mounts the pinned bar below instead — exactly one of the
                two is ever displayed, so there is never a second tab stop for
                the same action. */}
            {/* The rail: the brief this profile is read against, then the
                price and the actions — one column of weight, not an island. */}
            <aside className="hidden space-y-3 xl:sticky xl:top-24 xl:block">
              {capsule ?? (
                /* Without a brief the page cannot say what fits: the rail offers
                   the one step that would let it. */
                !isOwnProfile && (
                  <div className="surface p-5">
                    <p className="text-[0.9375rem] font-semibold text-foreground">{t("profile.rail.fitTitle")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("profile.rail.fitBody")}</p>
                    <Button asChild variant="outline" size="sm" className="mt-3 h-11">
                      <Link to="/owner/need/pet">{t("profile.rail.fitAction")}</Link>
                    </Button>
                  </div>
                )
              )}
              <div className="surface p-6">
                {rate && (
                  <QuotedRate amount={rate.amount} careType={rate.careType} isFrom={rate.isFrom} className="mb-4" />
                )}
                <div className="[&>*]:w-full">{cta}</div>
                {!isOwnProfile && (
                  <Button asChild variant="surface" className="mt-2.5 w-full">
                    <Link to={askHref}>
                      <MessageCircle aria-hidden="true" />
                      {t("messages.ask")}
                    </Link>
                  </Button>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("profile.noPayment")}</p>
              </div>
              {/* Safety (Nidz 1.7 §24): an owner can stop seeing a sitter. */}
              {canBlock && (
                <div className="px-2">
                  <BlockControl sitterId={sitter.id} name={sitter.publicName} />
                </div>
              )}
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
        /* Offset above the bottom navigation below md: both pin to
           bottom:0 in the root stacking context, so without this the nav
           sat over the one conversion action in the product and swallowed
           the tap. Above md the nav is gone and this returns to the edge. */
        /* 1.4: a floating pill like the brief capsule, held above the
           floating tab bar below md (bottom-[5.75rem]) and at the edge from
           md, where the tab bar is gone. */
        className="has-pinned-action-sm pointer-events-none sticky bottom-[5rem] z-30 md:bottom-0 xl:hidden"
      >
        {/* An opaque band under the pill, down to the tab bar, so page text
            never shows through the gap between the two floating layers. */}
        <div className="container bg-gradient-to-t from-background from-60% to-transparent pb-2 pt-5 md:pb-4">
          <div className="pointer-events-auto mx-auto flex max-w-[720px] items-center gap-2 rounded-full bg-card p-1.5 ps-4 shadow-raised">
            {/* The price keeps its own width (`shrink-0`): squeezed to a
                fixed minimum, "DZD 1,200" ran under the message button at
                320px. The action is what gives way — its label wraps. */}
            {rate ? (
              <QuotedRate amount={rate.amount} careType={rate.careType} isFrom={rate.isFrom} compact className="shrink-0" />
            ) : null}
            {!isOwnProfile && (
              <Button asChild variant="secondary" size="icon" className="size-12 shrink-0">
                <Link to={askHref} aria-label={t("messages.askName", { name: sitter.publicName })}>
                  <MessageCircle className="!size-5" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {/* Takes what is left: at 320px the action's label wraps inside
                its pill rather than pushing the price or the page sideways. */}
            <div className="min-w-0 flex-1 [&>*]:w-full [&>*]:whitespace-normal [&>*]:px-3 [&>*]:text-[0.9375rem] [&>*]:leading-tight min-[360px]:[&>*]:px-4">
              {cta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** « Ne plus voir ce pet-sitter » — local to this device, said so in the
    dialog, and reversible here or in Paramètres › Sécurité et confidentialité. */
function BlockControl({ sitterId, name }: { sitterId: string; name: string }) {
  const { t } = useTranslation();
  const { state, commit } = useDemo();
  if (state.blockedSitters.includes(sitterId)) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("profile.block.blocked")}{" "}
        <button
          type="button"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
          onClick={() => commit({ type: "unblockSitter", id: sitterId })}
        >
          {t("settings.security.unblock")}
        </button>
      </p>
    );
  }
  return (
    <ConfirmAction
      variant="ghost"
      className="-ms-3 text-muted-foreground"
      trigger={
        <>
          <Ban aria-hidden="true" />
          {t("profile.block.action")}
        </>
      }
      title={t("profile.block.title", { name })}
      body={t("profile.block.body")}
      confirm={t("profile.block.confirm")}
      onConfirm={() => commit({ type: "blockSitter", id: sitterId })}
    />
  );
}
