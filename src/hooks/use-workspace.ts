import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { workspaceHome } from "@/data/navigation";
import type { Workspace } from "@/data/workspace";
import { useDemo } from "@/state/demo/context";

/**
 * Switch which side of the account you are looking at.
 *
 * The two halves have to happen together, which is the whole reason this is a
 * hook rather than two lines at each call site: recording the workspace without
 * navigating leaves you on a screen belonging to the other side with the new
 * side's chrome around it, and navigating without recording means the next
 * shared screen — Compte, Messages — follows the side you left.
 *
 * Where it lands is `workspaceHome` — the same answer the logo, `/` and Compte
 * give (NAV-01): a sitter whose profile is not visible yet resumes it rather
 * than opening an empty inbox whose only action restarted the sign-up.
 *
 * It changes the view. It does not touch capabilities, and it discards nothing:
 * the other side's pets, requests and profile are exactly where they were.
 */
export function useSwitchWorkspace(): (workspace: Workspace) => void {
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();

  return useCallback(
    (workspace: Workspace) => {
      dispatch({ type: "setWorkspace", workspace });
      navigate(workspaceHome(state, workspace));
    },
    [dispatch, navigate, state],
  );
}
