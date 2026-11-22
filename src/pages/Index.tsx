import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";

import { REGISTER_ROW } from "@/components/shared/register";
import SitterCard from "@/components/sitter/SitterCard";
import { Button } from "@/components/ui/button";
import { getWilaya } from "@/data/algeria";
import {
  activeCriteriaCount,
  criteriaFromNeed,
  criteriaToParams,
  matchSitters,
  partitionReasons,
  EMPTY_CRITERIA,
  type SearchCriteria,
} from "@/data/criteria";
import { DEMO_SITTERS, getDemoSitter } from "@/data/demo-sitters";
import { requestPath } from "@/data/request-draft";
import { localized } from "@/data/types";
import { WORKSPACE_ROOT } from "@/data/workspace";
import { useAppLocale } from "@/hooks/use-locale";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { isolate } from "@/utils/format";

/** How many suggestions the home page shows before sending people to the full
    results. Enough to be useful, few enough that the page stays a home rather
    than becoming a second search screen. */
const SUGGESTION_LIMIT = 3;

/**
 * The OWNER home.
 *
 * An editorial flow, not a dashboard (§127). Every section here is either the
 * person's own data or a real match against the fixtures, and **each one is
 * absent entirely when there is nothing behind it** — an empty placeholder is
 * how a home page starts inventing activity.
 *
 * The suggestions are the part most at risk of overclaiming, so they are
 * constrained hard:
 *
 *   - The heading states the FILTER that produced them ("in Alger", "who
 *     accept cats"), never a judgement about the animal. §21 forbids
 *     pretending to know pet compatibility, and §117 forbids showing a claim
 *     any part of which is unsupported.
 *   - Every reason on a card is re-derived from the sitter's own declarations
 *     by `reasonsFor`, not echoed back from the query.
 *   - No section appears at all until Nidz knows where the owner is, because
 *     "near you" without a location is not a claim it can make.
 *
 * `/` belongs to whichever workspace is active, so an account currently on the
 * sitter side is sent to the sitter root rather than shown the owner home under
 * sitter chrome.
 */
