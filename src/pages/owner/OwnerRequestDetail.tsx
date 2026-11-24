import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";

import ClarificationThread from "@/components/request/ClarificationThread";
import RequestSummary from "@/components/request/RequestSummary";
import BackButton from "@/components/shared/BackButton";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { awaitingReplyFrom, canClarify } from "@/data/clarification";
import { findRequest, requestsReceived, requestsSent, sitterNameFor } from "@/data/repository";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { formatDate, toISODate } from "@/utils/dates";

/**
 * One request, and what is true about it right now.
 *
 * The status line says what has and has not happened, in plain terms. An
 * accepted request is a sitter saying yes — it is not a confirmed reservation,
 * there is no payment and there is no protection, and the copy says so
 * (Audit p.522).
 */
export default function OwnerRequestDetail() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useDemo();
  const [asking, setAsking] = useState(false);
  const askRef = useRef<HTMLButtonElement>(null);
  const restoreAsk = useRef(false);
  useEffect(() => {
    if (!asking && restoreAsk.current) {
      restoreAsk.current = false;
      askRef.current?.focus();
    }
  }, [asking]);

  const request = findRequest(state, id);
  /* A question from the sitter, waiting for the owner (Audit 1.3 LOT 07). */
  const questionForYou = request ? awaitingReplyFrom(request) === "owner" : false;
  /* A question is only offered where the other side of THIS browser can read
     it: a request addressed to the visitor's own sitter profile. An example
     sitter has no inbox, so a question to one would be read by nobody — and
     the composer's note promises it can be read (LOT 07 review). */
  const sitterCanRead = Boolean(request && state.sitter && request.sitterId === state.sitter.profile.id);
  const sitterName = request ? sitterNameFor(state, request.sitterId) : "";
  /* Set when the owner tried to send a request identical to one already
     waiting — otherwise arriving here after tapping "Envoyer" looks like
     nothing happened. */
  const again = searchParams.get("again") === "1";

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {request ? request.pet.name : t("ownerRequests.notFoundTitle")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <BackButton fallback="/owner/requests" label={t("common.backToRequests")} />
        {!request ? (
          /* No action: the back control above already goes to the only place
             this state can send anyone, and two identical links to one
             destination is not a choice. */
          <EmptyState
            headingLevel="h1"
            title={t("ownerRequests.notFoundTitle")}
            body={t("ownerRequests.notFoundBody")}
          />
        ) : (
          <>
            <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">
              <bdi>{request.pet.name}</bdi>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {/* Converted through a local Date: slicing the ISO string takes the
                  UTC day, which in Algeria shows yesterday before 01:00. */}
              {t("ownerRequests.sentOn", {
                date: formatDate(toISODate(new Date(request.createdAt)), lng),
              })}
            </p>

            {again && (
              <p role="status" className="mt-6 text-sm font-medium text-foreground">
                {t("ownerRequests.alreadySent")}
              </p>
            )}

            {/* ONE honesty statement, fitted to the status (Audit 1.3 LOT 09):
                this page used to carry a "nothing was sent" banner on top AND
                the same fact again at the bottom. It is deep-linkable and the
                screen an owner comes back to, so the statement stays — once,
                first, at body size, with the info glyph that marks the honesty
                layer everywhere else. */}
            <div className="mt-5 flex max-w-[64ch] items-start gap-3 rounded-xl bg-card p-4 text-base leading-relaxed text-foreground shadow-card">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Info className="size-[1.125rem]" />
              </span>
              <span className="pt-1">{t(`ownerRequests.explain.${request.status}`)}</span>
            </div>

            <div className="mt-3">
              <RequestSummary request={request} sitterName={sitterName} showStatus headingLevel="h2" />
            </div>

            {/* Questions on this request, before a decision. The status above
                stays "En attente" while they are exchanged. */}
            {questionForYou && !asking && (
              <p className="mt-6 text-base font-medium text-foreground">{t("clarify.questionForYou")}</p>
            )}
            {/* Keyed by request: moving from one request's page to another's
                must not carry the question being typed across. */}
            <ClarificationThread
              key={request.id}
              request={request}
              side="owner"
              composerOpen={asking}
              onComposerOpenChange={(open, reason) => {
                if (!open && reason === "cancelled") restoreAsk.current = true;
                setAsking(open);
              }}
              headingLevel="h2"
            />
            {canClarify(request) && !asking && sitterCanRead && (
              <div className="mt-4">
                <Button ref={askRef} type="button" variant="outline" onClick={() => setAsking(true)}>
                  {questionForYou ? t("clarify.reply") : t("clarify.ask")}
                </Button>
              </div>
            )}
            {canClarify(request) && !sitterCanRead && (
              <p className="mt-6 max-w-[64ch] text-sm text-muted-foreground">{t("clarify.exampleNoInbox")}</p>
            )}



            <div className="mt-6">
              <Button asChild variant="surface">
                <Link to={`/sitters/${request.sitterId}`}>{t("ownerRequests.viewSitter")}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
