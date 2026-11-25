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
import { DEMO_POSTS } from "./demo-posts";
import type { CarePost, Proposal } from "./publications";
import type { DemoState } from "@/state/demo/reducer";
import { conversationsFor, type Conversation, type ConversationSide } from "./conversations";

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
  const ownListed = !excludeOwn && own && isPubliclyListed(state, own.profile) ? [own.profile] : [];
  /* A sitter this person blocked is not offered to them again (Nidz 1.7
     §24). Local to this device, like the block itself. */
  const blocked = new Set(state.blockedSitters);
  return [...DEMO_SITTERS, ...ownListed].filter((s) => !blocked.has(s.id));
}

/**
 * Whether a profile may be shown to owners and asked for care: every example,
 * and the visitor's own only while published AND publishable. ONE rule for the
 * search, the public profile page, the request flow and the test tool — a
 * profile that lost an essential after publication (boarding without a home
 * description) must not be reachable by link either (LOT 05 review).
 */
export function isPubliclyListed(state: DemoState, sitter: SitterProfile): boolean {
  if (sitter.isDemoFixture) return true;
  const own = state.sitter;
  /* `hidden` is the sitter's own choice in Paramètres to stop being found,
     without unpublishing or losing anything (Nidz 1.7 §23.1). */
  return Boolean(own && own.profile.id === sitter.id && own.published && !own.hidden && canPublish(own.profile));
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

/* -------------------------------------------------------- conversations */

/**
 * Server: `GET /conversations` — the caller's side only. The owner sees the
 * conversations they started; the sitter, only those addressed to their own
 * profile (an example sitter has nobody to read anything).
 */
export function conversationsOf(state: DemoState, side: ConversationSide): Conversation[] {
  return conversationsFor(state.conversations, side, state.sitter?.profile.id ?? null);
}

/** Server: `GET /conversations/:id` — for its owner or its sitter only. */
export function findConversation(state: DemoState, id: string | null | undefined): Conversation | null {
  return state.conversations.find((c) => c.id === id) ?? null;
}

/** The owner's existing conversation with a sitter, if any: one thread per
    pair, so "Poser une question" twice opens the same one. */
export function conversationWith(state: DemoState, sitterId: string): Conversation | null {
  return state.conversations.find((c) => c.sitterId === sitterId) ?? null;
}

/** Whether anyone on this device can answer as the sitter: only the
    visitor's own profile. */
export function sitterCanAnswer(state: DemoState, sitterId: string): boolean {
  return state.sitter?.profile.id === sitterId;
}

/* ------------------------------------------------ published requests (1.7) */

/**
 * Every published request a sitter can see: the examples, and the ones the
 * visitor published from their owner space on this device.
 *
 * Server: `GET /posts?near=…` — open posts in the sitter's area, without any
 * owner contact detail.
 */
export function feedPosts(state: DemoState): CarePost[] {
  return [...state.posts, ...DEMO_POSTS];
}

/** The posts this account published, as an owner. Server: `GET /me/posts`. */
export function postsPublished(state: DemoState): CarePost[] {
  return state.posts;
}

/** Server: `GET /posts/:id`. */
export function findPost(state: DemoState, id: string | null | undefined): CarePost | null {
  if (!id) return null;
  return state.posts.find((p) => p.id === id) ?? DEMO_POSTS.find((p) => p.id === id) ?? null;
}

/** Proposals on the visitor's own posts — what the owner received.
    Server: `GET /me/posts/proposals`. */
export function proposalsReceived(state: DemoState): Proposal[] {
  const mine = new Set(state.posts.map((p) => p.id));
  return state.proposals.filter((p) => mine.has(p.postId));
}

/** Proposals the visitor's sitter profile sent. Simulated proposals are
    written on behalf of example sitters and are never « sent » by anybody
    here. Server: `GET /me/proposals`. */
export function proposalsSent(state: DemoState): Proposal[] {
  const myId = state.sitter?.profile.id;
  return myId ? state.proposals.filter((p) => p.sitterId === myId && !p.simulated) : [];
}

export function findProposal(state: DemoState, id: string | null | undefined): Proposal | null {
  return id ? (state.proposals.find((p) => p.id === id) ?? null) : null;
}
