import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";

import { NameStep, PhoneStep } from "@/components/account/AccountSteps";
import FlowScreen from "@/components/shared/FlowScreen";
import { useReturnToDashboard } from "@/hooks/use-return-to-dashboard";
import { LocationFields } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { checkLocation, normalizeCommuneId, normalizeWilayaId, wilayaOfPlace } from "@/data/algeria";
import { useDraftField } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { Button } from "@/components/ui/button";
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

  return (
    <NameStep
      title={t("request.name.title")}
      intro={t("sitterFlow.name.intro")}
      backTo="/sitter/start"
      onDone={() => navigate("/sitter/join/phone")}
    />
  );
}

export function SitterPhone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useDemo();

  if (!state.account) return <Navigate to="/sitter/join/name" replace />;

  return (
    <PhoneStep
      intro={t("sitterFlow.phone.intro")}
      backTo="/sitter/join/name"
      onDone={() => navigate("/sitter/join/location")}
    />
  );
}

/**
 * The simulated code step, retired.
 *
 * It accepted any six digits and set a flag — a staged verification of a
 * number nobody could check, which is precisely what §92 forbids when there is
 * no OTP provider. The route survives as a redirect because it is a plausible
 * bookmark and a live history entry for anyone mid-flow when this shipped —
 * deleting it outright would turn Back into a 404 for them.
 */
export function SitterVerify() {
  return <Navigate to="/sitter/join/location" replace />;
}

const FORM_ID = "sitter-location";
const SCOPE = "sitter-location";

/**
 * Where the sitter offers their services.
 *
 * AUDIT 1.3.1: THE WILAYA IS REQUIRED, THE COMMUNE IS NOT. The commune used
 * to be mandatory, which blocked registration outright in every wilaya whose
 * commune list Nidz did not carry — the picker had nothing to choose and the
 * form would not continue. Every wilaya now has its communes, and choosing
 * one is still optional: a wilaya alone is a complete answer, shown publicly
 * as the wilaya. `checkLocation` is the rule, shared with every other
 * location form.
 *
 * The privacy line is the field's own help text: §27 requires explaining why
 * location is asked, and the explanation belongs next to the thing it
 * explains. What a profile shows publicly is the commune — or the wilaya —
 * never an address: Nidz never collects one.
 */
export function SitterLocation() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const returnToDashboard = useReturnToDashboard();
  const { state } = useDemo();

  const profile = state.sitter?.profile;
  const save = useSave({
    scope: SCOPE,
    watch: (s) => {
      const p = s.sitter?.profile;
      return p && { wilayaCode: p.wilayaCode, communeCode: p.communeCode };
    },
  });
  /* Derived from the saved profile, so a returning sitter does not see an
     empty field while the profile still holds an answer — and does not lose
     the commune the moment they touch the wilaya. Kept as a draft until
     saved (A-01). */
  const [location, setLocation] = useDraftField<{ wilayaCode: string | null; communeCode: string | null }>(
    SCOPE,
    "location",
    () => ({
      wilayaCode: profile ? wilayaOfPlace(profile) : null,
      communeCode: profile?.communeCode || null,
    }),
    {
      validate: (raw) => {
        if (typeof raw !== "object" || raw === null) return null;
        const r = raw as { wilayaCode?: unknown; communeCode?: unknown };
        const value = {
          wilayaCode: normalizeWilayaId(typeof r.wilayaCode === "string" ? r.wilayaCode : null),
          communeCode: normalizeCommuneId(typeof r.communeCode === "string" ? r.communeCode : null),
        };
        return checkLocation(value, { wilayaRequired: false }) ? null : value;
      },
    },
  );
  const [error, setError] = useState<string>();
  const wilayaRef = useRef<HTMLButtonElement>(null);

  if (!state.account?.accountComplete) return <Navigate to="/sitter/join/name" replace />;

  const submit = (force = false) => {
    const problem = checkLocation(location, { wilayaRequired: true });
    if (problem) {
      setError(t(problem === "wilayaRequired" ? "sitterFlow.location.wilayaRequired" : "location.invalid"));
      wilayaRef.current?.focus();
      return;
    }
    const saved = save.save(
      (base) =>
        base.account && base.sitter
          ? {
              type: "patchSitterProfile",
              patch: {
                wilayaCode: location.wilayaCode!,
                /* Empty when no commune was chosen: absent is honest. */
                communeCode: location.communeCode ?? "",
                /* The public identity convention, the same one owners get on
                   their requests: first name and an initial (§27). */
                publicName: `${base.account.firstName} ${base.account.lastName.charAt(0).toUpperCase()}.`,
              },
            }
          : null,
      { force },
    );
    /* From the dashboard's "who and where" row this pops back to it; at the
       end of the first pass through the join flow it lands there. Only once
       the profile really holds the answer (A-02). */
    if (saved) returnToDashboard();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.location.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo="/sitter/join/phone"
        title={t("sitterFlow.location.title")}
        intro={t("sitterFlow.location.intro")}
        headerExtra={<DraftNotice save={save} />}
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
            wilayaCode={location.wilayaCode}
            communeCode={location.communeCode}
            wilayaRef={wilayaRef}
            onChange={(next) => {
              setLocation(next);
              setError(undefined);
            }}
            wilayaLabel={t("need.location.wilayaLabel")}
            wilayaPlaceholder={t("need.location.wilayaPlaceholder")}
            communeLabel={t("need.location.communeLabel")}
            anyCommuneLabel={t("sitterFlow.location.noCommune")}
            help={t("sitterFlow.location.privacy")}
            error={error}
          />
          <p className="mt-6 text-sm text-muted-foreground">{t("need.location.coverage")}</p>
          <SaveFeedback className="mt-6" save={save} onRetry={() => submit()} onKeepMine={() => submit(true)} />
        </form>
      </FlowScreen>
    </>
  );
}
