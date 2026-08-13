import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

/**
 * An address that resolves to nothing.
 *
 * Distinct from `NotAvailable`, which is for routes that exist but are not
 * part of this demonstration. Keeping the two apart means neither has to lie
 * about the other.
 */
export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    /* Kept from the original: useful when someone reports a broken link. */
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("notFound.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        <EmptyState
          headingLevel="h1"
          title={t("notFound.title")}
          body={t("notFound.body")}
          action={
            <Button asChild variant="outline">
              <Link to="/">{t("notAvailable.home")}</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
