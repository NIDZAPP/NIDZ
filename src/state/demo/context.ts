import { createContext, useContext } from "react";

import type { DemoAction, DemoState } from "./reducer";

/** Why a save did not happen. Both leave the visitor's input untouched.
 *
 *  - `storage`: the browser refused the write, or the record did not read
 *    back as written (Audit 1.3.1 A-02).
 *  - `conflict`: what this form was about to overwrite changed in another tab
 *    since the form was opened (A-19). Nothing is written until the visitor
 *    chooses whose version wins.
 */
export type SaveFailureReason = "storage" | "conflict";

export type SaveResult = { ok: true; state: DemoState } | { ok: false; reason: SaveFailureReason };

/** One action, several applied atomically, or a function of the state they
    will actually be applied to. The function form matters across tabs: a
    patch built from what THIS tab rendered could carry stale copies of fields
    another tab has since changed, while one built from the freshly read state
    cannot. */
export type CommitInput =
  | DemoAction
  | readonly DemoAction[]
  /* `null`: the record this save was for no longer exists (another tab
     erased it). Refused as a conflict — never reported as saved. */
  | ((base: DemoState) => DemoAction | readonly DemoAction[] | null);

export type CommitGuard = {
  /** The part of the state this save would overwrite. */
  watch: (state: DemoState) => unknown;
  /** `stableStringify(watch(state))` as it was when the form was opened. */
  expected: string;
};

export type DemoContextValue = {
  state: DemoState;
  /**
   * Best effort, for VIEW state only — which side is shown, the intro seen, a
   * request bookmark. Applied in memory even if storage refuses it, because
   * navigation must not break in a browser that cannot persist.
   */
  dispatch: (action: DemoAction) => void;
  /**
   * Transactional, for everything the visitor would call "my data". The new
   * state is shown ONLY once it is confirmed on disk; on failure nothing
   * changes and the caller must say so instead of moving on.
   */
  commit: (input: CommitInput, options?: { guard?: CommitGuard }) => SaveResult;
};

export const DemoContext = createContext<DemoContextValue | null>(null);

/** Throws rather than returning a silent default: a screen reading demo state
    outside the provider is a wiring bug, and a default would hide it behind an
    empty list that looks like a legitimate empty state. */
export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

/**
 * JSON with object keys sorted, so two equal values always produce the same
 * string — a record read back from storage does not keep the key order of the
 * one in memory, and a guard comparing them must not see a change that is not
 * there. `undefined` fields are dropped, as JSON drops them.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .map((k) => [k, (v as Record<string, unknown>)[k]]),
      );
    }
    return v;
  }) ?? "null";
}
