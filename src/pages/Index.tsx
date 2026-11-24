import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Inbox, Plus, Search, X } from "lucide-react";

import HomeHero from "@/components/home/HomeHero";
import { HomeHeart } from "@/components/icons/nidz-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
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
import { findSitter, publicSitters, requestsSent } from "@/data/repository";
import { requestPath } from "@/data/request-draft";
import { localized } from "@/data/types";
import { WORKSPACE_ROOT } from "@/data/workspace";
import { useAppLocale } from "@/hooks/use-locale";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { useDemo } from "@/state/demo/context";
import { isolate } from "@/utils/format";
import { ACTION_LINK_END } from "@/components/shared/link-styles";

/** How many suggestions the home page shows before sending people to the full
    results. Enough to be useful, few enough that the page stays a home rather
    than becoming a second search screen. */
const SUGGESTION_LIMIT = 3;

/**
 * The OWNER home (Nidz 1.4, step 2).
 *
 * The same promise as the entry screen — the approved title, subtitle and
 * the three animals on the deep-teal card — then the person's own things as
 * cards, one idea each. Not a dashboard (§127). Every section here is either the
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
    /* Suggestions to an owner never include their own sitter profile. */
    return matchSitters(publicSitters(state, { excludeOwn: true }), suggestionCriteria, account?.communeId ?? null, lng).slice(
      0,
      SUGGESTION_LIMIT,
    );
  }, [suggestionCriteria, account?.communeId, lng, state]);

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

  const sent = requestsSent(state);
  const pending = sent.filter((r) => r.status === "pending").length;

  /* The request the owner was preparing, by name. Resolved against the real
     directory: a bookmark to a sitter that no longer exists is not offered. */
  const draft = state.requestDraft;
  const draftSitter = draft ? findSitter(state, draft.sitterId).sitter : null;
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

  const rowCls =
    "surface surface-press flex min-h-[4.5rem] w-full items-center gap-3.5 p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="container pb-10 pt-1 md:pb-16 md:pt-4">
      <Helmet>
        <title>
          {t("common.appName")} — {t("entry.title")}
        </title>
        <meta name="description" content={t("entry.subtitle")} />
      </Helmet>

      <div className="mx-auto max-w-[1080px]">
        <HomeHero />

        <div className="mt-4 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-60">
            {hasNeed ? (
              <Link to={{ pathname: "/search", search: resume }}>
                <Search aria-hidden="true" />
                {t("entry.resume")}
              </Link>
            ) : (
              <Link to="/owner/need/pet">
                <Search aria-hidden="true" />
                {t("entry.findCare")}
              </Link>
            )}
          </Button>
          {/* The other side, as the second door. With no sitter side yet it is
              an invitation phrased as an activity; with one, it is the SWITCH
              — having a sitter profile does not stop you being an owner, and
              nothing is discarded by moving. */}
          {state.capabilities.sitter ? (
            <Button type="button" size="lg" variant="surface" className="w-full sm:w-auto sm:min-w-60" onClick={() => switchWorkspace("sitter")}>
              <HomeHeart aria-hidden="true" />
              {t("workspace.toSitter")}
            </Button>
          ) : (
            <Button asChild size="lg" variant="surface" className="w-full sm:w-auto sm:min-w-60">
              <Link to="/sitter/start">
                <HomeHeart aria-hidden="true" />
                {t("entry.becomeSitter")}
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {/* An unsent request, named after its sitter (Audit 1.3 LOT 01). It
              says "not sent yet" in words: a request in preparation must never
              read as one that was sent. Discarding forgets the bookmark only. */}
          {draft && draftSitter && (
            <div className="surface flex items-center gap-1 p-1.5 md:col-span-2">
              <Link
                to={requestPath(draft.sitterId, draft.search)}
                className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg p-2.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Neutral, never a status colour: nothing has been sent. */}
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Inbox className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">
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
                className="shrink-0 text-muted-foreground"
                onClick={() => dispatch({ type: "discardRequestDraft" })}
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">
                  {t("home.draft.discard", { sitter: isolate(draftSitter.publicName) })}
                </span>
              </Button>
            </div>
          )}

          {/* The household. Shown once there is anything to show: the need
              flow saves an animal with no account at all. */}
          {(pets.length > 0 || state.capabilities.owner) && (
            <Link to="/owner/pets" className={rowCls}>
              {pets.length > 0 ? (
                <span aria-hidden="true" className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
                  {pets.slice(0, 3).map((p) => (
                    <AnimalPortrait key={p.id} species={p.species} className="size-11 rounded-full ring-2 ring-card" />
                  ))}
                </span>
              ) : (
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Plus className="size-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">{t("nav.pets")}</span>
                <span className="mt-0.5 block break-words text-sm text-muted-foreground">
                  {pets.length > 0 ? pets.map((p) => p.name).filter(Boolean).join(" · ") : t("pets.empty.title")}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          )}

          {/* The person's own data, so it is the one thing that can honestly be
              counted. Absent entirely when there is nothing to count. */}
          {sent.length > 0 && (
            <Link to="/owner/requests" className={rowCls}>
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Inbox className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">{t("entry.myRequests")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {pending > 0
                    ? t("entry.requestsPending", { count: pending })
                    : t("entry.requestsCount", { count: sent.length })}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Only with a location, and only with real matches. The heading names
            the filter that produced the list — not a verdict about the animal. */}
        {suggestions.length > 0 && (
          <section aria-labelledby="home-nearby" className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <h2 id="home-nearby" className="text-title font-semibold text-foreground">
                {suggestionCriteria?.species
                  ? t("home.nearby.titleSpecies", {
                      wilaya: wilayaName,
                      species: t(`speciesPlural.${suggestionCriteria.species}`).toLocaleLowerCase(lng),
                    })
                  : t("home.nearby.title", { wilaya: wilayaName })}
              </h2>
              <Link
                to={{ pathname: "/search", search: suggestionSearch }}
                className={ACTION_LINK_END}
              >
                {t("home.nearby.seeAll")}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>

            <ul role="list" className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                  layout="stack"
                  /* The heading already says "who accept cats"; repeating it on
                     every card discriminates nothing. Same rule /search applies. */
                  showSpeciesEyebrow={!suggestionCriteria?.species}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
