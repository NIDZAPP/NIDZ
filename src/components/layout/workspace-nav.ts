import { Home, Inbox, PawPrint, Search, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Workspace } from "@/data/workspace";

/**
 * The navigation model for both workspaces, in one place.
 *
 * One source, consumed by every breakpoint. The bottom bar below `md`, the
 * header at `md`+ and the sitter's desktop rail all read this list, so a
 * destination cannot be called one thing on a phone and another on a laptop —
 * crossing 768px must never rename a place.
 *
 * THE RULE THAT DECIDES WHAT APPEARS HERE (§84-86 vs. Nidz's own §22):
 *
 *   A destination is listed when it renders that workspace's real screen,
 *   INCLUDING its genuine empty state. It is not listed while it would render
 *   `NotAvailable`.
 *
 * The distinction matters and is easy to blur: an empty Messages screen that
 * says "no conversations yet" IS a destination — the person has arrived
 * somewhere true. A Messages tab that lands on "this is not part of the
 * demonstration" is a dead button wearing navigation's clothes, and a bar of
 * those is worse than a shorter bar. Greying a tab out is the same offence
 * with an apology attached.
 *
 * AUDIT 1.3 LOT 04 — ONE ACCOUNT, TWO SPACES, EVERY TAB REAL.
 *
 *   owner   Accueil · Recherche · Demandes · Mes animaux · Compte
 *   sitter  Demandes · Mon profil · Compte
 *
 * "Mes animaux" and the account screen already existed and were hard to find
 * (a row on Home; an unlabelled sliders icon). They are now in the bar rather
 * than recreated. "Compte" is the shared `/settings` screen — one account, so
 * one account screen, whichever space is active — and it is where the switch
 * between the two spaces lives.
 *
 * Not in the bar, and why:
 *   - Messages: there is no messaging in Nidz. A tab would land on
 *     `NotAvailable`.
 *   - Calendar / Disponibilités as a TAB: there is no calendar. What exists is
 *     a form where the sitter declares the periods they cannot take; it is a
 *     full-screen step that returns to "Mon profil", where it is listed. A tab
 *     that drops the visitor out of the tabbed chrome would make the place of
 *     things unstable, which is what LOT 04 asks to fix.
 */
export type NavDestination = {
  to: string;
  /** i18n key, resolved by the component. Keeping the key here rather than the
      translated string is what lets one list serve three languages and both
      orientations. */
  labelKey: string;
  icon: LucideIcon;
  /** Exact match only — for `/`, which otherwise matches every route. */
  end?: boolean;
};

/** The account screen, shared by both spaces. */
export const ACCOUNT_PATH = "/settings";

const ACCOUNT: NavDestination = { to: ACCOUNT_PATH, labelKey: "nav.account", icon: UserRound };

const OWNER: NavDestination[] = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/search", labelKey: "nav.search", icon: Search },
  { to: "/owner/requests", labelKey: "nav.myRequests", icon: Inbox },
  { to: "/owner/pets", labelKey: "nav.petsShort", icon: PawPrint },
  ACCOUNT,
];

const SITTER: NavDestination[] = [
  { to: "/sitter/requests", labelKey: "nav.received", icon: Inbox },
  /* The sitter's own profile, as the sections dashboard — what they keep up
     to date, including the periods they declare unavailable. Exact match, so
     a section editor under `/sitter/profile/…` is not shown as this tab (those
     are full-screen steps without the bar anyway). */
  { to: "/sitter/profile", labelKey: "nav.sitterProfile", icon: PawPrint, end: true },
  ACCOUNT,
];

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
  /** A sitter profile exists AND has been published locally.
   *
   * Deliberately `published`, not "a sitter workspace exists": `state.sitter`
   * is created by the first tap on the sitter introduction, so keying on its
   * mere existence put a sitter destination in front of people who had typed
   * nothing. A carried-over 1.1 decision. */
  sitterPublished: boolean;
};

/**
 * What this workspace can currently navigate between, for this person.
 *
 * ONE function, used by every breakpoint. Both the bottom bar and the header
 * used to carry their own copy of the availability rule, which is two places to
 * forget — and they had already drifted apart on whether a sitter destination
 * needs a *published* profile.
 *
 * Two different reasons a destination is absent, kept distinct:
 *   - the screen does not exist yet → it is not in the list above at all;
 *   - the screen exists but is not this person's business yet → filtered here.
 */
export function workspaceDestinations(workspace: Workspace, ctx: NavContext): NavDestination[] {
  if (!ctx.entered) return [];
  const all = workspace === "sitter" ? SITTER : OWNER;
  return all.filter((d) => (d.to.startsWith("/sitter/") ? ctx.sitterPublished : true));
}

/**
 * Whether a set of destinations is worth drawing as navigation at all.
 *
 * One destination is not navigation — it is a link, and a full-width bar
 * containing a single tab reads as a broken four-tab bar rather than as a
 * deliberate one. Below the threshold the shell falls back to in-page links,
 * which is the honest state while a workspace is still filling in.
 *
 * Applied to the header as well as the bar, so the two cannot disagree about
 * whether this workspace has navigation.
 */
export function isNavigable(destinations: NavDestination[]): boolean {
  return destinations.length >= 2;
}
