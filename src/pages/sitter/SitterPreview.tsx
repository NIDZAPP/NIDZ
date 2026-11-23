import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import SitterProfileView from "@/components/sitter/SitterProfileView";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { canPublish } from "@/data/sitter-sections";
import { useReturnToDashboard } from "@/hooks/use-return-to-dashboard";
import { useDemo } from "@/state/demo/context";

/**
 * "Voici ce que les propriétaires verront."
 *
 * Literally: this renders `SitterProfileView`, the same component the owner's
 * `/sitters/:id` renders. The audit requires "exactement le même profil", and
 * the only way to guarantee that is to have one implementation — a preview
 * built separately would drift within a release and start showing the sitter
 * something owners never see.
 *
 * No criteria here: there is no visitor and no search, so the compatibility
 * section is absent rather than filled with a generic claim.
 */
export default function SitterPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useDemo();
  const returnToDashboard = useReturnToDashboard();

  const profile = state.sitter?.profile;
  /* Publishing must not be reachable for a profile that is not one. The rule is
     the dashboard's own (`canPublish`, Audit 1.3 LOT 05) — one definition, so
     the "Pour publier" list and this gate can never disagree about what a
     publishable profile is. */
  const complete = Boolean(state.account?.accountComplete) && Boolean(profile && canPublish(profile));
  /* Two different situations, two different destinations. No workspace at all
     means the flow was never entered, and the introduction is where that
     starts. A workspace with an unfinished profile means the sitter is
     mid-build — sending them back to the introduction would throw away the
     dashboard they were working from, which is the screen that can actually
     tell them what is missing. */
  if (!state.sitter || !profile) return <Navigate to="/sitter/start" replace />;
  if (!complete) return <Navigate to="/sitter/profile" replace />;
  const published = state.sitter.published;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.preview.title")}
        </title>
      </Helmet>
      <FlowScreen
        wide
        backTo="/sitter/profile"
        title={t("sitterFlow.preview.title")}
        intro={t("sitterFlow.preview.intro")}
        /* No progress bar. The preview is reached from the dashboard, not at
           the end of a chain, so "8 of 8" would be inventing a sequence. */
        action={
          published ? (
            /* Already published, and every builder step writes straight into
               the live profile — so there is nothing left to commit. A button
               labelled "enregistrer" would be claiming an action it does not
               perform. */
            <Button asChild size="lg">
              <Link to="/sitter/requests">{t("sitterFlow.published.requests")}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => {
                dispatch({ type: "publishSitterProfile" });
                navigate("/sitter/published");
              }}
            >
              {t("sitterFlow.preview.publish")}
            </Button>
          )
        }
        /* "Modifier" re-enters the builder at step one, which is where it
           means something. */
        secondaryAction={
          /* Back to the dashboard by history when the preview was opened from
             it, so Back from the dashboard does not return here (LOT 05
             review). */
          <Button type="button" variant="link" className="text-muted-foreground" onClick={returnToDashboard}>
            {t("sitterFlow.preview.edit")}
          </Button>
        }
      >
        {/* What the categories mean, stated once. Everything on this profile
            is category A — declared. Nidz has verified nothing, there are no
            reviews, and nothing has been measured (§6). */}
        <DemoNotice
          className="mb-8"
          title={t("sitterFlow.preview.provenanceTitle")}
          body={t("sitterFlow.preview.provenanceBody")}
        />

        {published && (
          <p className="mb-8 text-sm text-muted-foreground">{t("sitterFlow.preview.liveNote")}</p>
        )}

        {/* `headingLevel="h2"`: the screen's own h1 belongs to FlowScreen. */}
        <SitterProfileView
          sitter={profile}
          hasCriteria={false}
          reasons={[]}
          mismatches={[]}
          petName={null}
          headingLevel="h2"
        />
      </FlowScreen>
    </>
  );
}
