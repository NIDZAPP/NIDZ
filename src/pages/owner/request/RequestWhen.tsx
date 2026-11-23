import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { DateRangeField } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { normalizeCriteria, parseCriteria } from "@/data/criteria";
import { offeredServices, overlapsDeclaredUnavailable } from "@/data/offer";
import { profilePathForRequest, requestPath } from "@/data/request-draft";
import { isPubliclyListed } from "@/data/repository";
import { CARE_TYPES, CARE_UNIT_KEY, type CareType, type DateRange } from "@/data/types";
import { dateRangeOrNull, oneOf } from "@/hooks/draft-validators";
import { useDraftField } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { DraftNotice } from "@/components/shared/SaveFeedback";
import { useAppLocale } from "@/hooks/use-locale";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, toISODate, today } from "@/utils/dates";
import { formatDZD, formatList, isolate } from "@/utils/format";
import { CARE_ICON } from "@/components/icons/domain-icons";

const FORM_ID = "request-when";

/**
 * Which care, and when — for ONE sitter (Audit 1.3 LOT 01).
 *
 * The request summary used to send an owner who had not given a service or a
 * period to the generic need flow, which ends on the results list and forgets
 * the sitter. This step asks the same two questions without leaving the
 * request: it offers only the services THIS sitter offers, priced with their
 * unit, and it returns to the summary of the same sitter.
 *
 * Pre-filled, visibly, from the search that led here — or, failing that, from
 * the owner's saved brief. Pre-filling here is honest in a way it was not on
 * the summary: the owner sees the values and confirms them with the action.
 *
 * Periods the sitter has DECLARED unavailable are stated as declarations and
 * refused. A period outside them is never called "available": Nidz holds no
 * reservations (§6.1).
 */
export default function RequestWhen() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter: found } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  /* Only a sitter owners may find can be asked: an own profile that is not
     published — or lost an essential after publication — has no request flow
     (`isPubliclyListed`, LOT 05 review). Treated as absent before any effect
     writes the draft bookmark or the URL. */
  const sitter = found && isPubliclyListed(state, found) ? found : null;
  const search = searchParams.toString();

  const criteria = useMemo(() => parseCriteria(new URLSearchParams(search)), [search]);
  const offers = useMemo(() => (sitter ? offeredServices(sitter) : []), [sitter]);
  const todayISO = toISODate(today());

  /* Seeded together, because they constrain each other: a walk is one day,
     and a range carried in from the URL or the brief must be collapsed BEFORE
     it is shown — the single-day field displays only the start, and checking
     a hidden end date against the sitter's declarations would refuse a day
     the owner never chose. */
  const [initial] = useState(() => {
    const care: CareType | null =
      criteria.care && offers.includes(criteria.care)
        ? criteria.care
        : state.need.careType && offers.includes(state.need.careType)
          ? state.need.careType
          : /* One service on offer is not a choice to make. */
            offers.length === 1
            ? offers[0]
            : null;
    const fresh = (d: DateRange | null) => (d && d.start >= todayISO ? d : null);
    const raw = fresh(criteria.dates) ?? fresh(state.need.dates);
    return { care, dates: normalizeCriteria({ ...criteria, care, dates: raw }).dates };
  });
  /* Unsaved answers survive a reload or closing the app (A-01). Keyed by the
     request URL as well as the sitter: the URL is the source of truth for a
     request in preparation, so a draft only ever resumes the same request —
     it never overrides different dates arriving from a new search. */
  const draftScope = `request-when-${sitterId ?? ""}-${search}`;
  /* Nothing is committed here — the answers go into the URL — but a resumed
     draft is still announced, and can still be thrown away. */
  const draftState = useSave({ scope: draftScope });
  const [careType, setCareType] = useDraftField<CareType | null>(draftScope, "careType", () => initial.care, {
    validate: oneOf(CARE_TYPES),
  });
  const [dates, setDates] = useDraftField<DateRange | null>(draftScope, "dates", () => initial.dates, {
    validate: dateRangeOrNull,
  });
  const [errors, setErrors] = useState<{ care?: string; dates?: string }>({});
  const careRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sitter) dispatch({ type: "touchRequestDraft", sitterId: sitter.id, search });
  }, [sitter, search, dispatch]);

  if (!sitter) return <Navigate to="/search" replace />;

  const sitterName = isolate(sitter.publicName);
  const summary = requestPath(sitter.id, search);
  const upcoming = sitter.declaredUnavailable.filter((u) => u.end >= todayISO);

  const submit = () => {
    /* Judged on the period that will actually be sent — one day for a walk. */
    const period = normalizeCriteria({ ...criteria, care: careType, dates }).dates;
    const next: typeof errors = {};
    if (!careType) next.care = t("need.care.careRequired");
    if (!period) next.dates = t("need.care.datesRequired");
    else if (period.start < todayISO) next.dates = t("need.care.datesPast");
    else if (overlapsDeclaredUnavailable(sitter, period)) next.dates = t("request.when.unavailable", { sitter: sitterName });
    setErrors(next);
    if (next.care) return careRef.current?.focus();
    if (next.dates) return datesRef.current?.focus();
    if (!careType || !period) return;

    const params = new URLSearchParams(search);
    params.set("care", careType);
    params.set("from", period.start);
    params.set("to", period.end);
    /* The answers now live in the request URL — the draft has done its job. */
    draftState.discard();
    /* Replaces this step: Back from the summary goes to the profile, not to a
       form holding the previous answer. */
    navigate(requestPath(sitter.id, params.toString()), { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.when.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={profilePathForRequest(summary) ?? "/search"}
        title={t("request.when.title")}
        intro={t("request.when.intro", { sitter: sitterName })}
        headerExtra={<DraftNotice save={draftState} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("request.when.submit")}
          </Button>
        }
        footNote={<DemoLine>{t("need.care.availabilityNote")}</DemoLine>}
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <p id="when-care-label" className="mb-3 text-sm font-medium text-foreground">
              {t("need.care.careLabel")}
            </p>
            <OptionGroup
              labelledBy="when-care-label"
              describedBy={errors.care ? "when-care-error" : undefined}
              invalid={Boolean(errors.care)}
              groupRef={careRef}
              value={careType}
              onChange={(value) => {
                setCareType(value);
                setErrors((e) => ({ ...e, care: undefined }));
                if (value === "walk" && dates) setDates({ start: dates.start, end: dates.start });
              }}
              options={offers.map((c) => ({
                value: c,
                label: t(`care.${c}`),
                /* The price with its unit, so the choice is made knowing what
                   it costs — and what it costs PER. */
                description: `${formatDZD(sitter.rates[c] as number, lng)} ${t(CARE_UNIT_KEY[c])}`,
                icon: CARE_ICON[c],
              }))}
            />
            {errors.care && (
              <p id="when-care-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                {errors.care}
              </p>
            )}
          </div>

          <DateRangeField
            singleDay={careType === "walk"}
            value={dates}
            onChange={(next) => {
              setDates(next);
              setErrors((e) => ({ ...e, dates: undefined }));
            }}
            singleLabel={t("need.care.dateLabel")}
            startLabel={t("need.care.startLabel")}
            endLabel={t("need.care.endLabel")}
            help={
              upcoming.length > 0
                ? t("request.when.unavailableHelp", {
                    sitter: sitterName,
                    periods: formatList(
                      upcoming.map((u) => formatDateRange(u, lng)),
                      lng,
                    ),
                  })
                : undefined
            }
            error={errors.dates}
            startRef={datesRef}
          />
        </form>
      </FlowScreen>
    </>
  );
}
