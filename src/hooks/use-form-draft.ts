import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

/* ---------------------------------------------------------------------------
   UNSAVED FORM DRAFTS (Audit 1.3 LOT 08, made durable by Audit 1.3.1 A-01).

   A form's state lived in `useState` only — and, for three forms, in
   `sessionStorage`. Reloading, closing the app and coming back, or leaving a
   step for another screen emptied it. Drafts now live in `localStorage`, one
   record per form ("scope"), until the form is saved or the visitor discards
   them, so an unfinished owner or sitter form survives all three.

   What a draft is not: it is not saving. Nothing here reaches the demo state;
   a form's own submit is still the only thing that commits, and a screen that
   shows a restored draft says it is not saved yet (`DraftNotice`).

   Storage is untrusted input, as everywhere in Nidz: every value read back is
   checked against the shape of the form's initial value, and anything that
   does not fit falls back to it. A photo is an object URL that points at
   nothing after a reload, so a `transient` field is kept in memory only — it
   survives moving between screens, never a reload.
   ------------------------------------------------------------------------ */

const PREFIX = "nidz.draft.";
const VERSION = 2;
/** The one field name `useFormDraft` stores its whole object under. */
const WHOLE = "__form";

type DraftRecord = { v: number; fields: Record<string, unknown>; base: string | null; savedAt: string };

/** In-memory values for transient fields, per scope. */
const memory = new Map<string, Map<string, unknown>>();
/** The conflict base a mounted form registered, written with its first field. */
const pendingBase = new Map<string, string>();
/** Forms listening for "start again from what is saved". */
const resetListeners = new Map<string, Set<() => void>>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRecord(scope: string): DraftRecord | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(PREFIX + scope);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as DraftRecord).v === VERSION &&
        typeof (parsed as DraftRecord).fields === "object" &&
        (parsed as DraftRecord).fields !== null
      ) {
        const rec = parsed as DraftRecord;
        return { ...rec, base: typeof rec.base === "string" ? rec.base : null };
      }
      return null;
    }
    /* Audit 1.3 kept three forms' drafts in sessionStorage, as the bare form
       object. Carried over once, so a draft started before this build is not
       lost on the update that was meant to keep drafts longer. */
    const legacy = window.sessionStorage.getItem(PREFIX + scope);
    if (legacy) {
      const value: unknown = JSON.parse(legacy);
      window.sessionStorage.removeItem(PREFIX + scope);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const rec: DraftRecord = { v: VERSION, fields: { [WHOLE]: value }, base: null, savedAt: new Date().toISOString() };
        ls.setItem(PREFIX + scope, JSON.stringify(rec));
        return rec;
      }
    }
  } catch {
    /* unreadable: no draft */
  }
  return null;
}

function writeField(scope: string, field: string, value: unknown): void {
  const ls = storage();
  if (!ls) return;
  try {
    const rec = readRecord(scope) ?? { v: VERSION, fields: {}, base: null, savedAt: "" };
    rec.fields[field] = value;
    rec.base ??= pendingBase.get(scope) ?? null;
    rec.savedAt = new Date().toISOString();
    ls.setItem(PREFIX + scope, JSON.stringify(rec));
  } catch {
    /* Full quota or blocked storage: the form still works, the draft just
       does not outlive the screen. A draft is not a save, so this is not the
       A-02 failure path — submitting is, and it reports its own result. */
  }
}

/** Whether this form has an unsaved draft on disk. */
export function hasDraft(scope: string | null): boolean {
  if (!scope) return false;
  const rec = readRecord(scope);
  return Boolean(rec && Object.keys(rec.fields).length > 0);
}

/** The conflict base persisted with the draft: what the saved data looked like
    when the visitor started typing. */
export function readDraftBase(scope: string | null): string | null {
  return scope ? (readRecord(scope)?.base ?? null) : null;
}

export function registerDraftBase(scope: string | null, base: string | null): void {
  if (!scope) return;
  if (base === null) pendingBase.delete(scope);
  else pendingBase.set(scope, base);
}

/** After a successful save: the draft has become the saved data. */
export function clearDraft(scope: string | null): void {
  if (!scope) return;
  memory.delete(scope);
  try {
    storage()?.removeItem(PREFIX + scope);
  } catch {
    /* nothing stored */
  }
}

