import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";

import { WelcomeArt } from "@/components/illustrations/animals";
import BrandMark from "@/components/shared/BrandMark";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH, REGISTER_PATH, afterSignInPath, hasSession } from "@/data/navigation";
import { useDemo } from "@/state/demo/context";

/**
 * The first screen without a session (Nidz 1.7 §2.1).
 *
 * Brand and language at the top; the supplied welcome illustration; the
 * approved promise; two actions — « Ouvrir un compte » (teal, the first-time
 * path) and « Se connecter » (white, same size, so a returning person finds
 * it as fast). Nothing under them: the 1.6 explanations, the animal grid and
 * the sitter preview are gone. Each later screen explains itself when it is
 * reached.
 *
 * ONE VIEWPORT. The column is the full dynamic height; the picture is the
 * only flexible part and gives up height first, so on a 320×568 phone the
 * actions are still on the first screen. With enlarged text the page simply
 * scrolls: nothing is clipped.
 *
 * Someone already signed in never sees this screen: `/welcome` sends them
 * to the home of the space they last used (§2.2).
 */
export default function Welcome() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  if (hasSession(state)) return <Navigate to={afterSignInPath(state)} replace />;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {t("entry.title")}
        </title>
        <meta name="description" content={t("entry.subtitle")} />
      </Helmet>

      <header className="container">
        <div className="mx-auto flex h-16 max-w-[520px] items-center justify-between gap-4">
          <BrandMark />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container flex flex-1 flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
          {/* The flexible part: it shrinks on a short screen so the actions
              stay in view, and never grows past a square. The column only
              has a MIN height, so a percentage height inside it does not
              resolve (nor do container units, in Chromium); an absolutely
              positioned layer does — it is sized by the box the column gave.
              The picture is a replaced element: under max-width and
              max-height it keeps its square ratio, so it is the smaller of
              the two sides, capped at 26rem, and it carries its own corners. */}
          <div className="relative min-h-[9rem] flex-1">
            <div className="absolute inset-0 flex items-center justify-center">
              <WelcomeArt className="h-auto max-h-full w-auto max-w-full rounded-3xl shadow-card md:max-h-[26rem]" />
            </div>
          </div>

          <div className="pt-6 text-center">
            <h1
              ref={heading}
              tabIndex={-1}
              className="mx-auto max-w-[18ch] text-[clamp(1.625rem,7.4vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground focus:outline-none"
            >
              {t("entry.title")}
            </h1>
            <p className="mx-auto mt-3 max-w-[34ch] text-base leading-relaxed text-muted-foreground">{t("entry.subtitle")}</p>
          </div>

          <div className="mt-6 grid gap-2.5">
            <Button asChild size="lg" className="w-full">
              <Link to={REGISTER_PATH}>{t("welcome.createAccount")}</Link>
            </Button>
            <Button asChild size="lg" variant="surface" className="w-full">
              <Link to={LOGIN_PATH}>{t("welcome.signIn")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
