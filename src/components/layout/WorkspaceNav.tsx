import { useTranslation } from "react-i18next";
import { NavLink, useLocation, matchPath } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import type { Workspace } from "@/data/workspace";
import { isNavigable, workspaceDestinations, type NavContext } from "./workspace-nav";

/**
 * The mobile navigation for whichever workspace is active.
 *
 * ONE bar, never two (§22): the workspace decides what the bar CONTAINS, never
 * whether a second bar appears beside the first. Drawing the bar never changes
 * the workspace; only an explicit switch (or using this bar's tabs) does.
 *
 * 1.4 shape: a floating pill, inset from the screen edges, on its own raised
 * shadow — the one thing in the shell that genuinely floats. The current tab
 * sits on a soft teal capsule that SLIDES between tabs (transform only,
 * 250ms, a strong ease-in-out because it moves ON screen — Emil Kowalski), so moving between spaces reads as one control changing state
 * rather than five links repainting. Three cues mark the current tab, never
 * colour alone (§12.2): the capsule, a heavier label, and `aria-current`.
 *
 * Desktop uses the header instead: at `md`+ this is hidden.
 */
export default function WorkspaceNav({
  workspace,
  context,
}: {
  workspace: Workspace;
  context: NavContext;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { state, dispatch } = useDemo();
  const destinations = workspaceDestinations(workspace, context);
  /* Tapping one of THIS bar's tabs is choosing its space (Audit 1.3 LOT 04). */
  const choose = () => {
    if (state.activeWorkspace !== workspace) dispatch({ type: "setWorkspace", workspace });
  };

  /* One destination is a link, not a bar. See `isNavigable`. */
  if (!isNavigable(destinations)) return null;

  const active = destinations.findIndex(({ to, end }) => matchPath({ path: to, end: Boolean(end) }, pathname));
  const count = destinations.length;

  return (
    <nav
      /* Named per workspace so two navigations stay distinguishable in a
         screen reader's landmark list. */
      aria-label={t(workspace === "sitter" ? "nav.sitterLabel" : "nav.ownerLabel")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
      /* The iOS home indicator sits under the bar, not on its targets. */
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <ul
        role="list"
        className="pointer-events-auto relative mx-auto flex max-w-md rounded-full bg-card p-1.5 shadow-raised"
      >
        {active >= 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 start-1.5 rounded-full bg-primary-soft transition-transform duration-[250ms] ease-in-out"
            style={{
              width: `calc((100% - 0.75rem) / ${count})`,
              /* Logical direction: in Arabic the bar runs right to left, so the
                 capsule travels the other way. */
              transform: `translateX(calc(${active * 100}% * var(--nav-dir, 1)))`,
            }}
          />
        )}
        {destinations.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="relative flex-1">
            <NavLink
              to={to}
              end={end}
              onClick={choose}
              className={({ isActive }) =>
                cn(
                  /* min-h-14 keeps every tab above the ~44px Nidz floor (§17)
                     even with the label under the icon. */
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-center text-[0.6875rem] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive ? "font-semibold text-primary" : "font-normal text-muted-foreground active:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[1.375rem] shrink-0" aria-hidden="true" strokeWidth={isActive ? 2.25 : 1.75} />
                  {/* Icon AND label (§84): an icon-only bar asks every user to
                      have already learned it. */}
                  <span className="line-clamp-1">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
