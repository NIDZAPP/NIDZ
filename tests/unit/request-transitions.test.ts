import { after, describe, test } from "node:test";
import assert from "node:assert/strict";

import { awaitingReplyFrom, newMessage, restoreThread } from "@/data/clarification";
import { INITIAL_STATE, loadState, reducer, type DemoState } from "@/state/demo/reducer";
import type { CareRequest } from "@/data/types";

const request: CareRequest = {
  id: "r1",
  createdAt: "2026-01-01T00:00:00Z",
  sitterId: "me",
  pet: { id: "p", name: "Rex", age: "", sex: "unknown", notes: "", species: "dog", details: { size: "medium", neutered: "unknown", goodWithDogs: "unknown", goodWithCats: "unknown", goodWithChildren: "unknown", walksPerDay: null, leashNotes: "" } },
  careType: "boarding",
  dates: { start: "2030-01-01", end: "2030-01-03" },
  communeCode: null,
  ownerName: "Lina K.",
  displayedRate: { amount: 900, careType: "boarding" },
  status: "pending",
  respondedAt: null,
};
const withRequest: DemoState = { ...INITIAL_STATE, requests: [request] };

describe("request transitions", () => {
  test("a question keeps the request pending and its context intact", () => {
    const s = reducer(withRequest, { type: "addClarification", id: "r1", message: newMessage("sitter", "On se voit ?") });
    const r = s.requests[0];
    assert.equal(r.status, "pending");
    assert.equal(r.thread?.length, 1);
    assert.equal(r.pet.name, "Rex");
    assert.deepEqual(r.dates, request.dates);
    assert.equal(awaitingReplyFrom(r), "owner");
  });
  test("only accept / decline change the status", () => {
    const accepted = reducer(withRequest, { type: "respondToRequest", id: "r1", status: "accepted" });
    assert.equal(accepted.requests[0].status, "accepted");
    assert.ok(accepted.requests[0].respondedAt);
  });
  test("no question once decided, and no empty question", () => {
    const declined = reducer(withRequest, { type: "respondToRequest", id: "r1", status: "declined" });
    const after = reducer(declined, { type: "addClarification", id: "r1", message: newMessage("owner", "?") });
    assert.equal(after.requests[0].thread?.length ?? 0, 0);
    const empty = reducer(withRequest, { type: "addClarification", id: "r1", message: newMessage("owner", "   ") });
    assert.equal(empty.requests[0].thread?.length ?? 0, 0);
  });
  test("a stored thread keeps only whole messages", () => {
    const thread = restoreThread([
      { id: "a", author: "sitter", text: "ok", createdAt: "x" },
      { id: "b", author: "admin", text: "no" },
      { id: "c", author: "owner", text: "   " },
      "junk",
    ]);
    assert.deepEqual(thread.map((m) => m.id), ["a"]);
  });
});

describe("storage is untrusted", () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  after(() => {
    delete g.window;
  });

  test("a request with a partial animal is repaired; a bad status is dropped", () => {
    store.set(
      "nidz.demo",
      JSON.stringify({
        version: 3,
        entered: true,
        requests: [
          { ...request, id: "ok", pet: { id: "p", name: "Rex", species: "dog", details: { size: "large" } } },
          { ...request, id: "bad", status: "completed" },
          { ...request, id: "nopet", pet: null },
        ],
      }),
    );
    const s = loadState();
    assert.deepEqual(s.requests.map((r) => r.id), ["ok"]);
    const pet = s.requests[0].pet;
    assert.equal(pet.species === "dog" && pet.details.leashNotes, "");
    assert.ok(!("care" in pet), "the private care plan never rides along");
  });
});

describe("storage hardening (LOT 05–07 review)", () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  const install = () => {
    g.window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
  };
  after(() => {
    delete g.window;
  });

  test("requests with unformattable dates or an unknown service are dropped", () => {
    install();
    store.set(
      "nidz.demo",
      JSON.stringify({
        version: 3,
        requests: [
          { ...request, id: "ok" },
          { ...request, id: "baddate", dates: { start: "soon", end: "later" } },
          { ...request, id: "badcare", careType: "grooming" },
          { ...request, id: "badcreated", createdAt: "yesterday" },
        ],
      }),
    );
    assert.deepEqual(loadState().requests.map((r) => r.id), ["ok"]);
  });

  test("a thread keeps one message per id and never an unparseable date", () => {
    const thread = restoreThread([
      { id: "a", author: "sitter", text: "one", createdAt: "not a date" },
      { id: "a", author: "owner", text: "dup", createdAt: "2026-01-01T00:00:00Z" },
    ]);
    assert.equal(thread.length, 1);
    assert.equal(thread[0].createdAt, "");
  });

  test("a stored sitter with a null commune or a plain-string headline does not crash", () => {
    install();
    store.set(
      "nidz.demo",
      JSON.stringify({
        version: 3,
        sitter: {
          published: true,
          profile: {
            id: "me",
            publicName: "Lina K.",
            communeCode: null,
            headline: "plain string",
            services: [],
            rates: {},
            acceptedSpecies: [],
            acceptedDogSizes: [],
            limits: ["one limit"],
            declaredUnavailable: [],
            housing: {},
          },
        },
      }),
    );
    const s = loadState();
    assert.equal(s.sitter?.profile.communeCode, "");
    assert.equal(s.sitter?.profile.headline.fr, "plain string");
    assert.equal(s.sitter?.profile.limits[0].en, "one limit");
  });
});
