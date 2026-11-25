import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { HomeHeart } from "@/components/icons/nidz-icons";
import { WelcomeArt } from "@/components/illustrations/animals";
import BrandMark from "@/components/shared/BrandMark";
import { Button } from "@/components/ui/button";
import { WELCOME_PATH, hasSession, workspaceHome } from "@/data/navigation";
import { useDemo } from "@/state/demo/context";

/**
 * The first choice of activity, right after an account is opened (Nidz 1.7
 * §4): the introduction, the welcome illustration, two actions.
 *
 *   Trouver une garde    the owner journey, from « Votre animal »;
 *   Devenir pet-sitter   the sitter onboarding — which no longer asks for
 *                        the name or number the account already holds.
 *
 * A choice of where to START, not a role: the account keeps both spaces and
 * Compte switches between them at any time. Nothing else on the screen — no
 * « un seul compte pour les deux », no sign-in (the person just made an
 * account). Choosing the sitter side does not move the active space until a
 * profile is published, as before (the reducer's rule).
 */
export default function Start() {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;

  const findCare = () => {
    dispatch({ type: "setWorkspace", workspace: "owner" });
    navigate("/owner/need/pet");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {t("start.title")}
        </title>
      </Helmet>
      <header className="container">
        <div className="mx-auto flex h-16 max-w-[520px] items-center">
          <BrandMark />
        </div>
      </header>

      <main className="container flex flex-1 flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
          <div className="relative flex min-h-[9rem] flex-1 items-center justify-center">
            <div className="aspect-square h-full max-h-[24rem] max-w-full overflow-hidden rounded-3xl shadow-card">
              <WelcomeArt className="size-full" />
            </div>
          </div>
          <div className="pt-6 text-center">
            <h1
              ref={heading}
              tabIndex={-1}
              className="mx-auto max-w-[18ch] text-[clamp(1.625rem,7.4vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground focus:outline-none"
            >
              {t("start.title", { name: state.account?.firstName ?? "" })}
            </h1>
            <p className="mx-auto mt-3 max-w-[34ch] text-base leading-relaxed text-muted-foreground">{t("entry.subtitle")}</p>
          </div>
          <div className="mt-6 grid gap-2.5">
            <Button type="button" size="lg" className="w-full" onClick={findCare}>
              <Search aria-hidden="true" />
              {t("entry.findCare")}
            </Button>
            <Button asChild size="lg" variant="surface" className="w-full">
              <Link to={state.sitter ? workspaceHome(state, "sitter") : "/sitter/start"}>
                <HomeHeart aria-hidden="true" />
                {t("entry.becomeSitter")}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
