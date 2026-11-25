import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { emptyPet, forSharing } from "@/data/pets";
import { duplicateOpenPost, liveProposal, type CarePost, type Proposal } from "@/data/publications";
import { feedPosts, proposalsReceived, proposalsSent } from "@/data/repository";
import { INITIAL_STATE, reducer, sizeRestrictionLimit, stateFromRaw, type DemoState } from "@/state/demo/reducer";

/* Nidz 1.7 §13.2–§14: published care requests and proposals, and the
   storage migrations that came with the new animal model. */

const post = (patch: Partial<CarePost> = {}): CarePost => ({
  id: "post-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  pet: forSharing({ ...emptyPet("pet-1", "rabbit"), name: "Noisette" }),
  petId: "pet-1",
  careType: "boarding",
  dates: { start: "2030-01-10", end: "2030-01-12" },
  wilayaCode: "alger",
  communeCode: null,
  ownerName: "Lina K.",
  status: "open",
  acceptedProposalId: null,
  isDemoFixture: false,
  ...patch,
});

const proposal = (id: string, sitterId: string, patch: Partial<Proposal> = {}): Proposal => ({
  id,
  postId: "post-1",
  sitterId,
  createdAt: "2026-01-02T00:00:00.000Z",
  message: "",
  displayedRate: null,
  status: "pending",
  respondedAt: null,
  simulated: false,
  ...patch,
});

const published = (): DemoState => reducer(INITIAL_STATE, { type: "publishPost", post: post() });

describe("publishing", () => {
  test("publishing the same id twice is one post", () => {
    const once = published();
    const twice = reducer(once, { type: "publishPost", post: post() });
    assert.equal(twice.posts.length, 1);
  });
  test("the same animal, service and dates still open is a duplicate", () => {
    const s = published();
    assert.ok(duplicateOpenPost(s.posts, { petId: "pet-1", petName: "Noisette", careType: "boarding", dates: post().dates }));
    assert.equal(duplicateOpenPost(s.posts, { petId: "pet-1", petName: "Noisette", careType: "atOwner", dates: post().dates }), null);
  });
  test("a published post reaches the sitter feed of this device, next to the examples", () => {
    const s = published();
    const feed = feedPosts(s);
    assert.ok(feed.some((p) => p.id === "post-1"));
    assert.ok(feed.some((p) => p.isDemoFixture));
  });
  test("a post never carries the private care plan", () => {
    assert.equal("care" in post().pet, false);
  });
});

describe("proposals", () => {
  test("one live proposal per sitter per post; withdrawing allows proposing again", () => {
    let s = reducer(published(), { type: "addProposal", proposal: proposal("a", "s1") });
    s = reducer(s, { type: "addProposal", proposal: proposal("b", "s1") });
    assert.equal(s.proposals.length, 1);
    s = reducer(s, { type: "withdrawProposal", id: "a" });
    assert.equal(liveProposal(s.proposals, "post-1", "s1"), null);
    s = reducer(s, { type: "addProposal", proposal: proposal("c", "s1") });
    assert.equal(liveProposal(s.proposals, "post-1", "s1")?.id, "c");
  });
  test("accepting one closes the post and marks the others not chosen — never two acceptances", () => {
    let s = reducer(published(), { type: "addProposal", proposal: proposal("a", "s1") });
    s = reducer(s, { type: "addProposal", proposal: proposal("b", "s2") });
    s = reducer(s, { type: "respondToProposal", id: "a", status: "accepted" });
    assert.equal(s.posts[0].status, "accepted");
    assert.equal(s.posts[0].acceptedProposalId, "a");
    assert.equal(s.proposals.find((p) => p.id === "b")?.status, "notRetained");
    const again = reducer(s, { type: "respondToProposal", id: "b", status: "accepted" });
    assert.equal(again.proposals.filter((p) => p.status === "accepted").length, 1);
    /* …and a closed post takes no new proposal. */
    const late = reducer(s, { type: "addProposal", proposal: proposal("c", "s3") });
    assert.equal(late.proposals.length, 2);
  });
  test("declining touches only that proposal", () => {
    let s = reducer(published(), { type: "addProposal", proposal: proposal("a", "s1") });
    s = reducer(s, { type: "respondToProposal", id: "a", status: "declined" });
    assert.equal(s.proposals[0].status, "declined");
    assert.equal(s.posts[0].status, "open");
  });
  test("withdrawing a post closes its waiting proposals", () => {
    let s = reducer(published(), { type: "addProposal", proposal: proposal("a", "s1") });
    s = reducer(s, { type: "withdrawPost", id: "post-1" });
    assert.equal(s.posts[0].status, "withdrawn");
    assert.equal(s.proposals[0].status, "notRetained");
  });
  test("an accepted arrangement can be called off, and says by whom", () => {
    let s = reducer(published(), { type: "addProposal", proposal: proposal("a", "s1") });
    s = reducer(s, { type: "respondToProposal", id: "a", status: "accepted" });
    s = reducer(s, { type: "cancelPostArrangement", postId: "post-1", by: "owner" });
    assert.equal(s.posts[0].status, "cancelled");
    assert.equal(s.proposals[0].status, "cancelled");
    assert.equal(s.proposals[0].cancelledBy, "owner");
  });
  test("received and sent are the two sides of the same proposals; simulations are never « sent »", () => {
    let s: DemoState = { ...published(), sitter: { profile: { id: "me" } as never, published: true, hidden: false, idDocument: null } };
    s = reducer(s, { type: "addProposal", proposal: proposal("a", "me") });
    s = reducer(s, { type: "addProposal", proposal: proposal("b", "amina-b", { simulated: true }) });
    assert.deepEqual(proposalsReceived(s).map((p) => p.id).sort(), ["a", "b"]);
    assert.deepEqual(proposalsSent(s).map((p) => p.id), ["a"]);
  });
});

