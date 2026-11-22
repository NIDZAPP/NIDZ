import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import type { Workspace } from "@/data/workspace";
import { isNavigable, workspaceDestinations, type NavContext } from "./workspace-nav";

/**
 * The mobile navigation for whichever workspace is active.
 *
 * ONE bar, not two visible at once. §22 is explicit that a single person may
 * progressively have both uses and that Nidz must not become two separate
 * applications — so the workspace decides what the bar CONTAINS, never whether
 * a second bar appears beside the first.
 *
 * What changed at Audit 1.2, and why it matters: the 1.1 bar appended the
 * sitter's inbox as a fifth destination the moment a profile was published, so
 * an owner browsing sitters carried a sitter tab. Under the workspace model the
 * bar is drawn from the ACTIVE WORKSPACE instead. Publishing a profile grants a
 * capability; it does not rearrange the furniture of the side you are standing
 * on.
 *
 * Drawing the bar never changes the workspace. `resolveWorkspace` decides which
 * nav to render; only an explicit switch changes which workspace is active.
 *
 * Desktop uses the header instead: at `md`+ this is hidden. When the sitter
 * workspace gains enough destinations to need one (Group 11 onward), its
 * desktop counterpart is a vertical rail built from the same
 * `workspaceDestinations` list, so a label can never differ across a
 * breakpoint.
 */
export default function WorkspaceNav({
  workspace,
  context,
}: {
  workspace: Workspace;
  context: NavContext;
}) {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const destinations = workspaceDestinations(workspace, context);
  /* The bar can show a space that is not the active one — a screen whose path
     belongs to the other side (your own sitter dashboard while the owner space
     is active). Tapping one of ITS tabs is choosing that space: recorded, so
     that "Compte" and Home keep the bar you were using instead of flipping to
     the other one (Audit 1.3 LOT 04 review). */
  const choose = () => {
    if (state.activeWorkspace !== workspace) dispatch({ type: "setWorkspace", workspace });
  };

  /* One destination is a link, not a bar. See `isNavigable`. */
  if (!isNavigable(destinations)) return null;

  return (
    <nav
      /* Named per workspace so the landmark list stays legible to a screen
         reader user who has both — "Owner navigation" and "Sitter navigation"
         are two different places, and two identically-named navigations are
         indistinguishable in a rotor. */
      aria-label={t(workspace === "sitter" ? "nav.sitterLabel" : "nav.ownerLabel")}
      className="sticky bottom-0 z-40 border-t border-border bg-background shadow-chrome-t md:hidden"
      /* The iOS home indicator overlaps a bottom-pinned bar and erodes the
         touch targets underneath it. */
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul role="list" className="flex">
        {destinations.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              onClick={choose}
              className={({ isActive }) =>
                cn(
                  /* min-h-14 keeps every tab above the ~44px Nidz floor (§17)
                     even with the label under the icon. */
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Three cues, so the current tab is never carried by colour
                      alone (§12.2): a rule along the top edge, a heavier
                      label, and `aria-current` from NavLink. */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                  <Icon
                    className="size-5 shrink-0"
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {/* Icon AND label (§84). An icon-only bar asks every user to
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
