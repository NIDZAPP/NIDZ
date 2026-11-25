import { useCallback, useRef } from "react";

import { useSave, type SaveController } from "@/hooks/use-save";
import type { DemoState } from "@/state/demo/reducer";
import type { CommitInput } from "@/state/demo/context";

/**
 * A one-tap decision that writes user data — accept, decline, withdraw,
 * cancel, block, a preference — under the same rule as a form (Audit 1.3.1
 * A-02): it is written, read back, and only then shown; a refused write
 * keeps the screen where it is with the reason and a retry. Render
 * `<SaveFeedback save={action.save} onRetry={action.retry} />` next to the
 * controls.
 *
 * `watch` names the record the decision is about, so a change made in
 * another tab since this screen opened comes back as a conflict instead of
 * being decided blind. There is no « keep mine » for a decision: the only
 * way on is what is saved.
 */
export function useAction(watch?: (state: DemoState) => unknown): {
  run: (input: CommitInput) => DemoState | null;
  retry: () => void;
  save: SaveController;
} {
  const save = useSave({ watch });
  const last = useRef<CommitInput | null>(null);
  const { save: commitSave } = save;
  const run = useCallback(
    (input: CommitInput) => {
      last.current = input;
      return commitSave(input);
    },
    [commitSave],
  );
  const retry = useCallback(() => {
    if (last.current) commitSave(last.current);
  }, [commitSave]);
  return { run, retry, save };
}
