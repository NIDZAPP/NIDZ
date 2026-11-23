import { SlidersHorizontal } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { WORKSPACE_ROOT, type Workspace } from "@/data/workspace";
import BrandMark from "@/components/shared/BrandMark";
import { isNavigable, workspaceDestinations, type NavContext } from "./workspace-nav";

/**
 * The browsable shell's top bar.
 *
 * Carries the same destinations as the mobile bar, from the same list, so
 * crossing 768px cannot rename a place or offer a different set of them.
 * Help and Policies stay out of it: they are not tasks (§84-86).
 *
 * 1.4 shape: the bar is the mist ground itself — no rule, no fill — so the
 * first card below it is the first object on the page. At md+ the
 * destinations sit in one white segmented pill; the current one is a soft
 * teal capsule with a heavier label and `aria-current` (never colour alone).
 */
export default function Header({
  workspace,
  navContext,
  actions,
}: {
  workspace: Workspace;
  navContext: NavContext;
  /** Extra controls at the inline end, before the account (messages, the
      language chooser on the entry screen). */
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const all = workspaceDestinations(workspace, navContext);
  /* Same rule as the bar: using this space's navigation is choosing it. */
  const choose = () => {
    if (state.activeWorkspace !== workspace) dispatch({ type: "setWorkspace", workspace });
  };
  /* An unpublished sitter has no inbox worth landing on: the wordmark goes to
     the owner home instead of an empty "Demandes reçues". */
  const home = workspace === "sitter" && !navContext.sitterPublished ? "/" : WORKSPACE_ROOT[workspace];

  /* Home leaves the DESKTOP nav only: the wordmark beside it is already a link
     to the same place (§4.2). It stays in the mobile bar, which has no
     wordmark. */
  const navigable = isNavigable(all);
  const destinations = navigable ? all.filter((d) => d.to !== "/") : [];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-3 md:h-[4.5rem]">
        {/* Home means the ACTIVE workspace's root, not `/` (see `home`). */}
        <Link
          to={home}
          aria-label={`${t("common.appName")} — ${t("nav.home")}`}
          className="-ms-1 flex min-h-11 shrink-0 items-center gap-2 rounded-full pe-2 ps-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <BrandMark />
        </Link>

        {destinations.length > 0 && (
          <nav
            /* Named per workspace, matching the mobile bar. */
            aria-label={t(workspace === "sitter" ? "nav.sitterLabel" : "nav.ownerLabel")}
            className="hidden md:block"
          >
            <ul role="list" className="flex items-center gap-1 rounded-full bg-card p-1 shadow-pill">
              {destinations.map(({ to, labelKey, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={choose}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary-soft font-semibold text-primary"
                          : "font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {actions}
          {/* Where a space has no navigation yet (a sitter whose profile is
              not published), the account stays one tap away. Icon-only, so
              the name is carried in text. */}
          {!navigable && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-pill transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "text-primary" : "text-foreground hover:bg-secondary",
                )
              }
            >
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              <span className="sr-only">{t("nav.account")}</span>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
