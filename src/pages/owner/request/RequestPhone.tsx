import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useSitter } from "@/hooks/use-sitter";
import { PHONE_PREFIX } from "@/data/types";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "request-phone";

/** Algerian mobile numbers are 9 digits after the country code. */
const DIGITS = /^\d{9}$/;

/**
 * The phone number.
 *
 * `+213` is a fixed prefix, not a country selector. The audit allows other
 * countries "si réellement nécessaires", and nothing in this demonstration
 * does anything with a number at all — a selector would be a control that
 * changes nothing, which is worse than an honest constant.
 */
export default function RequestPhone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  const search = searchParams.toString();
  const goBack = useFlowBack(`/owner/request/${sitterId ?? ""}?${search}`);

  const [number, setNumber] = useState(state.account?.phoneNumber ?? "");
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!sitter) return <Navigate to="/search" replace />;
  /* Reached without a name means the chain was entered mid-way. */
  if (!state.account) return <Navigate to={`/owner/request/${sitter.id}?${search}`} replace />;

  const submit = () => {
    const digits = number.replace(/\s/g, "");
    if (!DIGITS.test(digits)) {
      setError(t("request.phone.invalid"));
      inputRef.current?.focus();
      return;
    }
    dispatch({
      type: "setAccount",
      account: {
        ...state.account!,
        phoneNumber: digits,
        /* A confirmation belongs to the number it was given for. Changing the
           number invalidates it; keeping it would let an edited number inherit
           a code step it never went through. */
        phoneConfirmed: state.account!.phoneNumber === digits && state.account!.phoneConfirmed,
      },
    });
    navigate({ pathname: `/owner/request/${sitter.id}/verify`, search });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.phone.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("request.phone.title")}
        intro={t("request.phone.intro")}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
        footNote={<DemoLine>{t("request.phone.demoNote")}</DemoLine>}
      >
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FieldShell label={t("request.phone.label")} help={t("request.phone.help")} error={error}>
            {({ id, describedBy, invalid }) => (
              /* `dir="ltr"`: a phone number is a left-to-right run, and under
                 RTL the prefix would otherwise be placed after the digits. */
              <div dir="ltr" className="flex items-stretch gap-2">
                {/* A constant, so it is presented as one rather than as a
                    control that would not change anything. */}
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 shrink-0 items-center rounded-md border border-input bg-secondary px-3 text-base tabular-nums text-foreground"
                >
                  {PHONE_PREFIX}
                </span>
                <Input
                  id={id}
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="555 12 34 56"
                  value={number}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    setError(undefined);
                  }}
                />
              </div>
            )}
          </FieldShell>
        </form>
      </FlowScreen>
    </>
  );
}
