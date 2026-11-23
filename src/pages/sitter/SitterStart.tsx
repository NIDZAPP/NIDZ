import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PawPrint } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { useSave } from "@/hooks/use-save";

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
  const save = useSave();

  const start = () => {
    /* Idempotent in the reducer — re-entering must not wipe a profile that is
       already in progress. Built on the stored state, so a profile another
       tab started keeps its id. One write, confirmed before the flow opens:
       the next steps write into this profile, and must not open on one that
       was never kept (A-02). */
    const saved = save.save((base) => [
      { type: "enter" },
      { type: "startSitterProfile", id: base.sitter?.profile.id ?? "my-profile" },
    ]);
    if (saved) navigate("/sitter/join/name");
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
        backTo="/start"
        title={t("sitterFlow.start.title")}
        intro={t("sitterFlow.start.intro")}
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
        <SaveFeedback className="mt-8" save={save} onRetry={start} />
      </FlowScreen>
    </>
  );
}
