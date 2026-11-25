import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { CompatLine } from "@/components/posts/post-ui";
import { postStatusKey, proposalStatusKey, useNeedsText } from "@/components/posts/post-status";
import { categoryText, petFacts } from "@/components/request/pet-facts";
import BackButton from "@/components/shared/BackButton";
import StatusBadge from "@/components/shared/StatusBadge";
import { DemoNotice } from "@/components/shared/trust";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { placeName } from "@/data/algeria";
import { compatibility } from "@/data/compatibility";
import { petRef } from "@/data/criteria";
import { SITTER_HOME, WELCOME_PATH, hasSession, requestsPath, sitterVisibility } from "@/data/navigation";
import { offeredServices, overlapsDeclaredUnavailable } from "@/data/offer";
import { kindLabel } from "@/data/pets";
import { acceptsProposals, liveProposal } from "@/data/publications";
import { findPost } from "@/data/repository";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, toISODate, today } from "@/utils/dates";
import { isolate } from "@/utils/format";

/**
 * One published request, as a sitter reads it before proposing (Nidz 1.7
 * §14.2): the animal and what the owner said about it — needs and
 * constraints included, BEFORE any commitment (§24) — the service, the
 * period, the approximate area, and how it fits the sitter's own
 * declarations, item by item.
 *
 * One action: « Proposer mes services », offered only when it can mean
 * something — a profile owners can find, an animal the sitter does not
 * exclude, a post still open, and no live proposal already (no duplicates).
 * Otherwise the screen says why. A pending proposal can be withdrawn.
 */
export default function SitterPostDetail() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, commit } = useDemo();
  const post = findPost(state, id);
  const needs = useNeedsText(post);

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;
  if (!state.sitter) return <Navigate to="/sitter/start" replace />;
  if (!post) return <Navigate to={SITTER_HOME} replace />;

  const profile = state.sitter.profile;
  const listed = sitterVisibility(state) === "listed";
  const compat = compatibility(profile, petRef(post.pet));
  const serviceOk = offeredServices(profile).includes(post.careType);
  const declaredBusy = overlapsDeclaredUnavailable(profile, post.dates);
  const open = acceptsProposals(post, toISODate(today()));
  const mine = liveProposal(state.proposals, post.id, profile.id);
  const own = !post.isDemoFixture;
  const canPropose = listed && open && !mine && compat.level !== "incompatible" && serviceOk;

  const facts = petFacts(post.pet, t, locale);
  const kind = kindLabel(post.pet, locale);
  const CareIcon = CARE_ICON[post.careType];
  const area = placeName({ wilayaCode: post.wilayaCode, communeCode: post.communeCode }, locale);

  const withdraw = () => {
    if (mine) commit({ type: "withdrawProposal", id: mine.id });
  };

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {post.pet.name}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <BackButton fallback={SITTER_HOME} />
      <div className="mx-auto max-w-[720px]">
        {params.get("proposed") === "1" && mine && (
          <div role="status" className="surface mb-5 flex items-start gap-3 p-4">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{t("postDetail.proposedTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {post.isDemoFixture ? t("postDetail.proposedExample") : t("postDetail.proposedOwn")}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <AnimalPortrait species={post.pet.species} className="size-20 shrink-0 rounded-xl" sizes="80px" eager />
          <div className="min-w-0 flex-1">
            <h1 className="text-h1 font-semibold text-foreground">
              <bdi>{post.pet.name}</bdi>
            </h1>
            <p className="mt-1 text-[0.9375rem] text-muted-foreground">
              {categoryText(post.pet, t)}
              {kind ? ` · ${kind}` : ""}
            </p>
            <div className="mt-2">
              <StatusBadge status={postStatusKey(post)} />
            </div>
          </div>
        </div>

        <section aria-labelledby="post-care" className="surface mt-6 p-4">
          <h2 id="post-care" className="sr-only">
            {t("postDetail.careTitle")}
          </h2>
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CareIcon className="size-5 text-primary" aria-hidden="true" />
            {t(`care.${post.careType}`)}
          </p>
          <p className="mt-1 text-[0.9375rem] text-foreground">{formatDateRange(post.dates, locale)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("postDetail.area", { area: isolate(area ?? "") })} · {t("postDetail.by", { name: isolate(post.ownerName) })}
          </p>
        </section>

        <section aria-labelledby="post-needs" className="mt-6">
          <h2 id="post-needs" className="text-title font-semibold text-foreground">
            {t("needFlow.needs.title")}
          </h2>
          <p className={needs.kind === "text" ? "mt-2 whitespace-pre-line text-[0.9375rem] text-foreground" : "mt-2 text-sm text-muted-foreground"}>
            {needs.text}
          </p>
        </section>

        {facts.length > 0 && (
          <section aria-labelledby="post-facts" className="mt-6">
            <h2 id="post-facts" className="text-title font-semibold text-foreground">
              {t("postDetail.factsTitle")}
            </h2>
            <dl className="surface mt-3 divide-y divide-border">
              {facts.map((fact) => (
                <div key={fact.key} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="text-end font-medium text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section aria-labelledby="post-fit" className="mt-6">
          <h2 id="post-fit" className="text-title font-semibold text-foreground">
            {t("postDetail.fitTitle")}
          </h2>
          <div className="surface mt-3 grid gap-2 p-4">
            {profile.acceptedSpecies.length > 0 ? (
              <CompatLine compat={compat} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("feed.undeclared")}</p>
            )}
            <p className="text-sm text-foreground">
              {serviceOk ? t("postDetail.serviceOk") : t("feed.outside.service")}
            </p>
            <p className="text-sm text-muted-foreground">
              {declaredBusy ? t("feed.outside.unavailable") : t("postDetail.notDeclaredBusy")}
            </p>
            <p className="text-sm text-muted-foreground">{t("postDetail.breedNotBehaviour")}</p>
          </div>
        </section>

        {post.isDemoFixture && <DemoNotice className="mt-6" title={t("postDetail.exampleTitle")} body={t("postDetail.exampleBody")} />}
        {own && <DemoNotice className="mt-6" title={t("postDetail.ownTitle")} body={t("postDetail.ownBody")} />}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {mine ? (
            <>
              <div className="flex items-center gap-2 text-sm text-foreground">
                {t("postDetail.yourProposal")} <StatusBadge status={proposalStatusKey(mine, post)} />
              </div>
              {mine.status === "pending" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="surface">
                      {t("postDetail.withdraw")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("postDetail.withdrawTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("postDetail.withdrawBody")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={withdraw}>{t("postDetail.withdrawConfirm")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button asChild variant="ghost">
                <Link to={requestsPath("sitter", "sent")}>{t("postDetail.seeSent")}</Link>
              </Button>
            </>
          ) : canPropose ? (
            <Button asChild size="lg">
              <Link to={`/sitter/posts/${encodeURIComponent(post.id)}/propose`}>{t("postDetail.propose")}</Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground" role="note">
              {!listed
                ? t("postDetail.cannot.notListed")
                : !open
                  ? t("postDetail.cannot.closed")
                  : compat.level === "incompatible"
                    ? t("postDetail.cannot.animal")
                    : t("postDetail.cannot.service")}
            </p>
          )}
          {!listed && (
            <Button asChild variant="surface">
              <Link to="/sitter/profile">{t("feed.notListed.action")}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
