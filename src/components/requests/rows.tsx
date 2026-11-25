import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { KindTag } from "@/components/posts/post-ui";
import { proposalStatusKey, requestStatusKey } from "@/components/posts/post-status";
import StatusBadge from "@/components/shared/StatusBadge";
import { awaitingReplyFrom } from "@/data/clarification";
import type { CarePost, Proposal } from "@/data/publications";
import { sitterNameFor } from "@/data/repository";
import { CARE_UNIT_KEY, type CareRequest } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { formatDateRange } from "@/utils/dates";
import { formatDZD } from "@/utils/format";

/* The rows of Demandes (Nidz 1.7 §20), shared by both spaces so a request
   looks the same from either side: the animal, who, the service and dates,
   the status — and the KIND, because a published request, a direct request
   and a proposal are three different things (§14.3). */

const ROW =
  "surface surface-press flex items-start gap-3.5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function DirectRequestRow({ request, to, who }: { request: CareRequest; to: string; who: "sitter" | "owner" }) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const CareIcon = CARE_ICON[request.careType];
  const name = who === "sitter" ? sitterNameFor(state, request.sitterId) : request.ownerName;
  return (
    <li>
      <Link to={to} className={ROW}>
        <AnimalPortrait species={request.pet.species} className="size-12 shrink-0 rounded-full" sizes="48px" />
        <span className="min-w-0 flex-1">
          <span className="block break-words text-name font-semibold text-foreground">
            <bdi>{request.pet.name}</bdi>
            <span className="text-muted-foreground"> · </span>
            <bdi className="font-normal text-muted-foreground">{name}</bdi>
          </span>
          <span className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <CareIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {t(`care.${request.careType}`)}
              <span aria-hidden="true"> · </span>
              <bdi>{formatDateRange(request.dates, lng)}</bdi>
            </span>
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={requestStatusKey(request)} />
            <KindTag kind="direct" />
          </span>
          {request.status === "pending" && awaitingReplyFrom(request) === (who === "sitter" ? "owner" : "sitter") && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MessageCircleQuestion className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {t("clarify.questionForYouShort")}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export function ProposalRow({
  proposal,
  post,
  to,
  who,
}: {
  proposal: Proposal;
  post: CarePost | null;
  to: string;
  /** Whose name to show: the sitter's (owner side) or the owner's. */
  who: "sitter" | "owner";
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const name = who === "sitter" ? sitterNameFor(state, proposal.sitterId) : (post?.ownerName ?? "");
  return (
    <li>
      <Link to={to} className={ROW}>
        {post && <AnimalPortrait species={post.pet.species} className="size-12 shrink-0 rounded-full" sizes="48px" />}
        <span className="min-w-0 flex-1">
          <span className="block break-words text-name font-semibold text-foreground">
            <bdi>{name}</bdi>
            {post && (
              <>
                <span className="text-muted-foreground"> · </span>
                <bdi className="font-normal text-muted-foreground">{post.pet.name}</bdi>
              </>
            )}
          </span>
          {post && (
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {t(`care.${post.careType}`)} · <bdi>{formatDateRange(post.dates, lng)}</bdi>
            </span>
          )}
          {proposal.displayedRate && (
            <span className="mt-0.5 block text-sm text-foreground">
              {formatDZD(proposal.displayedRate.amount, lng)} / {t(CARE_UNIT_KEY[proposal.displayedRate.careType])}
            </span>
          )}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge status={proposalStatusKey(proposal, post)} />
            <KindTag kind="proposal" />
          </span>
          {proposal.simulated && <span className="mt-1 block text-xs font-semibold text-muted-foreground">{t("proposals.simulated")}</span>}
        </span>
      </Link>
    </li>
  );
}

/** A group of rows with a heading, and a folded « Historique ». */
export function RowGroup({
  title,
  rows,
  history,
  empty,
}: {
  title?: string;
  rows: ReactNode[];
  history?: ReactNode[];
  empty?: ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = title ? `group-${title.replace(/\W+/g, "-")}` : undefined;
  return (
    <section aria-labelledby={id} className="mt-6">
      {title && (
        <h2 id={id} className="text-title font-semibold text-foreground">
          {title}
        </h2>
      )}
      {rows.length > 0 ? <ul role="list" className={cn("grid gap-3", title && "mt-3")}>{rows}</ul> : empty}
      {history && history.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-ms-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("requestsHub.history", { count: history.length })}
            <ChevronDown className={cn("size-4 transition-transform duration-200 ease-out", open && "rotate-180")} aria-hidden="true" />
          </button>
          {open && <ul role="list" className="mt-2 grid gap-3 animate-fade-in">{history}</ul>}
        </div>
      )}
    </section>
  );
}
