import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import SitterProfileView from "@/components/sitter/SitterProfileView";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
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

  const profile = state.sitter?.profile;
  /* Publishing must not be reachable for a profile that is not one. Without a
     name, a commune and at least one priced service, `matchSitters` drops it
     from the results — so "votre profil est publié" would be false the moment
     it was shown. */
  const complete =
    Boolean(state.account?.accountComplete) &&
    Boolean(profile?.publicName) &&
    Boolean(profile?.communeCode) &&
    (profile?.services.length ?? 0) > 0;
  if (!state.sitter || !profile || !complete) return <Navigate to="/sitter/start" replace />;
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
        backTo="/sitter/trust"
        title={t("sitterFlow.preview.title")}
        intro={t("sitterFlow.preview.intro")}
        progress={{ current: 8, total: 8, label: t("sitterFlow.progress", { current: 8, total: 8 }) }}
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
          <Button asChild variant="link" className="text-muted-foreground">
            <Link to="/sitter/profile/about">{t("sitterFlow.preview.edit")}</Link>
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
