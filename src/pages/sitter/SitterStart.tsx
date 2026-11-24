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
import { sitterResumePath } from "@/data/navigation";
import { emptySitterProfile } from "@/state/demo/reducer";
import { useDemo } from "@/state/demo/context";
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
  const { state } = useDemo();
  const save = useSave();
  /* A profile already started on this device is CONTINUED from here, never
     started again (NAV-01): the action says so and resumes where it stopped. */
  const resuming = Boolean(state.sitter);

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
    /* Then the next thing to do — not always the name step: an owner whose
       account already holds a name and a number goes straight to the area
       (`sitterResumePath`, the rule Compte and the switch use too). */
    if (saved) {
      navigate(
        sitterResumePath({
          ...state,
          sitter: state.sitter ?? { profile: emptySitterProfile("my-profile"), published: false, idDocument: null },
        }),
      );
    }
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
        backTo="/"
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
            {resuming ? t("workspace.continueSitter") : t("sitterFlow.start.cta")}
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
