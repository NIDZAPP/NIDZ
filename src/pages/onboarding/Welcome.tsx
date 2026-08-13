import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/state/demo/context";

/* The splash is a state of this screen, not a route of its own: a route would
   be a back-button trap, a thing a deep link could land on, and a flash of
   empty page. `sessionStorage` rather than the demo store, because "has seen
   the wordmark" is a per-tab question — `entered` means "has been through the
   introduction", which outlives the tab. */
export const SPLASH_KEY = "nidz.splash.seen";

function shouldSplash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(SPLASH_KEY)) return false;
    /* Never animate at someone who asked not to be animated at (§24). */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Screen one and two of the audit, in one component.
 *
 * The wordmark is an overlay over an introduction that is already rendered
 * underneath, so nothing on this screen is waiting for a timer — the entry is
 * never artificially delayed (Audit p.56).
 */
export default function Welcome() {
  const { t } = useTranslation();
  const { dispatch } = useDemo();
  const [splash, setSplash] = useState(shouldSplash);
  /* Acting on this screen is what "has been introduced" means: after it, `/`
     is the home rather than the introduction again. */
  const enter = () => dispatch({ type: "enter" });

  useEffect(() => {
    if (!splash) return;
    const timer = window.setTimeout(() => {
      setSplash(false);
      try {
        window.sessionStorage.setItem(SPLASH_KEY, "1");
      } catch {
        /* Private mode: the wordmark shows once per navigation instead. */
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [splash]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {t("entry.title")}
        </title>
        <meta name="description" content={t("entry.intro")} />
      </Helmet>

      {splash && (
        <div
          aria-hidden="true"
          /* `pointer-events-none` because the introduction underneath is
             already interactive — the wordmark is a cover, not a gate, and an
             overlay that swallows taps would be the artificial delay the audit
             rules out. */
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-brand-soft motion-safe:animate-fade-out motion-safe:[animation-delay:550ms] motion-safe:[animation-fill-mode:forwards]"
        >
          <span className="flex items-center gap-3">
            <PawPrint className="size-8 text-brand" />
            <span className="text-h1-lg font-semibold tracking-tight text-foreground">
              {t("common.appName")}
            </span>
          </span>
        </div>
      )}

      <div className="container flex h-14 shrink-0 items-center justify-end">
        {/* Flow screens carry no site header, and language detection can land
            an Algerian visitor in English. Language has to be reachable from
            the first screen, in a trilingual product (§34). */}
        <LanguageSwitcher compact />
      </div>

      {/* No back control: this is a root screen (Audit p.23). */}
      <main className="flex flex-1 items-center">
        <div className="container py-8 md:py-16">
          <div className="mx-auto max-w-[560px]">
            <PawPrint className="mb-6 size-8 text-brand" aria-hidden="true" />
            {/* Inter, not Playfair: `font-display` has no Arabic face, so the
                brand serif would silently fall back to an arbitrary system
                font in one of the three product languages. The wordmark on the
                splash is the one brand-expression moment here. */}
            <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("entry.title")}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("entry.intro")}</p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-52">
                <Link to="/start" onClick={enter}>
                  {t("entry.start")}
                </Link>
              </Button>
              {/* Deliberately not "J'ai déjà un compte". There is no sign-in,
                  no session and no server, so an authentication affordance on
                  the first screen anyone sees would promise something Nidz
                  cannot do. This goes somewhere that exists instead. */}
              <Button asChild variant="link" className="text-muted-foreground">
                <Link to="/search" onClick={enter}>
                  {t("entry.browse")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