export default function Index() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state, dispatch } = useDemo();
  const switchWorkspace = useSwitchWorkspace();

  const account = state.account;
  const pets = state.pets;

  /* Where to look, and for what. Only the owner's declared wilaya and — when
     they have an animal — its species. Both are facts they gave; nothing is
     inferred from behaviour. */
  const suggestionCriteria: SearchCriteria | null = useMemo(() => {
    if (!account?.wilayaId) return null;
    return {
      ...EMPTY_CRITERIA,
      wilaya: account.wilayaId,
      /* One saved animal narrows the suggestions to it. With none — the state
         every new account is in — fall back to the species the owner declared
         on the account, which is the one case `ownerAccount.speciesHelp`
         promises to handle and which nothing was reading. With several, no
         species: guessing which animal they meant would be a claim. */
      species:
        pets.length === 1
          ? pets[0].species
          : pets.length === 0 && account?.ownedSpecies.length === 1
            ? account.ownedSpecies[0]
            : null,
      /* The one dog's size, when it is known: a large dog must not be offered
         a sitter who only takes small ones (Audit 1.3 LOT 03). */
      size: pets.length === 1 && pets[0].species === "dog" ? pets[0].details.size : null,
    };
  }, [account?.wilayaId, account?.ownedSpecies, pets]);

  const suggestions = useMemo(() => {
    if (!suggestionCriteria) return [];
    return matchSitters(DEMO_SITTERS, suggestionCriteria, account?.communeId ?? null, lng).slice(
      0,
      SUGGESTION_LIMIT,
    );
  }, [suggestionCriteria, account?.communeId, lng]);

  const { perResult } = useMemo(() => partitionReasons(suggestions), [suggestions]);

  /* A first-time visitor belongs on the introduction, which is a full-screen
     route outside the site chrome. */
  if (!state.entered) return <Navigate to="/welcome" replace />;

  /* Not a redirect loop: the sitter root is `/sitter/requests`, which resolves
     to the sitter workspace and never back to here. Guarded on the capability
     as well as the preference, so a stale `activeWorkspace` in storage can
     never strand someone on a side they have nothing on. */
  if (state.activeWorkspace === "sitter" && state.capabilities.sitter) {
    return <Navigate to={WORKSPACE_ROOT.sitter} replace />;
  }

  const pending = state.requests.filter((r) => r.status === "pending").length;

  /* The request the owner was preparing, by name. Resolved against the real
     directory: a bookmark to a sitter that no longer exists is not offered. */
  const draft = state.requestDraft;
  const draftSitter = draft
    ? (getDemoSitter(draft.sitterId) ??
      (state.sitter?.profile.id === draft.sitterId ? state.sitter.profile : null))
    : null;
  const criteria = criteriaFromNeed(state.need);
  /* Same definition of "has a brief" the search contract uses, so a saved
     wilaya or a saved date range is not quietly treated as nothing. */
  const hasNeed = Boolean(state.need.petId) || activeCriteriaCount(criteria) > 0;
  const resume = new URLSearchParams(criteriaToParams(criteria)).toString();

  const wilayaName = suggestionCriteria?.wilaya
    ? localized(getWilaya(suggestionCriteria.wilaya)?.name ?? { en: "", fr: "", ar: "" }, lng)
    : "";
  const suggestionSearch = suggestionCriteria
    ? new URLSearchParams(criteriaToParams(suggestionCriteria)).toString()
    : "";

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("home.title")}
        </title>
        <meta name="description" content={t("home.subtitle")} />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">
          {account?.firstName ? t("home.greeting", { name: account.firstName }) : t("home.title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("home.subtitle")}</p>

        <div className="mt-8">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-52">
            {hasNeed ? (
              <Link to={{ pathname: "/search", search: resume }}>{t("entry.resume")}</Link>
            ) : (
              <Link to="/owner/need/pet">{t("entry.findSitter")}</Link>
            )}
          </Button>
        </div>

        {/* An unsent request, named after its sitter (Audit 1.3 LOT 01). The
            row says "not sent yet" in words: a request in preparation must
            never read as one that was sent. Discarding forgets the bookmark
            only — no animal and no request is touched. */}
        {draft && draftSitter && (
          <div className="mt-8 flex items-center gap-2 border-y border-border">
            <Link
              to={requestPath(draft.sitterId, draft.search)}
              className="flex min-w-0 flex-1 items-center justify-between gap-4 py-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="min-w-0">
                <span className="block font-medium text-foreground">
                  {t("request.review.titleFor", { sitter: isolate(draftSitter.publicName) })}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t("home.draft.body")}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-muted-foreground"
              onClick={() => dispatch({ type: "discardRequestDraft" })}
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">
                {t("home.draft.discard", { sitter: isolate(draftSitter.publicName) })}
              </span>
            </Button>
          </div>
        )}

        {/* Only with a location, and only with real matches. The heading names
            the filter that produced the list — not a verdict about the animal. */}
        {suggestions.length > 0 && (
          <section aria-labelledby="home-nearby" className="mt-12">
            <h2 id="home-nearby" className="text-name font-semibold text-foreground">
              {suggestionCriteria?.species
                ? t("home.nearby.titleSpecies", {
                    wilaya: wilayaName,
                    species: t(`speciesPlural.${suggestionCriteria.species}`).toLocaleLowerCase(lng),
                  })
                : t("home.nearby.title", { wilaya: wilayaName })}
            </h2>

            <ul role="list" className="mt-4 border-t border-border">
              {suggestions.map(({ sitter, rate }) => (
                <SitterCard
                  key={sitter.id}
                  sitter={sitter}
                  rate={rate}
                  reasons={perResult.get(sitter.id) ?? []}
                  askedSpecies={suggestionCriteria?.species ?? null}
                  askedSize={suggestionCriteria?.size ?? null}
                  askedCare={null}
                  search={suggestionSearch}
                  actionVariant="outline"
                  /* The heading already says "who accept cats"; repeating it on
                     every row discriminates nothing. Same rule /search applies. */
                  showSpeciesEyebrow={!suggestionCriteria?.species}
                />
              ))}
            </ul>

            <p className="mt-5 text-sm">
              <Link
                to={{ pathname: "/search", search: suggestionSearch }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("home.nearby.seeAll")}
              </Link>
            </p>
          </section>
        )}

        <div className="mt-12">
          {/* My pets is also a tab since Audit 1.3 LOT 04; this row stays as the
              summary of the household (the animals' names) on Home. */}
          {/* Shown once there is anything to show. The need flow saves an
              animal with no account at all, so gating on the capability alone
              hid pets that genuinely existed. */}
          {(pets.length > 0 || state.capabilities.owner) && (
            <Link to="/owner/pets" className={REGISTER_ROW}>
              <span>
                <span className="block font-medium text-foreground">{t("nav.pets")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {pets.length > 0
                    ? pets.map((p) => p.name).filter(Boolean).join(" · ")
                    : t("pets.empty.title")}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          )}

          {/* The person's own data, so it is the one thing that can honestly be
              counted. Absent entirely when there is nothing to count. */}
          {state.requests.length > 0 && (
            <Link to="/owner/requests" className={REGISTER_ROW}>
              <span>
                <span className="block font-medium text-foreground">{t("entry.myRequests")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {pending > 0
                    ? t("entry.requestsPending", { count: pending })
                    : t("entry.requestsCount", { count: state.requests.length })}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          )}

          {/* The SWITCH, not a fork. Having a sitter profile does not stop you
              being an owner, so this offers the other workspace and records the
              move; it does not replace this page. Nothing is discarded. */}
          {state.capabilities.sitter && (
            <button
              type="button"
              onClick={() => switchWorkspace("sitter")}
              className={cn(REGISTER_ROW, "w-full text-start")}
            >
              <span>
                <span className="block font-medium text-foreground">{t("workspace.toSitter")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {state.sitter?.published ? t("entry.sitterPublished") : t("entry.sitterDraft")}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* One quiet invitation, only for someone who has no sitter side yet.
            Phrased as an activity rather than an identity. */}
        {!state.capabilities.sitter && (
          <p className="mt-10 text-sm text-muted-foreground">
            <Link to="/sitter/start" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("entry.switchToSitter")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
