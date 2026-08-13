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
import { useDemo } from "@/state/demo/context";

const FORM_ID = "request-name";

/**
 * The first step of sending a request: who is asking.
 *
 * Identity is collected HERE and not earlier — the audit is explicit that the
 * account is only requested when the owner actually wants to send something
 * (Audit p.215). Everything before this point works without one.
 *
 * "Account" is a generous word for what this is. There is no server, no
 * session and no sign-in: this writes a name into this browser and nothing
 * else, which is why the screen says so rather than implying registration.
 */
export default function RequestName() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state, dispatch } = useDemo();
  /* Carries the search back with it, so returning to the profile keeps its
     fit section and its link to the results. */
  const goBack = useFlowBack(`/sitters/${sitterId ?? ""}?${searchParams.toString()}`);

  const [firstName, setFirstName] = useState(state.account?.firstName ?? "");
  const [lastName, setLastName] = useState(state.account?.lastName ?? "");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  if (!sitter) return <Navigate to="/search" replace />;

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
           their surname back through the simulated code step. The phone step
           clears it when the number itself changes. */
        phoneConfirmed: state.account?.phoneConfirmed ?? false,
        createdAt: state.account?.createdAt ?? new Date().toISOString(),
      },
    });
    navigate({ pathname: `/owner/request/${sitter.id}/phone`, search: searchParams.toString() });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("request.name.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("request.name.title")}
        intro={t("request.name.intro", { name: sitter.publicName })}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
        footNote={<DemoLine>{t("request.name.storageNote")}</DemoLine>}
      >
        <form
          id={FORM_ID}
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
