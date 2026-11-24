import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { ACTION_LINK } from "@/components/shared/link-styles";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { sitterResumePath, sitterVisibility } from "@/data/navigation";
import { FROM_DASHBOARD, SITTER_DASHBOARD, missingRequired } from "@/data/sitter-sections";
import { useDemo } from "@/state/demo/context";
import { AnimalPortrait } from "@/components/illustrations/animals";

/**
 * "Votre profil est publié."
 *
 * What happens next, without inventing any of it: no owner is browsing, no
 * notification goes anywhere, and nothing is promised about volume, timing or
 * income. The one thing that IS true — the profile now resolves at its own
 * URL, and requests sent to it land in the sitter's list — is what the screen
 * offers.
 *
 * NAV-02 (1.6): the screen says "published" only while owners can actually
 * find the profile — the search's own rule, through `sitterVisibility`. A
 * profile published and later emptied of an essential is told so here, with
 * the missing sections as links, instead of a confirmation whose "see my
 * profile" opened "this profile does not exist".
 *
 * No back control: this is the end of the chain.
 */
export default function SitterPublished() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const visibility = sitterVisibility(state);

  if (!state.sitter) return <Navigate to="/sitter/start" replace />;
  /* Never published: nothing to confirm — resume the profile instead. */
  if (visibility === "draft") return <Navigate to={sitterResumePath(state)} replace />;
  const { profile } = state.sitter;

  if (visibility === "hidden") {
    return (
      <>
        <Helmet>
          <title>
            {t("common.appName")} — {t("sitterFlow.published.hiddenTitle")}
          </title>
        </Helmet>
        <FlowScreen
          title={t("sitterFlow.published.hiddenTitle")}
          intro={t("sitterFlow.published.hiddenIntro")}
          action={
            <Button asChild size="lg">
              <Link to={SITTER_DASHBOARD}>{t("workspace.completeSitter")}</Link>
            </Button>
          }
        >
          <div className="rounded-xl bg-card p-4 shadow-card">
            <p className="text-base font-medium text-foreground">{t("sitterFlow.published.missing")}</p>
            <ul role="list" className="mt-1.5 flex flex-wrap gap-x-4">
              {missingRequired(profile).map((section) => (
                <li key={section.id}>
                  <Link to={section.path} state={FROM_DASHBOARD} className={ACTION_LINK}>
                    {t(section.labelKey)}
                    <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FlowScreen>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("sitterFlow.published.title")}
        </title>
      </Helmet>
      <FlowScreen
        title={t("sitterFlow.published.title")}
        intro={t("sitterFlow.published.intro")}
        headerExtra={
          <div aria-hidden="true" className="relative mt-6 inline-flex -space-x-4 motion-safe:animate-scale-in rtl:space-x-reverse">
            {profile.acceptedSpecies.map((sp) => (
              <AnimalPortrait key={sp} species={sp} className="size-16 rounded-full ring-4 ring-background" />
            ))}
            <span className="absolute -bottom-1 -end-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
              <Check className="size-4" strokeWidth={3} />
            </span>
          </div>
        }
        action={
          <Button asChild size="lg">
            <Link to="/sitter/requests">{t("sitterFlow.published.requests")}</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to={`/sitters/${profile.id}`}>{t("sitterFlow.published.viewProfile")}</Link>
          </Button>
        }
      >
        <DemoNotice title={t("sitterFlow.published.demoTitle")} body={t("sitterFlow.published.demoBody")} />
      </FlowScreen>
    </>
  );
}
