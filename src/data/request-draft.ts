/* ---------------------------------------------------------------------------
   THE REQUEST IN PREPARATION — one owner, one sitter, before anything is sent.

   Audit 1.3 LOT 01. An owner who chose Amina, then had to create an account
   and add an animal, was sent through the generic need flow and landed on the
   results list — the sitter they had picked was gone, and the cheapest result
   was one tap away. This module is what makes the chosen sitter impossible to
   lose.

   ONE SOURCE OF TRUTH: THE REQUEST URL.

     /owner/request/:sitterId?care=…&from=…&to=…&commune=…&pet=…

   The path names the sitter, so no screen can quietly substitute another one.
   The query carries the service, the period, the search zone and the chosen
   animal (a local id — never its name or its needs). Because it is a URL, it
   survives a reload, a guard redirect and the Back button by construction, and
   every detour (account, add an animal, edit an animal) carries it as `next`
   and returns to it.

   The demo state's `need` brief is NOT read silently any more. It only
   pre-fills the service-and-dates step, where the owner sees and confirms it;
   it never decides what is sent.

   WHAT IS PERSISTED, AND WHY IT IS NOT A SECOND SOURCE.

   `RequestDraft` is a bookmark: the last request URL the owner was looking at,
   so the home screen can offer "Votre demande à Amina — reprendre" after they
   wander off. It is written FROM the URL and read only to rebuild a link to
   it. The one field that flows the other way is `petHandoff`, a one-shot
   message from the animal screen ("this is the animal I just added") that the
   summary consumes on arrival and writes into its own URL. It exists so that
   returning from the animal screen can pop history back to the summary
   instead of stacking a second copy of it — which would make Back land on the
   same request with the animal unselected.

   Nothing here is a reservation, and nothing is transmitted anywhere.
   ------------------------------------------------------------------------ */

export type RequestDraft = {
  sitterId: string;
  /** The request URL's query string, exactly as last shown. */
  search: string;
  /** An animal just added or edited from this request, waiting to be selected
      by the summary. Consumed on arrival. */
  petHandoff: string | null;
  updatedAt: string;
};

/** Router `state` on a link from the request summary into the animal screen.
    It tells that screen the entry behind it IS the summary, so saving can pop
    history back to it rather than stacking a second copy. */
export const FROM_REQUEST = { fromRequest: true } as const;

export function cameFromRequest(state: unknown): boolean {
  return typeof state === "object" && state !== null && (state as { fromRequest?: unknown }).fromRequest === true;
}

/** The summary of the request to one sitter. */
export function requestPath(sitterId: string, search = ""): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return `/owner/request/${encodeURIComponent(sitterId)}${query ? `?${query}` : ""}`;
}

/** The service-and-dates step of the same request. */
export function requestWhenPath(sitterId: string, search = ""): string {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return `/owner/request/${encodeURIComponent(sitterId)}/when${query ? `?${query}` : ""}`;
}

/** Split an app path into pathname and query without trusting its shape. */
function splitPath(path: string): { pathname: string; params: URLSearchParams } {
  const url = new URL(path, "http://nidz.local");
  return { pathname: url.pathname, params: url.searchParams };
}

/**
 * The sitter a request path is about, or null if the path is not the request
 * summary. Exact: `/owner/request/amina-b/sent` is the end of a request, not
 * one in preparation, and is not matched.
 */
export function sitterIdFromRequestPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const { pathname } = splitPath(path);
  const match = /^\/owner\/request\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  /* `next` comes from the address bar, and a malformed escape there must not
     throw during render and take the screen down. */
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** The query of a request path, as a string, minus the animal. */
export function requestSearchOf(path: string, { keepPet = true } = {}): string {
  const { params } = splitPath(path);
  if (!keepPet) params.delete("pet");
  return params.toString();
}

/** The same request path with the animal set (or cleared). */
export function withPet(path: string, petId: string | null): string {
  const { pathname, params } = splitPath(path);
  if (petId) params.set("pet", petId);
  else params.delete("pet");
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

/**
 * Where "back" goes from a screen that interrupted a request (sign-in,
 * account): the profile of the sitter the request is for, with the search
 * that led there — never the summary itself, which would bounce straight back
 * through the same guard.
 */
export function profilePathForRequest(path: string | null | undefined): string | null {
  const sitterId = sitterIdFromRequestPath(path);
  if (!sitterId || !path) return null;
  const search = requestSearchOf(path, { keepPet: false });
  return `/sitters/${encodeURIComponent(sitterId)}${search ? `?${search}` : ""}`;
}

/** Storage is untrusted input: a draft is restored only if it is whole. */
export function restoreRequestDraft(value: unknown): RequestDraft | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.sitterId !== "string" || !raw.sitterId) return null;
  if (typeof raw.search !== "string") return null;
  return {
    sitterId: raw.sitterId,
    search: raw.search,
    petHandoff: typeof raw.petHandoff === "string" && raw.petHandoff ? raw.petHandoff : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}
