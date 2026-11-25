import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  messagesPath,
  messagesTabFrom,
  navBadge,
  requestSentPath,
  sitterResumePath,
  sitterVisibility,
  workspaceHome,
} from "@/data/navigation";
import { newMessage } from "@/data/clarification";
import { isDestinationActive, workspaceDestinations } from "@/components/layout/workspace-nav";
import { INITIAL_STATE, emptySitterProfile, type DemoAccount, type DemoState } from "@/state/demo/reducer";
import type { CareRequest, SitterProfile } from "@/data/types";

const account = (complete = true): DemoAccount => ({
  firstName: "Lina",
  lastName: "Kaci",
  dateOfBirth: null,
  wilayaId: "alger",
  communeId: null,
  ownedSpecies: [],
  phoneNumber: "",
  accountComplete: complete,
  createdAt: "2026-01-01T00:00:00Z",
});

/** A profile that meets every publication essential (walks only). */
const publishable = (): SitterProfile => ({
  ...emptySitterProfile("me"),
  publicName: "Lina K.",
  wilayaCode: "alger",
  communeCode: "",
  headline: { en: "Dogs at home.", fr: "Dogs at home.", ar: "Dogs at home." },
  services: ["walk"],
  rates: { walk: 500 },
  acceptedSpecies: ["cat"],
});

const withSitter = (profile: SitterProfile, published: boolean, extra: Partial<DemoState> = {}): DemoState => ({
  ...INITIAL_STATE,
  entered: true,
  account: account(),
  capabilities: { owner: true, sitter: true },
  sitter: { profile, published, idDocument: null },
  ...extra,
});

const request = (over: Partial<CareRequest> = {}): CareRequest => ({
  id: "r1",
  createdAt: "2026-01-01T00:00:00Z",
  sitterId: "me",
  pet: { id: "p", name: "Rex", age: "", sex: "unknown", notes: "", species: "cat", details: { neutered: "unknown", goodWithDogs: "unknown", goodWithCats: "unknown", goodWithChildren: "unknown", indoorOnly: "unknown", litterNotes: "" } } as CareRequest["pet"],
  careType: "walk",
  dates: { start: "2030-01-01", end: "2030-01-03" },
  communeCode: null,
  ownerName: "Lina K.",
  displayedRate: { amount: 500, careType: "walk" },
  status: "pending",
  respondedAt: null,
  ...over,
});

describe("sitter visibility (NAV-02)", () => {
  test("no profile, draft, listed", () => {
    assert.equal(sitterVisibility({ ...INITIAL_STATE }), "none");
    assert.equal(sitterVisibility(withSitter(publishable(), false)), "draft");
    assert.equal(sitterVisibility(withSitter(publishable(), true)), "listed");
  });
  test("published but missing an essential is hidden, not listed", () => {
    const lost = { ...publishable(), services: [], rates: {} };
    assert.equal(sitterVisibility(withSitter(lost, true)), "hidden");
  });
});

describe("where the sitter space begins (NAV-01)", () => {
  test("a started, unpublished profile resumes at the dashboard, never the introduction", () => {
    const state = withSitter(publishable(), false);
    assert.equal(workspaceHome(state, "sitter"), "/sitter/profile");
    assert.notEqual(workspaceHome(state, "sitter"), "/sitter/start");
  });
  test("the same draft resolves to the same place from every entry", () => {
    const state = withSitter({ ...emptySitterProfile("me"), publicName: "Lina K.", wilayaCode: "alger" }, false);
    assert.equal(workspaceHome(state, "sitter"), sitterResumePath(state));
    assert.equal(sitterResumePath(state), "/sitter/profile");
  });
  test("an owner account skips the name and phone it already gave", () => {
    const state = withSitter(emptySitterProfile("me"), false);
    assert.equal(sitterResumePath(state), "/sitter/join/location");
  });
  test("join steps in order when the account is missing or incomplete", () => {
    const base = withSitter(emptySitterProfile("me"), false);
    assert.equal(sitterResumePath({ ...base, account: null }), "/sitter/join/name");
    assert.equal(sitterResumePath({ ...base, account: account(false) }), "/sitter/join/phone");
  });
  test("no profile at all: the introduction", () => {
    assert.equal(workspaceHome({ ...INITIAL_STATE }, "sitter"), "/sitter/start");
  });
  test("listed profiles start at their requests; a hidden one where the work is", () => {
    assert.equal(workspaceHome(withSitter(publishable(), true), "sitter"), "/sitter/feed");
    const lost = { ...publishable(), services: [], rates: {} };
    assert.equal(workspaceHome(withSitter(lost, true), "sitter"), "/sitter/profile");
  });
  test("the owner space always begins at Home", () => {
    assert.equal(workspaceHome(withSitter(publishable(), true), "owner"), "/");
  });
});

