import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { House, ListChecks, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { useSave } from "@/hooks/use-save";
import { AnimalPortrait } from "@/components/illustrations/animals";

/**
 * The sitter's entry point.
 *
 * The audit's line is "Faites de votre passion pour les animaux une activité
 * rémunérée" — kept, because it describes an intention rather than promising
 * an income. Nothing here estimates earnings, counts owners waiting, or
 * suggests demand: none of those numbers exist, and inventing them is the
 * §38 "gamification before validation" failure in its most tempting form.
 */
/* The three promises of the sitter side, each with its picture. */
const POINTS: { key: string; icon: LucideIcon }[] = [
  { key: "what", icon: House },
  { key: "control", icon: Wallet },
  { key: "limits", icon: ListChecks },
];

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
        headerExtra={
          <div aria-hidden="true" className="mt-6 flex -space-x-4 rtl:space-x-reverse">
            {(["dog", "cat", "bird"] as const).map((sp) => (
              <AnimalPortrait key={sp} species={sp} className="size-16 rounded-full ring-4 ring-background" />
            ))}
          </div>
        }
        action={
          <Button type="button" size="lg" onClick={start}>
            {t("sitterFlow.start.cta")}
          </Button>
        }
        footNote={<DemoLine>{t("sitterFlow.start.demoNote")}</DemoLine>}
      >
        <ul role="list" className="grid gap-2.5">
          {POINTS.map(({ key, icon: Icon }) => (
            <li key={key} className="surface flex items-start gap-3.5 p-4 text-base leading-relaxed text-foreground">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <span className="pt-1.5">{t(`sitterFlow.start.points.${key}`)}</span>
            </li>
          ))}
        </ul>
        <SaveFeedback className="mt-8" save={save} onRetry={start} />
      </FlowScreen>
    </>
  );
}
