import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  profilePathForRequest,
  restoreRequestDraft,
  sitterIdFromRequestPath,
  withPet,
} from "@/data/request-draft";
import { INITIAL_STATE, reducer } from "@/state/demo/reducer";
import type { CareRequest } from "@/data/types";

describe("request paths", () => {
  test("the sitter is read from the summary path only", () => {
    assert.equal(sitterIdFromRequestPath("/owner/request/amina-b?care=boarding"), "amina-b");
    assert.equal(sitterIdFromRequestPath("/owner/request/amina-b/sent?id=1"), null);
    assert.equal(sitterIdFromRequestPath("/owner/requests"), null);
    assert.equal(sitterIdFromRequestPath("/owner/request/%E0%A4%A"), null, "malformed escape does not throw");
  });
  test("the animal is set and cleared without touching the rest", () => {
    assert.equal(withPet("/owner/request/a?care=walk", "p1"), "/owner/request/a?care=walk&pet=p1");
    assert.equal(withPet("/owner/request/a?care=walk&pet=p1", null), "/owner/request/a?care=walk");
  });
  test("Back from an interrupted request goes to that sitter's profile", () => {
    assert.equal(profilePathForRequest("/owner/request/amina-b?care=walk&pet=p1"), "/sitters/amina-b?care=walk");
  });
});

describe("request draft (persistence)", () => {
  test("touching with the same URL returns the same state object", () => {
    const once = reducer(INITIAL_STATE, { type: "touchRequestDraft", sitterId: "amina-b", search: "care=walk" });
    const twice = reducer(once, { type: "touchRequestDraft", sitterId: "amina-b", search: "care=walk" });
    assert.equal(twice, once);
    assert.equal(once.requestDraft?.sitterId, "amina-b");
  });
  test("the pet hand-off is consumed once", () => {
    let s = reducer(INITIAL_STATE, { type: "handoffPet", sitterId: "amina-b", search: "", petId: "p1" });
    assert.equal(s.requestDraft?.petHandoff, "p1");
    s = reducer(s, { type: "consumePetHandoff" });
    assert.equal(s.requestDraft?.petHandoff, null);
    assert.equal(s.requestDraft?.sitterId, "amina-b");
  });
  test("sending clears the draft for that sitter only", () => {
    const s = reducer(INITIAL_STATE, { type: "touchRequestDraft", sitterId: "amina-b", search: "" });
    const other = { id: "r", sitterId: "youcef-h" } as CareRequest;
    assert.ok(reducer(s, { type: "addRequest", request: other }).requestDraft);
    const same = { id: "r2", sitterId: "amina-b" } as CareRequest;
    assert.equal(reducer(s, { type: "addRequest", request: same }).requestDraft, null);
  });
  test("a stored draft is restored only if whole", () => {
    assert.equal(restoreRequestDraft({ sitterId: "", search: "" }), null);
    assert.equal(restoreRequestDraft({ sitterId: "a", search: 3 }), null);
    assert.equal(restoreRequestDraft("x"), null);
    assert.equal(restoreRequestDraft({ sitterId: "a", search: "care=walk" })?.petHandoff, null);
  });
});
