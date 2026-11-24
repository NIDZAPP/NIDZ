import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";

import RequestSummary from "@/components/request/RequestSummary";
import FlowScreen from "@/components/shared/FlowScreen";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { findRequest, sitterNameFor } from "@/data/repository";
import { requestSentPath } from "@/data/navigation";
import { useDemo } from "@/state/demo/context";
import { AnimalPortrait } from "@/components/illustrations/animals";

/**
 * Sent — in the only sense available here.
 *
 * The audit asks for a short validation moment and, if the send is only
 * simulated, for the screen to say "Demande de démonstration envoyée"
 * (p.281). It is, so it does. Nothing left this browser.
 *
 * No back control: this is the end of the chain, and going back would land on
 * a summary whose action would create the request a second time.
 */
export default function RequestSent() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { sitterId } = useParams();
  const { state } = useDemo();

  const id = searchParams.get("id");
  const request = findRequest(state, id);
  const sitterName = request ? sitterNameFor(state, request.sitterId) : "";

  /* Reloaded after the state was cleared, or opened directly: there is no
     request to celebrate, so go where the real ones are. */
  if (!request) return <Navigate to="/owner/requests" replace />;

  /* ONE address per confirmation (NAV-04). The request names its sitter; a
     path naming another — a hand-assembled or stale link — is replaced by
     the canonical one, so the address and the screen never disagree about
     who was asked. */
  if (sitterId !== request.sitterId) return <Navigate to={requestSentPath(request)} replace />;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.sent.title")}
        </title>
      </Helmet>
      <FlowScreen
        wide
        title={t("request.sent.title")}
        intro={t("request.sent.intro", { sitter: sitterName, pet: request.pet.name })}
        headerExtra={
          /* The animal the request is about, with a check for the one thing
             that did happen: the request is kept on this device. The notice
             below says plainly that nobody received it. */
          <div aria-hidden="true" className="relative mt-6 inline-flex motion-safe:animate-scale-in">
            <AnimalPortrait species={request.pet.species} className="size-20 rounded-full" />
            <span className="absolute -bottom-1 -end-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Check className="size-4" strokeWidth={3} />
            </span>
          </div>
        }
        action={
          <Button asChild size="lg">
            <Link to={`/owner/requests/${request.id}`}>{t("request.sent.viewRequest")}</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/">{t("request.sent.home")}</Link>
          </Button>
        }
      >
        <DemoNotice
          className="mb-3"
          title={t("request.sent.demoTitle")}
          body={t("request.sent.demoBody")}
        />
        <RequestSummary request={request} sitterName={sitterName} showStatus />
      </FlowScreen>
    </>
  );
}
