import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_CRITERIA,
  criteriaToParams,
  matchSitters,
  normalizeCriteria,
  parseCriteria,
  petFit,
  reasonsFor,
  sizeLimitToState,
  type SearchCriteria,
} from "@/data/criteria";
import { DEMO_SITTERS, getDemoSitter } from "@/data/demo-sitters";
import { emptyPet, type Pet } from "@/data/pets";

const c = (patch: Partial<SearchCriteria>): SearchCriteria => ({ ...EMPTY_CRITERIA, ...patch });
const names = (criteria: SearchCriteria) => matchSitters(DEMO_SITTERS, criteria).map((r) => r.sitter.id);
const dog = (size: "small" | "medium" | "large" | null): Pet => {
  const pet = emptyPet("p", "dog");
  return pet.species === "dog" ? { ...pet, details: { ...pet.details, size } } : pet;
};

describe("search criteria", () => {
  test("size and sort round-trip through the URL", () => {
    const criteria = c({ species: "dog", size: "large", care: "walk", sort: "price", wilaya: "alger" });
    assert.deepEqual(parseCriteria(new URLSearchParams(criteriaToParams(criteria))), criteria);
  });
  test("a size without a dog is dropped; a walk is one day", () => {
    assert.equal(normalizeCriteria(c({ species: "cat", size: "large" })).size, null);
    const walk = normalizeCriteria(c({ care: "walk", dates: { start: "2030-01-01", end: "2030-01-05" } }));
    assert.deepEqual(walk.dates, { start: "2030-01-01", end: "2030-01-01" });
  });
  test("unknown values in the URL are ignored, not trusted", () => {
    const parsed = parseCriteria(new URLSearchParams("species=rabbit&size=huge&sort=best&max=42"));
    assert.equal(parsed.species, null);
    assert.equal(parsed.size, null);
    assert.equal(parsed.sort, "default");
    assert.equal(parsed.maxPrice, null);
  });
});

describe("hard constraints", () => {
  test("a large dog excludes sitters who only take smaller dogs", () => {
    const ids = names(c({ species: "dog", size: "large" }));
    assert.ok(!ids.includes("youcef-h") && !ids.includes("karim-b"));
    assert.ok(ids.includes("amina-b"));
  });
  test("an unknown size excludes nobody and is never a reason", () => {
    const criteria = c({ species: "dog" });
    assert.ok(names(criteria).includes("youcef-h"));
    const youcef = getDemoSitter("youcef-h");
    assert.ok(youcef);
    assert.ok(!reasonsFor(youcef, criteria).some((r) => r.kind === "size"));
    assert.deepEqual(sizeLimitToState(youcef, criteria), ["small"]);
  });
  test("a cat search excludes dogs-only sitters and says nothing about dogs", () => {
    const criteria = c({ species: "cat" });
    assert.ok(!names(criteria).includes("amina-b"));
    for (const { sitter } of matchSitters(DEMO_SITTERS, criteria)) {
      assert.ok(reasonsFor(sitter, criteria).every((r) => r.kind !== "size"));
    }
  });
  test("a size reason replaces the generic species reason", () => {
    const amina = getDemoSitter("amina-b");
    assert.ok(amina);
    const kinds = reasonsFor(amina, c({ species: "dog", size: "large" })).map((r) => r.kind);
    assert.ok(kinds.includes("size") && !kinds.includes("species"));
  });
});

describe("order", () => {
  test("default order is alphabetical, never price", () => {
    const ids = matchSitters(DEMO_SITTERS, c({ species: "dog" })).map((r) => r.sitter.publicName);
    assert.deepEqual(ids, [...ids].sort((a, b) => a.localeCompare(b)));
  });
  test("price order applies only with a service (one unit)", () => {
    const byPrice = matchSitters(DEMO_SITTERS, c({ care: "walk", sort: "price" })).map((r) => r.rate.amount);
    assert.deepEqual(byPrice, [...byPrice].sort((a, b) => a - b));
    const noCare = matchSitters(DEMO_SITTERS, c({ sort: "price" })).map((r) => r.sitter.publicName);
    assert.deepEqual(noCare, [...noCare].sort((a, b) => a.localeCompare(b)));
  });
});

describe("petFit", () => {
  const amina = getDemoSitter("amina-b");
  const youcef = getDemoSitter("youcef-h");
  test("species, size, unknown size", () => {
    assert.ok(amina && youcef);
    assert.deepEqual(petFit(emptyPet("c", "cat"), amina), { fits: false, reason: "species" });
    assert.equal(petFit(dog("large"), youcef).fits, false);
    assert.equal(petFit(dog(null), youcef).fits, "unknown");
    assert.equal(petFit(dog(null), amina).fits, true);
    assert.equal(petFit(dog("medium"), amina).fits, true);
  });
});
