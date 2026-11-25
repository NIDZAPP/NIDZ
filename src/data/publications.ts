/* ---------------------------------------------------------------------------
   PUBLISHED CARE REQUESTS AND PROPOSALS (Nidz 1.7 §13.2, §14).

   The second way of finding a sitter. Instead of writing to ONE sitter (a
   direct request, `CareRequest` in types.ts), the owner PUBLISHES what they
   need; nearby sitters see it in their feed and PROPOSE their services; the
   owner stays free to accept one proposal, or none.

   Four things the screens must never blur, and this model keeps apart:

     CarePost   a request posted for every sitter to see — the owner's;
     CareRequest a request addressed to one sitter (unchanged);
     Proposal   a sitter's answer to a post — the sitter's;
     accepted   a post whose owner accepted one proposal. It is an agreement
                between two people to arrange care, NOT a reservation, a
                payment or a guarantee: Nidz holds none of those.

   WHAT A POST CARRIES, AND WHAT IT NEVER DOES. A sitter assessing an
   opportunity needs the animal (as `SharedPet`: no feeding plan, medication,
   vet or emergency contact), the service, the dates and an approximate area —
   a wilaya, and a commune only if the owner gave one. Never a phone number,
   an email, an address or a position: Nidz holds no exact address for anyone,
   and the owner's public identity is a first name and an initial.

   ONE ACCEPTANCE PER POST. Accepting a proposal closes the post to new
   proposals and marks every other pending proposal « non retenue » in the
   same write, so a post can never end up with two accepted sitters (§14.3).

   LOCAL ONLY. Like everything else here this lives in this browser. A post is
   seen by the sitter workspace of THIS device and by the example feed; it is
   not delivered to anybody. Every screen says so.
   ------------------------------------------------------------------------ */

import { CARE_TYPES, type CareType, type DateRange, type SharedPet } from "./types";

export type PostStatus = "open" | "accepted" | "withdrawn" | "cancelled";
export const POST_STATUSES: readonly PostStatus[] = ["open", "accepted", "withdrawn", "cancelled"];

export type CarePost = {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** A copy, like a direct request: editing or deleting the animal later must
      not rewrite what sitters were shown. The private care plan is excluded
      by type. */
  pet: SharedPet;
  /** The saved animal this post was made from, if any — only to offer the
      owner « this animal » again. Never shown to a sitter. */
  petId: string | null;
  careType: CareType;
  dates: DateRange;
  /** The approximate area: a wilaya, always; a commune only if given. */
  wilayaCode: string;
  communeCode: string | null;
  /** Public identity: first name and initial. */
  ownerName: string;
  status: PostStatus;
  acceptedProposalId: string | null;
  /** Fixture posts that populate the example feed. Never the visitor's. */
  isDemoFixture: boolean;
};

/** `outdated`: the owner changed the service or the dates after this
    proposal was made — it was an answer to another request, so it can no
    longer be accepted; the sitter may propose again. */
export type ProposalStatus = "pending" | "accepted" | "declined" | "withdrawn" | "notRetained" | "cancelled" | "outdated";
export const PROPOSAL_STATUSES: readonly ProposalStatus[] = [
  "pending",
  "accepted",
  "declined",
  "withdrawn",
  "notRetained",
  "cancelled",
  "outdated",
];

export type Proposal = {
  id: string;
  postId: string;
  sitterId: string;
  createdAt: string;
  /** The sitter's own words, optional. */
  message: string;
  /** The sitter's declared rate for the post's service when they proposed,
      so the proposal stays truthful if the profile changes. No money moves. */
  displayedRate: { amount: number; careType: CareType } | null;
  status: ProposalStatus;
  respondedAt: string | null;
  /** A proposal written by the demo tools on behalf of an EXAMPLE sitter, so
      an owner can try accepting and declining on one device. Always labelled
      « simulation » wherever it appears. */
  simulated: boolean;
  cancelledBy?: "owner" | "sitter";
};

export const PROPOSAL_MESSAGE_MAX = 600;

/* ------------------------------------------------------------- derivations */

/** A post or request whose care has already started is past: nothing can be
    arranged for it any more. Derived from the dates, never stored — nothing
    happens at the moment a date passes. */
export function isPast(dates: DateRange, todayISO: string): boolean {
  return dates.start < todayISO;
}

/** Open for proposals: published, not withdrawn, not accepted, not past. */
export function acceptsProposals(post: CarePost, todayISO: string): boolean {
  return post.status === "open" && !isPast(post.dates, todayISO);
}

/** An owner may edit a post while nobody has been accepted and it has not
    started. Pending proposals stay attached, and the sitters who sent them
    see the post as it now reads. */
