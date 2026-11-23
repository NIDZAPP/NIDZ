import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { awaitingReplyFrom } from "@/data/clarification";
import { Button } from "@/components/ui/button";
import { DemoLine } from "@/components/shared/trust";
import { findRequest, requestsReceived, requestsSent, sitterNameFor } from "@/data/repository";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { formatDateRange } from "@/utils/dates";

/**
 * "Mes demandes".
 *
 * A register of the owner's own requests — the only screen in the product
 * whose contents are entirely the user's own data, and therefore the only one
 * that can honestly show a count.
 *
 * Statuses are the three the demo lifecycle actually implements. There is no
 * "Terminée": nothing here can observe that a stay happened, so that state
 * would be a fabricated lifecycle (Audit p.304).
 */
export default function OwnerRequests() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();



  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerRequests.title")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("ownerRequests.title")}</h1>

        {requestsSent(state).length === 0 ? (
          <EmptyState
            className="mt-8"
            title={t("ownerRequests.emptyTitle")}
            body={t("ownerRequests.emptyBody")}
            action={
              <Button asChild variant="outline">
                <Link to="/owner/need/pet">{t("entry.findSitter")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("ownerRequests.count", { count: requestsSent(state).length })}
            </p>
            {/* This list is deep-linkable and is where an owner returns, so it
                carries the marker rather than relying on the success screen
                they passed through once. */}
            <DemoLine className="mt-4">{t("ownerRequests.demoNote")}</DemoLine>
            <ul role="list" className="mt-6">
              {requestsSent(state).map((request) => (
                <li key={request.id} className="border-b border-border first:border-t">
                  <Link
                    to={`/owner/requests/${request.id}`}
                    className="flex items-start justify-between gap-4 py-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-name font-semibold text-foreground">
                        <bdi>{request.pet.name}</bdi>
                        <span className="text-muted-foreground"> · </span>
                        <bdi className="font-normal text-muted-foreground">
                          {sitterNameFor(state, request.sitterId)}
                        </bdi>
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {t(`care.${request.careType}`)}
                        <span aria-hidden="true"> · </span>
                        <bdi>{formatDateRange(request.dates, lng)}</bdi>
                      </span>
                      {/* A question waiting for this owner — said in words, and
                          still "En attente": a question is not a decision. */}
                      {awaitingReplyFrom(request) === "owner" && (
                        <span className="mt-1 block text-sm font-medium text-foreground">
                          {t("clarify.questionForYouShort")}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 pt-0.5">
                      <StatusBadge status={request.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
