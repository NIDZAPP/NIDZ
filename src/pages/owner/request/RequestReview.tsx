import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";

import RequestSummary from "@/components/request/RequestSummary";
import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { AnimalPortrait } from "@/components/illustrations/animals";
import BriefCapsule from "@/components/search/BriefCapsule";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { parseCriteria, petFit } from "@/data/criteria";
import type { Compatibility } from "@/data/compatibility";
import { offeredServices, overlapsDeclaredUnavailable } from "@/data/offer";
import { forSharing, type Pet } from "@/data/pets";
import { FROM_REQUEST, profilePathForRequest, requestPath, requestWhenPath } from "@/data/request-draft";
import { requestSentPath } from "@/data/navigation";
import { isPubliclyListed } from "@/data/repository";
import { isSpecies, type CareRequest, type PetCategory } from "@/data/types";
import { categoryText } from "@/components/request/pet-facts";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, toISODate, today } from "@/utils/dates";
import { isolate } from "@/utils/format";
import { ACTION_LINK } from "@/components/shared/link-styles";

/**
 * "Votre demande à Amina" — everything that is about to be sent, before it is
 * sent, addressed to ONE sitter.
 *
 * §9.5 and the audit both require the request to restate the animal, the
 * dates, the service and anything important — recognition rather than recall
 * (§4.4). The action says what it does: "Envoyer ma demande". Never
 * "Réserver", because nothing is reserved, and never "Payer", because there is
 * no payment.
 *
 * WHY THIS SCREEN NO LONGER SENDS ANYONE TO THE NEED FLOW (Audit 1.3 LOT 01).
 * It used to redirect to `/owner/need/pet` when no animal was chosen, and that
 * flow ends on the results list — so an owner who picked Amina, created an
 * account and added a dog was dropped among every sitter in the wilaya, with
 * the cheapest one first. Now every missing piece is collected against THIS
 * sitter and returns here:
 *
 *   - service and dates → `/owner/request/:id/when`, which offers only what
 *     this sitter does;
 *   - who is asking     → the sign-in gateway, carrying this URL as `next`;
 *   - which animal      → chosen on this screen; adding or editing one goes to
 *     the animal screen and comes straight back.
 *
 * The URL is the source of truth for all of it (see `request-draft.ts`). The
 * demo state's `need` brief is never used to fill in a service or a date
 * silently: it pre-fills the service-and-dates step, where it is visible.
 *
 * The record is built ONCE and the preview renders that same object. Building
 * it twice — once to show and once to store — let the two drift.
 */
