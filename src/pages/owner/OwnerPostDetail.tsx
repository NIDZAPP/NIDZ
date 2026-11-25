import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CircleCheck, FlaskConical, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { CompatLine } from "@/components/posts/post-ui";
import { postStatusKey, proposalStatusKey, useNeedsText } from "@/components/posts/post-status";
import { categoryText } from "@/components/request/pet-facts";
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
import { WELCOME_PATH, hasSession, requestsPath } from "@/data/navigation";
import { offeredServices, overlapsDeclaredUnavailable, rateFor } from "@/data/offer";
import { kindLabel } from "@/data/pets";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import {
  acceptsProposals,
  canEditPost,
  proposalAwaitsOwner,
  proposalsFor,
  standingProposal,
  type CarePost,
  type Proposal,
} from "@/data/publications";
import { findPost, publicSitters, sitterNameFor } from "@/data/repository";
import { CARE_UNIT_KEY } from "@/data/types";
import { useAction } from "@/hooks/use-action";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, formatRelativeTime, toISODate, today } from "@/utils/dates";
import { formatDZD, isolate } from "@/utils/format";

/**
 * One of the owner's PUBLISHED requests (Nidz 1.7 §14.1): what sitters see,
 * the proposals received, and what the owner can do with it.
 *
 *   - Accept ONE proposal (confirmed first): the post closes, the others are
 *     marked « non retenue » in the same write. It is an agreement to arrange
 *     care with that person, not a booking or a payment — said in the
 *     confirmation and on the result.
 *   - Decline a proposal; open the sitter's profile; write to them.
 *   - Edit (service and dates) while nobody is accepted; withdraw it; call
 *     off an accepted arrangement, with its consequence stated.
 *
 * TEST TOOL, SEPARATED. On one device nobody else can propose. « Simuler une
 * proposition » writes a proposal on behalf of an EXAMPLE sitter whose
 * declarations fit, so the owner can try accepting and declining. It sits in
 * a labelled demonstration box, and every simulated proposal says so.
 */
