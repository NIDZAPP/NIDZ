import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { WORKSPACE_ROOT, type Workspace } from "@/data/workspace";
import { useDemo } from "@/state/demo/context";

/**
 * Switch which side of the account you are looking at.
 *
 * The two halves have to happen together, which is the whole reason this is a
 * hook rather than two lines at each call site: recording the workspace without
 * navigating leaves you on a screen belonging to the other side with the new
 * side's chrome around it, and navigating without recording means the next
 * shared screen — Settings, Help — sends you back to where you were.
 *
 * It changes the view. It does not touch capabilities, and it discards nothing:
 * the other side's pets, requests and profile are exactly where they were.
 */
export function useSwitchWorkspace(): (workspace: Workspace) => void {
  const { dispatch } = useDemo();
  const navigate = useNavigate();

  return useCallback(
    (workspace: Workspace) => {
      dispatch({ type: "setWorkspace", workspace });
      navigate(WORKSPACE_ROOT[workspace]);
    },
    [dispatch, navigate],
  );
}
