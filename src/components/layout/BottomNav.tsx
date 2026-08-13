import { Home, Inbox, PawPrint, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

/**
 * Mobile navigation.
 *
 * ONE bar, not two. §22 is explicit that a single person may progressively
 * have both uses and that Nidz must not become two separate applications —
 * so the sitter's inbox is an additional destination on the same bar, not a
 * different bar behind a mode switch.
 *
 * Every destination here is a screen that exists and has content. The audit's
 * lists mention Messages, Mes animaux, Disponibilités and Compte; none of
 * those exist as real screens, so none of them appear. A tab that leads to
 * "coming soon" is worse than one tab fewer.
 *
 * Desktop uses the header instead: at md+ this is hidden and `Header` carries
 * the same destinations.
 */
type Destination = { to: string; label: string; icon: LucideIcon; end?: boolean };

export default function BottomNav() {
  const { t } = useTranslation();
  const { state } = useDemo();

  /* Nothing to navigate before the introduction has been seen — the entry
     flow owns the whole viewport and carries no chrome. */
  if (!state.entered) return null;

  const destinations: Destination[] = [
    { to: "/", label: t("nav.home"), icon: Home, end: true },
    { to: "/search", label: t("nav.search"), icon: Search },
    { to: "/owner/requests", label: t("nav.myRequests"), icon: Inbox },
    /* Appears once a profile is actually PUBLISHED. `state.sitter` exists from
       the first tap on the sitter intro, so keying on it put the tab in front
       of people who had typed nothing. */
    ...(state.sitter?.published
      ? [{ to: "/sitter/requests", label: t("nav.received"), icon: PawPrint } as Destination]
      : []),
  ];

  return (
    <nav
      aria-label={t("nav.siteLabel")}
      className="sticky bottom-0 z-40 border-t border-border bg-background md:hidden"
      /* The iOS home indicator overlaps a bottom-pinned bar and erodes the
         touch targets underneath it. */
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul role="list" className="flex">
        {destinations.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
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
                  <Icon className="size-5 shrink-0" aria-hidden="true" strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className="line-clamp-1">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
