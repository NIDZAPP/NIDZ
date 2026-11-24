import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BackButton from "@/components/shared/BackButton";
import { INLINE_LINK } from "@/components/shared/link-styles";

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

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("help.title")}
        </title>
        <meta name="description" content={t("help.q.what.a")} />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <BackButton variant="labelled" fallback="/settings" className="mb-3" />
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

        {/* The reset itself lives in Settings (§88). Erasing everything is a
            destructive action, and a destructive action with two triggers in
            two places is one more thing to reach by accident — so this points
            at it rather than repeating it. */}
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-name font-semibold text-foreground">{t("help.reset.title")}</h2>
          <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">
            {t("help.reset.body")}
          </p>
          <p className="mt-4">
            <Link
              to="/settings"
              className={INLINE_LINK}
            >
              {t("help.reset.inSettings")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
