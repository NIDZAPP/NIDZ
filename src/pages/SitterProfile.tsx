import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getDemoSitter } from "@/data/demo-sitters";

/**
 * PLACEHOLDER — the full public profile is Group 5.
 *
 * Every result row now lands here, so this screen must not promise anything.
 * It previously advertised "reviews and calendar (coming soon)": Nidz has no
 * review mechanism and no calendar, and naming them here is exactly the kind
 * of claim §6.1 forbids, coming-soon or not.
 */
export default function SitterProfile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const sitter = getDemoSitter(id);

  return (
    <div className="container py-10">
      <Helmet>
        <title>
          {t("common.appName")} — {sitter?.publicName ?? t("search.card.viewProfile")}
        </title>
      </Helmet>
      <h1 className="text-h1 font-semibold text-foreground">
        <bdi>{sitter?.publicName ?? t("search.card.viewProfile")}</bdi>
      </h1>
      <p className="mt-3 max-w-[60ch] text-base text-muted-foreground">{t("search.demo.body")}</p>
    </div>
  );
}
