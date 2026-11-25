import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { pruneDrafts } from "@/hooks/use-form-draft";

import { DemoContext } from "./context";
import { STORAGE_KEY } from "./reducer";
import { createDemoStore } from "./store";

/**
 * Holds the demo state and keeps it in step with localStorage.
 *
 * Persistence exists so the marketplace loop is demonstrable: an owner sends a
 * request, switches to the sitter side, answers it, and the owner's status
 * changes — across reloads. It stores nothing but what the visitor typed into
 * this browser, and it is never sent anywhere.
 *
 * How a write reaches storage, and why it is confirmed before the screen
 * moves on, is `store.ts`. This component only connects it to React and to
 * the other tabs of this browser.
 */
export default function DemoProvider({ children }: { children: ReactNode }) {
  /* One store per mounted provider, read once from storage on mount. */
  const [store] = useState(createDemoStore);
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  /* Once per start: drafts for an animal or a request that no longer needs
     them (A-01). */
  useEffect(() => {
    const s = store.getState();
    pruneDrafts({
      petIds: s.pets.map((p) => p.id),
      pendingRequestIds: s.requests.filter((r) => r.status === "pending").map((r) => r.id),
    });
  }, [store]);

  useEffect(() => {
    /* Another tab wrote. `storage` fires in every OTHER tab of this origin;
       a null key is `localStorage.clear()`. Unrelated keys — form drafts,
       the language — are ignored. */
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) store.syncFromStorage();
    };
    /* Belt and braces for a tab restored from the back/forward cache or
       woken after the event was missed: a cheap string comparison. */
    const onVisible = () => {
      if (document.visibilityState === "visible") store.syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", store.syncFromStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", store.syncFromStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  /* « Réduire les animations » (Paramètres › Préférences): the same overrides
     as the system setting, applied from the class on <html> (index.css). */
  const reduceMotion = state.preferences.reduceMotion;
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  const value = useMemo(
    () => ({ state, dispatch: store.dispatch, commit: store.commit }),
    [state, store],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