describe("messages view in the address (NAV-03)", () => {
  test("round trip", () => {
    assert.equal(messagesTabFrom(new URLSearchParams("tab=notifications")), "notifications");
    assert.equal(messagesTabFrom(new URLSearchParams("")), "conversations");
    assert.equal(messagesTabFrom(new URLSearchParams("tab=../../x")), "conversations");
    assert.equal(messagesPath("notifications"), "/messages?tab=notifications");
    assert.equal(messagesPath("conversations"), "/messages");
  });
});

describe("canonical confirmation address (NAV-04)", () => {
  test("names the request's own sitter", () => {
    assert.equal(requestSentPath({ id: "req-1", sitterId: "lina-k" }), "/owner/request/lina-k/sent?id=req-1");
  });
});

describe("tab badges", () => {
  test("owner: questions waiting for the owner only", () => {
    const asked = request({ sitterId: "amina-b", thread: [newMessage("sitter", "Il mange quoi ?")] });
    const state = { ...withSitter(publishable(), true), requests: [asked, request({ id: "r2", sitterId: "amina-b" })] };
    assert.equal(navBadge(state, "owner", "/owner/requests"), 1);
  });
  test("sitter: pending requests to decide, not those waiting on the owner", () => {
    const waiting = request({ id: "r2", thread: [newMessage("sitter", "Une question")] });
    const decided = request({ id: "r3", status: "accepted", respondedAt: "2026-01-02T00:00:00Z" });
    const state = { ...withSitter(publishable(), true), requests: [request(), waiting, decided] };
    assert.equal(navBadge(state, "sitter", "/sitter/requests"), 1);
  });
  test("other destinations carry no number", () => {
    assert.equal(navBadge(withSitter(publishable(), true), "owner", "/account"), 0);
  });
});

describe("tab bars (Nidz 1.7: the same four on both sides)", () => {
  const paths = (ws: "owner" | "sitter", sitterSpace: boolean) =>
    workspaceDestinations(ws, { entered: true, sitterSpace }).map((d) => d.to);

  test("owner: Home, Requests, Messages, Account", () => {
    assert.deepEqual(paths("owner", false), ["/", "/owner/requests", "/messages", "/account"]);
  });
  test("sitter: Home (the feed), Requests, Messages, Account — once a profile exists", () => {
    assert.deepEqual(paths("sitter", true), ["/sitter/feed", "/sitter/requests", "/messages", "/account"]);
    assert.deepEqual(paths("sitter", false), []);
  });
  test("same labels in the same order on both sides", () => {
    const labels = (ws: "owner" | "sitter") => workspaceDestinations(ws, { entered: true, sitterSpace: true }).map((d) => d.labelKey);
    assert.deepEqual(labels("owner"), labels("sitter"));
  });
  test("nothing before the introduction", () => {
    assert.deepEqual(workspaceDestinations("owner", { entered: false, sitterSpace: false }), []);
  });
  test("search, profiles and animals belong to Home; settings, help and the sitter profile to Account", () => {
    const [home, requests, , accountTab] = workspaceDestinations("owner", { entered: true, sitterSpace: false });
    assert.ok(isDestinationActive(home, "/search"));
    assert.ok(isDestinationActive(home, "/sitters/amina-b"));
    assert.ok(!isDestinationActive(home, "/owner/requests"));
    assert.ok(isDestinationActive(requests, "/owner/requests/req-1"));
    assert.ok(isDestinationActive(home, "/owner/pets"));
    assert.ok(isDestinationActive(requests, "/owner/posts/post-1"));
    for (const path of ["/account", "/settings", "/settings/security", "/help", "/policies", "/sitter/profile"]) {
      assert.ok(isDestinationActive(accountTab, path), path);
    }
  });
  test("the sitter's Home holds the feed and each request's detail; not the public profiles", () => {
    const [home] = workspaceDestinations("sitter", { entered: true, sitterSpace: true });
    assert.ok(isDestinationActive(home, "/sitter/feed"));
    assert.ok(isDestinationActive(home, "/sitter/posts/post-1"));
    assert.ok(!isDestinationActive(home, "/sitters/me"));
  });
});
