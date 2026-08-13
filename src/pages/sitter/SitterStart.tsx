import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useDemo } from "@/state/demo/context";

/**
 * The sitter's entry point.
 *
 * The audit's line is "Faites de votre passion pour les animaux une activité
 * rémunérée" — kept, because it describes an intention rather than promising
 * an income. Nothing here estimates earnings, counts owners waiting, or
 * suggests demand: none of those numbers exist, and inventing them is the
 * §38 "gamification before validation" failure in its most tempting form.
 */
export default function SitterStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useFlowBack("/start");
  const { state, dispatch } = useDemo();

  const start = () => {
    dispatch({ type: "enter" });
    /* Idempotent in the reducer — re-entering must not wipe a profile that is
       already in progress. */
    dispatch({ type: "startSitterProfile", id: state.sitter?.profile.id ?? "my-profile" });
    navigate("/sitter/join/name");
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.start.title")}
        </title>
        <meta name="description" content={t("sitterFlow.start.intro")} />
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("sitterFlow.start.title")}
        intro={t("sitterFlow.start.intro")}
        showLanguageSwitcher
        headerExtra={<PawPrint className="mt-8 size-8 text-brand" aria-hidden="true" />}
        action={
          <Button type="button" size="lg" onClick={start}>
            {t("sitterFlow.start.cta")}
          </Button>
        }
        footNote={<DemoLine>{t("sitterFlow.start.demoNote")}</DemoLine>}
      >
        <ul role="list" className="max-w-[60ch] space-y-3">
          {["what", "control", "limits"].map((key) => (
            <li key={key} className="text-base leading-relaxed text-foreground">
              {t(`sitterFlow.start.points.${key}`)}
            </li>
          ))}
        </ul>
      </FlowScreen>
    </>
  );
}
