import { Home, Inbox, Search } from "lucide-react";
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
 * Audit 1.2's target shape is four tabs a side — owner Home · Search ·
 * Messages · Profile, sitter Requests · Calendar · Messages · Profile — and
 * the commented entries below are the ones still to land. Each names the group
 * that brings it, so filling the bar in is a one-line edit rather than an
 * archaeology exercise. Existing entries keep their slot when a new one lands;
 * the single deliberate exception is noted on the owner list.
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

const OWNER: NavDestination[] = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/search", labelKey: "nav.search", icon: Search },
  /* Group 13 inserts Messages here, and Requests leaves the bar for Home,
     which already surfaces it. That is the one slot change in the plan, and it
     is what §84-86 asks for: secondary entities live inside Home and Profile
     rather than competing for the bar. */
  { to: "/owner/requests", labelKey: "nav.myRequests", icon: Inbox },
  /* Group 15: { to: "/owner/profile", labelKey: "nav.profile", icon: User } */
];

const SITTER: NavDestination[] = [
  { to: "/sitter/requests", labelKey: "nav.received", icon: Inbox },
  /* Group 11: { to: "/sitter/calendar", labelKey: "nav.calendar", icon: Calendar }
     Until then availability is a step inside the profile builder, not a place.
     Group 13: Messages. Group 15: Profile.

     So the sitter workspace currently has ONE browsable screen and therefore no
     bar — see `isNavigable`. Everything else on that side is a flow, which
     carries its own chrome. It looks unfinished in the demonstration because it
     is; that is the correct trade against three tabs that go nowhere. */
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
