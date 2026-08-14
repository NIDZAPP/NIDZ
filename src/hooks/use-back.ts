import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Back, for any screen that can also be arrived at directly.
 *
 * `navigate(-1)` alone is inert on a deep link, and worse after a guard
 * redirect (`<Navigate replace>` consumes the history entry, so a screen
 * reached that way has none) — the control renders at full size and does
 * nothing. If the previous entry belongs to another site it silently leaves
 * Nidz instead.
 *
 * So: pop only when this app actually put something behind us, otherwise walk
 * to the screen that logically precedes this one.
 *
 * `fallback` is passed per screen rather than looked up in a central route
 * table on purpose. The logical parent of a screen is a property OF that
 * screen — a sitter profile came from search, a pet detail came from the pet
 * list — and a central map is one more thing to forget to update when a route
 * moves. Passing it at the call site means a missing parent is a missing
 * argument, which the compiler catches.
 *
 * Named `useBack`, not `useFlowBack`: Audit 1.2 gives browsable screens a back
 * affordance too (§86), so this is no longer only a wizard concern.
 */
export function useBack(fallback: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
