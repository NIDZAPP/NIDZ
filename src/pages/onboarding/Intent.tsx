import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useDemo } from "@/state/demo/context";
import type { DemoRole } from "@/state/demo/reducer";

/**
 * "Que souhaitez-vous faire aujourd'hui ?"
 *
 * Two navigation rows, not a radio group: with nothing else on the screen, a
 * radio plus a "Continuer" is a redundant tap and forces an artificial choice
 * about which of two equal options is the primary. Choosing IS the action here.
 *
 * The rows are phrased as activities, never as identities. Answering does not
 * create two kinds of account — the same person can do both, and the line
 * under the rows says so out loud rather than hiding it in a tooltip
 * (Audit p.84, design system §22, §40).
 */
export default function Intent() {
  const { t } = useTranslation();
  const { dispatch } = useDemo();
  const navigate = useNavigate();
  const goBack = useFlowBack("/welcome");

  const choose = (role: DemoRole, to: string) => {
    dispatch({ type: "setRole", role });
    navigate(to);
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("intent.title")}
        </title>
      </Helmet>
      <FlowScreen
        onBack={goBack}
        title={t("intent.title")}
        showLanguageSwitcher
      >
        <div className="grid gap-3">
          <IntentRow
            icon={Search}
            label={t("intent.owner")}
            description={t("intent.ownerDescription")}
            onClick={() => choose("owner", "/owner/need/pet")}
          />
          <IntentRow
            icon={Heart}
            label={t("intent.sitter")}
            description={t("intent.sitterDescription")}
            onClick={() => choose("sitter", "/sitter/start")}
          />
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{t("intent.bothSides")}</p>
      </FlowScreen>
    </>
  );
}

/* Shares its shape with OptionGroup's rows deliberately — same visual weight
   for the same level of decision (§5.2) — but it is a button that navigates,
   not a form control, so it says so semantically. */
function IntentRow({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-16 w-full items-center gap-4 rounded-md border border-input bg-card p-4 text-start transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon aria-hidden="true" className="size-6 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
    </button>
  );
}
