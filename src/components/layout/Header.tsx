import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    /* h-11 keeps the nav links on the Nidz touch floor even on a tablet. */
    "inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
    isActive ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-secondary",
  );

/**
 * Desktop chrome.
 *
 * Carries the same destinations as the mobile bottom bar, and only
 * destinations that exist: "Mes animaux" and "Tableau de bord" pointed at
 * stubs and are gone. Admin stays out of public navigation.
 *
 * The header CTA was a second, competing "find a sitter" beside a nav link to
 * the same place; the nav link is enough (§4.2).
 */
export default function Header() {
  const { t } = useTranslation();
  const { state } = useDemo();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {/* The one Playfair role in the application: the wordmark. */}
          <Link
            to="/"
            aria-label={`${t("common.appName")} — ${t("nav.home")}`}
            className="shrink-0 rounded-md font-display text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("common.appName")}
          </Link>
          <nav aria-label={t("nav.siteLabel")} className="hidden items-center gap-1 md:flex">
            <NavLink to="/search" className={navLinkCls} end>
              {t("nav.search")}
            </NavLink>
            {/* Same keys as the bottom bar: crossing 768px must not rename a
                destination, and page-title keys are not nav labels. No `end`,
                so the link stays current on the request detail page. */}
            <NavLink to="/owner/requests" className={navLinkCls}>
              {t("nav.myRequests")}
            </NavLink>
            {/* Only once a profile is published — a destination that would be
                empty for everyone else is not navigation. */}
            {state.sitter?.published && (
              <NavLink to="/sitter/requests" className={navLinkCls}>
                {t("nav.received")}
              </NavLink>
            )}
            <NavLink to="/help" className={navLinkCls} end>
              {t("nav.help")}
            </NavLink>
          </nav>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
