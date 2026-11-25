import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearDraft,
  discardDraft,
  hasDraftFromEarlierVisit,
  onDraftReset,
  readDraftBase,
  registerDraftBase,
} from "@/hooks/use-form-draft";
import type { DemoState } from "@/state/demo/reducer";
import {
  stableStringify,
  useDemo,
  type CommitInput,
  type SaveFailureReason,
} from "@/state/demo/context";

export type SaveController = {
  /** Why the last attempt did not save, until the next attempt or discard. */
  failure: SaveFailureReason | null;
  /** Counts failed attempts, so a retry that fails AGAIN is announced again —
      the same `failure` value twice would otherwise render nothing new and
      the retry button would look dead. */
  attempt: number;
  /** The form opened on an unsaved draft from an earlier visit. */
  restored: boolean;
  /** Commit; on success the draft is cleared. Returns the saved state, or
      null when nothing was saved — a caller moves on ONLY on a state (Audit
      1.3.1 A-02). `force` skips the other-tab check, after the visitor chose
      to keep their version. */
  save: (input: CommitInput, options?: { force?: boolean }) => DemoState | null;
  /** Throw the draft away and show what is saved. */
  discard: () => void;
};

/**
 * The save path every form shares.
 *
 * `scope` is the form's draft scope (`useDraftField` / `useFormDraft`).
 * `watch` picks the part of the saved state this form overwrites; the value
 * it had when the visitor started is kept WITH the draft, so a draft resumed
 * after a reload still knows what it was based on. If another tab changed it
 * since, the save is refused as a conflict instead of silently replacing the
 * other tab's work (A-19).
 */
export function useSave({
  scope = null,
  watch,
}: { scope?: string | null; watch?: (state: DemoState) => unknown } = {}): SaveController {
  const { state, commit } = useDemo();
  const stateRef = useRef(state);
  stateRef.current = state;
  const watchRef = useRef(watch);
  watchRef.current = watch;

  const snapshot = (s: DemoState) => (watchRef.current ? stableStringify(watchRef.current(s)) : null);
  const [expected, setExpected] = useState<string | null>(() => readDraftBase(scope) ?? snapshot(state));
  const [failure, setFailure] = useState<SaveFailureReason | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [restored, setRestored] = useState(() => hasDraftFromEarlierVisit(scope));

  /* Written with the draft's first field, so it survives a reload. */
  useEffect(() => {
    registerDraftBase(scope, expected);
    return () => registerDraftBase(scope, null);
  }, [scope, expected]);

  useEffect(
    () =>
      onDraftReset(scope, () => {
        setExpected(snapshot(stateRef.current));
        setFailure(null);
        setRestored(false);
      }),
    [scope],
  );

  const save = useCallback(
    (input: CommitInput, { force = false }: { force?: boolean } = {}) => {
      const guarded = watchRef.current && expected !== null && !force;
      const result = commit(
        input,
        guarded ? { guard: { watch: watchRef.current!, expected: expected! } } : undefined,
      );
      if ("reason" in result) {
        setFailure(result.reason);
        setAttempt((n) => n + 1);
        return null;
      }
      setFailure(null);
      setRestored(false);
      clearDraft(scope);
      setExpected(snapshot(result.state));
      return result.state;
    },
    [commit, expected, scope],
  );

  const discard = useCallback(() => {
    if (scope) discardDraft(scope);
    else {
      setExpected(snapshot(stateRef.current));
      setFailure(null);
    }
  }, [scope]);

  return { failure, attempt, restored, save, discard };
}
