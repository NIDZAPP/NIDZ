import { useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";

import { DemoContext } from "./context";
import { loadState, reducer, saveState } from "./reducer";

/**
 * Holds the demo state and mirrors it into localStorage.
 *
 * Persistence exists so the marketplace loop is demonstrable: an owner sends a
 * request, switches to the sitter side, answers it, and the owner's status
 * changes — across reloads. It stores nothing but what the visitor typed into
 * this browser, and it is never sent anywhere.
 */
export default function DemoProvider({ children }: { children: ReactNode }) {
  /* Lazy init: read storage once, on mount, instead of on every render. */
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const hydrated = useRef(false);

  useEffect(() => {
    /* Skip the mount run. Otherwise every visitor to the home page gets a
       storage record written before they have interacted with anything. */
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
