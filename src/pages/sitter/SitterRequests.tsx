import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import ClarificationThread from "@/components/request/ClarificationThread";
import RequestSummary from "@/components/request/RequestSummary";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { awaitingReplyFrom } from "@/data/clarification";
import { findRequest, requestsReceived, requestsSent, sitterNameFor } from "@/data/repository";
import type { CareRequest } from "@/data/types";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { ACTION_LINK, INLINE_LINK } from "@/components/shared/link-styles";
import { Inbox } from "lucide-react";

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
  const { state, dispatch } = useDemo();
  const switchWorkspace = useSwitchWorkspace();
  /* Which request was just answered, so focus can follow the outcome. */
  const answeredRef = useRef<string | null>(null);

  /* Only the requests addressed to THIS profile. Showing the ones sent to
     demo sitters under a heading meaning "requests you received" would offer
     Accept and Decline on somebody else's behalf. */
  const myId = state.sitter?.profile.id;
  const requests = requestsReceived(state);

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterRequests.title")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        {/* No back control: this is the ROOT of the sitter workspace (§86), and
            a back that fell through to `/` would bounce straight here again —
            `/` sends an account whose active workspace is sitter to this very
            screen. The way out of a workspace is the switch below, not Back. */}
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("sitterRequests.title")}</h1>

        {/* §22 lists "mon profil de garde" as a real sitter destination, and
            unlike Messages or Disponibilités that screen exists. Without this
            a published sitter can only reach it by finding themselves in the
            search results.

            It points at the PUBLIC profile, not at `/sitter/preview`. The
            preview is the last step of the builder: it carries an 8-of-8
            progress bar and, once published, a primary action that leads back
            to this very screen. Sending a finished sitter there shows them a
            wizard they have already completed and a button that goes in a
            circle. The public route is also the honest answer to "view my
            profile" — it is what an owner sees.

            The owner chrome that comes with `/sitters/*` is correct and not a
            bug to route around: `workspaceForPath` files public profiles on the
            owner side because that is whose screen it is. */}
        {state.sitter?.published && (
          <p className="mt-3 text-sm">
            <Link
              to={`/sitters/${state.sitter.profile.id}`}
              className={INLINE_LINK}
            >
              {t("sitterFlow.published.viewProfile")}
            </Link>
          </p>
        )}

        {/* Above the branch: the first thing a new sitter reads must not be an
            unqualified promise that owners will write to them. */}
        <DemoNotice
          className="mt-5"
          title={t("sitterRequests.demoTitle")}
          body={t("sitterRequests.demoBody")}
        />

        {requests.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Inbox}
            title={t("sitterRequests.emptyTitle")}
            body={t("sitterRequests.emptyBody")}
            action={
              !state.sitter?.published ? (
                <Button asChild variant="outline">
                  <Link to="/sitter/start">{t("sitterFlow.start.cta")}</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul role="list" className="mt-6 space-y-10">
              {requests.map((request) => (
                <IncomingRequest key={request.id} request={request} answeredRef={answeredRef} />
              ))}
            </ul>
          </>
        )}

        {/* The way back to the other side of the same account. A workspace has
            to have an exit that is not the browser's Back button, and this one
            records the move so the chrome and every shared screen follow. */}
        <p className="mt-10">
          <button
            type="button"
            onClick={() => switchWorkspace("owner")}
            className={ACTION_LINK}
          >
            {t("workspace.toOwner")}
          </button>
        </p>
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
        <StatusBadge status={request.status} />
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
    </li>
  );
}
