import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { LocationFields } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { checkLocation, normalizeCommuneId, normalizeWilayaId } from "@/data/algeria";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "need-location";
const SCOPE = "need-location";

/**
 * Step 2 of 3 — where.
 *
 * The privacy line is the field's own help text, not a footnote: §27 requires
 * explaining why location is asked, and the explanation belongs next to the
 * thing it explains.
 *
 * There is no "utiliser ma position". Real geolocation returns coordinates,
 * and nothing in this project can turn coordinates into a commune — the button
 * could only pretend to work, which is the one thing it must not do.
 */
export default function NeedLocation() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const { state } = useDemo();
  /* The brief is this browser's own working copy, so no other-tab check:
     the last "Continuer" is the brief. The save itself is still confirmed. */
  const save = useSave({ scope: SCOPE });

  /* Kept as a draft until "Continuer" (Audit 1.3.1 A-01). */
  const [location, setLocation] = useDraftField<{ wilayaCode: string | null; communeCode: string | null }>(
    SCOPE,
    "location",
    () => ({ wilayaCode: state.need.wilayaCode, communeCode: state.need.communeCode }),
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
  const { wilayaCode, communeCode } = location;
  const [error, setError] = useState<string>();
  const wilayaRef = useRef<HTMLButtonElement>(null);

  /* Arriving here without an animal means the flow was entered mid-way, by a
     deep link or a stale tab. Send them to the start rather than collecting
     half a brief. */
  if (!state.need.petId) return <Navigate to="/owner/need/pet" replace />;

  const submit = () => {
    /* The same rule as every location form: wilaya required here, commune
       optional for every wilaya (Audit 1.3.1). */
    const problem = checkLocation(location, { wilayaRequired: true });
    if (problem) {
      setError(t(problem === "wilayaRequired" ? "need.location.wilayaRequired" : "location.invalid"));
      /* The action bar is pinned to the bottom and the field is above the
         fold; without moving focus the error is invisible at 320×640. */
      wilayaRef.current?.focus();
      return;
    }
    if (save.save({ type: "setNeed", patch: { wilayaCode, communeCode } })) navigate("/owner/need/care");
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.location.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo="/owner/need/pet"
        title={t("need.location.title")}
        intro={t("need.location.intro")}
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
            wilayaCode={wilayaCode}
            communeCode={communeCode}
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
          <p className="mt-6 text-sm text-muted-foreground">{t("need.location.coverage")}</p>
          <SaveFeedback className="mt-6" save={save} onRetry={submit} />
        </form>
      </FlowScreen>
    </>
  );
}
