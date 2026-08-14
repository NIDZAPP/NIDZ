import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import BackButton from "@/components/shared/BackButton";

/**
 * What this demonstration stores, and where.
 *
 * Not a privacy policy — Nidz has no service to write one about. It is a
 * factual description of the only data handling that happens: everything the
 * visitor types stays in their own browser, and nothing is transmitted. A
 * page of legal-sounding boilerplate here would imply an operator, a
 * processor and a retention policy, none of which exist (§28, §6.1).
 */
const POINTS = ["storage", "transmit", "location", "documents", "photos", "remove"] as const;

export default function Policies() {
  const { t } = useTranslation();

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("policies.title")}
        </title>
        <meta name="description" content={t("policies.intro")} />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <BackButton variant="labelled" fallback="/" className="mb-6" />
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("policies.title")}</h1>
        <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-muted-foreground">{t("policies.intro")}</p>

        <ul role="list" className="mt-10 space-y-6">
          {POINTS.map((key) => (
            <li key={key} className="border-b border-border pb-6 last:border-0">
              <p className="max-w-[64ch] text-base leading-relaxed text-foreground">{t(`policies.points.${key}`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