export default function OwnerPostDetail() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state } = useDemo();
  const post = findPost(state, id);
  const needs = useNeedsText(post);
  /* Every decision here is saved like a form (A-02) and checked against
     what another tab may have done to this post meanwhile. */
  const action = useAction((s) => {
    const p = s.posts.find((x) => x.id === id);
    return [p?.status ?? null, p?.careType ?? null, p?.dates ?? null, s.proposals.filter((x) => x.postId === id).map((x) => [x.id, x.status])];
  });

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;
  if (!post || post.isDemoFixture) return <Navigate to={requestsPath("owner", "sent")} replace />;

  const todayISO = toISODate(today());
  const proposals = proposalsFor(state.proposals, post.id);
  const pending = proposals.filter((p) => p.status === "pending");
  const others = proposals.filter((p) => p.status !== "pending");
  const accepted = proposals.find((p) => p.id === post.acceptedProposalId) ?? null;
  const editable = canEditPost(post, todayISO);
  const open = acceptsProposals(post, todayISO);

  const kind = kindLabel(post.pet, locale);
  const CareIcon = CARE_ICON[post.careType];
  const area = placeName({ wilayaCode: post.wilayaCode, communeCode: post.communeCode }, locale);

  /* An example sitter who could plausibly propose: accepts this animal, offers
     the service, has not declared these dates unavailable, has not proposed. */
  const simulatable = publicSitters(state, { excludeOwn: true }).find(
    (s) =>
      s.isDemoFixture &&
      compatibility(s, petRef(post.pet)).level !== "incompatible" &&
      offeredServices(s).includes(post.careType) &&
      !overlapsDeclaredUnavailable(s, post.dates) &&
      !standingProposal(state.proposals, post.id, s.id) &&
      !proposals.some((p) => p.sitterId === s.id),
  );

  const simulate = () => {
    if (!simulatable) return;
    const rate = rateFor(simulatable, [post.careType]);
    action.run({
      type: "addProposal",
      proposal: {
        id: `proposal-sim-${Date.now().toString(36)}`,
        postId: post.id,
        sitterId: simulatable.id,
        createdAt: new Date().toISOString(),
        message: "",
        displayedRate: rate ? { amount: rate.amount, careType: rate.careType } : null,
        status: "pending",
        respondedAt: null,
        simulated: true,
      },
    });
  };

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerPost.title", { name: post.pet.name })}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <BackButton fallback={requestsPath("owner", "sent")} />
      <div className="mx-auto max-w-[720px]">
        {params.get("published") === "1" && post.status === "open" && (
          <div role="status" className="surface mb-5 flex items-start gap-3 p-4">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{t("ownerPost.publishedTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("ownerPost.publishedBody")}</p>
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
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={postStatusKey(post)} />
              <span className="text-sm text-muted-foreground">{t("requestKind.post")}</span>
            </div>
          </div>
        </div>

        <div className="surface mt-6 p-4">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CareIcon className="size-5 text-primary" aria-hidden="true" />
            {t(`care.${post.careType}`)}
          </p>
          <p className="mt-1 text-[0.9375rem] text-foreground">{formatDateRange(post.dates, locale)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("postDetail.area", { area: isolate(area ?? "") })}</p>
          <p className="mt-3 text-sm text-foreground">
            <span className="font-medium">{t("needs.labelInline")} </span>
            {needs.text}
          </p>
          {editable && (
            <Button asChild variant="surface" className="mt-4">
              <Link to={`/owner/need/care?post=${encodeURIComponent(post.id)}`}>{t("ownerPost.edit")}</Link>
            </Button>
          )}
        </div>

        {/* ---------------------------------------------------- proposals */}
        <section aria-labelledby="post-proposals" className="mt-8">
          <h2 id="post-proposals" className="text-title font-semibold text-foreground">
            {t("ownerPost.proposalsTitle", { count: proposals.length })}
          </h2>
          {post.status === "accepted" && accepted && (
            <div className="surface mt-3 p-4">
              <p className="font-semibold text-foreground">
                {t("ownerPost.acceptedWith", { name: isolate(sitterNameFor(state, accepted.sitterId)) })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("ownerPost.acceptedMeaning")}</p>
            </div>
          )}
          {proposals.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{open ? t("ownerPost.noProposalsYet") : t("ownerPost.noProposals")}</p>
          ) : (
            <ul role="list" className="mt-3 grid gap-3">
              {[...pending, ...others].map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  post={post}
                  canDecide={proposalAwaitsOwner(proposal, post, todayISO)}
                  onDecide={(status) => action.run({ type: "respondToProposal", id: proposal.id, status })}
                >
                  <StatusBadge status={proposalStatusKey(proposal, post)} />
                </ProposalCard>
              ))}
            </ul>
          )}
        </section>

        {/* ---------------------------------------------------- actions */}
        <SaveFeedback className="mt-6" save={action.save} onRetry={action.retry} />
        <div className="mt-8 flex flex-wrap gap-2">
          {post.status === "open" && (
            <Confirm
              trigger={t("ownerPost.withdraw")}
              title={t("ownerPost.withdrawTitle")}
              body={t("ownerPost.withdrawBody", { count: pending.length })}
              confirm={t("ownerPost.withdrawConfirm")}
              onConfirm={() => action.run({ type: "withdrawPost", id: post.id })}
            />
          )}
          {post.status === "accepted" && (
            <Confirm
              trigger={t("arrangement.cancel")}
              title={t("arrangement.cancelTitle")}
              body={t("arrangement.cancelBody")}
              confirm={t("arrangement.cancelConfirm")}
              onConfirm={() => action.run({ type: "cancelPostArrangement", postId: post.id, by: "owner" })}
            />
          )}
        </div>

        {open && (
          <section aria-labelledby="post-sim" className="mt-10 rounded-xl border border-dashed border-input p-4">
            <h2 id="post-sim" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FlaskConical className="size-4" aria-hidden="true" />
              {t("ownerPost.simTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("ownerPost.simBody")}</p>
            <Button type="button" variant="surface" className="mt-3" disabled={!simulatable} onClick={simulate}>
              {t("ownerPost.simAction")}
            </Button>
            {!simulatable && <p className="mt-2 text-sm text-muted-foreground">{t("ownerPost.simNone")}</p>}
          </section>
        )}

        <DemoNotice className="mt-8" title={t("ownerPost.demoTitle")} body={t("ownerPost.demoBody")} />
      </div>
    </div>
  );
}

/* A top-level component: defined inside the screen, every render made it a
   NEW component type, remounting each card — focus fell to the page after
   Accept or Decline. */
function ProposalCard({
  proposal,
  post,
  canDecide,
  onDecide,
  children,
}: {
  proposal: Proposal;
  post: CarePost;
  canDecide: boolean;
  onDecide: (status: "accepted" | "declined") => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state } = useDemo();
  const sitter = publicSitters(state).find((s) => s.id === proposal.sitterId) ?? null;
  const name = sitterNameFor(state, proposal.sitterId);
  const compat = sitter ? compatibility(sitter, petRef(post.pet)) : null;
  return (
    <li className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            <bdi>{name}</bdi>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatRelativeTime(proposal.createdAt, locale)}</p>
        </div>
        {children}
      </div>
      {proposal.displayedRate && (
        <p className="mt-2 text-sm text-foreground">
          {formatDZD(proposal.displayedRate.amount, locale)} / {t(CARE_UNIT_KEY[proposal.displayedRate.careType])}
        </p>
      )}
      {proposal.message && <p className="mt-2 whitespace-pre-line text-[0.9375rem] text-foreground">{proposal.message}</p>}
      {compat && <CompatLine compat={compat} perspective="owner" className="mt-2" />}
      {proposal.simulated && <p className="mt-2 text-xs font-semibold text-muted-foreground">{t("proposals.simulated")}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {canDecide && (
          <>
            <Confirm
              variant="default"
              trigger={t("ownerPost.accept")}
              title={t("ownerPost.acceptTitle", { name })}
              body={t("ownerPost.acceptBody")}
              confirm={t("ownerPost.acceptConfirm")}
              onConfirm={() => onDecide("accepted")}
            />
            <Button type="button" variant="surface" onClick={() => onDecide("declined")}>
              {t("ownerPost.decline")}
            </Button>
          </>
        )}
        {sitter && (
          <Button asChild variant="ghost">
            <Link to={`/sitters/${encodeURIComponent(sitter.id)}`}>{t("ownerPost.viewProfile")}</Link>
          </Button>
        )}
        {sitter && (
          <Button asChild variant="ghost">
            <Link to={`/messages/to/${encodeURIComponent(sitter.id)}`}>
              <MessageCircle aria-hidden="true" />
              {t("ownerPost.write")}
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function Confirm({
  trigger,
  title,
  body,
  confirm,
  onConfirm,
  variant = "surface",
}: {
  trigger: string;
  title: string;
  body: string;
  confirm: string;
  onConfirm: () => void;
  variant?: "default" | "surface";
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant}>
          {trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
