import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { DocumentField } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/state/demo/context";

/**
 * The identity document.
 *
 * The single most important honesty boundary in the sitter flow: adding a
 * document does NOT make an identity verified. There is no reviewer, no
 * process and no traceable check behind this, so the furthest this can ever
 * go is "vérification en attente" — and even that is a demo state, because
 * nothing is actually waiting (Audit p.449, design system §6 B).
 *
 * There is no `verified` field anywhere in `SitterProfile`, and the state this
 * writes is only a file NAME. Nothing is uploaded, because there is nowhere to
 * upload it to.
 *
 * The step is skippable. Making it mandatory would imply it gates something.
 */
export default function SitterTrust() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useDemo();

  /* The profile has to exist as a profile before its trustworthiness is
     discussed: no name, no commune, no account means the flow was entered
     part-way. */
  if (!state.sitter || !state.account?.accountComplete || !state.sitter.profile.publicName) {
    return <Navigate to="/sitter/start" replace />;
  }
  const idDocument = state.sitter.idDocument;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.trust.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo="/sitter/profile/availability"
        title={t("sitterFlow.trust.title")}
        intro={t("sitterFlow.trust.intro")}
        progress={{ current: 7, total: 8, label: t("sitterFlow.progress", { current: 7, total: 8 }) }}
        action={
          <Button type="button" size="lg" onClick={() => navigate("/sitter/preview")}>
            {t("common.continue")}
          </Button>
        }
        footNote={<DemoLine>{t("sitterFlow.trust.demoNote")}</DemoLine>}
      >
        <DocumentField
          label={t("sitterFlow.trust.docLabel")}
          help={t("sitterFlow.trust.docHelp")}
          fileName={idDocument?.fileName}
          onSelect={(fileName) => dispatch({ type: "setIdDocument", fileName })}
          onClear={() => dispatch({ type: "clearIdDocument" })}
        />

        {/* The ONLY state a document can produce. It is not a badge, it is not
            teal, and it never becomes "Identité vérifiée". It does not say
            "vérification en attente" either: nothing is waiting, and the line
            below explains that no verification process exists. */}
        {idDocument?.fileName && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {t("sitterFlow.trust.pending")}
          </p>
        )}

        <p className="max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
          {t("sitterFlow.trust.explain")}
        </p>
      </FlowScreen>
    </>
  );
}
