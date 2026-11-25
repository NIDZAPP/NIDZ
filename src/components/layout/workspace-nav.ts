import { Home, Inbox, MessageCircle, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { matchPath } from "react-router-dom";

import type { Workspace } from "@/data/workspace";
import { MESSAGES_PATH, SITTER_HOME } from "@/data/navigation";

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
 * NIDZ 1.7 — THE SAME FOUR TABS, IN THE SAME ORDER, ON BOTH SIDES (§15).
 *
 *   owner   Accueil · Demandes · Messages · Compte
 *   sitter  Accueil · Demandes · Messages · Compte
 *
 * What each holds:
 *   - Accueil. Owner: « Mes animaux » and « Explorer les pet-sitters » (the
 *     search, results and public profiles are screens under it, and so is the
 *     animal sheet). Sitter: the feed of published requests nearby, and each
 *     request's detail.
 *   - Demandes. Reçues · Envoyées · Validées on both sides, with drafts and
 *     history inside — never a fifth tab.
 *   - Messages. Conversations and Notifications; the header carries no
 *     second door to it.
 *   - Compte. The person, the space switch and — on the sitter side — « Mon
 *     profil pet-sitter », which replaced the 1.6 « Mon profil » tab. Its
 *     section editors and Paramètres are screens under it.
 *
 * The bar keeps its shape when the space changes: same slots, same words.
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
  owns: [SETTINGS_PATH, `${SETTINGS_PATH}/*`, "/account/*", "/help", "/policies", "/sitter/profile"],
};

const OWNER: NavDestination[] = [
  { to: "/", labelKey: "nav.home", icon: Home, owns: ["/search", "/sitters/:id", "/owner/pets"] },
  {
    to: "/owner/requests",
    labelKey: "nav.myRequests",
    badgeLabelKey: "nav.ownerRequestsBadge",
    icon: Inbox,
    owns: ["/owner/requests/:id", "/owner/posts/:id"],
  },
  MESSAGES,
  ACCOUNT,
];

const SITTER: NavDestination[] = [
  { to: SITTER_HOME, labelKey: "nav.home", icon: Home, owns: ["/sitter/posts/:id"] },
  {
    to: "/sitter/requests",
    labelKey: "nav.myRequests",
    badgeLabelKey: "nav.sitterRequestsBadge",
    icon: Inbox,
    owns: ["/sitter/requests/:id"],
  },
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
