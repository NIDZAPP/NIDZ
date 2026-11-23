/* ---------------------------------------------------------------------------
   THE DEMO STORE — how state reaches storage, and how tabs stay honest.

   Audit 1.3.1 replaced "reduce in memory, then mirror to localStorage from an
   effect" with this, for two defects that design could not fix:

   A-02 — SILENT FAILED SAVES. The mirror ran after the screen had already
   moved on, and it swallowed its own exception. A full quota or blocked
   storage meant a pet that appeared in the list, a "Votre profil est publié"
   screen, and nothing on disk. Now `commit` writes FIRST, confirms the record
   reads back, and only then shows the new state. A refused write changes
   nothing and says so.

   A-19 — TABS OVERWRITING EACH OTHER. Every tab held the whole state in
   memory and wrote the whole state back. A tab opened before another tab
   added an animal would erase that animal on its next save of anything at
   all. Now:

     1. every write is REBASED: the action is applied to what is in storage
        now, not to what this tab last saw, so two tabs adding different
        things both keep theirs. (localStorage has no cross-tab transaction:
        two saves in the same instant, in two tabs, can still race at the
        browser level. Saves a person makes one after the other cannot.)
     2. other tabs' writes are picked up as they happen (`storage` event), so
        a tab does not sit on a stale copy;
     3. a save that would overwrite a record another tab changed since the
        form was opened is refused as a `conflict`, and the visitor decides.

   Pure TypeScript with no React in it, so the rules above are unit-tested
   against a fake storage rather than taken on trust.
   ------------------------------------------------------------------------ */

import {
  UNREADABLE,
  carryTransientFields,
  loadState,
  readStoredRaw,
  reducer,
  stateFromRaw,
  writeState,
  type DemoAction,
  type DemoState,
} from "./reducer";
import { stableStringify, type CommitGuard, type CommitInput, type SaveResult } from "./context";

export type DemoStore = {
  getState: () => DemoState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: DemoAction) => void;
  commit: (input: CommitInput, options?: { guard?: CommitGuard }) => SaveResult;
  /** Re-read storage if another tab wrote since this one last looked. */
  syncFromStorage: () => void;
};

export function createDemoStore(): DemoStore {
  let state = loadState();
  /* The record exactly as this tab last saw it on disk — written by it, or
     read by it. A different string on disk means another tab wrote. */
  let seenRaw = readStoredRaw();
  const listeners = new Set<() => void>();

  const publish = (next: DemoState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
  };

  /** The state an action must be applied to: storage as it is NOW when
      another tab has written, this tab's own state otherwise — which keeps
      view state (a workspace switch) that this tab could not persist. */
  const base = (): DemoState => {
    const raw = readStoredRaw();
    if (raw === UNREADABLE || raw === seenRaw) return state;
    seenRaw = raw;
    const fresh = carryTransientFields(stateFromRaw(raw), state);
    /* Which side a tab is LOOKING AT is that tab's own view, not shared data:
       another tab switching to the sitter space must not flip this one under
       the person reading it — unless that side no longer exists here. */
    const keepView = state.activeWorkspace === "owner" || fresh.capabilities.sitter;
    return fresh.activeWorkspace !== state.activeWorkspace && keepView
      ? { ...fresh, activeWorkspace: state.activeWorkspace }
      : fresh;
  };

  const syncFromStorage = () => publish(base());

  const dispatch = (action: DemoAction) => {
    const from = base();
    const next = reducer(from, action);
    if (next !== from) {
      const written = writeState(next);
      if (written.ok) seenRaw = written.raw;
    }
    publish(next);
  };

  const commit = (input: CommitInput, options: { guard?: CommitGuard } = {}): SaveResult => {
    const from = base();
    /* Whatever happens next, this tab now shows what storage holds. */
    publish(from);

    const guard = options.guard;
    if (guard && stableStringify(guard.watch(from)) !== guard.expected) {
      return { ok: false, reason: "conflict" };
    }

    const produced = typeof input === "function" ? input(from) : input;
    if (produced === null) return { ok: false, reason: "conflict" };
    const actions: readonly DemoAction[] = Array.isArray(produced) ? produced : [produced as DemoAction];
    const next = actions.reduce(reducer, from);
    if (next === from) return { ok: true, state: from };

    const written = writeState(next);
    if (!written.ok) return { ok: false, reason: "storage" };
    seenRaw = written.raw;
    publish(next);
    return { ok: true, state: next };
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch,
    commit,
    syncFromStorage,
  };
}
