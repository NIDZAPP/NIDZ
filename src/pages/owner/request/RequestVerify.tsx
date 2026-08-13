import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useSitter } from "@/hooks/use-sitter";
import { PHONE_PREFIX } from "@/data/types";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "request-verify";

/**
 * The code step — SIMULATED, and it says so at full weight.
 *
 * No SMS is sent. There is no provider, no server and no code to check
 * against, so this accepts any six digits. That is stated on the screen as a
 * `DemoNotice` above the field, not as a footnote: the audit is explicit that
 * an unconnected OTP must be clearly identified as a demonstration (p.241),
 * and a marker quieter than the thing it qualifies is not a marker.
 *
 * Completing it sets `phoneConfirmed`, which means exactly "went through the
 * simulated step". It is NOT phone verification and no surface may present it
 * as one — there is no `verified` flag anywhere in the model (§6 B).
 */
export default function RequestVerify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  const search = searchParams.toString();
  const goBack = useFlowBack(`/owner/request/${sitterId ?? ""}/phone?${search}`);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  /* A counter, not a flag: a second press of a control that has already
     fired must still acknowledge, or it reads as broken. */
  const [resentCount, setResentCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!sitter) return <Navigate to="/search" replace />;
  if (!state.account?.phoneNumber) {
    return <Navigate to={`/owner/request/${sitter.id}/phone?${search}`} replace />;
  }

  const submit = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("request.verify.invalid"));
      inputRef.current?.focus();
      return;
    }
    dispatch({ type: "confirmPhone" });
    navigate({ pathname: `/owner/request/${sitter.id}/review`, search });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.verify.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("request.verify.title")}
        /* Wrapped in bidi isolates: two European-number runs separated by a
           neutral space resolve right-to-left in Arabic, which would print the
           country code after the number. */
        intro={t("request.verify.intro", {
          phone: `\u2066${PHONE_PREFIX} ${state.account.phoneNumber}\u2069`,
        })}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
      >
        <DemoNotice
          className="mb-8"
          title={t("request.verify.demoTitle")}
          body={t("request.verify.demoBody")}
        />

        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FieldShell label={t("request.verify.codeLabel")} error={error}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={inputRef}
                inputMode="numeric"
                maxLength={6}
                /* Not `autocomplete="one-time-code"`: no code was sent, so
                   offering the platform's SMS autofill would be a lie the
                   operating system tells on Nidz's behalf. */
                autoComplete="off"
                placeholder="000000"
                dir="ltr"
                className="max-w-[12rem] text-center text-lg tracking-[0.4em]"
                value={code}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError(undefined);
                }}
              />
            )}
          </FieldShell>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Full-height link buttons: `h-auto p-0` collapsed these to text
                height, below the ~44px Nidz target (§17). */}
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground"
              onClick={() => setResentCount((n) => n + 1)}
            >
              {t("request.verify.resend")}
            </Button>
            <Button asChild variant="link" className="text-muted-foreground">
              <Link to={{ pathname: `/owner/request/${sitter.id}/phone`, search }}>
                {t("request.verify.changeNumber")}
              </Link>
            </Button>
          </div>
          {/* Mounted from the start so the live region exists before it has
              content — a region inserted together with its text is announced
              unreliably. Says what actually happened, which is nothing. */}
          <p role="status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            {resentCount > 0 ? t("request.verify.resentNote") : ""}
          </p>
        </form>
      </FlowScreen>
    </>
  );
}
