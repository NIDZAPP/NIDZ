import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { DocumentField } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import {
  VERIFICATION_DOMAINS,
  VERIFICATION_STATES,
  VERIFICATION_STATUS,
} from "@/data/trust";
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
  if (!state.sitter) return <Navigate to="/sitter/start" replace />;
  /* Same rule as the preview: a sitter part-way through belongs on their
     dashboard, not back at the introduction. */
  if (!state.account?.accountComplete || !state.sitter.profile.publicName) {
    return <Navigate to="/sitter/profile" replace />;
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
        backTo="/sitter/profile"
        title={t("sitterFlow.trust.title")}
        intro={t("sitterFlow.trust.intro")}
        /* No progress bar: §51 replaced the wizard, so "step 7 of 8" would be
           describing a sequence that no longer exists. */
        action={
          /* Returns to the dashboard rather than chaining to the preview. The
             document is stored the moment it is chosen, so this closes the
             section — it does not submit anything, so it does not say "save"
             either. */
          <Button type="button" variant="outline" size="lg" onClick={() => navigate("/sitter/profile")}>
            {t("sitterSections.done")}
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

        {/* §66 asks for the six verification states to exist as a model rather
            than as one boolean, and for none of them to be claimed until a
            process produces it. Showing the model is the point: a state machine
            that lives only in a type file is indistinguishable, to the person
            whose identity it describes, from one that will never be built.

            Every row reads `VERIFICATION_STATUS`, which is `not_started`
            across the board and has no code path that changes it. If a
            transition is ever added, it has to be added with the process behind
            it — and this table is where the lie would show first. */}
        <section aria-labelledby="verif-states" className="border-t border-border pt-8">
          <h2 id="verif-states" className="text-name font-semibold text-foreground">
            {t("sitterFlow.trust.statesTitle")}
          </h2>
          <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
            {t("sitterFlow.trust.statesIntro")}
          </p>

          <dl className="mt-5 space-y-3">
            {VERIFICATION_DOMAINS.map((domain) => (
              <div key={domain} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3">
                <dt className="text-base text-foreground">{t(`verification.domain.${domain}`)}</dt>
                {/* Muted, never a badge and never teal: this is the ABSENCE of
                    a check, and styling it as a status pill is how "not
                    started" starts looking like progress. */}
                <dd className="text-sm text-muted-foreground">
                  {t(`verification.state.${VERIFICATION_STATUS[domain]}`)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
            {t("sitterFlow.trust.statesList", {
              states: VERIFICATION_STATES.map((state) => t(`verification.state.${state}`)).join(" · "),
            })}
          </p>
        </section>
      </FlowScreen>
    </>
  );
}
