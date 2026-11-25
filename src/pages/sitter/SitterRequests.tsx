import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import ClarificationThread from "@/components/request/ClarificationThread";
import RequestSummary from "@/components/request/RequestSummary";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { awaitingReplyFrom } from "@/data/clarification";
import { requestsReceived, sitterNameFor } from "@/data/repository";
import type { CareRequest } from "@/data/types";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { sitterResumePath, sitterVisibility } from "@/data/navigation";
import { Inbox } from "lucide-react";
import { proposalStatusKey, requestStatusKey } from "@/components/posts/post-status";
import { ProposalRow, RowGroup } from "@/components/requests/rows";
import Segmented, { SegmentPanel } from "@/components/shared/Segmented";
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
import { REQUEST_TABS, hasSession, postPath, requestsTabFrom, type RequestsTab } from "@/data/navigation";
import { findPost, proposalsSent } from "@/data/repository";

/**
 * "Demandes reçues" — the sitter's side of the same records.
 *
 * These are literally the objects the owner created: one `requests` array in
 * one store, so accepting here changes what the owner sees, without any
 * synchronisation to get wrong.
 *
 * Accepting is a person saying yes. It is NOT a booking, there is no payment
 * and there is no protection — §28 and the audit (p.522) both forbid claiming
 * any of the three, and the copy under the actions says so.
 *
 * "Refuser" is a normal outcome, not a destructive one: a sitter whose home
 * has a cat declining a cat-intolerant dog is the matching working correctly.
 * It is therefore not a red button (§12.1).
 *
 * AUDIT 1.3 LOT 07 — A QUESTION BEFORE A DECISION. Beside Accepter and
 * Refuser, "Poser une question" adds a question to the request (see
 * `src/data/clarification.ts`). The request stays "En attente" while questions
 * go back and forth; only the two decisions change its status. Nothing is
 * transmitted, and the thread says so.
 */
export default function SitterRequests() {
  const { t } = useTranslation();
  const { state } = useDemo();
  /* Which request was just answered, so focus can follow the outcome. */
  const answeredRef = useRef<string | null>(null);

  /* Only the requests addressed to THIS profile. Showing the ones sent to
     demo sitters under a heading meaning "requests you received" would offer
     Accept and Decline on somebody else's behalf. */
  const requests = requestsReceived(state);
  const visibility = sitterVisibility(state);
  const [params, setParams] = useSearchParams();
  const tab = requestsTabFrom(params, "received");
  const setTab = (next: RequestsTab) => setParams({ tab: next }, { replace: true, preventScrollReset: true });
  const sent = proposalsSent(state);
  const waiting = requests.filter((r) => r.status === "pending" && awaitingReplyFrom(r) !== "owner").length;

  /* No sitter side on this device: nothing to receive, and the introduction
     is where one starts. */
  if (!hasSession(state)) return <Navigate to="/welcome" replace />;
  if (!state.sitter) return <Navigate to="/sitter/start" replace />;

  const incoming = (list: CareRequest[]) =>
    list.map((request) => <IncomingRequest key={request.id} request={request} answeredRef={answeredRef} />);
  const proposalRow = (p: (typeof sent)[number]) => (
    <ProposalRow key={p.id} proposal={p} post={findPost(state, p.postId)} to={postPath("sitter", p.postId)} who="owner" />
  );
  const proposalKey = (p: (typeof sent)[number]) => proposalStatusKey(p, findPost(state, p.postId));

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerRequests.title")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        {/* No back control: this is the ROOT of the sitter workspace (§86).
            The way to the other side is the switch in Compte, a tab of this
            bar. */}
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("ownerRequests.title")}</h1>

        <Segmented
          className="mt-5 w-full"
          stretch
          idPrefix="sitter-requests"
          label={t("sitterRequests.title")}
          value={tab}
          onChange={setTab}
          items={REQUEST_TABS.map((key) => ({
            key,
            label: t(`requestsHub.tabs.${key}`),
            count: key === "received" ? waiting : undefined,
            countLabel: key === "received" ? t("requestsHub.waitingCount", { count: waiting }) : undefined,
          }))}
        />

        <SegmentPanel idPrefix="sitter-requests" activeKey={tab}>
          {tab === "received" && (
            <>
        {/* Above the branch: the first thing a new sitter reads must not be an
            unqualified promise that owners will write to them. Not shown while
            the profile is not visible and nothing has arrived — there are no
            requests for it to qualify, and the card below already says no
            owner can write yet. */}
        {(visibility === "listed" || requests.length > 0) && (
          <DemoNotice
            className="mt-6"
            title={t("sitterRequests.demoTitle")}
            body={t("sitterRequests.demoBody")}
          />
        )}

        {/* A profile owners cannot find receives nothing new, whatever this
            list holds. Said first, with the way to fix it — which RESUMES the
            profile (NAV-01): 1.5 offered "Créer mon profil" here, back to the
            very first sign-up screen. */}
        {visibility !== "listed" && (
          <EmptyState
            className="mt-6"
            icon={Inbox}
            headingLevel="h2"
            title={t(visibility === "hidden" ? "sitterRequests.hiddenTitle" : "sitterRequests.draftTitle")}
            body={t(visibility === "hidden" ? "sitterRequests.hiddenBody" : "sitterRequests.draftBody")}
            action={
              <Button asChild>
                <Link to={sitterResumePath(state)}>
                  {t(visibility === "hidden" ? "workspace.completeSitter" : "workspace.continueSitter")}
                </Link>
              </Button>
            }
          />
        )}

            </>
          )}
          {tab === "received" &&
            (requests.length === 0 ? (
              visibility === "listed" && (
                <EmptyState className="mt-6" icon={Inbox} title={t("sitterRequests.emptyTitle")} body={t("sitterRequests.emptyBody")} />
              )
            ) : (
              <>
                <ul role="list" className="mt-6 space-y-10">
                  {incoming(requests.filter((r) => requestStatusKey(r) === "pending"))}
                </ul>
                {requests.some((r) => requestStatusKey(r) !== "pending" && r.status !== "accepted") && (
                  <RowGroup rows={[]} history={incoming(requests.filter((r) => requestStatusKey(r) !== "pending" && r.status !== "accepted"))} />
                )}
              </>
            ))}

          {tab === "sent" && (
            <RowGroup
              rows={sent.filter((p) => proposalKey(p) === "pending").map(proposalRow)}
              history={sent.filter((p) => !["pending", "accepted"].includes(proposalKey(p))).map(proposalRow)}
              empty={
                <div className="surface mt-6 p-5">
                  <p className="font-semibold text-foreground">{t("requestsHub.sitter.sentEmpty.title")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("requestsHub.sitter.sentEmpty.body")}</p>
                  <Button asChild className="mt-4">
                    <Link to="/sitter/feed">{t("requestsHub.sitter.toFeed")}</Link>
                  </Button>
                </div>
              }
            />
          )}

          {tab === "validated" && (
            <>
              <ul role="list" className="mt-6 space-y-10">
                {incoming(requests.filter((r) => r.status === "accepted"))}
              </ul>
              <RowGroup
                rows={sent.filter((p) => p.status === "accepted").map(proposalRow)}
                history={[...incoming(requests.filter((r) => r.status === "cancelled")), ...sent.filter((p) => p.status === "cancelled").map(proposalRow)]}
                empty={
                  requests.some((r) => r.status === "accepted") ? undefined : (
                    <div className="surface mt-6 p-5">
                      <p className="font-semibold text-foreground">{t("requestsHub.validatedEmpty.title")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t("requestsHub.validatedEmpty.body")}</p>
                    </div>
                  )
                }
              />
            </>
          )}
        </SegmentPanel>
      </div>
    </div>
  );
}

