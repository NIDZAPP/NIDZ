import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import EmptyState from "@/components/shared/EmptyState";
import BackButton from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";

/**
 * One honest screen for every route this demonstration does not implement.
 *
 * The routes stay registered rather than being deleted: deleting them breaks
 * deep links and the browser's Back button, and turns a known address into a
 * 404 that says nothing. What replaces the old stubs is a plain statement that
 * the screen is not part of this demonstration — not "coming soon", which is a
 * commitment nobody has made, and certainly not a feature list. The sitter
 * dashboard stub used to promise "Today, Calendar, Inbox, Wallet, Listing
 * editor"; none of those exist or are planned in a way anyone has validated.
 */
export default function NotAvailable() {
  const { t } = useTranslation();

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("notAvailable.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        <BackButton fallback="/" />
        <EmptyState
          headingLevel="h1"
          title={t("notAvailable.title")}
          body={t("notAvailable.body")}
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
