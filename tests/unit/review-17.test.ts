import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { isPublicPath, navBadge, signedOutRedirect } from "@/data/navigation";
import { emptyPet, forSharing } from "@/data/pets";
import { proposalAwaitsOwner, requestAwaitsSitter, restoreProposal, standingProposal, type CarePost, type Proposal } from "@/data/publications";
import { markJourneyStart, markJourneyStep, stepsBackToStart } from "@/pages/onboarding/register-history";
import { INITIAL_STATE, carryTransientFields, reducer, stateFromRaw, type DemoAccount, type DemoState } from "@/state/demo/reducer";

/* Nidz 1.7 — the defects the code review found, each pinned by a test. */

const FUTURE = { start: "2030-01-10", end: "2030-01-12" };
const PAST = { start: "2020-01-10", end: "2020-01-12" };

const post = (patch: Partial<CarePost> = {}): CarePost => ({
  id: "post-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  pet: forSharing({ ...emptyPet("pet-1", "rabbit"), name: "Noisette" }),
  petId: "pet-1",
  careType: "boarding",
  dates: FUTURE,
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

const account: DemoAccount = {
  firstName: "Lina",
  lastName: "Kaci",
  dateOfBirth: null,
  wilayaId: null,
  communeId: null,
  ownedSpecies: [],
  phoneNumber: "550123456",
  accountComplete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  signInMethod: "phone",
};

const withPost = (patch: Partial<CarePost> = {}, proposals: Proposal[] = []): DemoState => ({
  ...INITIAL_STATE,
  posts: [post(patch)],
  proposals,
});

describe("a decline is final for that post", () => {
  test("a declined sitter cannot propose again on the same post", () => {
    let s = withPost({}, [proposal("a", "s1")]);
    s = reducer(s, { type: "respondToProposal", id: "a", status: "declined" });
    s = reducer(s, { type: "addProposal", proposal: proposal("b", "s1") });
    assert.equal(s.proposals.length, 1);
    assert.equal(standingProposal(s.proposals, "post-1", "s1")?.status, "declined");
  });
  test("withdrawing still allows a new proposal", () => {
    let s = withPost({}, [proposal("a", "s1")]);
    s = reducer(s, { type: "withdrawProposal", id: "a" });
    s = reducer(s, { type: "addProposal", proposal: proposal("b", "s1") });
    assert.equal(s.proposals.length, 2);
  });
});

describe("editing a post", () => {
  test("changing the dates makes waiting proposals outdated — they answered another request", () => {
    let s = withPost({}, [proposal("a", "s1"), proposal("b", "s2", { status: "declined" })]);
    s = reducer(s, { type: "updatePost", id: "post-1", patch: { dates: { start: "2030-02-01", end: "2030-02-03" } } });
    assert.equal(s.proposals.find((p) => p.id === "a")?.status, "outdated");
    assert.equal(s.proposals.find((p) => p.id === "b")?.status, "declined");
    /* …and an outdated proposal can no longer be accepted. */
    s = reducer(s, { type: "respondToProposal", id: "a", status: "accepted" });
    assert.equal(s.posts[0].status, "open");
    /* The sitter may propose again on the new request. */
    s = reducer(s, { type: "addProposal", proposal: proposal("c", "s1") });
    assert.equal(s.proposals.filter((p) => p.sitterId === "s1").length, 2);
  });
  test("an edit that changes neither service nor dates keeps them waiting", () => {
    let s = withPost({}, [proposal("a", "s1")]);
    s = reducer(s, { type: "updatePost", id: "post-1", patch: { careType: "boarding" } });
    assert.equal(s.proposals[0].status, "pending");
  });
});

describe("publishing twice from two tabs", () => {
  test("the same request under another id is refused", () => {
    let s = reducer(INITIAL_STATE, { type: "publishPost", post: post() });
    s = reducer(s, { type: "publishPost", post: post({ id: "post-2" }) });
    assert.equal(s.posts.length, 1);
  });
});

describe("past items cannot be decided, nor counted as waiting", () => {
  test("a pending request whose dates are past cannot be accepted", () => {
    const s: DemoState = {
      ...INITIAL_STATE,
      requests: [
        {
          id: "r1",
          createdAt: "2019-12-01T00:00:00Z",
          sitterId: "me",
          pet: forSharing({ ...emptyPet("p", "cat"), name: "Mimi" }),
          careType: "atOwner",
          dates: PAST,
          communeCode: null,
          ownerName: "Lina K.",
          displayedRate: null,
          status: "pending",
          respondedAt: null,
        },
      ],
    };
    assert.equal(requestAwaitsSitter(s.requests[0], "2026-11-25"), false);
    assert.equal(reducer(s, { type: "respondToRequest", id: "r1", status: "accepted" }).requests[0].status, "pending");
  });
  test("a proposal on a past post cannot be accepted, and is not in the owner's badge", () => {
    const s = { ...withPost({ dates: PAST }, [proposal("a", "s1")]), account, signedIn: true };
    assert.equal(proposalAwaitsOwner(s.proposals[0], s.posts[0], "2026-11-25"), false);
    assert.equal(reducer(s, { type: "respondToProposal", id: "a", status: "accepted" }).posts[0].status, "open");
    assert.equal(navBadge(s, "owner", "/owner/requests"), 0);
    const live = { ...withPost({}, [proposal("a", "s1")]), account, signedIn: true };
    assert.equal(navBadge(live, "owner", "/owner/requests"), 1);
  });
});

describe("signing out locks the account's screens", () => {
  const signedOut: DemoState = { ...INITIAL_STATE, account, signedIn: false };
  test("private addresses go to sign-in, carrying where they were", () => {
    for (const path of ["/messages", "/owner/requests/r1", "/owner/account", "/account", "/settings/security", "/sitter/feed", "/owner/request/amina-b"]) {
      const to = signedOutRedirect(signedOut, path, "?x=1");
      assert.ok(to?.startsWith("/login?next="), path);
      assert.equal(decodeURIComponent(to!.split("next=")[1]), `${path}?x=1`);
    }
  });
  test("the way in, the public directory and the help stay open", () => {
    for (const path of ["/", "/welcome", "/register", "/register/code", "/login", "/search", "/sitters/amina-b", "/sitter/amina-b", "/help", "/policies"]) {
      assert.ok(isPublicPath(path), path);
      assert.equal(signedOutRedirect(signedOut, path), null, path);
    }
    assert.equal(isPublicPath("/sitter/feed"), false);
  });
  test("no redirect with a session, or with no account at all", () => {
    assert.equal(signedOutRedirect({ ...signedOut, signedIn: true }, "/messages"), null);
    assert.equal(signedOutRedirect(INITIAL_STATE, "/messages"), null);
  });
  test("editing the account does not sign a signed-out device back in", () => {
    const after = reducer(signedOut, { type: "setAccount", account: { ...account, firstName: "Lyna" } });
    assert.equal(after.signedIn, false);
    const created = reducer(INITIAL_STATE, { type: "setAccount", account });
    assert.equal(created.signedIn, true);
  });
});

describe("photos across tabs", () => {
  test("a stored photo removed in another tab does not come back from this tab's memory", () => {
    const pet = { ...emptyPet("p1", "cat"), name: "Mimi" };
    const current: DemoState = { ...INITIAL_STATE, pets: [{ ...pet, photoUrl: "data:image/jpeg;base64,AAAA" }] };
    const fresh: DemoState = { ...INITIAL_STATE, pets: [{ ...pet, photoUrl: undefined }] };
    assert.equal(carryTransientFields(fresh, current).pets[0].photoUrl, undefined);
    const transient: DemoState = { ...INITIAL_STATE, pets: [{ ...pet, photoUrl: "blob:http://x/1" }] };
    assert.equal(carryTransientFields(fresh, transient).pets[0].photoUrl, "blob:http://x/1");
  });
});

describe("storage validation", () => {
  test("a stored rate must name a real service; an unparseable answer time is dropped", () => {
    const p = restoreProposal({ ...proposal("a", "s1"), displayedRate: { amount: 500, careType: "teleport" }, respondedAt: "yesterday" });
    assert.equal(p?.displayedRate, null);
    assert.equal(p?.respondedAt, null);
  });
  test("one corrupt post costs that post, not the list", () => {
    const s = stateFromRaw(JSON.stringify({ version: 4, entered: true, posts: [post(), 42] }));
    assert.equal(s.posts.length, 1);
  });
});

describe("sign-up history (register-history)", () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as Record<string, unknown>;
  g.sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  test("a contiguous journey goes back to its start; a broken chain does not", () => {
    markJourneyStart(3);
    markJourneyStep(4);
    markJourneyStep(5);
    markJourneyStep(4); // Back
    markJourneyStep(5); // forward again
    markJourneyStep(6);
    assert.equal(stepsBackToStart(6), 3);
    /* Something else was pushed between two steps. */
    markJourneyStart(3);
    markJourneyStep(4);
    markJourneyStep(7);
    assert.equal(stepsBackToStart(7), null);
    /* Finishing from a position the trail did not see. */
    markJourneyStart(3);
    markJourneyStep(4);
    assert.equal(stepsBackToStart(9), null);
  });
});
