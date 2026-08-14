import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";

import RequestSummary from "@/components/request/RequestSummary";
import BackButton from "@/components/shared/BackButton";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/shared/trust";
import { sitterNameFor } from "@/data/sitter-name";
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

  const request = state.requests.find((r) => r.id === id) ?? null;
  const sitterName = request ? sitterNameFor(state, request.sitterId) : "";
  /* Set when the owner tried to send a request identical to one already
     waiting — otherwise arriving here after tapping "Envoyer" looks like
     nothing happened. */
  const again = searchParams.get("again") === "1";

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {request ? request.pet.name : t("ownerRequests.notFoundTitle")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <BackButton
          variant="labelled"
          fallback="/owner/requests"
          label={t("common.backToRequests")}
          className="mb-6"
        />
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

            {/* Deep-linkable, and the screen an owner comes back to. The one
                place that says nothing was sent is the success screen, which
                they pass through once. */}
            <DemoNotice
              className="mt-8"
              title={t("request.sent.demoTitle")}
              body={t("ownerRequests.demoBody")}
            />

            <div className="mt-8">
              <RequestSummary request={request} sitterName={sitterName} showStatus headingLevel="h2" />
            </div>

            {/* What the status actually means. "Acceptée" is a person saying
                yes, not a booking Nidz holds. */}
            <p className="mt-8 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
              {t(`ownerRequests.explain.${request.status}`)}
            </p>

            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to={`/sitters/${request.sitterId}`}>{t("ownerRequests.viewSitter")}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
