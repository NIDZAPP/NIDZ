import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ArrowRight, FileText, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import BackButton from "@/components/shared/BackButton";
import OptionGroup from "@/components/shared/OptionGroup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LIST_GROUP, REGISTER_ROW, ROW_ICON } from "@/components/shared/register";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { ACCOUNT_PATH } from "@/components/layout/workspace-nav";
import { SUPPORTED_LOCALES, hasExplicitLocale, setLocale, type AppLocale } from "@/i18n";
import { useAppLocale } from "@/hooks/use-locale";
import { clearFormDrafts } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { cn } from "@/lib/utils";
import { isPubliclyListed } from "@/data/repository";
import { useDemo } from "@/state/demo/context";

const LOCALE_LABEL_KEY: Record<AppLocale, string> = {
  en: "common.english",
  fr: "common.french",
  ar: "common.arabic",
};

/** `SUPPORTED_LOCALES` is `readonly`, which infers as `readonly AppLocale[]`
    and does not satisfy `OptionGroup`'s mutable `options` array. Widened once,
    here, rather than with a cast at the call site. */
const LANGUAGE_OPTIONS: AppLocale[] = [...SUPPORTED_LOCALES];

/**
 * PARAMÈTRES — under Compte, behind its gear (Nidz 1.6).
 *
 * How Nidz behaves on this device, separated from who the person is (that is
 * Compte). Three groups, each a row that does something:
 *
 *   Langue                       the trilingual product's language choice;
 *   Sécurité et confidentialité  how signing in works here (it does not:
 *                                the account lives in this browser), what
 *                                happens to what is typed, and erasing it all;
 *   Outils de test               explicitly apart from the product (Audit
 *                                1.3 LOT 07), only once there is a published
 *                                profile to address them to.
 *
 * A secondary screen: Back returns to Compte — or to the full-screen step it
 * was opened from (the gear on every flow step), since `useBack` pops real
 * history first.
 */
export default function Settings() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state } = useDemo();
  const navigate = useNavigate();
  const { hash } = useLocation();

  /* Help's "erase everything" points at the reset itself (`#reset`). The
     shell starts every new screen at its top, so the jump is made here, once
     the screen is drawn. */
  useEffect(() => {
    if (hash !== "#reset") return;
    const frame = window.requestAnimationFrame(() =>
      document.getElementById("reset")?.scrollIntoView({ block: "start" }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  /* Read once per render rather than held in state: nothing else in the app
     writes it, so there is no second source to fall out of step with. */
  const explicit = hasExplicitLocale();

  const erase = useSave();
  const reset = () => {
    /* The reducer reset is what clears storage: back to the initial state,
       the store removes the record — and confirms it is gone. "Tout est
       effacé" is not shown while the data is still there (A-02). */
    if (!erase.save({ type: "reset" })) return;
    /* Unsaved form drafts too: "erase everything" includes what was typed
       and never saved. */
    clearFormDrafts();
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("settings.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        {/* The generic name, not "Back to Account": opened from a flow step's
            gear, Back returns to that step (real history first). */}
        <BackButton fallback={ACCOUNT_PATH} />
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("settings.title")}</h1>

        <section aria-labelledby="settings-language" className="mt-6">
          <h2 id="settings-language" className="text-title font-semibold text-foreground">
            {t("settings.language.title")}
          </h2>
          {/* Says which of the two things is actually happening rather than
              implying a decision the visitor never made. Nidz follows the
              device until someone chooses here; after that the choice wins. */}
          <p className="mt-1.5 max-w-[64ch] text-sm text-muted-foreground">
            {explicit ? t("settings.language.chosen") : t("settings.language.following")}
          </p>
          {/* No explicit `<OptionGroup<AppLocale>>` type argument, deliberately.
              `lovable-tagger` — the dev-only plugin that annotates JSX — injects
              its attributes between the component name and the type argument,
              which is a syntax error. The type is inferred from `value` and
              `options` anyway. */}
          <OptionGroup
            className="mt-3"
            labelledBy="settings-language"
            value={locale}
            onChange={setLocale}
            options={LANGUAGE_OPTIONS.map((lng) => ({
              value: lng,
              label: t(LOCALE_LABEL_KEY[lng]),
            }))}
          />
        </section>

        {/* ------------------------------------- security and privacy */}
        <section aria-labelledby="settings-privacy" className="mt-8">
          <h2 id="settings-privacy" className="text-title font-semibold text-foreground">
            {t("settings.privacy.title")}
          </h2>
          <div className={cn("mt-3", LIST_GROUP)}>
            {/* A statement, not a control: there is nothing to configure, and
                saying so is the security information that is true. */}
            <div className={cn(REGISTER_ROW, "items-start hover:bg-transparent")}>
              <span aria-hidden="true" className={ROW_ICON}>
                <KeyRound className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{t("settings.privacy.signInTitle")}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                  {t("settings.privacy.signInBody")}
                </span>
              </span>
            </div>
            <Link to="/policies" className={REGISTER_ROW}>
              <span aria-hidden="true" className={ROW_ICON}>
                <FileText className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{t("settings.privacy.dataTitle")}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t("settings.privacy.dataLine")}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>

          <div id="reset" className="surface mt-3 scroll-mt-20 p-5">
            <h3 className="text-name font-semibold text-foreground">{t("settings.reset.title")}</h3>
            <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
              {t("settings.reset.body")}
            </p>
            {/* Confirmed, because this erases the animals, the requests and the
                whole sitter profile the visitor built, and nothing undoes it. */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="mt-4">
                  {t("settings.reset.cta")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("settings.reset.confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("settings.reset.confirmBody")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("settings.reset.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={reset}>{t("settings.reset.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <SaveFeedback
              className="mt-6"
              save={erase}
              onRetry={reset}
              failedTitle={t("settings.reset.failedTitle")}
              failedBody={t("settings.reset.failedBody")}
            />
          </div>
        </section>

        {/* TEST TOOLING, explicitly separate from the product (Audit 1.3
            LOT 07). This demonstration has no other users, so the only way to
            see the sitter side receive a request — and to try a question
            before deciding — is to address one to your own profile. That is
            an instruction for testing, not something a real sitter would do,
            so it lives here and nowhere in the owner's or the sitter's
            screens. */}
        {state.sitter && isPubliclyListed(state, state.sitter.profile) && (
          <section aria-labelledby="settings-tools" className="surface mt-8 p-5">
            <h2 id="settings-tools" className="text-title font-semibold text-foreground">
              {t("settings.tools.title")}
            </h2>
            <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
              {t("settings.tools.body")}
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline">
                <Link to={`/owner/request/${state.sitter.profile.id}`}>{t("settings.tools.selfRequest")}</Link>
              </Button>
              {/* The same honest detour for Messages (1.4): only your own
                  profile can answer, from your sitter space. */}
              <Button asChild variant="outline">
                <Link to={`/messages/to/${state.sitter.profile.id}`}>{t("settings.tools.selfMessage")}</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
