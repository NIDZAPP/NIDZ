/* Audit 1.3.1 — A-02 (confirmed saves) and A-19 (several tabs, one storage).

   Each "tab" is a store created against the SAME fake localStorage, which is
   exactly what two browser tabs of one origin share. */
import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import { emptyPet, type Pet } from "@/data/pets";
import type { CareRequest } from "@/data/types";
import { stableStringify } from "@/state/demo/context";
import { INITIAL_STATE, reducer, type DemoState } from "@/state/demo/reducer";
import { createDemoStore } from "@/state/demo/store";
import { conformTo, pruneDrafts } from "@/hooks/use-form-draft";
import { dateRanges, listOf, oneOf } from "@/hooks/draft-validators";

const KEY = "nidz.demo";
const disk = new Map<string, string>();
let failWrites = false;
let corruptWrites = false;
let corruptOnce = false;
const g = globalThis as unknown as { window?: unknown };

/* Hooks are registered inside a suite: at the top level, node:test would run
   them around every test of every file the harness loads into this process. */
describe("persistence (Audit 1.3.1)", () => {
  beforeEach(() => {
    disk.clear();
    failWrites = false;
    corruptWrites = false;
    corruptOnce = false;
    g.window = {
      localStorage: {
        getItem: (k: string) => disk.get(k) ?? null,
        setItem: (k: string, v: string) => {
          if (failWrites) throw new DOMException("quota", "QuotaExceededError");
          const corrupt = corruptWrites || corruptOnce;
          corruptOnce = false;
          disk.set(k, corrupt ? v.slice(0, -1) : v);
        },
        removeItem: (k: string) => void disk.delete(k),
        get length() {
          return disk.size;
        },
        key: (i: number) => [...disk.keys()][i] ?? null,
      },
    };
  });
  afterEach(() => {
    delete g.window;
  });

  const pet = (id: string, name: string): Pet => ({ ...emptyPet(id, "cat"), name });
  const stored = (): DemoState | null => (disk.has(KEY) ? (JSON.parse(disk.get(KEY)!) as DemoState) : null);

  describe("A-02 — a save is reported only once it is on disk", () => {
    test("a confirmed save is applied and persisted", () => {
      const tab = createDemoStore();
      const result = tab.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      assert.equal(result.ok, true);
      assert.deepEqual(tab.getState().pets.map((p) => p.name), ["Mimi"]);
      assert.deepEqual(stored()?.pets.map((p) => p.name), ["Mimi"]);
    });

    test("a refused write changes nothing and says so", () => {
      const tab = createDemoStore();
      failWrites = true;
      const result = tab.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      assert.deepEqual(result, { ok: false, reason: "storage" });
      assert.equal(tab.getState().pets.length, 0, "the screen must not show what was not saved");
      assert.equal(stored(), null);
    });

    test("a write that does not read back as written is a failure too", () => {
      const tab = createDemoStore();
      corruptWrites = true;
      assert.deepEqual(tab.commit({ type: "savePet", pet: pet("p1", "Mimi") }), { ok: false, reason: "storage" });
      assert.equal(tab.getState().pets.length, 0);
    });

    test("a damaged write is undone, so nothing builds on it", () => {
      const tab = createDemoStore();
      tab.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      const before = disk.get(KEY);
      corruptOnce = true;
      assert.equal(tab.commit({ type: "savePet", pet: pet("p2", "Rex") }).ok, false);
      assert.equal(disk.get(KEY), before, "the previous record is put back");
      assert.deepEqual(createDemoStore().getState().pets.map((p) => p.id), ["p1"]);
    });

    test("a save for a record another tab erased is refused, never 'saved'", () => {
      const a = createDemoStore();
      a.commit({ type: "startSitterProfile", id: "me" });
      createDemoStore().commit({ type: "reset" });
      const r = a.commit((base) => (base.sitter ? { type: "patchSitterProfile", patch: { maxAnimals: 2 } } : null));
      assert.deepEqual(r, { ok: false, reason: "conflict" });
      assert.equal(stored(), null);
    });

    test("retrying after the storage recovers saves the same input", () => {
      const tab = createDemoStore();
      failWrites = true;
      assert.equal(tab.commit({ type: "savePet", pet: pet("p1", "Mimi") }).ok, false);
      failWrites = false;
      assert.equal(tab.commit({ type: "savePet", pet: pet("p1", "Mimi") }).ok, true);
      assert.deepEqual(stored()?.pets.map((p) => p.id), ["p1"]);
    });

    test("several actions are kept together or not at all", () => {
      const tab = createDemoStore();
      failWrites = true;
      const r = tab.commit([
        { type: "savePet", pet: pet("p1", "Mimi") },
        { type: "setNeed", patch: { petId: "p1", species: "cat" } },
      ]);
      assert.equal(r.ok, false);
      assert.equal(tab.getState().pets.length, 0);
      assert.equal(tab.getState().need.petId, null);
    });

    test("view state still moves in memory when storage refuses it", () => {
      const tab = createDemoStore();
      failWrites = true;
      tab.dispatch({ type: "setWorkspace", workspace: "sitter" });
      assert.equal(tab.getState().activeWorkspace, "sitter");
    });

    test("erasing everything is confirmed, and the record is gone", () => {
      const tab = createDemoStore();
      tab.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      const r = tab.commit({ type: "reset" });
      assert.equal(r.ok, true);
      assert.equal(stored(), null);
      assert.equal(tab.getState(), INITIAL_STATE);
    });
  });

  describe("A-19 — tabs never overwrite each other", () => {
    test("two tabs adding different animals keep both", () => {
      const a = createDemoStore();
      const b = createDemoStore(); // opened before A saved anything
      assert.equal(a.commit({ type: "savePet", pet: pet("p1", "Mimi") }).ok, true);
      assert.equal(b.commit({ type: "savePet", pet: pet("p2", "Rex") }).ok, true);
      assert.deepEqual(stored()?.pets.map((p) => p.id), ["p1", "p2"]);
      assert.deepEqual(b.getState().pets.map((p) => p.id), ["p1", "p2"], "B now shows A's animal too");
    });

    test("a stale tab switching workspace does not erase another tab's animal", () => {
      const a = createDemoStore();
      const b = createDemoStore();
      a.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      b.dispatch({ type: "setWorkspace", workspace: "sitter" });
      assert.deepEqual(stored()?.pets.map((p) => p.id), ["p1"]);
    });

    test("which space a tab shows is its own: another tab switching does not flip it", () => {
      const a = createDemoStore();
      a.commit([{ type: "startSitterProfile", id: "me" }]);
      const b = createDemoStore();
      b.dispatch({ type: "setWorkspace", workspace: "sitter" });
      a.syncFromStorage();
      assert.equal(a.getState().activeWorkspace, "owner");
      assert.equal(a.getState().capabilities.sitter, true, "the data itself is still shared");
    });

    test("another tab's write is picked up on sync, keeping this tab's photos", () => {
      const a = createDemoStore();
      a.commit({ type: "savePet", pet: { ...pet("p1", "Mimi"), photoUrl: "blob:mimi" } });
      const b = createDemoStore();
      b.commit({ type: "savePet", pet: pet("p2", "Rex") });
      a.syncFromStorage();
      assert.deepEqual(a.getState().pets.map((p) => p.id), ["p1", "p2"]);
      assert.equal(a.getState().pets[0].photoUrl, "blob:mimi", "an object URL is never lost to a re-read");
      assert.ok(!disk.get(KEY)!.includes("blob:"), "and never written");
    });

    test("editing the same animal in two tabs is a conflict, not a silent overwrite", () => {
      const a = createDemoStore();
      a.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      const b = createDemoStore();
      const watch = (s: DemoState) => s.pets.find((p) => p.id === "p1") ?? null;
      const openedA = stableStringify(watch(a.getState()));
      // B renames first.
      b.commit({ type: "savePet", pet: pet("p1", "Minou") });
      // A saves its own edit, based on what it opened.
      const r = a.commit({ type: "savePet", pet: pet("p1", "Mimine") }, { guard: { watch, expected: openedA } });
      assert.deepEqual(r, { ok: false, reason: "conflict" });
      assert.equal(stored()?.pets[0].name, "Minou", "B's change is still there");
      assert.equal(a.getState().pets[0].name, "Minou", "A now shows what is saved");
      // The visitor chooses to keep their version: an explicit overwrite.
      assert.equal(a.commit({ type: "savePet", pet: pet("p1", "Mimine") }).ok, true);
      assert.equal(stored()?.pets[0].name, "Mimine");
    });

    test("an animal deleted in another tab is not resurrected without asking", () => {
      const a = createDemoStore();
      a.commit({ type: "savePet", pet: pet("p1", "Mimi") });
      const watch = (s: DemoState) => s.pets.find((p) => p.id === "p1") ?? null;
      const openedA = stableStringify(watch(a.getState()));
      createDemoStore().commit({ type: "removePet", id: "p1" });
      const r = a.commit({ type: "savePet", pet: pet("p1", "Mimi 2") }, { guard: { watch, expected: openedA } });
      assert.equal(r.ok, false);
      assert.equal(stored()?.pets.length, 0);
    });

    test("a patch built from the stored profile keeps fields another tab changed", () => {
      const a = createDemoStore();
      a.commit({ type: "startSitterProfile", id: "me" });
      const b = createDemoStore();
      b.commit({ type: "patchSitterProfile", patch: { maxAnimals: 3 } });
      // A, stale, patches only its own field — built from the base it is applied to.
      a.commit((base) => ({ type: "patchSitterProfile", patch: { publicName: "Lina K.", maxAnimals: base.sitter!.profile.maxAnimals } }));
      assert.equal(stored()?.sitter?.profile.maxAnimals, 3);
      assert.equal(stored()?.sitter?.profile.publicName, "Lina K.");
    });

    test("a request decided in one tab cannot be re-decided from another", () => {
      const request = {
        id: "r1",
        createdAt: "2026-01-01T00:00:00Z",
        sitterId: "me",
        pet: { id: "p", name: "Rex", age: "", sex: "unknown", notes: "", species: "cat", details: { neutered: "unknown", indoorOnly: "unknown", goodWithDogs: "unknown", goodWithCats: "unknown", litterNotes: "" } },
        careType: "boarding",
        dates: { start: "2030-01-01", end: "2030-01-03" },
        communeCode: null,
        ownerName: "Lina K.",
        displayedRate: null,
        status: "pending",
        respondedAt: null,
      } as unknown as CareRequest;
      const accepted = reducer(reducer(INITIAL_STATE, { type: "addRequest", request }), {
        type: "respondToRequest",
        id: "r1",
        status: "accepted",
      });
      const again = reducer(accepted, { type: "respondToRequest", id: "r1", status: "declined" });
      assert.equal(again, accepted);
      assert.equal(again.requests[0].status, "accepted");
    });
  });

  describe("A-01 — drafts nobody can reach any more are pruned", () => {
    test("deleted animals, decided requests and old request dates go; the rest stays", () => {
      const rec = (savedAt: string) => JSON.stringify({ v: 2, fields: { x: "1" }, base: null, savedAt });
      const now = new Date().toISOString();
      disk.set("nidz.draft.pet-p1", rec(now));
      disk.set("nidz.draft.pet-gone", rec(now));
      disk.set("nidz.draft.pet-new-", rec(now));
      disk.set("nidz.draft.clarify-r1-owner", rec(now));
      disk.set("nidz.draft.clarify-r2-sitter", rec(now));
      disk.set("nidz.draft.request-when-amina-b-care=walk", rec(now));
      disk.set("nidz.draft.request-when-amina-b-care=boarding", rec("2020-01-01T00:00:00Z"));
      disk.set("nidz.draft.sitter-about", rec("2020-01-01T00:00:00Z"));
      pruneDrafts({ petIds: ["p1"], pendingRequestIds: ["r1"] });
      assert.deepEqual([...disk.keys()].sort(), [
        "nidz.draft.clarify-r1-owner",
        "nidz.draft.pet-new-",
        "nidz.draft.pet-p1",
        "nidz.draft.request-when-amina-b-care=walk",
        "nidz.draft.sitter-about",
      ]);
    });
  });

  describe("A-01 — a draft out of storage is validated before use", () => {
    test("shape is checked against the form's own initial value", () => {
      assert.equal(conformTo(42, ""), null);
      assert.equal(conformTo("Rex", ""), "Rex");
      assert.deepEqual(conformTo({ a: "x", b: 3, extra: true }, { a: "", b: 0 }), { a: "x", b: 3 });
      assert.deepEqual(conformTo({ a: 5 }, { a: "keep" }), { a: "keep" });
      assert.equal(conformTo([{ x: 1 }], []), null, "an empty initial array only takes strings");
    });
    test("closed lists and records are filtered", () => {
      assert.equal(oneOf(["yes", "no"] as const)("maybe"), null);
      assert.deepEqual(listOf(["dog", "cat"] as const)(["cat", "rabbit"]), ["cat"]);
      assert.deepEqual(dateRanges([{ start: "2030-01-02", end: "2030-01-01" }, { start: "2030-01-01", end: "2030-01-02" }, "x"]), [
        { start: "2030-01-01", end: "2030-01-02" },
      ]);
    });
  });
});
