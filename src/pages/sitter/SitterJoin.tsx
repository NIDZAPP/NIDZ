import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";

import { NameStep, PhoneStep, VerifyStep } from "@/components/account/AccountSteps";
import FlowScreen from "@/components/shared/FlowScreen";
import { LocationFields } from "@/components/shared/fields";
import { getWilayaOfCommune } from "@/data/locations";
import { Button } from "@/components/ui/button";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Identity and location, for the sitter side.

   The three account screens are the SAME components the owner uses — one
   account concept, one implementation (§22). Only the copy, the back target
   and the destination differ.
   ------------------------------------------------------------------------ */

export function SitterName() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useFlowBack("/sitter/start");

  return (
    <NameStep
      title={t("request.name.title")}
      intro={t("sitterFlow.name.intro")}
      onBack={goBack}
      onDone={() => navigate("/sitter/join/phone")}
    />
  );
}

export function SitterPhone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useFlowBack("/sitter/join/name");
  const { state } = useDemo();

  if (!state.account) return <Navigate to="/sitter/join/name" replace />;

  return (
    <PhoneStep
      intro={t("sitterFlow.phone.intro")}
      onBack={goBack}
      onDone={() => navigate("/sitter/join/verify")}
    />
  );
}

export function SitterVerify() {
  const navigate = useNavigate();
  const goBack = useFlowBack("/sitter/join/phone");
  const { state } = useDemo();

  if (!state.account?.phoneNumber) return <Navigate to="/sitter/join/phone" replace />;

  return (
    <VerifyStep
      onBack={goBack}
      onChangeNumber={() => navigate("/sitter/join/phone")}
      onDone={() => navigate("/sitter/join/location")}
    />
  );
}

const FORM_ID = "sitter-location";

/**
 * Where the sitter offers their services.
 *
 * The privacy line is the field's own help text: §27 requires explaining why
 * location is asked, and the explanation belongs next to the thing it
 * explains. What a profile shows publicly is the commune, never an address —
 * Nidz never collects one.
 */
export function SitterLocation() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const goBack = useFlowBack("/sitter/join/verify");
  const { state, dispatch } = useDemo();

  const profile = state.sitter?.profile;
  /* Derived from the saved commune, so a returning sitter does not see an
     empty, disabled commune field while the profile still holds one — and
     does not lose it the moment they touch the wilaya select. */
  const [wilayaCode, setWilayaCode] = useState<string | null>(
    getWilayaOfCommune(profile?.communeCode)?.code ?? null,
  );
  const [communeCode, setCommuneCode] = useState<string | null>(profile?.communeCode || null);
  const [error, setError] = useState<string>();
  const wilayaRef = useRef<HTMLButtonElement>(null);

  if (!state.account?.phoneConfirmed) return <Navigate to="/sitter/join/name" replace />;

  const submit = () => {
    if (!communeCode) {
      setError(t("sitterFlow.location.communeRequired"));
      wilayaRef.current?.focus();
      return;
    }
    dispatch({
      type: "patchSitterProfile",
      patch: {
        communeCode,
        /* The public identity convention, the same one owners get on their
           requests: first name and an initial (§27). */
        publicName: `${state.account!.firstName} ${state.account!.lastName.charAt(0).toUpperCase()}.`,
      },
    });
    navigate("/sitter/profile/about");
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.location.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("sitterFlow.location.title")}
        intro={t("sitterFlow.location.intro")}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <LocationFields
            locale={locale}
            wilayaCode={wilayaCode}
            communeCode={communeCode}
            wilayaRef={wilayaRef}
            onChange={(next) => {
              setWilayaCode(next.wilayaCode);
              setCommuneCode(next.communeCode);
              setError(undefined);
            }}
            wilayaLabel={t("need.location.wilayaLabel")}
            wilayaPlaceholder={t("need.location.wilayaPlaceholder")}
            communeLabel={t("need.location.communeLabel")}
            anyCommuneLabel={t("sitterFlow.location.chooseCommune")}
            help={t("sitterFlow.location.privacy")}
            error={error}
          />
          <p className="mt-6 text-sm text-muted-foreground">{t("need.location.coverage")}</p>
        </form>
      </FlowScreen>
    </>
  );
}
