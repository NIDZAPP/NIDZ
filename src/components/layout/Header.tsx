import { PawPrint } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/data/workspace";
import { isNavigable, workspaceDestinations, type NavContext } from "./workspace-nav";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    /* h-11 keeps the nav links on the Nidz touch floor even on a tablet. */
    "inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
    isActive ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-secondary",
  );

/**
 * Desktop chrome.
 *
 * Carries the same destinations as the mobile bar, from the same list, so
 * crossing 768px cannot rename a place or offer a different set of them.
 *
 * Help and Policies left the header at Audit 1.2. They are not tasks — nobody
 * opens Nidz to read a policy — and they were competing for width with the
 * places people actually go. They stay in the footer, and Group 15 gives them a
 * home in Settings (§84-86).
 *
 * The header CTA was a second, competing "find a sitter" beside a nav link to
 * the same place; the nav link is enough (§4.2).
 */
export default function Header({
  workspace,
  navContext,
}: {
  workspace: Workspace;
  navContext: NavContext;
}) {
  const { t } = useTranslation();
  const all = workspaceDestinations(workspace, navContext);

  /* Home leaves the DESKTOP nav only. The wordmark to its immediate left is
     already a link to `/` with the accessible name "Nidz — Home", so listing it
     again put two controls to the same place side by side (§4.2). It stays in
     the mobile bar, which has no wordmark to carry it.

     `isNavigable` is applied to the same list the bar uses, before the filter,
     so the header and the bar can never disagree about whether this workspace
     has navigation at all. */
  const destinations = isNavigable(all) ? all.filter((d) => d.to !== "/") : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-chrome-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {/* The same lockup the entry screen uses: the terracotta mark plus
              the name in Inter. Audit 1.2 withdrew Playfair entirely — it had
              no Arabic face, so in Arabic the wordmark fell back to an
              arbitrary system serif and the header and the splash rendered the
              brand in two different faces. The mark carries the brand now, and
              it works in all three languages. */}
          <Link
            to="/"
            aria-label={`${t("common.appName")} — ${t("nav.home")}`}
            className="flex shrink-0 items-center gap-2 rounded-md text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PawPrint className="size-5 text-brand" aria-hidden="true" />
            {t("common.appName")}
          </Link>

          {destinations.length > 0 && (
            <nav
              /* Named per workspace, matching the mobile bar: two identically
                 named navigations are indistinguishable in a screen reader's
                 landmark list. */
              aria-label={t(workspace === "sitter" ? "nav.sitterLabel" : "nav.ownerLabel")}
              className="hidden items-center gap-1 md:flex"
            >
              {destinations.map(({ to, labelKey, end }) => (
                <NavLink key={to} to={to} className={navLinkCls} end={end}>
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
