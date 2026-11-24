import { UserRound } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { TOP_BAR, TOP_BAR_ROW } from "@/components/shared/top-bar";
import { navBadge, workspaceHome } from "@/data/navigation";
import type { Workspace } from "@/data/workspace";
import BrandMark from "@/components/shared/BrandMark";
import {
  ACCOUNT_PATH,
  isDestinationActive,
  isNavigable,
  workspaceDestinations,
  type NavContext,
} from "./workspace-nav";

/**
 * The browsable shell's top bar.
 *
 * Carries the same destinations as the mobile bar, from the same list, so
 * crossing 768px cannot rename a place or offer a different set of them.
 * Help and Policies stay out of it: they are not tasks (§84-86) — they live in
 * Compte.
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
  backSlot,
}: {
  workspace: Workspace;
  navContext: NavContext;
  /** Extra controls at the inline end (the language chooser on Accueil). */
  actions?: ReactNode;
  /** Receives the element a secondary screen's `BackButton` portals into —
      the inline start of this bar, before the wordmark. */
  backSlot?: (element: HTMLElement | null) => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { state, dispatch } = useDemo();
  const all = workspaceDestinations(workspace, navContext);
  /* Same rule as the bar: using this space's navigation is choosing it. */
  const choose = () => {
    if (state.activeWorkspace !== workspace) dispatch({ type: "setWorkspace", workspace });
  };
  /* The wordmark goes where this space begins — the one answer the switch and
     Compte give too (NAV-01). */
  const home = workspaceHome(state, workspace);

  /* Home leaves the DESKTOP nav only: the wordmark beside it is already a link
     to the same place (§4.2). It stays in the mobile bar, which has no
     wordmark. */
  const navigable = isNavigable(all);
  const destinations = navigable ? all.filter((d) => d.to !== "/") : [];

  return (
    <header className={TOP_BAR}>
      <div className={cn(TOP_BAR_ROW, "justify-between")}>
        <div className="flex min-w-0 items-center gap-2">
          {/* A secondary screen's back control lands here (see `BackButton`):
              the same spot as on a flow step, held in view by the sticky bar.
              `contents`, so an empty slot takes no room on a root screen. */}
          <span ref={backSlot} className="contents" />
          <Link
            to={home}
            onClick={choose}
            aria-label={`${t("common.appName")} — ${t("nav.home")}`}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full pe-2 ps-1 [span:empty+&]:-ms-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark />
          </Link>
        </div>

        {destinations.length > 0 && (
          <nav
            /* Named per workspace, matching the mobile bar. */
            aria-label={t(workspace === "sitter" ? "nav.sitterLabel" : "nav.ownerLabel")}
            className="hidden md:block"
          >
            <ul role="list" className="flex items-center gap-1 rounded-full bg-card p-1 shadow-pill">
              {destinations.map((destination) => {
                const { to, labelKey, badgeLabelKey, icon: Icon } = destination;
                const isActive = isDestinationActive(destination, pathname);
                const badge = navBadge(state, workspace, to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={choose}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={badge > 0 && badgeLabelKey ? t(badgeLabelKey, { count: badge }) : undefined}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-primary-soft font-semibold text-primary"
                          : "font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {t(labelKey)}
                      {/* Inline after the label here, as in Messages' own
                          tabs: a corner badge on a 16px icon covers it. */}
                      {badge > 0 && (
                        <span
                          aria-hidden="true"
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
                        >
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {actions}
          {/* Where a space has no navigation (before the introduction, or a
              sitter screen opened with no sitter side), Compte stays one tap
              away. Icon-only, so the name is carried in text. */}
          {!navigable && (
            <NavLink
              to={ACCOUNT_PATH}
              className={({ isActive }) =>
                cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-pill transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive ? "text-primary" : "text-foreground hover:bg-secondary",
                )
              }
            >
              <UserRound className="size-5" aria-hidden="true" />
              <span className="sr-only">{t("nav.account")}</span>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
