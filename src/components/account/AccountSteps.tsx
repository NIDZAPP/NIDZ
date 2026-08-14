import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DemoLine, DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHONE_PREFIX } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/* ---------------------------------------------------------------------------
   The identity steps, shared by both sides of the marketplace.

   An owner sending a request and a sitter creating a profile answer the same
   three questions, and there is one account behind both — §22's "ne pas créer
   deux applications entièrement séparées" applies to the code as much as to
   the navigation. Each screen takes its own copy, its own back target and its
   own destination; nothing else differs.
   ------------------------------------------------------------------------ */

/** Algerian mobile numbers are 9 digits after the country code. */
const DIGITS = /^\d{9}$/;

export function NameStep({
  title,
  intro,
  backTo,
  onDone,
  progress,
}: {
  title: string;
  intro?: string;
  backTo: string;
  onDone: () => void;
  progress?: { current: number; total: number; label: string };
}) {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const formId = "account-name";

  const [firstName, setFirstName] = useState(state.account?.firstName ?? "");
  const [lastName, setLastName] = useState(state.account?.lastName ?? "");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = t("request.name.firstRequired");
    if (!lastName.trim()) next.lastName = t("request.name.lastRequired");
    setErrors(next);
    if (next.firstName) return firstRef.current?.focus();
    if (next.lastName) return lastRef.current?.focus();

    dispatch({
      type: "setAccount",
      account: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: state.account?.phoneNumber ?? "",
        /* Preserved: a confirmation belongs to the phone NUMBER, which is
           unchanged here. Resetting it would push someone fixing a typo in
           their surname back through the code step. */
        phoneConfirmed: state.account?.phoneConfirmed ?? false,
        createdAt: state.account?.createdAt ?? new Date().toISOString(),
      },
    });
    onDone();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
      </Helmet>
      <FlowScreen
        backTo={backTo}
        progress={progress}
        title={title}
        intro={intro}
        action={
          <Button type="submit" form={formId} size="lg">
            {t("common.continue")}
          </Button>
        }
        footNote={<DemoLine>{t("request.name.storageNote")}</DemoLine>}
      >
        <form
          id={formId}
          noValidate
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FieldShell label={t("request.name.firstLabel")} error={errors.firstName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={firstRef}
                value={firstName}
                autoComplete="given-name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors((err) => ({ ...err, firstName: undefined }));
                }}
              />
            )}
          </FieldShell>

          <FieldShell label={t("request.name.lastLabel")} help={t("request.name.lastHelp")} error={errors.lastName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={lastRef}
                value={lastName}
                autoComplete="family-name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors((err) => ({ ...err, lastName: undefined }));
                }}
              />
            )}
          </FieldShell>
        </form>
      </FlowScreen>
    </>
  );
}

export function PhoneStep({
  intro,
  backTo,
  onDone,
  progress,
}: {
  intro: string;
  backTo: string;
  onDone: () => void;
  progress?: { current: number; total: number; label: string };
}) {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const formId = "account-phone";
  const account = state.account;

  const [number, setNumber] = useState(account?.phoneNumber ?? "");
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!account) return;
    const digits = number.replace(/\s/g, "");
    if (!DIGITS.test(digits)) {
      setError(t("request.phone.invalid"));
      inputRef.current?.focus();
      return;
    }
    dispatch({
      type: "setAccount",
      account: {
        ...account,
        phoneNumber: digits,
        /* A confirmation belongs to the number it was given for. Changing the
           number invalidates it. */
        phoneConfirmed: account.phoneNumber === digits && account.phoneConfirmed,
      },
    });
    onDone();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.phone.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={backTo}
        progress={progress}
        title={t("request.phone.title")}
        intro={intro}
        action={
          <Button type="submit" form={formId} size="lg">
            {t("common.continue")}
          </Button>
        }
        footNote={<DemoLine>{t("request.phone.demoNote")}</DemoLine>}
      >
        <form
          id={formId}
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
                {/* A constant, presented as one rather than as a control that
                    would not change anything. */}
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

/**
 * The code step — SIMULATED, and it says so at full weight.
 *
 * No SMS is sent. There is no provider, no server and no code to check
 * against, so this accepts any six digits, stated as a `DemoNotice` above the
 * field rather than as a footnote: the audit requires an unconnected OTP to be
 * clearly identified as a demonstration (p.241), and a marker quieter than the
 * thing it qualifies is not a marker.
 *
 * Completing it sets `phoneConfirmed`, which means exactly "went through the
 * simulated step". It is NOT phone verification and no surface may present it
 * as one — there is no `verified` flag anywhere in the model (§6 B).
 */
export function VerifyStep({
  backTo,
  onDone,
  onChangeNumber,
  progress,
}: {
  backTo: string;
  onDone: () => void;
  onChangeNumber: () => void;
  progress?: { current: number; total: number; label: string };
}) {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const formId = "account-verify";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  /* A counter, not a flag: a second press of a control that has already fired
     must still acknowledge, or it reads as broken. */
  const [resentCount, setResentCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("request.verify.invalid"));
      inputRef.current?.focus();
      return;
    }
    dispatch({ type: "confirmPhone" });
    onDone();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.verify.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={backTo}
        progress={progress}
        title={t("request.verify.title")}
        /* Wrapped in bidi isolates: two European-number runs separated by a
           neutral space resolve right-to-left in Arabic, which would print the
           country code after the number. */
        intro={t("request.verify.intro", {
          phone: `⁦${PHONE_PREFIX} ${state.account?.phoneNumber ?? ""}⁩`,
        })}
        action={
          <Button type="submit" form={formId} size="lg">
            {t("common.continue")}
          </Button>
        }
      >
        <DemoNotice className="mb-8" title={t("request.verify.demoTitle")} body={t("request.verify.demoBody")} />

        <form
          id={formId}
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
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground"
              onClick={() => setResentCount((n) => n + 1)}
            >
              {t("request.verify.resend")}
            </Button>
            <Button type="button" variant="link" className="text-muted-foreground" onClick={onChangeNumber}>
              {t("request.verify.changeNumber")}
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
