import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Back, for a step that can also be arrived at directly.
 *
 * `navigate(-1)` alone is inert on a deep link, and worse after a guard
 * redirect (`<Navigate replace>` consumes the history entry, so a step reached
 * that way has none) — the control renders at full size and does nothing. If
 * the previous entry belongs to another site it silently leaves Nidz instead.
 *
 * So: pop only when this app actually put something behind us, otherwise walk
 * to the step that logically precedes this one.
 */
export function useFlowBack(fallback: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