/** Throw the draft away AND put the form back to what is saved. */
export function discardDraft(scope: string | null): void {
  if (!scope) return;
  clearDraft(scope);
  for (const listener of resetListeners.get(scope) ?? []) listener();
}

export function onDraftReset(scope: string | null, listener: () => void): () => void {
  if (!scope) return () => {};
  const set = resetListeners.get(scope) ?? new Set();
  set.add(listener);
  resetListeners.set(scope, set);
  return () => set.delete(listener);
}

/* -------------------------------------------------------------- validation */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * A stored value, accepted only if it has the shape of the form's own initial
 * value: same kind, recursively for plain objects (keys from the initial
 * value), and for arrays every element shaped like the initial's first one.
 * An initially EMPTY array has no element to compare with, so only an array
 * of strings is accepted — a field that holds objects there must pass its own
 * `validate`.
 */
export function conformTo<T>(raw: unknown, fallback: T): T | null {
  if (fallback === null) return raw === null || typeof raw === "string" ? (raw as T) : null;
  if (Array.isArray(fallback)) {
    if (!Array.isArray(raw)) return null;
    if (fallback.length === 0) return raw.every((x) => typeof x === "string") ? (raw as T) : null;
    const out: unknown[] = [];
    for (const item of raw) {
      const ok = conformTo(item, fallback[0]);
      if (ok === null) return null;
      out.push(ok);
    }
    return out as T;
  }
  if (isPlainObject(fallback)) {
    if (!isPlainObject(raw)) return null;
    const out: Record<string, unknown> = { ...fallback };
    for (const [key, initialValue] of Object.entries(fallback)) {
      if (!(key in raw)) continue;
      const ok = conformTo(raw[key], initialValue);
      if (ok !== null || initialValue === null) out[key] = ok;
    }
    return out as T;
  }
  return typeof raw === typeof fallback ? (raw as T) : null;
}

const RESET = Symbol("reset");

/**
 * One field of a form, kept as a draft. A drop-in for `useState`.
 *
 * `scope` names the form — every field of one form shares it — and `null`
 * turns drafting off. Nothing is written until the visitor changes something:
 * arriving on a form must not create a draft of its untouched values.
 */
export function useDraftField<T>(
  scope: string | null,
  field: string,
  initial: () => T,
  options: {
    validate?: (raw: unknown, fallback: T) => T | null;
    transient?: boolean;
    /** What actually goes to disk — for a value with parts that must never be
        written (an object URL). */
    serialize?: (value: T) => unknown;
  } = {},
): [T, Dispatch<SetStateAction<T>>] {
  const { validate = conformTo, transient = false } = options;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const serializeRef = useRef(options.serialize);
  serializeRef.current = options.serialize;

  const read = (): T => {
    const fallback = initialRef.current();
    if (!scope) return fallback;
    if (transient) {
      const kept = memory.get(scope);
      return kept?.has(field) ? (kept.get(field) as T) : fallback;
    }
    const rec = readRecord(scope);
    if (!rec || !(field in rec.fields)) return fallback;
    try {
      return validate(rec.fields[field], fallback) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [raw, setRaw] = useState<T | typeof RESET>(read);
  /* Discarded: start again from what is saved, read with THIS render's
     `initial`, which sees the current state. */
  const value: T = raw === RESET ? initialRef.current() : raw;
  if (raw === RESET) setRaw(value);

  useEffect(() => onDraftReset(scope, () => setRaw(RESET)), [scope]);

  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setRaw((prev) => {
        const current = prev === RESET ? initialRef.current() : prev;
        const resolved = typeof next === "function" ? (next as (p: T) => T)(current) : next;
        if (scope) {
          if (transient) {
            const kept = memory.get(scope) ?? new Map<string, unknown>();
            kept.set(field, resolved);
            memory.set(scope, kept);
          } else {
            writeField(scope, field, serializeRef.current ? serializeRef.current(resolved) : resolved);
          }
        }
        return resolved;
      });
    },
    [scope, field, transient],
  );

  return [value, update];
}

/**
 * A whole form object kept as one draft — the original LOT 08 API, now on
 * `localStorage`. `restore` validates what comes back; `transient` fields are
 * held in memory only.
 */
