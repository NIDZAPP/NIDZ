import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { DateRangeField } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { criteriaFromNeed, criteriaToParams } from "@/data/criteria";
import { CARE_TYPES, type CareType, type DateRange } from "@/data/types";
import { useFlowBack } from "@/hooks/use-flow-back";
import { toISODate, today } from "@/utils/dates";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "need-care";

/**
 * Step 3 of 3 — which care, and when.
 *
 * One screen, because the two questions depend on each other: a walk is a
 * single afternoon, boarding is a run of nights, and home visits are a period
 * during which someone comes by. Asking for a start and end date before
 * knowing which of the three it is produces a question the product cannot use
 * — and splitting them would mean going back a step to change the answer.
 */
export default function NeedCare() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useFlowBack("/owner/need/location");
  const { state, dispatch } = useDemo();

  const [careType, setCareType] = useState<CareType | null>(state.need.careType);
  const [dates, setDates] = useState<DateRange | null>(state.need.dates);
  const [errors, setErrors] = useState<{ care?: string; dates?: string }>({});
  const careRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);

  if (!state.need.petId) return <Navigate to="/owner/need/pet" replace />;

  const singleDay = careType === "walk";

  const submit = () => {
    const next: typeof errors = {};
    if (!careType) next.care = t("need.care.careRequired");
    if (!dates) next.dates = t("need.care.datesRequired");
    /* `min` on the input prevents a past date in the picker, but it can still
       be typed, and a stay that started last month is not a request anyone can
       answer. */
    else if (dates.start < toISODate(today())) next.dates = t("need.care.datesPast");
    setErrors(next);
    if (next.care) return careRef.current?.focus();
    if (next.dates) return datesRef.current?.focus();

    const need = { ...state.need, careType, dates };
    dispatch({ type: "setNeed", patch: { careType, dates } });
    /* The brief becomes the results URL, so it stays linkable and Back from a
       sitter profile returns to exactly these results. */
    navigate({ pathname: "/search", search: new URLSearchParams(criteriaToParams(criteriaFromNeed(need))).toString() });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.care.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("need.care.title")}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("need.care.submit")}
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
            <p id="care-type-label" className="mb-3 text-sm font-medium text-foreground">
              {t("need.care.careLabel")}
            </p>
            {/* No explicit generic argument in JSX: the dev-only
                `lovable-tagger` transform cannot parse `<Comp<T> …>`. `T` is
                inferred from `options` in every call site instead. */}
            <OptionGroup
              labelledBy="care-type-label"
              describedBy={errors.care ? "care-type-error" : undefined}
              invalid={Boolean(errors.care)}
              groupRef={careRef}
              value={careType}
              onChange={(value) => {
                setCareType(value);
                setErrors((e) => ({ ...e, care: undefined }));
                /* A walk is one day. Collapse an existing range rather than
                   silently carrying an end date the service cannot use. */
                if (value === "walk" && dates) setDates({ start: dates.start, end: dates.start });
              }}
              options={CARE_TYPES.map((c) => ({
                value: c,
                label: t(`care.${c}`),
                description: t(`care.description.${c}`),
              }))}
            />
            {errors.care && (
              <p id="care-type-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                {errors.care}
              </p>
            )}
          </div>

          <div>
            <DateRangeField
              singleDay={singleDay}
              value={dates}
              onChange={(next) => {
                setDates(next);
                setErrors((e) => ({ ...e, dates: undefined }));
              }}
              singleLabel={t("need.care.dateLabel")}
              startLabel={t("need.care.startLabel")}
              endLabel={t("need.care.endLabel")}
              error={errors.dates}
              startRef={datesRef}
            />
          </div>
        </form>
      </FlowScreen>
    </>
  );
}
