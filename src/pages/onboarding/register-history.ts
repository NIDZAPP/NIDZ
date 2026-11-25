/* ---------------------------------------------------------------------------
   The sign-up journey and the browser history (Nidz 1.7 §25).

   Each step of `/register` is a real history entry, so Back walks the steps
   (and the answers are kept: they are a draft). But once the account exists,
   those entries must not stay behind the destination: Back from the request
   that was waiting for the account would land on a finished step, which
   forwards straight back — Back would seem to do nothing.

   So the journey keeps a TRAIL in this tab: the history position of its
   `/register` entry and the last position it saw. Finishing goes back to
   that entry when the chain between them is known to be only the journey's
   own steps; the entry, now signed in, forwards to the destination with a
   replace. History ends as « …, where the person was, the destination ».
   When the chain is not known (a step opened from a bookmark, another page
   pushed in between, storage refused), finishing simply replaces the last
   step, as before.

   sessionStorage: the trail is per tab and means nothing to another one.
   ------------------------------------------------------------------------ */

const TRAIL_KEY = "nidz.register.trail";
const AFTER_KEY = "nidz.register.after";

type Trail = { start: number; last: number; ok: boolean };

/** React Router keeps the position of the entry in `history.state.idx`. */
export function historyIndex(): number | null {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}

function read(): Trail | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(TRAIL_KEY) ?? "null") as Partial<Trail> | null;
    if (!raw || typeof raw.start !== "number" || typeof raw.last !== "number" || typeof raw.ok !== "boolean") return null;
    return { start: raw.start, last: raw.last, ok: raw.ok };
  } catch {
    return null;
  }
}

function write(trail: Trail | null) {
  try {
    if (trail) sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
    else sessionStorage.removeItem(TRAIL_KEY);
  } catch {
    /* Without storage the journey falls back to a plain replace. */
  }
}

/** `/register` (the choice of method) was shown at position `idx`. */
export function markJourneyStart(idx: number | null) {
  write(idx === null ? null : { start: idx, last: idx, ok: true });
}

/** A step was shown at position `idx`. The chain stays known only while each
    entry follows the last one seen or goes back along it. */
export function markJourneyStep(idx: number | null) {
  const trail = read();
  if (!trail) return;
  if (idx === null || idx <= trail.start || idx > trail.last + 1) write({ ...trail, ok: false });
  else write({ ...trail, last: idx });
}

/**
 * How many entries to go back to reach `/register`, or null when the chain
 * is not known — then the caller replaces the current step instead.
 */
export function stepsBackToStart(now: number | null): number | null {
  const trail = read();
  if (!trail || !trail.ok || now === null || now !== trail.last || now <= trail.start) return null;
  return now - trail.start;
}

/** Where `/register` sends the person once the account exists. */
export function setAfterJourney(path: string) {
  try {
    sessionStorage.setItem(AFTER_KEY, path);
  } catch {
    /* ignored: see stepsBackToStart */
  }
}

export function afterJourney(): string | null {
  try {
    const path = sessionStorage.getItem(AFTER_KEY);
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

export function endJourney() {
  write(null);
  try {
    sessionStorage.removeItem(AFTER_KEY);
  } catch {
    /* nothing to clear */
  }
}
