import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, LocateFixed, MapPin, Navigation } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import InfoTip from "@/components/shared/InfoTip";
import OptionGroup from "@/components/shared/OptionGroup";
import { LocationFields } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { checkLocation, normalizeCommuneId, normalizeWilayaId, wilayaName } from "@/data/algeria";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useNearbyWilaya } from "@/hooks/use-nearby-wilaya";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { isolate } from "@/utils/format";

import { stepPath, useNeedFlow } from "./animal-draft";

const FORM_ID = "need-location";
const SCOPE = "need-location";

type Method = "manual" | "nearby";

/**
 * « Où cherchez-vous ? » (Nidz 1.7 §11).
 *
 * Two methods, chosen explicitly:
 *
 *   Sélectionner manuellement  wilaya (required) and commune (optional), from
 *                              Nidz's reference of the 69 wilayas and 1 541
 *                              communes. Never asks for a position.
 *   À proximité de moi         the device position, asked only when the
 *                              person presses « Utiliser ma position », turned
 *                              into the nearest wilaya for them to confirm,
 *                              then forgotten (`use-nearby-wilaya.ts`). Every
 *                              failure falls back to choosing by hand.
 *
 * The zone ORDERS results and the sitter feed (nearest first); it does not
 * hide anyone, which is what the explanation under the title says.
 */
export default function NeedLocation() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const { state } = useDemo();
  const save = useSave({ scope: SCOPE });
  const nearby = useNearbyWilaya();

  const [method, setMethod] = useDraftField<Method>(SCOPE, "method", () => "manual", {
    validate: (raw) => (raw === "manual" || raw === "nearby" ? raw : null),
  });
  /* Pre-filled from the brief, else from the owner's own area. */
  const [location, setLocation] = useDraftField<{ wilayaCode: string | null; communeCode: string | null }>(
    SCOPE,
    "location",
    () => ({
      wilayaCode: state.need.wilayaCode ?? state.account?.wilayaId ?? null,
      communeCode: state.need.wilayaCode ? state.need.communeCode : (state.account?.communeId ?? null),
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

  const found = nearby.state.status === "found" ? nearby.state.wilayaId : null;
  /* A found wilaya fills the field once per answer; the person can still
     change it — it is a suggestion, not a fact about where they are. */
  useEffect(() => {
    if (found) setLocation({ wilayaCode: found, communeCode: null });
  }, [found, nearby.state, setLocation]);

  const petId = flow.petId ?? state.need.petId;
  const pet = petId ? state.pets.find((p) => p.id === petId) : null;
  if (!pet) return <Navigate to={stepPath("pet", "")} replace />;

  const submit = () => {
    const problem = checkLocation(location, { wilayaRequired: true });
    if (problem) {
      setError(problem === "wilayaRequired" ? t("need.location.wilayaRequired") : t("location.invalid"));
      if (method === "manual" || found) wilayaRef.current?.focus();
      return;
    }
    const saved = save.save({
      type: "setNeed",
      patch: {
        petId: pet.id,
        species: pet.species,
        kindId: pet.kindId,
        wilayaCode: location.wilayaCode,
        communeCode: location.communeCode,
        step: "care",
      },
    });
    if (!saved) return;
    navigate(stepPath("care", flow.search));
  };

  const showFields = method === "manual" || found !== null;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.location.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={flow.petId ? "/" : stepPath("needs", flow.search)}
        title={t("need.location.title")}
        intro={t("needFlow.location.intro")}
        titleAdornment={<InfoTip topic={t("need.location.title")}>{t("needFlow.location.privacyInfo")}</InfoTip>}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg" disabled={method === "nearby" && !found}>
            {t("common.continue")}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p id="location-method" className="sr-only">
            {t("needFlow.location.methodLabel")}
          </p>
          <OptionGroup
            labelledBy="location-method"
            value={method}
            onChange={(value) => {
              setMethod(value);
              setError(undefined);
              if (value === "manual") nearby.reset();
            }}
            options={[
              { value: "manual" as const, label: t("needFlow.location.manual"), description: t("needFlow.location.manualHint"), icon: MapPin },
              { value: "nearby" as const, label: t("needFlow.location.nearby"), description: t("needFlow.location.nearbyHint"), icon: Navigation },
            ]}
          />

          {method === "nearby" && (
            <div className="surface p-4 animate-fade-in" aria-live="polite">
              {nearby.state.status === "idle" && (
                <>
                  <p className="text-sm text-muted-foreground">{t("needFlow.location.askHint")}</p>
                  <Button type="button" className="mt-3" onClick={nearby.locate}>
                    <LocateFixed aria-hidden="true" />
                    {t("needFlow.location.useMyPosition")}
                  </Button>
                </>
              )}
              {nearby.state.status === "locating" && (
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
                  {t("needFlow.location.locating")}
                </p>
              )}
              {found && (
                <p className="text-sm text-foreground">
                  {t("needFlow.location.found", { wilaya: isolate(wilayaName(found, locale) ?? "") })}
                </p>
              )}
              {["denied", "unavailable", "timeout", "unsupported", "outside"].includes(nearby.state.status) && (
                <div role="alert">
                  <p className="text-sm font-medium text-foreground">{t(`needFlow.location.error.${nearby.state.status}`)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nearby.state.status !== "unsupported" && (
                      <Button type="button" variant="surface" onClick={nearby.locate}>
                        {t("needFlow.location.retry")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setMethod("manual");
                        nearby.reset();
                      }}
                    >
                      {t("needFlow.location.chooseManually")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {showFields && (
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
              anyCommuneLabel={t("need.location.anyCommune")}
              help={t("need.location.privacy")}
              error={error}
            />
          )}
          <SaveFeedback save={save} onRetry={submit} />
        </form>
      </FlowScreen>
    </>
  );
}