export function useFormDraft<T extends Record<string, unknown>>(
  key: string | null,
  initial: () => T,
  options: { restore?: (raw: unknown, fallback: T) => T | null; transient?: (keyof T)[] } = {},
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const { restore = shallowRestore, transient = [] } = options;
  const transientRef = useRef(transient);
  transientRef.current = transient;

  const [stored, setStored] = useDraftField<T>(key, WHOLE, initial, {
    /* Transient fields never reach the disk, not even for one write. */
    serialize: (value) => {
      const copy: Record<string, unknown> = { ...value };
      for (const f of transientRef.current) delete copy[f as string];
      return copy;
    },
    validate: (raw, fallback) => {
      const restored = restore(raw, fallback);
      if (!restored) return null;
      /* Transient fields come from memory (same session) or the fallback. */
      const kept = key ? memory.get(key) : undefined;
      const out = { ...restored };
      for (const f of transientRef.current) {
        out[f] = (kept?.has(f as string) ? kept.get(f as string) : fallback[f]) as T[keyof T];
      }
      return out;
    },
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (key && transientRef.current.length) {
          const kept = memory.get(key) ?? new Map<string, unknown>();
          for (const f of transientRef.current) kept.set(f as string, resolved[f]);
          memory.set(key, kept);
        }
        return resolved;
      });
    },
    [key, setStored],
  );

  const clear = useCallback(() => clearDraft(key), [key]);

  return [stored, update, clear];
}

/** Keep only fields the initial value has, with the same kind of value. */
function shallowRestore<T extends Record<string, unknown>>(raw: unknown, fallback: T): T | null {
  if (!isPlainObject(raw)) return null;
  const out: Record<string, unknown> = { ...fallback };
  for (const [field, initialValue] of Object.entries(fallback)) {
    const stored = raw[field];
    if (stored === undefined) continue;
    const sameKind =
      (Array.isArray(initialValue) && Array.isArray(stored)) ||
      (initialValue === null && (stored === null || typeof stored === "string")) ||
      (typeof initialValue === typeof stored && !Array.isArray(stored));
    if (sameKind) out[field] = stored;
  }
  return out as T;
}

/** How long a request-dates draft is kept. It is keyed by the request URL, so
    every URL edited leaves one; older than this, nobody is coming back. */
const REQUEST_DRAFT_DAYS = 30;

/**
 * Remove drafts that no screen can reach any more — an animal deleted (in
 * this tab or another), a question on a request already decided, request
 * dates left long ago — so "kept until you save or discard it" stays true
 * for what is left. Run once when the app starts.
 */
export function pruneDrafts(live: { petIds: readonly string[]; pendingRequestIds: readonly string[] }): void {
  const ls = storage();
  if (!ls) return;
  try {
    const cutoff = Date.now() - REQUEST_DRAFT_DAYS * 24 * 60 * 60 * 1000;
    for (let i = ls.length - 1; i >= 0; i--) {
      const key = ls.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const scope = key.slice(PREFIX.length);
      let orphan = false;
      if (scope.startsWith("pet-") && !scope.startsWith("pet-new-")) {
        orphan = !live.petIds.includes(scope.slice("pet-".length));
      } else if (scope.startsWith("clarify-")) {
        const requestId = scope.replace(/^clarify-/, "").replace(/-(owner|sitter)$/, "");
        orphan = !live.pendingRequestIds.includes(requestId);
      } else if (scope.startsWith("request-when-")) {
        const savedAt = Date.parse(readRecord(scope)?.savedAt ?? "");
        orphan = !Number.isFinite(savedAt) || savedAt < cutoff;
      }
      if (orphan) ls.removeItem(key);
    }
  } catch {
    /* storage unreadable: nothing to prune */
  }
}

/** Forget every unsaved form draft — used by the demonstration reset. */
export function clearFormDrafts(): void {
  memory.clear();
  for (const area of ["localStorage", "sessionStorage"] as const) {
    try {
      const store = window[area];
      for (let i = store.length - 1; i >= 0; i--) {
        const k = store.key(i);
        if (k?.startsWith(PREFIX)) store.removeItem(k);
      }
    } catch {
      /* nothing to clear */
    }
  }
}
