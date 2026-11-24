/* ---------------------------------------------------------------------------
   NAVIGATION DECISIONS — one place for "where does this go?" (Nidz 1.6).

   The 1.5 navigation audit found the same intention landing in different
   places depending on the door used: "my sitter space" opened the empty inbox
   from Home and the logo, the dashboard from Compte, and the sitter
   introduction from the inbox's own empty state (NAV-01). A confirmation said
   "published" while the search said "not found" (NAV-02). Each screen had
   carried its own copy of the rule.

   Every such decision now lives here, as a pure function of the stored state:
   the logo, Home, Compte, the tab bar, the inbox and the confirmations all ask
   the same question and get the same answer. No React, no storage — so each
   rule is unit-tested in tests/unit/navigation.test.ts.
   ------------------------------------------------------------------------ */

import type { DemoState } from "@/state/demo/reducer";
import type { CareRequest } from "./types";
import type { Workspace } from "./workspace";
import { awaitingReplyFrom } from "./clarification";
import { unreadThreads } from "./notifications";
import { isPubliclyListed, requestsReceived, requestsSent } from "./repository";
import { SITTER_DASHBOARD, SITTER_SECTIONS } from "./sitter-sections";

/* ------------------------------------------------------- sitter side */

/**
 * Where the visitor's sitter profile stands, as an owner would experience it.
 *
 *   none    no sitter profile has been started on this device;
 *   draft   started, never published;
 *   listed  published AND still publishable — owners find it;
 *   hidden  published, then an essential was removed — owners do NOT find it.
 *
 * `hidden` is the state the old confirmation screen could not see: the
 * `published` flag alone says yes, the search says no. `isPubliclyListed` is
 * the search's own rule, so the two can no longer disagree.
 */
export type SitterVisibility = "none" | "draft" | "listed" | "hidden";

export function sitterVisibility(state: DemoState): SitterVisibility {
  const sitter = state.sitter;
  if (!sitter) return "none";
  if (!sitter.published) return "draft";
  return isPubliclyListed(state, sitter.profile) ? "listed" : "hidden";
}

const IDENTITY = SITTER_SECTIONS.find((section) => section.id === "identity");

/**
 * The next thing a sitter has to do, as an address.
 *
 * A returning sitter is never sent to the introduction again once a profile
 * exists, and never asked again for what the account already holds: an owner
 * who already gave a name and a number goes straight to the area step. Once
 * the join steps are done, the dashboard ("Mon profil") is where the rest is
 * resumed — it names the missing essentials and links to each.
 */
export function sitterResumePath(state: DemoState): string {
  const sitter = state.sitter;
  if (!sitter) return "/sitter/start";
  if (!state.account) return "/sitter/join/name";
  if (!state.account.accountComplete) return "/sitter/join/phone";
  if (IDENTITY && !IDENTITY.isAnswered(sitter.profile)) return "/sitter/join/location";
  return SITTER_DASHBOARD;
}

/**
 * Where a space begins — for the logo, for `/`, for the space switch in
 * Compte and on Home. ONE answer per state (NAV-01).
 *
 * The sitter side begins at its requests only once owners can actually find
 * the profile; until then — and again if it falls out of the results — it
 * begins where the work is.
 */
export function workspaceHome(state: DemoState, workspace: Workspace): string {
  if (workspace === "owner") return "/";
  return sitterVisibility(state) === "listed" ? "/sitter/requests" : sitterResumePath(state);
}

/* ------------------------------------------------------------ badges */

/**
 * The number on a tab: things that are waiting for THIS person, from their own
 * data — never activity invented to pull them back.
 *
 *   owner Demandes   a sitter asked a question and waits for the owner;
 *   sitter Demandes  a request still needs the sitter's decision (and is not
 *                    waiting on an answer from the owner);
 *   Messages         conversations this space has not opened since the other
 *                    side wrote (the count the header used to carry).
 *
 * Zero means no badge.
 */
export function navBadge(state: DemoState, workspace: Workspace, to: string): number {
  switch (to) {
    case "/owner/requests":
      return requestsSent(state).filter((r) => awaitingReplyFrom(r) === "owner").length;
    case "/sitter/requests":
      return requestsReceived(state).filter((r) => r.status === "pending" && awaitingReplyFrom(r) !== "owner")
        .length;
    case MESSAGES_PATH:
      return unreadThreads(state, workspace);
    default:
      return 0;
  }
}

/* ---------------------------------------------------------- messages */

export const MESSAGES_PATH = "/messages";

/** The two views of Messages. The view is part of the ADDRESS (NAV-03): a
    notification opened from the second view comes back to the second view,
    by the Back control and by the browser's Back alike. */
export const MESSAGES_TABS = ["conversations", "notifications"] as const;
export type MessagesTab = (typeof MESSAGES_TABS)[number];

export function messagesTabFrom(params: URLSearchParams): MessagesTab {
  return params.get("tab") === "notifications" ? "notifications" : "conversations";
}

export function messagesPath(tab: MessagesTab): string {
  return tab === "notifications" ? `${MESSAGES_PATH}?tab=notifications` : MESSAGES_PATH;
}

/* ---------------------------------------------------------- requests */

/**
 * The one address of a request's confirmation. The sitter in the path is the
 * request's own sitter — the screen redirects any other combination here
 * (NAV-04), so a hand-assembled link can never show one name in the address
 * and another on the screen.
 */
export function requestSentPath(request: Pick<CareRequest, "id" | "sitterId">): string {
  return `/owner/request/${encodeURIComponent(request.sitterId)}/sent?id=${encodeURIComponent(request.id)}`;
}
