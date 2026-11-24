/* ---------------------------------------------------------------------------
   WORKSPACES — one account, two ways of using Nidz.

   The single most important thing this module says is what it does NOT
   contain: there is no `role` field.

   A person who boards a neighbour's dog on weekends and also needs someone for
   their own cat in August is one person with one account. Modelling that as a
   mutually exclusive `role: "owner" | "sitter"` forces a false choice at signup,
   makes "become a sitter" a destructive migration of your own account, and
   invites every screen to ask "which kind of user is this?" — a question with
   no honest answer.

   So the account carries CAPABILITIES (what this person can do — both may be
   true) and, separately, an ACTIVE WORKSPACE (what they are looking at right
   now). Switching workspace changes the view. It never changes who you are, and
   it never discards the other side's data.

   This module is deliberately free of React and of storage. Persistence and the
   switch action live in `src/state/demo/`; the navigation model that consumes
   `Workspace` lives in `src/components/layout/`.
   ------------------------------------------------------------------------ */

/** The two ways of using Nidz. Not two kinds of person. */
export type Workspace = "owner" | "sitter";

export const WORKSPACES: readonly Workspace[] = ["owner", "sitter"];

export function isWorkspace(value: unknown): value is Workspace {
  return value === "owner" || value === "sitter";
}

/**
 * What this account is able to do. Both flags may be true at once; that is the
 * whole point of the type.
 *
 * `owner` is granted as soon as someone completes the quick owner account — it
 * costs almost nothing and unlocks sending a request. `sitter` is granted when
 * a sitter profile exists at all, because opening the builder is what opens
 * that side of the account.
 *
 * Do not confuse this with whether a sitter DESTINATION is worth navigating to.
 * That is a narrower question — it needs a *published* profile — and it is
 * answered in `components/layout/workspace-nav.ts`. A capability says what this
 * person may do; navigation says where there is currently something to see.
 */
export type AccountCapabilities = {
  owner: boolean;
  sitter: boolean;
};

/** Frozen: one object is shared by the initial state and by every restore that
    finds nothing, so a single stray mutation would grant a capability to every
    capability-less state at once. Every reducer path spreads rather than
    mutates today; this makes that stay true. */
export const NO_CAPABILITIES: AccountCapabilities = Object.freeze({ owner: false, sitter: false });

export function can(capabilities: AccountCapabilities, workspace: Workspace): boolean {
  return capabilities[workspace];
}

export function hasBothCapabilities(capabilities: AccountCapabilities): boolean {
  return capabilities.owner && capabilities.sitter;
}

/**
 * The workspace a path belongs to, or `null` when the path is shared.
 *
 * `null` is a real answer, not a failure: Settings, Help and Policies are the
 * same screens whichever side you are using, so they follow whatever workspace
 * is active rather than forcing one. Callers resolve that with
 * `resolveWorkspace`.
 *
 * The segment comparison is exact, and it has to be. `"/sitters/amina-b"`
 * starts with `"/sitter"`, so a `startsWith` check would file a PUBLIC SITTER
 * PROFILE — which is a screen owners browse — under the sitter's own private
 * workspace, and hand a visiting owner the sitter's navigation.
 */
export function workspaceForPath(pathname: string): Workspace | null {
  const [first] = pathname.split("/").filter(Boolean);
  switch (first) {
    case "sitter":
      return "sitter";
    /* Search and public profiles are the owner's side of the marketplace: they
       are how an owner discovers a sitter, not part of running a sitter
       business. A sitter previewing their own profile does it from
       `/sitter/...`, which resolves above. */
    case "owner":
    case "search":
    case "sitters":
      return "owner";
    default:
      return null;
  }
}

export function resolveWorkspace(pathname: string, active: Workspace): Workspace {
  return workspaceForPath(pathname) ?? active;
}

/** The other one. Used by the switch control, which must never be a no-op. */
export function otherWorkspace(workspace: Workspace): Workspace {
  return workspace === "owner" ? "sitter" : "owner";
}

/* Where each workspace BEGINS is not a constant: the sitter side begins at its
   requests only once owners can find the profile, and where the work is until
   then. That decision needs the stored state, so it lives with the other
   navigation decisions in `src/data/navigation.ts` (`workspaceHome`) — the
   1.5 constant here sent an unfinished profile to an empty inbox (NAV-01). */
