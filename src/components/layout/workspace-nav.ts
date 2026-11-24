import { Home, Inbox, MessageCircle, PawPrint, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { matchPath } from "react-router-dom";

import type { Workspace } from "@/data/workspace";
import { MESSAGES_PATH } from "@/data/navigation";

/**
 * The navigation model for both workspaces, in one place.
 *
 * One source, consumed by every breakpoint. The bottom bar below `md` and the
 * header at `md`+ read this list, so a destination cannot be called one thing
 * on a phone and another on a laptop — crossing 768px must never rename a
 * place.
 *
 * THE RULE THAT DECIDES WHAT APPEARS HERE (§84-86 vs. Nidz's own §22):
 *
 *   A destination is listed when it renders that workspace's real screen,
 *   INCLUDING its genuine empty state. It is not listed while it would render
 *   `NotAvailable`.
 *
 * NIDZ 1.6 — FOUR TABS ON EACH SIDE (the approved model).
 *
 *   owner   Accueil · Demandes · Messages · Compte
 *   sitter  Demandes · Mon profil · Messages · Compte
 *
 * What moved, and where to:
 *   - Search is part of Accueil. Results and public profiles are screens
 *     UNDER Accueil — the tab stays lit there — the way Explore holds both
 *     the search and the listing in the marketplaces owners already use.
 *   - Mes animaux is part of Compte: the animals are the household's, set up
 *     once and chosen per request. The list is a screen under Compte.
 *   - Messages is a tab on both sides (it was an icon in the header), and
 *     holds the notifications as its second view.
 *   - Paramètres (language, security and privacy, the reset, the test tools)
 *     is under Compte, behind the gear at its top-right.
 *
 * Each side's tabs are the same four slots, so the bar keeps its shape when
 * the space changes: the two shared tabs (Messages, Compte) sit in the same
 * place on both sides.
 */
export type NavDestination = {
  to: string;
  /** i18n key, resolved by the component. Keeping the key here rather than the
      translated string is what lets one list serve three languages and both
      orientations. */
  labelKey: string;
  /** Accessible name when a number is shown on the tab (i18n plural family,
      called with `count`). Without it the label alone is announced. */
  badgeLabelKey?: string;
  icon: LucideIcon;
  /** The paths under this tab, beyond `to` itself: the tab stays current on
      them. `matchPath` patterns, matched exactly unless they end in `/*`. */
  owns?: string[];
};

/** Compte: the account hub, shared by both spaces. */
export const ACCOUNT_PATH = "/account";
/** Paramètres: under Compte, behind its gear. */
export const SETTINGS_PATH = "/settings";

const MESSAGES: NavDestination = {
  to: MESSAGES_PATH,
  labelKey: "nav.messages",
  badgeLabelKey: "nav.messagesUnread",
  icon: MessageCircle,
};

const ACCOUNT: NavDestination = {
  to: ACCOUNT_PATH,
  labelKey: "nav.account",
  icon: UserRound,
  owns: [SETTINGS_PATH, "/owner/pets", "/help", "/policies"],
};

const OWNER: NavDestination[] = [
  { to: "/", labelKey: "nav.home", icon: Home, owns: ["/search", "/sitters/:id"] },
  {
    to: "/owner/requests",
    labelKey: "nav.myRequests",
    badgeLabelKey: "nav.ownerRequestsBadge",
    icon: Inbox,
    owns: ["/owner/requests/:id"],
  },
  MESSAGES,
  ACCOUNT,
];

const SITTER: NavDestination[] = [
  {
    to: "/sitter/requests",
    labelKey: "nav.myRequests",
    badgeLabelKey: "nav.sitterRequestsBadge",
    icon: Inbox,
  },
  /* The sitter's own profile, as the sections dashboard — what they keep up to
     date, including the periods they declare unavailable. The section editors
     under `/sitter/profile/…` are full-screen steps without the bar. */
  { to: "/sitter/profile", labelKey: "nav.sitterProfile", icon: PawPrint },
  MESSAGES,
  ACCOUNT,
];

/** Whether `pathname` is this destination or one of the screens under it. */
export function isDestinationActive(destination: NavDestination, pathname: string): boolean {
  return [destination.to, ...(destination.owns ?? [])].some((path) =>
    Boolean(matchPath({ path, end: !path.endsWith("/*") }, pathname)),
  );
}

/**
 * Everything the shell needs in order to decide what to draw.
 *
 * Passed in rather than read from the demo context here, so this module stays
 * a plain description of the navigation model and can be reasoned about (and
 * changed) without touching React.
 */
export type NavContext = {
  /** The introduction has been seen. Before it, the entry flow owns the whole
      viewport and there is no chrome at all. */
  entered: boolean;
  /** A sitter profile exists on this device — started, published or not.
   *
   * 1.5 waited for publication, which left the person FINISHING their profile
   * — the one who most needs to move between it, their account and their
   * messages — with no bar at all and a Back control to the owner home. Every
   * sitter tab renders a real screen for a draft: Demandes says the profile is
   * not visible yet and links to it; Mon profil is the work itself. Starting a
   * profile still does not move the ACTIVE space (see the reducer): only the
   * sitter's own screens draw this bar until the person switches. */
  sitterSpace: boolean;
};

/**
 * What this workspace can currently navigate between, for this person.
 *
 * ONE function, used by every breakpoint. Two different reasons a destination
 * is absent, kept distinct:
 *   - the screen does not exist yet → it is not in the lists above at all;
 *   - the side does not exist for this person yet → filtered here.
 */
export function workspaceDestinations(workspace: Workspace, ctx: NavContext): NavDestination[] {
  if (!ctx.entered) return [];
  if (workspace === "sitter") return ctx.sitterSpace ? SITTER : [];
  return OWNER;
}

/**
 * Whether a set of destinations is worth drawing as navigation at all.
 *
 * One destination is not navigation — it is a link, and a full-width bar
 * containing a single tab reads as a broken bar rather than as a deliberate
 * one. Applied to the header as well as the bar, so the two cannot disagree
 * about whether this workspace has navigation.
 */
export function isNavigable(destinations: NavDestination[]): boolean {
  return destinations.length >= 2;
}
