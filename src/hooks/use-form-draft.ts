import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Form state that survives leaving the screen (Audit 1.3 LOT 08).
 *
 * A form's state lived in `useState` only, so stepping out to Compte to
 * change the language — the one way to change it from a full-screen step —
 * and coming back, or reloading, emptied the form. This keeps an UNSAVED
 * draft in `sessionStorage`, for this tab only, until the form is submitted
 * (`clear`) or the tab is closed.
 *
 * What it is not: it is not saving. Nothing here reaches the demo state or
 * `localStorage`; the form's own submit is still the only thing that commits.
 *
 * Storage is untrusted input, as everywhere in Nidz: `restore` validates what
 * comes back, and anything it rejects falls back to the initial value. Fields
 * named in `transient` (an object URL for a photo, which points at nothing
 * after a reload) are never written.
 */
const PREFIX = "nidz.draft.";

export function useFormDraft<T extends Record<string, unknown>>(
  key: string | null,
  initial: () => T,
  options: { restore?: (raw: unknown, fallback: T) => T | null; transient?: (keyof T)[] } = {},
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const { restore = shallowRestore, transient = [] } = options;
  const keyRef = useRef(key);
  keyRef.current = key;

  const [value, setValue] = useState<T>(() => {
    const fallback = initial();
    if (!key) return fallback;
    try {
      const raw = window.sessionStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      return restore(JSON.parse(raw), fallback) ?? fallback;
    } catch {
      return fallback;
    }
  });

  /* Written only after the visitor has changed something: arriving on a form
     must not create a draft of its untouched initial values. */
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current || !keyRef.current) return;
    try {
      const copy: Record<string, unknown> = { ...value };
      for (const field of transient) delete copy[field as string];
      window.sessionStorage.setItem(PREFIX + keyRef.current, JSON.stringify(copy));
    } catch {
      /* Private mode or a full quota: the form still works, it just does not
         outlive the screen. */
    }
    // `transient` is a constant list per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    touched.current = true;
    setValue(next);
  }, []);

  const clear = useCallback(() => {
    touched.current = false;
    if (!keyRef.current) return;
    try {
      window.sessionStorage.removeItem(PREFIX + keyRef.current);
    } catch {
      /* nothing stored */
    }
  }, []);

  return [value, update, clear];
}

/** Keep only fields the initial value has, with the same kind of value. */
function shallowRestore<T extends Record<string, unknown>>(raw: unknown, fallback: T): T | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const out: Record<string, unknown> = { ...fallback };
  for (const [field, initialValue] of Object.entries(fallback)) {
    const stored = (raw as Record<string, unknown>)[field];
    if (stored === undefined) continue;
    const sameKind =
      (Array.isArray(initialValue) && Array.isArray(stored)) ||
      (initialValue === null && (stored === null || typeof stored === "string")) ||
      (typeof initialValue === typeof stored && !Array.isArray(stored));
    if (sameKind) out[field] = stored;
  }
  return out as T;
}

/** Forget every unsaved form draft — used by the demonstration reset. */
export function clearFormDrafts(): void {
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) window.sessionStorage.removeItem(k);
    }
  } catch {
    /* nothing to clear */
  }
}
