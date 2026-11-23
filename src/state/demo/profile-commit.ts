import type { SitterProfile } from "@/data/types";

import type { CommitInput } from "./context";
import type { DemoState } from "./reducer";

/**
 * A sitter-profile patch built from the profile it will be applied to.
 *
 * Built at commit time from the state just read back from storage, not from
 * what this tab rendered — so a section that spreads a nested record (the
 * experience answers, the housing) never carries back stale copies of fields
 * another tab changed in the meantime (Audit 1.3.1 A-19).
 */
export function patchProfile(build: (profile: SitterProfile) => Partial<SitterProfile>): CommitInput {
  /* No profile any more (erased in another tab): `null`, refused as a
     conflict — a patch applied to nothing is not a save. */
  return (base: DemoState) =>
    base.sitter ? { type: "patchSitterProfile", patch: build(base.sitter.profile) } : null;
}

/** The part of the saved profile a section overwrites — what its conflict
    check compares. Never the photo: an object URL is not stored, so it would
    always read as changed. */
export function watchProfile<K extends keyof SitterProfile>(keys: readonly K[]) {
  return (s: DemoState): Pick<SitterProfile, K> | null => {
    const p = s.sitter?.profile;
    if (!p) return null;
    return Object.fromEntries(keys.map((k) => [k, p[k]])) as Pick<SitterProfile, K>;
  };
}