export default function RequestReview() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sitter: found } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  /* Only a sitter owners may find can be asked: an own profile that is not
     published — or lost an essential after publication — has no request flow
     (`isPubliclyListed`, LOT 05 review). Treated as absent before any effect
     writes the draft bookmark or the URL. */
  const sitter = found && isPubliclyListed(state, found) ? found : null;
  const search = searchParams.toString();

  /* Guards a same-tick double event; the duplicate check below guards the
     round trip. */
  const sending = useRef(false);
  /* No draft and no other-tab check: the request is a new record. What is
     checked is that it really reached storage before "envoyée" is shown. */
  const save = useSave();
  const petGroupRef = useRef<HTMLDivElement>(null);
  const [petError, setPetError] = useState<string>();

  const criteria = useMemo(() => parseCriteria(new URLSearchParams(search)), [search]);
  const careType = criteria.care;
  const dates = criteria.dates;
  const account = state.account;

  /* Every animal the owner has, each judged against THIS sitter. Incompatible
     ones are shown with the reason rather than hidden: an owner with a cat
     looking at a dogs-only sitter has learned something, and an animal that
     silently vanished from the list would look like lost data. */
  const candidates = useMemo(
    () => (sitter ? state.pets.map((pet) => ({ pet, fit: petFit(pet, sitter) })) : []),
    [sitter, state.pets],
  );
  const selectable = candidates.filter((c) => c.fit.level !== "incompatible");
  /* What may be chosen FOR the owner, as opposed to by them: an animal this
     sitter can take AND of the species the owner was searching for. Youcef
     takes cats, but an owner who arrived from a dog search did not ask about
     their cat, and pre-selecting it would send the wrong animal. */
  const preselectable = selectable.filter((c) => !criteria.species || c.pet.species === criteria.species);
  /* Only an animal this sitter could take may be selected, from ANY source —
     a hand-off or a URL pointing at a cat for a dogs-only sitter is dropped,
     and the cat stays visible in the list, disabled, with its reason. A
     selected-but-impossible row would look chosen while saying it cannot be
     sent. */
  const exists = (id: string | null | undefined): id is string =>
    Boolean(id) && selectable.some((c) => c.pet.id === id);

  const draft = sitter && state.requestDraft?.sitterId === sitter.id ? state.requestDraft : null;
  const urlPetId = searchParams.get("pet");

  /* Which animal, in order of how explicitly it was chosen:
       1. the one just added or edited from this request (the hand-off);
       2. the one named in this URL;
       3. the one the owner picked in the need flow — only if this sitter can
          take it and it is the species being searched for, so a cat chosen for
          another search never lands in a request about a dog;
       4. the owner's only animal that qualifies on the same two counts.
     Whatever wins is written back into the URL below, so a reload or a Back
     shows the same animal. */
  const resolvedPetId =
    (exists(draft?.petHandoff) ? draft?.petHandoff : null) ??
    (exists(urlPetId) ? urlPetId : null) ??
    (state.need.petId && preselectable.some((c) => c.pet.id === state.need.petId) ? state.need.petId : null) ??
    (preselectable.length === 1 ? preselectable[0].pet.id : null);
  const selected = candidates.find((c) => c.pet.id === resolvedPetId) ?? null;

  const offers = sitter ? offeredServices(sitter) : [];
  const needsWhen =
    !careType ||
    !offers.includes(careType) ||
    !dates ||
    dates.start < toISODate(today()) ||
    (sitter ? overlapsDeclaredUnavailable(sitter, dates) : false);
  const needsAccount = !account?.accountComplete;
  const ready = Boolean(sitter) && !needsWhen && !needsAccount;

  useEffect(() => {
    if (!sitter) return;
    if (ready && (resolvedPetId ?? null) !== urlPetId) {
      const next = new URLSearchParams(search);
      if (resolvedPetId) next.set("pet", resolvedPetId);
      else next.delete("pet");
      setSearchParams(next, { replace: true });
      return;
    }
    if (ready && draft?.petHandoff) dispatch({ type: "consumePetHandoff" });
    /* The bookmark that lets Home offer "reprendre". Written even before the
       account exists, so abandoning at the sign-in gateway is resumable too. */
    dispatch({ type: "touchRequestDraft", sitterId: sitter.id, search });
  }, [sitter, ready, resolvedPetId, urlPetId, search, setSearchParams, draft?.petHandoff, dispatch]);

  if (!sitter) return <Navigate to="/search" replace />;

  const here = requestPath(sitter.id, search);
  /* A request is about a service and a period this sitter can be asked for.
     Missing or impossible — a service they do not offer, a past date, a period
     they declared unavailable — the owner chooses again, for this sitter. A
     summary must never substitute a default for something nobody chose. */
  if (needsWhen || !careType || !dates) return <Navigate to={requestWhenPath(sitter.id, search)} replace />;

  /* The first point at which Nidz needs to know who is asking. Everything
     before it works with no account at all (§15). `next` is this exact URL. */
  if (needsAccount || !account) return <Navigate to={`/auth?next=${encodeURIComponent(here)}`} replace />;

  const sitterName = isolate(sitter.publicName);

  /* Nidz 1.7: three-valued. Incompatible cannot be sent; « à confirmer »
     can, and says what the sitter will have to check. */
  const fitMessage = (fit: Compatibility, pet: Pet): string | null => {
    if (fit.level === "confirmed") return null;
    if (fit.level === "incompatible") {
      return fit.reason === "category"
        ? t("request.review.fitCategory", { sitter: sitterName, animal: categoryText(pet, t).toLocaleLowerCase(lng) })
        : t("request.review.fitKind", { sitter: sitterName, name: isolate(pet.name) });
    }
    return t(`request.review.fitUnknown.${fit.reason}`, { sitter: sitterName, name: isolate(pet.name) });
  };

  /* The species a new animal starts as: what the search asked for if this
     sitter takes it, otherwise this sitter's only species. A live choice on the
     animal screen either way — never recorded unless the owner saves it. */
  const startSpecies: PetCategory | null =
    criteria.species && isSpecies(criteria.species) && sitter.acceptedSpecies.includes(criteria.species)
      ? criteria.species
      : sitter.acceptedSpecies.length === 1
        ? sitter.acceptedSpecies[0]
        : null;
  const addParams = new URLSearchParams({ ...(startSpecies ? { species: startSpecies } : {}), next: here });
  const addHref = `/owner/pets/new?${addParams.toString()}`;
  const editHref = selected ? `/owner/pets/${selected.pet.id}?next=${encodeURIComponent(here)}` : null;

  const canSend = Boolean(selected) && selected!.fit.level !== "incompatible";
  const selectedFitMessage = selected ? fitMessage(selected.fit, selected.pet) : null;

  /* One record. The preview below is this object; sending stamps it with an
     id and a time and stores it unchanged. */
  const draftRequest: Omit<CareRequest, "id" | "createdAt" | "pet"> & { pet: CareRequest["pet"] | null } = {
    sitterId: sitter.id,
    /* A copy without the care plan (§83), and a copy so editing the animal
       later cannot rewrite what this sitter was asked about. */
    pet: canSend && selected ? forSharing(selected.pet) : null,
    careType,
    dates,
    /* The OWNER's area. The search zone when it named a commune; the commune
       on the account when the search named no zone at all; otherwise absent —
       better absent than replaced by the sitter's own commune. */
    communeCode: criteria.commune ?? (criteria.wilaya ? null : account.communeId),
    ownerName: `${account.firstName} ${account.lastName.charAt(0).toUpperCase()}.`,
    /* `needsWhen` guarantees the sitter offers this service, so the quoted
       price is the price of what is being asked for. */
    displayedRate: { amount: sitter.rates[careType] as number, careType },
    status: "pending",
    respondedAt: null,
  };

  const send = () => {
    if (sending.current) return;
    if (!selected || !canSend || !draftRequest.pet) {
      setPetError(selected ? (selectedFitMessage ?? undefined) : t("request.review.petRequired"));
      /* The action bar is pinned: without moving focus the reason can be
         entirely off-screen. */
      petGroupRef.current?.focus();
      return;
    }
    const pet = selected.pet;

    /* The same animal, the same sitter, the same service, the same dates,
       still unanswered — a second copy tells the sitter nothing new. */
    const isSame = (r: CareRequest) =>
      r.status === "pending" &&
      r.sitterId === sitter.id &&
      r.pet.id === pet.id &&
      r.careType === careType &&
      r.dates.start === dates.start &&
      r.dates.end === dates.end;
    const existing = state.requests.find(isSame);
    if (existing) {
      navigate(`/owner/requests/${existing.id}?again=1`, { replace: true });
      return;
    }

    sending.current = true;
    const request: CareRequest = {
      ...draftRequest,
      pet: draftRequest.pet,
      id: `req-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    /* Checked again against storage as it is now: the same request sent from
       another tab a moment ago is not sent twice (A-19). */
    const saved = save.save((base) => (base.requests.some(isSame) ? [] : { type: "addRequest", request }));
    if (!saved) {
      /* Not sent, and not reported as sent (A-02): the summary stays, and
         "Réessayer" sends the same request again. */
      sending.current = false;
      return;
    }
    const sent = saved.requests.some((r) => r.id === request.id);
    const twin = sent ? null : saved.requests.find(isSame);
    if (twin) navigate(`/owner/requests/${twin.id}?again=1`, { replace: true });
    else navigate(requestSentPath(request), { replace: true });
  };

  const noPets = candidates.length === 0;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.review.titleFor", { sitter: sitterName })}
        </title>
      </Helmet>
      <FlowScreen
        wide
        /* Back to the profile this request is about. The search travels with
           it so the profile still explains the same match. */
        backTo={profilePathForRequest(here) ?? "/search"}
        title={t("request.review.titleFor", { sitter: sitterName })}
        /* THE BRIEF CAPSULE (direction contract): what this request asks —
           the animal, the care, the dates — and the way to change the care
           or the dates. `replace`, and the step replaces itself on submit:
           changing the dates must not leave the OLD summary behind in
           history, still sendable one Back away. */
        headerExtra={
          <BriefCapsule
            className="mt-5"
            species={selected?.pet.species ?? null}
            /* The dates lead the second line: this screen exists to confirm
               them, so they must never sit behind the ellipsis. */
            title={selected ? `${selected.pet.name} · ${t(`care.${careType}`)}` : t(`care.${careType}`)}
            parts={[formatDateRange(dates, lng)]}
            emptyText=""
            actionText={t("search.context.edit")}
            actionLabel={t("request.review.changeWhen")}
            to={requestWhenPath(sitter.id, search)}
            replace
          />
        }
        action={
          noPets ? (
            /* With no animal there is nothing to send yet, and the one useful
               thing to do is the action — not a disabled "Send" beside it. */
            <Button asChild size="lg">
              <Link to={addHref} state={FROM_REQUEST}>
                {t("request.review.addPet")}
              </Link>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={send}>
              {t("request.review.send")}
            </Button>
          )
        }
        footNote={<DemoLine>{t("request.review.demoNote")}</DemoLine>}
      >
        <section aria-labelledby="request-pet" className="mb-6">
          <h2 id="request-pet" className="text-title font-semibold text-foreground">
            {t("request.review.petTitle")}
          </h2>

          {noPets ? (
            <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
              {t("request.review.petNone", { sitter: sitterName })}
            </p>
          ) : (
            <>
              <OptionGroup
                className="mt-4"
                labelledBy="request-pet"
                describedBy={petError ? "request-pet-error" : selectedFitMessage ? "request-pet-fit" : undefined}
                invalid={Boolean(petError)}
                groupRef={petGroupRef}
                value={resolvedPetId}
                onChange={(id) => {
                  setPetError(undefined);
                  const next = new URLSearchParams(search);
                  next.set("pet", id);
                  setSearchParams(next, { replace: true });
                }}
                options={candidates.map(({ pet, fit }) => ({
                  value: pet.id,
                  label: pet.name,
                  description: fitMessage(fit, pet) ?? t(`species.${pet.species}`),
                  art: <AnimalPortrait species={pet.species} className="size-11" />,
                  disabled: fit.level === "incompatible",
                }))}
              />

              {petError ? (
                <p id="request-pet-error" role="alert" className="mt-3 text-sm font-medium text-destructive">
                  {petError}
                </p>
              ) : (
                selectedFitMessage && (
                  <p id="request-pet-fit" className="mt-3 text-sm font-medium text-foreground">
                    {selectedFitMessage}
                  </p>
                )
              )}

              <div className="mt-3 flex flex-wrap gap-x-4">
                {editHref && selected && (
                  <Link
                    to={editHref}
                    state={FROM_REQUEST}
                    className={ACTION_LINK}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    {selected.fit.level === "unknown" && selected.fit.reason === "kindNotGiven"
                      ? t("request.review.specifyKind", { name: isolate(selected.pet.name) })
                      : t("request.review.editPet", { name: isolate(selected.pet.name) })}
                  </Link>
                )}
                <Link
                  to={addHref}
                  state={FROM_REQUEST}
                  className={ACTION_LINK}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("request.review.addAnother")}
                </Link>
              </div>
            </>
          )}
        </section>

        <RequestSummary request={{ ...draftRequest, id: "preview", createdAt: "" }} sitterName={sitter.publicName} />

        <SaveFeedback className="mt-6" save={save} onRetry={send} />

      </FlowScreen>
    </>
  );
}