function IncomingRequest({
  request,
  answeredRef,
}: {
  request: CareRequest;
  answeredRef: React.MutableRefObject<string | null>;
}) {
  const { t } = useTranslation();
  const { state } = useDemo();
  /* A decision is recorded only once storage confirms it, and only on a
     request that is still pending as stored — a second tab that still shows
     the buttons cannot turn an acceptance into a refusal (A-02 / A-19). */
  const save = useSave({ watch: (s) => s.requests.find((r) => r.id === request.id)?.status ?? null });
  const decide = (status: "accepted" | "declined") => {
    answeredRef.current = request.id;
    if (!save.save({ type: "respondToRequest", id: request.id, status })) answeredRef.current = null;
  };
  const lastDecision = useRef<"accepted" | "declined">("accepted");
  const [asking, setAsking] = useState(false);
  const askRef = useRef<HTMLButtonElement>(null);
  const restoreAsk = useRef(false);
  useEffect(() => {
    if (!asking && restoreAsk.current) {
      restoreAsk.current = false;
      askRef.current?.focus();
    }
  }, [asking]);
  const waitingForOwner = awaitingReplyFrom(request) === "owner";

  return (
    <li className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-title font-semibold text-foreground">
          <bdi>{request.pet.name}</bdi>
          <span className="font-normal text-muted-foreground">
            {" · "}
            <bdi>{request.ownerName}</bdi>
          </span>
        </h2>
        <StatusBadge status={requestStatusKey(request)} />
      </div>

      {/* The same summary the owner confirmed — everything the sitter needs in
          order to answer honestly, including the animal's important needs. */}
      <RequestSummary
        request={request}
        sitterName={sitterNameFor(state, request.sitterId)}
        headingLevel="h3"
      />

      <ClarificationThread
        request={request}
        side="sitter"
        composerOpen={asking}
        onComposerOpenChange={(open, reason) => {
          if (!open && reason === "cancelled") restoreAsk.current = true;
          setAsking(open);
        }}
      />

      {/* Announced and focusable: answering removes the buttons from the DOM,
          which would otherwise drop focus to the body with nothing said. */}
      {request.status === "pending" ? (
        <>
          {waitingForOwner && (
            <p className="px-1 text-sm font-medium text-foreground">{t("clarify.waitingOwner")}</p>
          )}
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                lastDecision.current = "accepted";
                decide("accepted");
              }}
            >
              {t("sitterRequests.accept")}
            </Button>
            {/* Before deciding: a question, not a third verdict. */}
            {!asking && (
              <Button ref={askRef} type="button" variant="outline" onClick={() => setAsking(true)}>
                {t("clarify.ask")}
              </Button>
            )}
            {/* Secondary, and deliberately not destructive. */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                lastDecision.current = "declined";
                decide("declined");
              }}
            >
              {t("sitterRequests.decline")}
            </Button>
          </div>
          <p className="max-w-[64ch] px-1 text-sm text-muted-foreground">{t("sitterRequests.acceptNote")}</p>
          <SaveFeedback save={save} onRetry={() => decide(lastDecision.current)} />
        </>
      ) : (
        <p
          role="status"
          tabIndex={-1}
          ref={(node) => {
            if (node && answeredRef.current === request.id) {
              node.focus();
              answeredRef.current = null;
            }
          }}
          className="max-w-[64ch] rounded-xl bg-card p-4 text-base leading-relaxed text-muted-foreground shadow-card focus:outline-none"
        >
          {t(`sitterRequests.answered.${request.status}`)}
        </p>
      )}
      {request.status === "accepted" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="surface">
              {t("arrangement.cancel")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("arrangement.cancelTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("arrangement.cancelBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => save.save({ type: "cancelRequest", id: request.id, by: "sitter" })}>
                {t("arrangement.cancelConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}
