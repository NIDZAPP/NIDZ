import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown, Megaphone } from "lucide-react";

import { CompatLine, PostCard } from "@/components/posts/post-ui";
import EmptyState from "@/components/shared/EmptyState";
import { ChipGroup } from "@/components/shared/Chip";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { compareProximity, petRef, proximity } from "@/data/criteria";
import { compatibility, compatibilityRank, type Compatibility } from "@/data/compatibility";
import { WELCOME_PATH, hasSession, postPath, sitterResumePath, sitterVisibility } from "@/data/navigation";
import { offeredServices, overlapsDeclaredUnavailable } from "@/data/offer";
import { acceptsProposals, standingProposal, type CarePost } from "@/data/publications";
import { feedPosts } from "@/data/repository";
import { CARE_TYPES, type CareType, type SitterProfile } from "@/data/types";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { toISODate, today } from "@/utils/dates";

type Entry = {
  post: CarePost;
  compat: Compatibility;
  /** Why it is outside the sitter's own declarations, when it is. */
  outside: "animal" | "service" | "unavailable" | null;
};

function assess(post: CarePost, profile: SitterProfile): Entry {
  const compat = compatibility(profile, petRef(post.pet));
  const outside =
    compat.level === "incompatible"
      ? "animal"
      : !offeredServices(profile).includes(post.careType)
        ? "service"
        : overlapsDeclaredUnavailable(profile, post.dates)
          ? "unavailable"
          : null;
  return { post, compat, outside };
}

/**
 * The SITTER'S ACCUEIL (Nidz 1.7 §17): requests owners published, nearest
 * first.
 *
 * Each card says what a sitter needs to decide whether to open it — the
 * animal and its breed, the service, the dates, the approximate area, the
 * owner's declared needs — and whether it fits what the sitter declared:
 * the animals and breeds they accept, the services they offer, the periods
 * they said they are unavailable. Fitting is never « disponible »: not
 * having declared a period busy confirms nothing, so the feed says
 * « correspond à votre profil », not « vous êtes disponible ».
 *
 * Requests outside the sitter's own declarations are not hidden — they are
 * folded under « Hors de vos critères », with the reason, so a sitter who
 * forgot to tick « lapins » can see why.
 *
 * A profile owners cannot find yet still sees the feed (to know what is
 * asked for nearby), with the one action that matters first: finish the
 * profile — resumed where it stopped, never restarted.
 *
 * Where requests come from, honestly: the examples, and what the visitor
 * published from their own owner space on this device. Nobody else.
 */
