import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { activeCriteriaCount, criteriaFromNeed, criteriaToParams } from "@/data/criteria";
import { useDemo } from "@/state/demo/context";

/**
 * Home, for someone who has already been through the introduction.
 *
 * Deliberately not a dashboard. Everything a dashboard would show either does
 * not exist yet or would have to be invented, and this is the easiest screen
 * in the product on which to accidentally fabricate activity. The only counted
 * thing here is the person's own requests, which is the only thing that can
 * honestly be counted.
 *
 * The role fork is not repeated: it was asked once, and §22 says to ask it
 * only when the choice is necessary.
 */
export default function Index() {
  const { t } = useTranslation();
  const { state } = useDemo();

  /* A first-time visitor belongs on the introduction, which is a full-screen
     route outside the site chrome. */
  if (!state.entered) return <Navigate to="/welcome" replace />;

  const pending = state.requests.filter((r) => r.status === "pending").length;
  const criteria = criteriaFromNeed(state.need);
  /* Same definition of "has a brief" the search contract uses, so a saved
     wilaya or a saved date range is not quietly treated as nothing. */
  const hasNeed = Boolean(state.need.petId) || activeCriteriaCount(criteria) > 0;
  const resume = new URLSearchParams(criteriaToParams(criteria)).toString();

  return (
    <div className="container py-12 md:py-20">
      <Helmet>
        <title>
          {t("common.appName")} — {t("home.title")}
        </title>
        <meta name="description" content={t("home.subtitle")} />
      </Helmet>

      <div className="mx-auto max-w-[640px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("home.title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("home.subtitle")}</p>

        <div className="mt-8">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-52">
            {hasNeed ? (
              <Link to={{ pathname: "/search", search: resume }}>{t("entry.resume")}</Link>
            ) : (
              <Link to="/owner/need/pet">{t("entry.findSitter")}</Link>
            )}
          </Button>
        </div>

        {/* The one thing here that resembles a dashboard — and it is the
            person's own data, so it is the one thing that can be counted.
            Absent entirely when there is nothing to count. */}
        {state.requests.length > 0 && (
          <Link
            to="/owner/requests"
            className="mt-10 flex items-center justify-between gap-4 rounded-md border border-border p-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span>
              <span className="block font-medium text-foreground">{t("entry.myRequests")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {pending > 0
                  ? t("entry.requestsPending", { count: pending })
                  : t("entry.requestsCount", { count: state.requests.length })}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        )}

        {/* One quiet pointer at the other side of the marketplace, chosen by
            the activity the person is not currently in. Not a second pair of
            equal-weight cards. */}
        <p className="mt-10 text-sm text-muted-foreground">
          {state.role === "sitter" ? (
            <Link to="/owner/need/pet" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("entry.switchToOwner")}
            </Link>
          ) : (
            <Link to="/sitter/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("entry.switchToSitter")}
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