describe("direct requests: withdraw and cancel", () => {
  const base = (status: "pending" | "accepted"): DemoState => ({
    ...INITIAL_STATE,
    requests: [
      {
        id: "r1",
        createdAt: "2026-01-01T00:00:00Z",
        sitterId: "me",
        pet: forSharing({ ...emptyPet("p", "cat"), name: "Mimi" }),
        careType: "atOwner",
        dates: { start: "2030-01-01", end: "2030-01-03" },
        communeCode: null,
        ownerName: "Lina K.",
        displayedRate: null,
        status,
        respondedAt: null,
      },
    ],
  });
  test("only a waiting request can be withdrawn; only an accepted one cancelled", () => {
    assert.equal(reducer(base("pending"), { type: "withdrawRequest", id: "r1" }).requests[0].status, "withdrawn");
    assert.equal(reducer(base("accepted"), { type: "withdrawRequest", id: "r1" }).requests[0].status, "accepted");
    assert.equal(reducer(base("accepted"), { type: "cancelRequest", id: "r1", by: "sitter" }).requests[0].status, "cancelled");
    assert.equal(reducer(base("pending"), { type: "cancelRequest", id: "r1", by: "sitter" }).requests[0].status, "pending");
  });
});

describe("storage migrations (Nidz 1.7)", () => {
  const v3 = (sitter: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      version: 3,
      entered: true,
      account: { firstName: "Lina", lastName: "K", accountComplete: true, ownedSpecies: [] },
      capabilities: { owner: true, sitter: true },
      sitter: {
        published: true,
        profile: {
          id: "me",
          publicName: "Lina K.",
          services: [],
          rates: {},
          acceptedSpecies: ["dog"],
          limits: [],
          declaredUnavailable: [],
          housing: {},
          ...sitter,
        },
      },
      ...extra,
    });

  test("a pre-1.7 dog-size restriction becomes one of the sitter's limits, never silently dropped", () => {
    const s = stateFromRaw(v3({ acceptedDogSizes: ["small", "medium"] }));
    assert.equal(s.sitter?.profile.limits.length, 1);
    assert.match(s.sitter?.profile.limits[0].fr ?? "", /petite et de moyenne taille/);
    assert.equal("acceptedDogSizes" in (s.sitter?.profile ?? {}), false);
  });
  test("every size accepted is no limit at all", () => {
    assert.equal(sizeRestrictionLimit(["small", "medium", "large"]), null);
    assert.equal(stateFromRaw(v3({ acceptedDogSizes: ["small", "medium", "large"] })).sitter?.profile.limits.length, 0);
  });
  test("an account stored before 1.7 stays signed in; a stored sign-out is respected", () => {
    assert.equal(stateFromRaw(v3({})).signedIn, true);
    assert.equal(stateFromRaw(v3({}, { signedIn: false })).signedIn, false);
  });
  test("an old brief's dog size is not read back", () => {
    const s = stateFromRaw(v3({}, { need: { species: "dog", dogSize: "large" } }));
    assert.equal(s.need.species, "dog");
    assert.equal("dogSize" in s.need, false);
  });
  test("signing out keeps every record", () => {
    const s = stateFromRaw(v3({}));
    const out = reducer(s, { type: "signOut" });
    assert.equal(out.signedIn, false);
    assert.ok(out.account && out.sitter);
    assert.equal(reducer(out, { type: "signIn" }).signedIn, true);
  });
});