export default function SitterFeed() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const [params, setParams] = useSearchParams();
  const [showOutside, setShowOutside] = useState(false);
  const careParam = params.get("care");
  const care = (CARE_TYPES as readonly string[]).includes(careParam ?? "") ? (careParam as CareType) : null;

  const sitter = state.sitter;
  const visibility = sitterVisibility(state);
  const profile = sitter?.profile ?? null;

  const { fits, outside } = useMemo(() => {
    if (!profile) return { fits: [] as Entry[], outside: [] as Entry[] };
    const todayISO = toISODate(today());
    const origin = { wilayaCode: profile.wilayaCode || null, communeCode: profile.communeCode || null };
    const entries = feedPosts(state)
      .filter((post) => acceptsProposals(post, todayISO))
      .filter((post) => !care || post.careType === care)
      .map((post) => assess(post, profile))
      .sort((a, b) => {
        const near = compareProximity(proximity(origin, a.post), proximity(origin, b.post));
        if (near !== 0) return near;
        const fit = compatibilityRank(a.compat) - compatibilityRank(b.compat);
        if (fit !== 0) return fit;
        return a.post.dates.start < b.post.dates.start ? -1 : a.post.dates.start > b.post.dates.start ? 1 : 0;
      });
    /* A profile with no animals declared yet cannot be matched: everything
       is shown, nothing is claimed as fitting. */
    if (profile.acceptedSpecies.length === 0) return { fits: entries.map((e) => ({ ...e, outside: null })), outside: [] };
    return { fits: entries.filter((e) => !e.outside), outside: entries.filter((e) => e.outside) };
  }, [state, profile, care]);

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;
  if (!sitter || !profile) return <Navigate to="/sitter/start" replace />;

  const listed = visibility === "listed";
  const undeclared = profile.acceptedSpecies.length === 0;
  const myId = profile.id;

  const setCare = (value: string | null) =>
    setParams(value ? { care: value } : {}, { replace: true, preventScrollReset: true });

  const card = (entry: Entry) => {
    const mine = standingProposal(state.proposals, entry.post.id, myId);
    return (
      <PostCard
        key={entry.post.id}
        post={entry.post}
        to={postPath("sitter", entry.post.id)}
        compat={undeclared ? null : entry.compat}
        showStatus={false}
        footer={
          <>
            {entry.outside && entry.outside !== "animal" && (
              <p className="mt-1 text-sm text-muted-foreground">{t(`feed.outside.${entry.outside}`)}</p>
            )}
            {mine && <p className="mt-1.5 text-sm font-semibold text-primary">{t(`feed.proposal.${mine.status}`)}</p>}
            {!entry.post.isDemoFixture && <p className="mt-1.5 text-xs font-medium text-muted-foreground">{t("feed.yours")}</p>}
          </>
        }
      />
    );
  };

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("feed.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("feed.title")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("feed.intro")}</p>

        {!listed && (
          <div className="surface mt-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">{t(`feed.notListed.${visibility === "hidden" ? "hidden" : "draft"}.title`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`feed.notListed.${visibility === "hidden" ? "hidden" : "draft"}.body`)}</p>
            </div>
            <Button asChild className="shrink-0">
              <Link to={visibility === "hidden" ? "/sitter/profile" : sitterResumePath(state)}>
                {t("feed.notListed.action")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}

        <ChipGroup
          className="mt-5"
          label={t("feed.filterLabel")}
          value={care ?? "all"}
          onChange={(value) => setCare(value === "all" ? null : value)}
          options={[
            { value: "all", label: t("feed.filterAll") },
            ...CARE_TYPES.filter((c) => profile.services.length === 0 || profile.services.includes(c)).map((c) => ({
              value: c,
              label: t(`care.${c}`),
            })),
          ]}
        />

        <DemoNotice className="mt-5" title={t("feed.demoTitle")} body={t("feed.demoBody")} />

        {fits.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Megaphone}
            title={t("feed.empty.title")}
            body={t(outside.length ? "feed.empty.bodyOutside" : "feed.empty.body")}
          />
        ) : (
          <section aria-labelledby="feed-fits" className="mt-6">
            <h2 id="feed-fits" className="text-title font-semibold text-foreground">
              {undeclared ? t("feed.allTitle", { count: fits.length }) : t("feed.fitsTitle", { count: fits.length })}
            </h2>
            {undeclared && <p className="mt-1 text-sm text-muted-foreground">{t("feed.undeclared")}</p>}
            <ul role="list" className="mt-3 grid gap-3">
              {fits.map(card)}
            </ul>
          </section>
        )}

        {outside.length > 0 && (
          <section aria-labelledby="feed-outside" className="mt-8">
            {/* The disclosure pattern: the button INSIDE the heading, so the
                heading stays in the outline and the control keeps its role. */}
            <h2 id="feed-outside" className="text-title font-semibold text-foreground">
              <button
                type="button"
                aria-expanded={showOutside}
                aria-controls="feed-outside-list"
                onClick={() => setShowOutside((v) => !v)}
                className="-ms-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("feed.outsideTitle", { count: outside.length })}
                <ChevronDown className={cn("size-5 transition-transform duration-200 ease-out", showOutside && "rotate-180")} aria-hidden="true" />
              </button>
            </h2>
            <div id="feed-outside-list" hidden={!showOutside}>
              {showOutside && <ul role="list" className="mt-3 grid gap-3 animate-fade-in">{outside.map(card)}</ul>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

