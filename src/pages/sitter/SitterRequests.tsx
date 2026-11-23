import { useRef, useState } from "react";
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
import { useDemo } from "@/state/demo/context";

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
    <div className="container py-10 md:py-14">
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
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("sitterFlow.published.viewProfile")}
            </Link>
          </p>
        )}

        {/* Above the branch: the first thing a new sitter reads must not be an
            unqualified promise that owners will write to them. */}
        <DemoNotice
          className="mt-6"
          title={t("sitterRequests.demoTitle")}
          body={t("sitterRequests.demoBody")}
        />

        {requests.length === 0 ? (
          <EmptyState
            className="mt-8"
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
            <ul role="list" className="mt-8 space-y-10">
              {requests.map((request) => (
                <IncomingRequest key={request.id} request={request} answeredRef={answeredRef} />
              ))}
            </ul>
          </>
        )}

        {/* The way back to the other side of the same account. A workspace has
            to have an exit that is not the browser's Back button, and this one
            records the move so the chrome and every shared screen follow. */}
        <p className="mt-12 border-t border-border pt-8 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => switchWorkspace("owner")}
            className="min-h-11 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
  const { state, dispatch } = useDemo();
  const [asking, setAsking] = useState(false);
  const waitingForOwner = awaitingReplyFrom(request) === "owner";

  return (
    <li className="border-b border-border pb-10 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-name font-semibold text-foreground">
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
        className="mt-4"
        request={request}
        sitterName={sitterNameFor(state, request.sitterId)}
        headingLevel="h3"
      />

      <ClarificationThread request={request} side="sitter" composerOpen={asking} onComposerOpenChange={setAsking} />

      {/* Announced and focusable: answering removes the buttons from the DOM,
          which would otherwise drop focus to the body with nothing said. */}
      {request.status === "pending" ? (
        <>
          {waitingForOwner && (
            <p className="mt-4 text-sm font-medium text-foreground">{t("clarify.waitingOwner")}</p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                answeredRef.current = request.id;
                dispatch({ type: "respondToRequest", id: request.id, status: "accepted" });
              }}
            >
              {t("sitterRequests.accept")}
            </Button>
            {/* Before deciding: a question, not a third verdict. */}
            {!asking && (
              <Button type="button" variant="outline" onClick={() => setAsking(true)}>
                {t("clarify.ask")}
              </Button>
            )}
            {/* Secondary, and deliberately not destructive. */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                answeredRef.current = request.id;
                dispatch({ type: "respondToRequest", id: request.id, status: "declined" });
              }}
            >
              {t("sitterRequests.decline")}
            </Button>
          </div>
          <p className="mt-3 max-w-[64ch] text-sm text-muted-foreground">{t("sitterRequests.acceptNote")}</p>
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
          className="mt-6 max-w-[64ch] text-base leading-relaxed text-muted-foreground focus:outline-none"
        >
          {t(`sitterRequests.answered.${request.status}`)}
        </p>
      )}
    </li>
  );
}
