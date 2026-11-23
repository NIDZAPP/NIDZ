/* ---------------------------------------------------------------------------
   THE DATA DOOR (Audit 1.3 LOT 10).

   Every screen that needs a sitter, a request, a review or a care moment asks
   here — and nothing outside this module imports a fixture file. That is the
   seam a backend replaces: the functions below keep their names and their
   result shapes, and their bodies become server queries.

   TODAY — two sources, both in this browser:
     - the fixtures in `demo-sitters.ts`, `demo-reviews.ts`, `demo-portfolio.ts`
       (examples, `isDemoFixture: true`, never real people);
     - the demo state (`src/state/demo/`): the visitor's own sitter profile,
       animals and requests, mirrored into localStorage.

   TOMORROW — see docs/NIDZ-1.3-BACKEND-HANDOFF.md for the endpoint each
   function becomes, who may call it, and what the server must check. The
   signatures here are synchronous because the data is; making them async is
   a change of transport that the screens will have to absorb (loading and
   error states), and the handoff document lists those screens.

   No fake API is written here: nothing pretends to fetch.
   ------------------------------------------------------------------------ */

import { DEMO_PORTFOLIO } from "./demo-portfolio";
import { DEMO_REVIEWS } from "./demo-reviews";
import { DEMO_SITTERS, getDemoSitter } from "./demo-sitters";
import { publicItemsFor } from "./portfolio";
import { reviewsFor } from "./reviews";
import { canPublish } from "./sitter-sections";
import type { CareRequest, SitterProfile } from "./types";
import type { DemoState } from "@/state/demo/reducer";

/* -------------------------------------------------------------- sitters */

/**
 * The sitters an owner can find: the example directory, plus the visitor's
 * own profile once it is published AND still has what publication requires
 * (a published profile that lost an essential is not offered — LOT 05).
 *
 * Server: `GET /sitters?criteria…` returning published, publishable profiles.
 */
export function publicSitters(state: DemoState, { excludeOwn = false } = {}): SitterProfile[] {
  const own = state.sitter;
  const ownListed = !excludeOwn && own?.published && canPublish(own.profile) ? [own.profile] : [];
  return [...DEMO_SITTERS, ...ownListed];
}

/**
 * One profile by id, and whether it is the visitor's own. The visitor's own
 * profile resolves even unpublished, because their preview renders through
 * the same path; screens that serve the PUBLIC check `published` themselves.
 *
 * Server: `GET /sitters/:id` (public) and `GET /me/sitter-profile` (own).
 */
export function findSitter(
  state: DemoState,
  id: string | undefined,
): { sitter: SitterProfile | null; isOwnProfile: boolean } {
  const fixture = getDemoSitter(id);
  if (fixture) return { sitter: fixture, isOwnProfile: false };
  const own = state.sitter;
  if (id && own && own.profile.id === id) return { sitter: own.profile, isOwnProfile: true };
  return { sitter: null, isOwnProfile: false };
}

/**
 * The public name of the sitter a request points at. One implementation:
 * three hand-written copies had drifted on their fallback, and none checked
 * that an own profile was actually the sitter in question.
 */
export function sitterNameFor(state: DemoState, sitterId: string): string {
  const fixture = getDemoSitter(sitterId);
  if (fixture) return fixture.publicName;
  const own = state.sitter?.profile;
  if (own && own.id === sitterId && own.publicName) return own.publicName;
  return sitterId;
}

/* ------------------------------------------------------------- evidence */

/** Reviews of a sitter. Today only fixture EXAMPLES exist (labelled so).
    Server: `GET /sitters/:id/reviews` — only for stays that really happened,
    which needs a "completed" request status that does not exist yet. */
export function sitterReviews(sitterId: string) {
  return reviewsFor(DEMO_REVIEWS, sitterId);
}

/** Care moments a sitter chose to publish. Today fixture examples only.
    Server: `GET /sitters/:id/portfolio` (public items only). */
export function sitterPortfolio(sitterId: string) {
  return publicItemsFor(DEMO_PORTFOLIO, sitterId);
}

/* ------------------------------------------------------------ requests */

/**
 * Requests this account SENT, as an owner. In a single browser every request
 * was sent from here, so today this is all of them.
 *
 * Server: `GET /me/requests?role=owner`.
 */
export function requestsSent(state: DemoState): CareRequest[] {
  return state.requests;
}

/**
 * Requests addressed to THIS account's sitter profile — never the ones sent
 * to example sitters, which nobody answers: offering Accept and Decline on
 * somebody else's behalf would be a fabricated role.
 *
 * Server: `GET /me/requests?role=sitter`.
 */
export function requestsReceived(state: DemoState): CareRequest[] {
  const myId = state.sitter?.profile.id;
  return myId ? state.requests.filter((r) => r.sitterId === myId) : [];
}

/** Server: `GET /requests/:id` — for its owner or its sitter only. */
export function findRequest(state: DemoState, id: string | null | undefined): CareRequest | null {
  return id ? (state.requests.find((r) => r.id === id) ?? null) : null;
}
