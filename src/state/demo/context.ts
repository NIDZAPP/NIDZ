import { createContext, useContext } from "react";
import type { Dispatch } from "react";

import type { DemoAction, DemoState } from "./reducer";

export type DemoContextValue = {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
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
