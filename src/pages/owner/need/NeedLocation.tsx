import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { LocationFields } from "@/components/shared/fields";
import { Button } from "@/components/ui/button";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "need-location";

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
  const goBack = useFlowBack("/owner/need/pet");
  const { state, dispatch } = useDemo();

  const [wilayaCode, setWilayaCode] = useState(state.need.wilayaCode);
  const [communeCode, setCommuneCode] = useState(state.need.communeCode);
  const [error, setError] = useState<string>();
  const wilayaRef = useRef<HTMLButtonElement>(null);

  /* Arriving here without an animal means the flow was entered mid-way, by a
     deep link or a stale tab. Send them to the start rather than collecting
     half a brief. */
  if (!state.need.petId) return <Navigate to="/owner/need/pet" replace />;

  const submit = () => {
    if (!wilayaCode) {
      setError(t("need.location.wilayaRequired"));
      /* The action bar is pinned to the bottom and the field is above the
         fold; without moving focus the error is invisible at 320×640. */
      wilayaRef.current?.focus();
      return;
    }
    dispatch({ type: "setNeed", patch: { wilayaCode, communeCode } });
    navigate("/owner/need/care");
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.location.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("need.location.title")}
        intro={t("need.location.intro")}
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
            anyCommuneLabel={t("need.location.anyCommune")}
            help={t("need.location.privacy")}
            error={error}
          />
          <p className="mt-6 text-sm text-muted-foreground">{t("need.location.coverage")}</p>
        </form>
      </FlowScreen>
    </>
  );
}
