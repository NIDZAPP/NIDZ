import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Inbox, MessageCircleQuestion } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
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
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerRequests.title")}
        </title>
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("ownerRequests.title")}</h1>

        {requestsSent(state).length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Inbox}
            title={t("ownerRequests.emptyTitle")}
            body={t("ownerRequests.emptyBody")}
            action={
              <Button asChild>
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
            <ul role="list" className="mt-5 space-y-3">
              {requestsSent(state).map((request) => {
                const CareIcon = CARE_ICON[request.careType];
                return (
                  <li key={request.id}>
                    <Link
                      to={`/owner/requests/${request.id}`}
                      className="surface surface-press flex items-center gap-3.5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <AnimalPortrait species={request.pet.species} className="size-12 shrink-0 rounded-full" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-name font-semibold text-foreground">
                          <bdi>{request.pet.name}</bdi>
                          <span className="text-muted-foreground"> · </span>
                          <bdi className="font-normal text-muted-foreground">
                            {sitterNameFor(state, request.sitterId)}
                          </bdi>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CareIcon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {t(`care.${request.careType}`)}
                            <span aria-hidden="true"> · </span>
                            <bdi>{formatDateRange(request.dates, lng)}</bdi>
                          </span>
                        </span>
                        {/* A question waiting for this owner — said in words,
                            and still "En attente": a question is not a decision. */}
                        {awaitingReplyFrom(request) === "owner" && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <MessageCircleQuestion className="size-4 shrink-0 text-primary" aria-hidden="true" />
                            {t("clarify.questionForYouShort")}
                          </span>
                        )}
                      </span>
                      <StatusBadge status={request.status} className="shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
