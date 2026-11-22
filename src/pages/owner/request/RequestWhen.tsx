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
import { offeredServices, overlapsDeclaredUnavailable } from "@/data/demo-sitters";
import { profilePathForRequest, requestPath } from "@/data/request-draft";
import { CARE_UNIT_KEY, type CareType, type DateRange } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, toISODate, today } from "@/utils/dates";
import { formatDZD, formatList, isolate } from "@/utils/format";

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
  const { sitter } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  const search = searchParams.toString();

  const criteria = useMemo(() => parseCriteria(new URLSearchParams(search)), [search]);
  const offers = useMemo(() => (sitter ? offeredServices(sitter) : []), [sitter]);
  const todayISO = toISODate(today());

  const [careType, setCareType] = useState<CareType | null>(() => {
    if (criteria.care && offers.includes(criteria.care)) return criteria.care;
    if (state.need.careType && offers.includes(state.need.careType)) return state.need.careType;
    /* One service on offer is not a choice to make. */
    return offers.length === 1 ? offers[0] : null;
  });
  const [dates, setDates] = useState<DateRange | null>(() => {
    const fresh = (d: DateRange | null) => (d && d.start >= todayISO ? d : null);
    return fresh(criteria.dates) ?? fresh(state.need.dates);
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
    const next: typeof errors = {};
    if (!careType) next.care = t("need.care.careRequired");
    if (!dates) next.dates = t("need.care.datesRequired");
    else if (dates.start < todayISO) next.dates = t("need.care.datesPast");
    else if (overlapsDeclaredUnavailable(sitter, dates)) next.dates = t("request.when.unavailable", { sitter: sitterName });
    setErrors(next);
    if (next.care) return careRef.current?.focus();
    if (next.dates) return datesRef.current?.focus();
    if (!careType || !dates) return;

    const normalized = normalizeCriteria({ ...criteria, care: careType, dates });
    const params = new URLSearchParams(search);
    params.set("care", careType);
    if (normalized.dates) {
      params.set("from", normalized.dates.start);
      params.set("to", normalized.dates.end);
    }
    navigate(requestPath(sitter.id, params.toString()));
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
        eyebrow={t("request.review.titleFor", { sitter: sitterName })}
        title={t("request.when.title")}
        intro={t("request.when.intro", { sitter: sitterName })}
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
