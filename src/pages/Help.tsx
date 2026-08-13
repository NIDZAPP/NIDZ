import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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
import { SPLASH_KEY } from "@/pages/onboarding/Welcome";
import { useDemo } from "@/state/demo/context";

/**
 * What this demonstration is, and what it is not.
 *
 * Real content rather than a stub, because the page is linked from the header
 * and the footer — and because the single most useful thing Nidz can tell
 * someone opening a prototype is exactly which parts are real. Every answer
 * here restates a boundary the rest of the interface already keeps.
 */
const QUESTIONS = ["what", "data", "verification", "booking", "sitters", "coverage"] as const;

export default function Help() {
  const { t } = useTranslation();
  const { dispatch } = useDemo();
  const navigate = useNavigate();

  const reset = () => {
    /* The reducer reset is what clears storage: DemoProvider removes the key
       when the state is back to initial, so calling clearStoredState() here
       would be undone by the persistence effect a tick later. */
    dispatch({ type: "reset" });
    try {
      window.sessionStorage.removeItem(SPLASH_KEY);
    } catch {
      /* Private mode — the reducer reset is enough. */
    }
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("help.title")}
        </title>
        <meta name="description" content={t("help.q.what.a")} />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("help.title")}</h1>
        <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-muted-foreground">{t("help.intro")}</p>

        <dl className="mt-10 space-y-8">
          {QUESTIONS.map((key) => (
            <div key={key}>
              <dt className="text-name font-semibold text-foreground">{t(`help.q.${key}.q`)}</dt>
              <dd className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
                {t(`help.q.${key}.a`)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-name font-semibold text-foreground">{t("help.reset.title")}</h2>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
            {t("help.reset.body")}
          </p>
          {/* Confirmed, because this erases the animal, the requests and the
              whole sitter profile the visitor built, and nothing undoes it. */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="mt-4">
                {t("help.reset.cta")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("help.reset.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("help.reset.confirmBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("help.reset.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={reset}>{t("help.reset.confirm")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
