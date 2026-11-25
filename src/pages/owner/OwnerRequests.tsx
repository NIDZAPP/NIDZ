import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { PostCard } from "@/components/posts/post-ui";
import { postStatusKey, proposalStatusKey, requestStatusKey } from "@/components/posts/post-status";
import DraftCards from "@/components/requests/DraftCards";
import { DirectRequestRow, ProposalRow, RowGroup } from "@/components/requests/rows";
import Segmented, { SegmentPanel } from "@/components/shared/Segmented";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { REQUEST_TABS, WELCOME_PATH, hasSession, postPath, requestsTabFrom, type RequestsTab } from "@/data/navigation";
import { findPost, postsPublished, proposalsReceived, requestsSent } from "@/data/repository";
import { proposalAwaitsOwner } from "@/data/publications";
import { useDemo } from "@/state/demo/context";
import { toISODate, today } from "@/utils/dates";

const LIVE = new Set(["pending", "open", "accepted"]);

/**
 * DEMANDES, owner side (Nidz 1.7 §20.1): three sections in the address
 * (`?tab=`), the same three words as on the sitter side.
 *
 *   Reçues    proposals sitters made on the owner's PUBLISHED requests — the
 *             new thing to decide on;
 *   Envoyées  direct requests to one sitter, and the published requests
 *             themselves, each labelled as what it is;
 *   Validées  what was accepted, on either path — an agreement between two
 *             people, never a reservation or a payment.
 *
 * Unfinished care requests are « Brouillon » cards under the controls, only
 * when one exists. Declined, withdrawn, past and cancelled items are kept,
 * folded into each section's « Historique » — no fifth tab.
 */
export default function OwnerRequests() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const [params, setParams] = useSearchParams();

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;

  const proposals = proposalsReceived(state);
  const direct = requestsSent(state);
  const posts = postsPublished(state);

  /* Only what the owner can still decide (the same rule as the badge). */
  const pendingProposals = proposals.filter((p) => proposalAwaitsOwner(p, findPost(state, p.postId), toISODate(today()))).length;
  const fallback: RequestsTab = pendingProposals > 0 || (direct.length === 0 && posts.length === 0) ? "received" : "sent";
  const tab = requestsTabFrom(params, fallback);
  const setTab = (next: RequestsTab) => setParams({ tab: next }, { replace: true, preventScrollReset: true });

  const directRow = (r: (typeof direct)[number]) => <DirectRequestRow key={r.id} request={r} to={`/owner/requests/${r.id}`} who="sitter" />;
  const postRow = (p: (typeof posts)[number]) => <PostCard key={p.id} post={p} to={postPath("owner", p.id)} />;
  const proposalRow = (p: (typeof proposals)[number]) => (
    <ProposalRow key={p.id} proposal={p} post={findPost(state, p.postId)} to={postPath("owner", p.postId)} who="sitter" />
  );

  const live = <T,>(items: T[], key: (item: T) => string) => items.filter((i) => LIVE.has(key(i)) && key(i) !== "accepted");
  const ended = <T,>(items: T[], key: (item: T) => string) => items.filter((i) => !LIVE.has(key(i)));

  const proposalKey = (p: (typeof proposals)[number]) => proposalStatusKey(p, findPost(state, p.postId));

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerRequests.title")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("ownerRequests.title")}</h1>

        <Segmented
          className="mt-5 w-full"
          stretch
          idPrefix="requests"
          label={t("ownerRequests.title")}
          value={tab}
          onChange={setTab}
          items={REQUEST_TABS.map((key) => ({
            key,
            label: t(`requestsHub.tabs.${key}`),
            count: key === "received" ? pendingProposals : undefined,
            countLabel: key === "received" ? t("requestsHub.waitingCount", { count: pendingProposals }) : undefined,
          }))}
        />

        <DraftCards />

        <SegmentPanel idPrefix="requests" activeKey={tab}>
          {tab === "received" && (
            <RowGroup
              rows={live(proposals, proposalKey).map(proposalRow)}
              history={ended(proposals, proposalKey).map(proposalRow)}
              empty={<Empty title={t("requestsHub.owner.receivedEmpty.title")} body={t("requestsHub.owner.receivedEmpty.body")} />}
            />
          )}

          {tab === "sent" && (
            <>
              <RowGroup
                title={t("requestsHub.owner.directTitle")}
                rows={live(direct, requestStatusKey).map(directRow)}
                history={ended(direct, requestStatusKey).map(directRow)}
                empty={<p className="mt-2 text-sm text-muted-foreground">{t("requestsHub.owner.directEmpty")}</p>}
              />
              <RowGroup
                title={t("requestsHub.owner.postsTitle")}
                rows={live(posts, postStatusKey).map(postRow)}
                history={ended(posts, postStatusKey).map(postRow)}
                empty={<p className="mt-2 text-sm text-muted-foreground">{t("requestsHub.owner.postsEmpty")}</p>}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/">{t("requestsHub.owner.start")}</Link>
                </Button>
              </div>
            </>
          )}

          {tab === "validated" && (
            <RowGroup
              rows={[
                ...direct.filter((r) => r.status === "accepted").map(directRow),
                ...posts.filter((p) => p.status === "accepted").map(postRow),
              ]}
              history={[
                ...direct.filter((r) => r.status === "cancelled").map(directRow),
                ...posts.filter((p) => p.status === "cancelled").map(postRow),
              ]}
              empty={<Empty title={t("requestsHub.validatedEmpty.title")} body={t("requestsHub.validatedEmpty.body")} />}
            />
          )}
        </SegmentPanel>

        <DemoLine className="mt-8">{t("ownerRequests.demoNote")}</DemoLine>
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface p-5">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
