import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHONE_PREFIX } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/* ---------------------------------------------------------------------------
   The identity steps — now the SITTER side only.

   Audit 1.2 gave the owner a single quick-account screen
   (`pages/owner/OwnerAccount.tsx`, §16) and retired the simulated code step
   that used to follow these two. What is left here is the sitter's name and
   phone, which Group 10 replaces when sitter onboarding is rebuilt as a
   section-based dashboard.

   Nothing in either step verifies anything. `accountComplete` means the steps
   were completed and nothing more.
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
        /* Not asked on this step, and therefore genuinely unknown rather than
           defaulted to something that would read as an answer. The quick owner
           account (§16) collects them; until it does, they stay null and no
           screen may present an empty value as a declaration. */
        dateOfBirth: state.account?.dateOfBirth ?? null,
        wilayaId: state.account?.wilayaId ?? null,
        communeId: state.account?.communeId ?? null,
        ownedSpecies: state.account?.ownedSpecies ?? [],
        phoneNumber: state.account?.phoneNumber ?? "",
        /* Preserved: correcting a typo in a surname does not undo the steps
           that were already completed. */
        accountComplete: state.account?.accountComplete ?? false,
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
        /* Finishing this step is what "the account steps are done" means, and
           it is the whole of what the flag claims. It used to be set by a
           SIMULATED code step, which Audit 1.2 removed: with no OTP provider,
           §92 forbids claiming a code was sent, and the cleanest way to stop
           claiming it is to stop staging it. Nothing here verifies the number
           and no surface may suggest it does. */
        accountComplete: true,
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
