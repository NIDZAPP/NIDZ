import { useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import RequestSummary from "@/components/request/RequestSummary";
import FlowScreen from "@/components/shared/FlowScreen";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { parseCriteria } from "@/data/criteria";
import { offeredServices } from "@/data/demo-sitters";
import type { CareRequest } from "@/data/types";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";

/**
 * Everything that is about to be sent, before it is sent.
 *
 * §9.5 and the audit both require the request to restate the animal, the
 * dates, the service and anything important — recognition rather than recall
 * (§4.4). The action says what it does: "Envoyer ma demande". Never
 * "Réserver", because nothing is reserved, and never "Payer", because there is
 * no payment.
 *
 * The record is built ONCE and the preview renders that same object. Building
 * it twice — once to show and once to store — let the two drift: a service the
 * sitter did not offer showed no price on this screen and then acquired one,
 * for a different service, on the screen after it.
 */
export default function RequestReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  const search = searchParams.toString();

  /* Guards a same-tick double event; the duplicate check below guards the
     round trip. */
  const sending = useRef(false);

  const criteria = useMemo(() => parseCriteria(new URLSearchParams(search)), [search]);
  const pet = state.pets.find((p) => p.id === state.need.petId) ?? null;
  /* The URL is canonical for what the owner was looking at — every screen
     before this one matches on it — so it wins here too. Demo state is the
     fallback for an arrival that carries no query. */
  const careType = criteria.care ?? state.need.careType;
  const dates = criteria.dates ?? state.need.dates;

  if (!sitter) return <Navigate to="/search" replace />;
  if (!state.account?.phoneNumber) {
    return <Navigate to={`/owner/request/${sitter.id}/phone${search ? `?${search}` : ""}`} replace />;
  }
  if (!state.account.accountComplete) {
    return <Navigate to={`/owner/request/${sitter.id}/verify${search ? `?${search}` : ""}`} replace />;
  }
  /* A request is about an animal, a service and a period. Missing any of them,
     the owner goes back to the step that collects it — a summary must never
     substitute a default for something nobody chose. */
  if (!pet) return <Navigate to="/owner/need/pet" replace />;
  if (!careType || !dates) return <Navigate to="/owner/need/care" replace />;

  const account = state.account;
  const offers = offeredServices(sitter).includes(careType);

  /* One record. The preview below is this object; sending stamps it with an
     id and a time and stores it unchanged. */
  const draft: Omit<CareRequest, "id" | "createdAt"> = {
    sitterId: sitter.id,
    /* A copy, not a reference: editing the pet later must not rewrite what
       this sitter was asked to look after. */
    pet: { ...pet },
    careType,
    dates,
    /* The OWNER's area, which is what a sitter needs in order to answer a
       home visit or a walk. Null when the search was wilaya-wide — better
       absent than silently replaced by the sitter's own commune. */
    communeCode: state.need.communeCode,
    /* The public convention, the same one sitters get: first name and an
       initial. `request.name.lastHelp` promises exactly this. */
    ownerName: `${account.firstName} ${account.lastName.charAt(0).toUpperCase()}.`,
    /* Only a price for the service actually being asked for. A sitter who does
       not offer it has no price to quote, and quoting another service's would
       pair a nightly rate with a walk. */
    displayedRate: offers ? { amount: sitter.rates[careType] as number, careType } : null,
    status: "pending",
    respondedAt: null,
  };

  const send = () => {
    if (sending.current) return;

    /* The same animal, the same sitter, the same service, the same dates,
       still unanswered — a second copy tells the sitter nothing new and gives
       the owner two rows to track. */
    const existing = state.requests.find(
      (r) =>
        r.status === "pending" &&
        r.sitterId === sitter.id &&
        r.pet.id === pet.id &&
        r.careType === careType &&
        r.dates.start === dates.start &&
        r.dates.end === dates.end,
    );
    if (existing) {
      navigate(`/owner/requests/${existing.id}?again=1`, { replace: true });
      return;
    }

    sending.current = true;
    const request: CareRequest = {
      ...draft,
      id: `req-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "addRequest", request });
    navigate(`/owner/request/${sitter.id}/sent?id=${request.id}`, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.review.title")}
        </title>
      </Helmet>
      <FlowScreen
        wide
        backTo={`/owner/request/${sitterId ?? ""}/verify${search ? `?${search}` : ""}`}
        title={t("request.review.title")}
        action={
          <Button type="button" size="lg" onClick={send}>
            {t("request.review.send")}
          </Button>
        }
        footNote={<DemoLine>{t("request.review.demoNote")}</DemoLine>}
      >
        <RequestSummary
          request={{ ...draft, id: "preview", createdAt: "" }}
          sitterName={sitter.publicName}
        />
      </FlowScreen>
    </>
  );
}