export function canEditPost(post: CarePost, todayISO: string): boolean {
  return !post.isDemoFixture && post.status === "open" && !isPast(post.dates, todayISO);
}

export function proposalsFor(proposals: readonly Proposal[], postId: string): Proposal[] {
  return proposals.filter((p) => p.postId === postId);
}

/** The one proposal by this sitter on this post that is still alive — the
    rule that stops a sitter applying twice (§14.2). A withdrawn proposal does
    not count: withdrawing and proposing again is a real change of mind. */
export function liveProposal(proposals: readonly Proposal[], postId: string, sitterId: string): Proposal | null {
  return (
    proposals.find(
      (p) => p.postId === postId && p.sitterId === sitterId && (p.status === "pending" || p.status === "accepted"),
    ) ?? null
  );
}

/** A request the sitter can still answer: waiting, and its dates not past.
    Once past, nothing can come of an acceptance, so it is neither offered
    nor counted as « waiting for you ». */
export function requestAwaitsSitter(request: { status: string; dates: DateRange }, todayISO: string): boolean {
  return request.status === "pending" && !isPast(request.dates, todayISO);
}

/** A proposal the owner can still decide on: waiting, on a post still open
    and not past. The same rule for the button, the badge and the count. */
export function proposalAwaitsOwner(proposal: Proposal, post: CarePost | null | undefined, todayISO: string): boolean {
  return proposal.status === "pending" && Boolean(post) && post!.status === "open" && !isPast(post!.dates, todayISO);
}

/** The proposal that stops this sitter proposing again on this post: one
    still waiting or accepted, or one the owner DECLINED — a decline is the
    owner's answer to this sitter, final for this post. A proposal the sitter
    withdrew, or one that became outdated when the owner changed the request,
    does not stop a new one. */
export function standingProposal(proposals: readonly Proposal[], postId: string, sitterId: string): Proposal | null {
  return (
    proposals.find(
      (p) =>
        p.postId === postId &&
        p.sitterId === sitterId &&
        (p.status === "pending" || p.status === "accepted" || p.status === "declined"),
    ) ?? null
  );
}

/** The same animal, service and dates already published and still open —
    publishing it again would be a duplicate (§13.2). */
export function duplicateOpenPost(
  posts: readonly CarePost[],
  candidate: Pick<CarePost, "petId" | "careType" | "dates"> & { petName: string },
): CarePost | null {
  return (
    posts.find(
      (p) =>
        !p.isDemoFixture &&
        p.status === "open" &&
        p.careType === candidate.careType &&
        p.dates.start === candidate.dates.start &&
        p.dates.end === candidate.dates.end &&
        (candidate.petId ? p.petId === candidate.petId : p.pet.name === candidate.petName),
    ) ?? null
  );
}

/* ----------------------------------------------------------------- storage */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function restoreProposal(value: unknown): Proposal | null {
  if (!isRecord(value)) return null;
  const { id, postId, sitterId, createdAt, status } = value;
  if (typeof id !== "string" || typeof postId !== "string" || typeof sitterId !== "string") return null;
  if (typeof createdAt !== "string" || !Number.isFinite(Date.parse(createdAt))) return null;
  if (!(PROPOSAL_STATUSES as readonly unknown[]).includes(status)) return null;
  const rate = isRecord(value.displayedRate) ? value.displayedRate : null;
  return {
    id,
    postId,
    sitterId,
    createdAt,
    message: typeof value.message === "string" ? value.message.slice(0, PROPOSAL_MESSAGE_MAX) : "",
    displayedRate:
      rate &&
      typeof rate.amount === "number" &&
      Number.isFinite(rate.amount) &&
      rate.amount >= 0 &&
      (CARE_TYPES as readonly unknown[]).includes(rate.careType)
        ? { amount: rate.amount, careType: rate.careType as CareType }
        : null,
    status: status as ProposalStatus,
    /* Read back as a notification's time: an unparseable date would throw
       in the relative-time formatter. */
    respondedAt:
      typeof value.respondedAt === "string" && Number.isFinite(Date.parse(value.respondedAt)) ? value.respondedAt : null,
    simulated: value.simulated === true,
    cancelledBy: value.cancelledBy === "owner" || value.cancelledBy === "sitter" ? value.cancelledBy : undefined,
  };
}

/** A person's public identity: first name and the initial of the last. */
export function publicNameOf(account: { firstName: string; lastName: string }): string {
  const initial = account.lastName.trim().charAt(0).toUpperCase();
  return initial ? `${account.firstName.trim()} ${initial}.` : account.firstName.trim();
}
