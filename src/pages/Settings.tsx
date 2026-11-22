import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "lucide-react";
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
import { REGISTER_ROW } from "@/components/shared/register";
import { SUPPORTED_LOCALES, hasExplicitLocale, setLocale, type AppLocale } from "@/i18n";
import { useAppLocale } from "@/hooks/use-locale";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
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
 * Compte — the account screen, shared by both spaces (Audit 1.3 LOT 04).
 *
 * One account, so one account screen: it is the last tab of the owner bar and
 * of the sitter bar alike, and it is where the switch between the two spaces
 * lives. Switching changes the view only — no request draft, animal or sitter
 * profile is touched (see `setWorkspace` in the reducer).
 *
 * As a tab root it shows no Back control — EXCEPT when it was opened from a
 * full-screen step (the sliders icon in `FlowScreen`), where Back is the only
 * way into that step again.
 *
 * Settings, as it was:
 *
 * Exists from Group 3 because §89 moves the language chooser out of the rest of
 * the product, and taking it out of the header without giving it somewhere to
 * live would make a trilingual product's language unchangeable. It is
 * deliberately small: only rows that do something. §88 lists many more sections
 * — account, notifications, privacy, security — and each arrives with the
 * feature behind it rather than as a row that leads nowhere.
 *
 * Help and Policies moved here as well as staying in the footer, because they
 * are the two screens that state what this prototype cannot do and they must be
 * reachable on a phone.
 */
export default function Settings() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const switchWorkspace = useSwitchWorkspace();
  const fromFlow = (location.state as { fromFlow?: unknown } | null)?.fromFlow === true;
  const active = state.activeWorkspace;

  /* Read once per render rather than held in state: nothing else in the app
     writes it, so there is no second source to fall out of step with. */
  const explicit = hasExplicitLocale();

  const reset = () => {
    /* The reducer reset is what clears storage: DemoProvider removes the key
       when the state is back to initial, so calling clearStoredState() here
       would be undone by the persistence effect a tick later. */
    dispatch({ type: "reset" });
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("settings.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        {fromFlow && <BackButton variant="labelled" fallback="/" className="mb-6" />}
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("settings.title")}</h1>

        {/* The two spaces of ONE account. The current one is stated, not
            offered; the other is a real switch, or the honest next step when
            that side does not exist yet. */}
        <section aria-labelledby="settings-spaces" className="mt-10">
          <h2 id="settings-spaces" className="text-name font-semibold text-foreground">
            {t("settings.spaces.title")}
          </h2>
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">{t("settings.spaces.body")}</p>
          <div className="mt-4">
            {(["owner", "sitter"] as const).map((space) => {
              /* The sitter side is only "current" once it has something in it;
                 before publication its row is the way to continue the
                 profile, never an inert "this is where you are". */
              const current = active === space && (space === "owner" || Boolean(state.sitter?.published));
              const label = t(`settings.spaces.${space}`);
              if (current) {
                return (
                  <div key={space} className={cn(REGISTER_ROW, "hover:bg-transparent")} aria-current="true">
                    <span>
                      <span className="block font-medium text-foreground">{label}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {t("settings.spaces.current")}
                      </span>
                    </span>
                    <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  </div>
                );
              }
              /* The sitter side before it has anything: offer to build it,
                 rather than switching to an empty inbox. */
              if (space === "sitter" && !state.sitter?.published) {
                return (
                  <Link
                    key={space}
                    to={state.sitter ? "/sitter/profile" : "/sitter/start"}
                    className={REGISTER_ROW}
                  >
                    <span>
                      <span className="block font-medium text-foreground">{label}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {state.sitter ? t("settings.spaces.sitterDraft") : t("settings.spaces.sitterNone")}
                      </span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                );
              }
              return (
                <button
                  key={space}
                  type="button"
                  onClick={() => switchWorkspace(space)}
                  className={cn(REGISTER_ROW, "w-full text-start")}
                >
                  <span>
                    <span className="block font-medium text-foreground">{label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {t(space === "owner" ? "workspace.toOwner" : "workspace.toSitter")}
                    </span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="settings-language" className="mt-12">
          <h2 id="settings-language" className="text-name font-semibold text-foreground">
            {t("settings.language.title")}
          </h2>
          {/* Says which of the two things is actually happening rather than
              implying a decision the visitor never made. Nidz follows the
              device until someone chooses here; after that the choice wins. */}
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
            {explicit ? t("settings.language.chosen") : t("settings.language.following")}
          </p>
          {/* No explicit `<OptionGroup<AppLocale>>` type argument, deliberately.
              `lovable-tagger` — the dev-only plugin that annotates JSX — injects
              its attributes between the component name and the type argument,
              which is a syntax error. It never reaches the production build, so
              tsc and `npm run build` both pass while the dev server returns a
              500 for this module. The type is inferred from `value` and
              `options` anyway. */}
          <OptionGroup
            className="mt-4"
            labelledBy="settings-language"
            value={locale}
            onChange={setLocale}
            options={LANGUAGE_OPTIONS.map((lng) => ({
              value: lng,
              label: t(LOCALE_LABEL_KEY[lng]),
            }))}
          />
        </section>

        {/* The account was write-once: nothing linked back to it, so a wrong
            commune or a typo'd name could only be fixed by wiping all demo
            state — and that commune is what Owner Home's whole suggestion
            section keys off. */}
        {state.capabilities.owner && (
          <section aria-labelledby="settings-account" className="mt-12">
            <h2 id="settings-account" className="text-name font-semibold text-foreground">
              {t("settings.account.title")}
            </h2>
            <div className="mt-4">
              <Link to="/owner/account" className={REGISTER_ROW}>
                <span>
                  <span className="block font-medium text-foreground">
                    {t("settings.account.edit")}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {t("settings.account.editLine")}
                  </span>
                </span>
                <ArrowRight
                  className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>
        )}

        <section aria-labelledby="settings-about" className="mt-12">
          <h2 id="settings-about" className="text-name font-semibold text-foreground">
            {t("settings.about.title")}
          </h2>
          <div className="mt-4">
            {[
              { to: "/help", label: t("nav.help"), description: t("settings.about.helpLine") },
              { to: "/policies", label: t("nav.policies"), description: t("settings.about.policiesLine") },
            ].map((row) => (
              <Link key={row.to} to={row.to} className={REGISTER_ROW}>
                <span>
                  <span className="block font-medium text-foreground">{row.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{row.description}</span>
                </span>
                <ArrowRight
                  className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        {/* TEST TOOLING, explicitly separate from the product (Audit 1.3
            LOT 07). This demonstration has no other users, so the only way to
            see the sitter side receive a request — and to try a question
            before deciding — is to address one to your own profile. That is
            an instruction for testing, not something a real sitter would do,
            so it lives here and nowhere in the owner's or the sitter's
            screens. */}
        {state.sitter?.published && (
          <section aria-labelledby="settings-tools" className="mt-12 border-t border-border pt-8">
            <h2 id="settings-tools" className="text-name font-semibold text-foreground">
              {t("settings.tools.title")}
            </h2>
            <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
              {t("settings.tools.body")}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to={`/owner/request/${state.sitter.profile.id}`}>{t("settings.tools.selfRequest")}</Link>
            </Button>
          </section>
        )}

        <section aria-labelledby="settings-reset" className="mt-12 border-t border-border pt-8">
          <h2 id="settings-reset" className="text-name font-semibold text-foreground">
            {t("settings.reset.title")}
          </h2>
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
        </section>
      </div>
    </div>
  );
}
