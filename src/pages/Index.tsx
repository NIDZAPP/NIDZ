import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { REGISTER_ROW } from "@/components/shared/register";
import { activeCriteriaCount, criteriaFromNeed, criteriaToParams } from "@/data/criteria";
import { WORKSPACE_ROOT } from "@/data/workspace";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

/**
 * The OWNER home, for someone who has already been through the introduction.
 *
 * Deliberately not a dashboard. Everything a dashboard would show either does
 * not exist yet or would have to be invented, and this is the easiest screen
 * in the product on which to accidentally fabricate activity. The only counted
 * thing here is the person's own requests, which is the only thing that can
 * honestly be counted.
 *
 * `/` belongs to whichever workspace is active, so someone whose account is
 * currently on the sitter side is sent to the sitter root instead of being
 * shown the owner home under sitter chrome. That is what makes the wordmark
 * mean "my home" on both sides rather than "the owner's home, always".
 */

export default function Index() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const switchWorkspace = useSwitchWorkspace();

  /* A first-time visitor belongs on the introduction, which is a full-screen
     route outside the site chrome. */
  if (!state.entered) return <Navigate to="/welcome" replace />;

  /* Not a redirect loop: the sitter root is `/sitter/requests`, which resolves
     to the sitter workspace and never back to here. Guarded on the capability
     as well as the preference, so a stale `activeWorkspace` in storage can
     never strand someone on a side they have nothing on. */
  if (state.activeWorkspace === "sitter" && state.capabilities.sitter) {
    return <Navigate to={WORKSPACE_ROOT.sitter} replace />;
  }

  const pending = state.requests.filter((r) => r.status === "pending").length;
  const criteria = criteriaFromNeed(state.need);
  /* Same definition of "has a brief" the search contract uses, so a saved
     wilaya or a saved date range is not quietly treated as nothing. */
  const hasNeed = Boolean(state.need.petId) || activeCriteriaCount(criteria) > 0;
  const resume = new URLSearchParams(criteriaToParams(criteria)).toString();

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("home.title")}
        </title>
        <meta name="description" content={t("home.subtitle")} />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("home.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("home.subtitle")}</p>

        <div className="mt-8">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-52">
            {hasNeed ? (
              <Link to={{ pathname: "/search", search: resume }}>{t("entry.resume")}</Link>
            ) : (
              <Link to="/owner/need/pet">{t("entry.findSitter")}</Link>
            )}
          </Button>
        </div>

        {/* The one thing here that resembles a dashboard — and it is the
            person's own data, so it is the one thing that can be counted.
            Absent entirely when there is nothing to count. */}
        <div className="mt-10">
        {/* My pets lives inside Home rather than in the tab bar (§84): four
            primary destinations, and secondary entities reached from them.
            Shown once there is an account, because that is when an animal can
            be saved and reused rather than retyped per request. */}
        {state.capabilities.owner && (
          <Link to="/owner/pets" className={REGISTER_ROW}>
            <span>
              <span className="block font-medium text-foreground">{t("nav.pets")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {state.pets.length > 0
                  ? state.pets.map((p) => p.name).filter(Boolean).join(" · ")
                  : t("pets.empty.title")}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        )}

        {state.requests.length > 0 && (
          <Link
            to="/owner/requests"
            className={REGISTER_ROW}
          >
            <span>
              <span className="block font-medium text-foreground">{t("entry.myRequests")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {pending > 0
                  ? t("entry.requestsPending", { count: pending })
                  : t("entry.requestsCount", { count: state.requests.length })}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        )}

        {/* The SWITCH, not a fork.
            Audit 1.2 retired the shape this used to have — one boolean deciding
            which "side" you belong to. Having a sitter profile does not stop
            you being an owner, so this does not replace the owner home; it
            offers the other workspace and records that you moved, so shared
            screens and the chrome follow you there. Nothing is discarded. */}
        {state.capabilities.sitter && (
          <button type="button" onClick={() => switchWorkspace("sitter")} className={cn(REGISTER_ROW, "w-full text-start")}>
            <span>
              <span className="block font-medium text-foreground">{t("workspace.toSitter")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {state.sitter?.published ? t("entry.sitterPublished") : t("entry.sitterDraft")}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
          </button>
        )}

        </div>

        {/* One quiet invitation, only for someone who has no sitter side yet.
            Phrased as an activity rather than an identity: answering it does
            not make you a different kind of user. */}
        {!state.capabilities.sitter && (
          <p className="mt-10 text-sm text-muted-foreground">
            <Link to="/sitter/start" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("entry.switchToSitter")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
