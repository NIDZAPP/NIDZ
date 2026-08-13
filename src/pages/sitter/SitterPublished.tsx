import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/state/demo/context";

/**
 * "Votre profil est publié."
 *
 * What happens next, without inventing any of it: no owner is browsing, no
 * notification goes anywhere, and nothing is promised about volume, timing or
 * income. The one thing that IS true — the profile now resolves at its own
 * URL, and requests sent to it land in the sitter's list — is what the screen
 * offers.
 *
 * No back control: this is the end of the chain.
 */
export default function SitterPublished() {
  const { t } = useTranslation();
  const { state } = useDemo();

  if (!state.sitter?.published) return <Navigate to="/sitter/start" replace />;
  const { profile } = state.sitter;

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
          <div className="mt-6">
            <span
              aria-hidden="true"
              className="inline-flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary motion-safe:animate-scale-in"
            >
              <Check className="size-6" />
            </span>
          </div>
        }
        action={
          <Button asChild size="lg">
            <Link to="/sitter/requests">{t("sitterFlow.published.requests")}</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="link" className="text-muted-foreground">
            <Link to={`/sitters/${profile.id}`}>{t("sitterFlow.published.viewProfile")}</Link>
          </Button>
        }
      >
        <DemoNotice title={t("sitterFlow.published.demoTitle")} body={t("sitterFlow.published.demoBody")} />
      </FlowScreen>
    </>
  );
}
