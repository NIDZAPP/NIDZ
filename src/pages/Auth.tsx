import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { AUTH_PROVIDERS, hasWorkingProvider } from "@/auth/providers";

/**
 * The sign-in gateway (§14).
 *
 * The audit asks for Google, Microsoft and phone here, and forbids faking any
 * of them in the same breath: no silently-created "Google verified account", no
 * invented token, no claim that a provider authenticated anyone, no SMS that
 * was never sent. Those are only compatible one way — the providers are shown
 * as what they are, which is **planned and not connected**.
 *
 * They are rendered `disabled` with the reason stated once, in text, rather
 * than as buttons that respond to a tap with an apology. A control that looks
 * live and then refuses is the decorative dead button §71-83 names; a control
 * that is visibly unavailable and says why is just an honest statement about
 * the product's stage. `hasWorkingProvider()` decides which of those two
 * framings the screen uses, so wiring a real provider changes this screen by
 * itself.
 *
 * The two things that DO work are underneath, and they are the point of the
 * screen: create a local demo identity, or carry on without one. §15 is
 * explicit that browsing must not require an account, so leaving empty-handed
 * is a first-class exit rather than a "no thanks" link in small print.
 */
export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  /* Same-origin paths only. An absolute URL in `next` would make this an open
     redirect, and this is exactly the screen where someone would try one. */
  const raw = searchParams.get("next");
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
  const accountHref = next ? `/owner/account?next=${encodeURIComponent(next)}` : "/owner/account";

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("auth.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen backTo="/" title={t("auth.title")} intro={t("auth.intro")}>
        <section aria-labelledby="auth-providers">
          <h2 id="auth-providers" className="eyebrow">
            {t("auth.plannedTitle")}
          </h2>

          <div className="mt-3 grid gap-3">
            {AUTH_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant="outline"
                size="lg"
                disabled={!provider.available}
                aria-describedby="auth-providers-reason"
                className="w-full justify-center"
              >
                {t(provider.labelKey)}
              </Button>
            ))}
          </div>

          {/* One reason, once, in text — not three tooltips and not a toast
              after the tap. `aria-describedby` on each control means a screen
              reader hears why the button is disabled instead of only that it
              is. */}
          <p id="auth-providers-reason" className="mt-3 text-sm text-muted-foreground">
            {hasWorkingProvider() ? t("auth.someUnavailable") : t("auth.noneConnected")}
          </p>
        </section>

        {/* The honest boundary, at full weight rather than as a footnote: this
            screen is the single most tempting place in the product to imply an
            identity was proven. */}
        <DemoNotice
          className="mt-8"
          title={t("auth.demoNoticeTitle")}
          body={t("auth.demoNoticeBody")}
        />

        {/* No `border-t` here: `DemoNotice` draws its own bottom rule, and the
            two stacked into a double line. The notice IS the separator. */}
        <section aria-labelledby="auth-continue" className="mt-8">
          <h2 id="auth-continue" className="text-name font-semibold text-foreground">
            {t("auth.continueTitle")}
          </h2>
          <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            {t("auth.continueBody")}
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={accountHref}>{t("auth.createAccount")}</Link>
            </Button>
            {/* §15's guest path. A real exit, not small print: browsing,
                filtering and reading a profile need no identity at all. */}
            <Button asChild variant="link" className="text-muted-foreground">
              <Link to="/search">{t("auth.explore")}</Link>
            </Button>
          </div>
        </section>
      </FlowScreen>
    </>
  );
}
