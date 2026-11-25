import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_CRITERIA,
  criteriaToParams,
  matchSitters,
  normalizeCriteria,
  parseCriteria,
  petFit,
  proximity,
  reasonsFor,
  splitByDistance,
  type SearchCriteria,
} from "@/data/criteria";
import { compatibility } from "@/data/compatibility";
import { DEMO_SITTERS, getDemoSitter } from "@/data/demo-sitters";
import { emptyPet, type Pet } from "@/data/pets";

const c = (patch: Partial<SearchCriteria>): SearchCriteria => ({ ...EMPTY_CRITERIA, ...patch });
const names = (criteria: SearchCriteria) => matchSitters(DEMO_SITTERS, criteria).map((r) => r.sitter.id);
const withKind = (species: Pet["species"], kindId: string | null, kindOther = ""): Pet =>
  ({ ...emptyPet("p", species), kindId, kindOther }) as Pet;

describe("search criteria", () => {
  test("kind and sort round-trip through the URL", () => {
    const criteria = c({ species: "dog", kind: "dog.sloughi", care: "walk", sort: "price", wilaya: "alger" });
    assert.deepEqual(parseCriteria(new URLSearchParams(criteriaToParams(criteria))), criteria);
  });
  test("a kind of another category is dropped; a walk is one day; a service the animal cannot have is dropped", () => {
    assert.equal(normalizeCriteria(c({ species: "cat", kind: "dog.sloughi" })).kind, null);
    const walk = normalizeCriteria(c({ care: "walk", dates: { start: "2030-01-01", end: "2030-01-05" } }));
    assert.deepEqual(walk.dates, { start: "2030-01-01", end: "2030-01-01" });
    assert.equal(normalizeCriteria(c({ species: "cat", care: "walk" })).care, null);
    assert.equal(normalizeCriteria(c({ species: "fish", care: "boarding" })).care, null);
  });
  test("unknown values in the URL are ignored, not trusted; an old size= is ignored", () => {
    const parsed = parseCriteria(new URLSearchParams("species=unicorn&size=huge&sort=best&max=42&kind=dog.nothing"));
    assert.equal(parsed.species, null);
    assert.equal(parsed.kind, null);
    assert.equal(parsed.sort, "default");
    assert.equal(parsed.maxPrice, null);
    assert.equal("size" in parsed, false);
  });
  test("the thirteen categories are all valid search values", () => {
    for (const species of ["rabbit", "parrot", "snake", "guineaPig"])
      assert.equal(parseCriteria(new URLSearchParams(`species=${species}`)).species, species);
  });
});

describe("hard constraints", () => {
  test("dog size is no longer a filter: a dog search keeps every dog sitter", () => {
    const ids = names(c({ species: "dog" }));
    for (const id of ["amina-b", "karim-b", "youcef-h", "nadia-l", "yasmine-t"]) assert.ok(ids.includes(id), id);
  });
  test("a cat search excludes dogs-only sitters", () => {
    assert.ok(!names(c({ species: "cat" })).includes("amina-b"));
  });
  test("parrots are not birds: a bird sitter is not offered for a parrot", () => {
    assert.ok(names(c({ species: "bird" })).includes("lyna-r"));
    assert.ok(!names(c({ species: "parrot" })).includes("lyna-r"));
    assert.ok(names(c({ species: "parrot" })).includes("mehdi-s"));
  });
  test("a sitter who accepts only some kinds: listed → confirmed, other listed → excluded, unknown → to confirm", () => {
    const mehdi = getDemoSitter("mehdi-s");
    assert.ok(mehdi);
    assert.equal(petFit(withKind("parrot", "bird.grey-parrot"), mehdi).level, "confirmed");
    assert.deepEqual(petFit(withKind("parrot", "parrot.macaw"), mehdi), { level: "incompatible", reason: "kind" });
    assert.deepEqual(petFit(withKind("parrot", null), mehdi), { level: "unknown", reason: "kindNotGiven" });
    assert.deepEqual(petFit(withKind("parrot", null, "Gris"), mehdi), { level: "unknown", reason: "kindFreeText" });
    /* In results: excluded only when the kind is a listed one he does not take. */
    assert.ok(!names(c({ species: "parrot", kind: "parrot.macaw" })).includes("mehdi-s"));
    const unknown = matchSitters(DEMO_SITTERS, c({ species: "parrot" })).find((r) => r.sitter.id === "mehdi-s");
    assert.equal(unknown?.compat.level, "unknown");
  });
  test("an unknown kind is never a reason", () => {
    const mehdi = getDemoSitter("mehdi-s");
    assert.ok(mehdi);
    const kinds = reasonsFor(mehdi, c({ species: "parrot" })).map((r) => r.kind);
    assert.ok(!kinds.includes("kind") && !kinds.includes("species"));
  });
  test("« Autre » is never confirmed for anybody", () => {
    for (const sitter of DEMO_SITTERS) assert.equal(compatibility(sitter, { species: "other", kindId: null }).level, "unknown");
  });
  test("a listed kind accepted by every-kind sitters is a kind reason, not two", () => {
    const amina = getDemoSitter("amina-b");
    assert.ok(amina);
    const kinds = reasonsFor(amina, c({ species: "dog", kind: "dog.sloughi" })).map((r) => r.kind);
    assert.ok(kinds.includes("kind") && !kinds.includes("species"));
  });
});

describe("order", () => {
  test("without a zone, the order is alphabetical, never price", () => {
    const ids = matchSitters(DEMO_SITTERS, c({ species: "dog" })).map((r) => r.sitter.publicName);
    assert.deepEqual(ids, [...ids].sort((a, b) => a.localeCompare(b)));
  });
  test("a zone orders and does not filter: its own sitters first, others after, nearest first", () => {
    const results = matchSitters(DEMO_SITTERS, c({ wilaya: "oran" }));
    assert.equal(results[0].sitter.wilayaCode, "oran");
    assert.ok(results.some((r) => r.sitter.wilayaCode === "alger"));
    const { near, farther } = splitByDistance(results);
    assert.ok(near.every((r) => r.sitter.wilayaCode === "oran"));
    const km = farther.map((r) => r.proximity.km);
    assert.deepEqual(km, [...km].sort((a, b) => a - b));
  });
  test("proximity: commune, then wilaya, then elsewhere; nothing without an origin", () => {
    assert.equal(proximity({ wilayaCode: "alger", communeCode: "hydra" }, { wilayaCode: "alger", communeCode: "hydra" }).tier, 0);
    assert.equal(proximity({ wilayaCode: "alger", communeCode: "hydra" }, { wilayaCode: "alger", communeCode: "kouba" }).tier, 1);
    assert.equal(proximity({ wilayaCode: "alger", communeCode: null }, { wilayaCode: "blida", communeCode: "blida" }).tier, 2);
    assert.equal(proximity(null, { wilayaCode: "alger", communeCode: null }).tier, 3);
    const blida = proximity({ wilayaCode: "alger", communeCode: null }, { wilayaCode: "blida" }).km;
    const oran = proximity({ wilayaCode: "alger", communeCode: null }, { wilayaCode: "oran" }).km;
    assert.ok(blida < oran);
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
  test("category, and dog size no longer decides", () => {
    assert.ok(amina && youcef);
    assert.deepEqual(petFit(emptyPet("c", "cat"), amina), { level: "incompatible", reason: "category" });
    const bigDog = emptyPet("d", "dog");
    if (bigDog.species === "dog") bigDog.details.size = "large";
    assert.equal(petFit(bigDog, youcef).level, "confirmed");
    assert.equal(petFit(emptyPet("d", "dog"), amina).level, "confirmed");
  });
  test("the size limits sitters declared before 1.7 are kept as their own limits", () => {
    const youcef = getDemoSitter("youcef-h");
    assert.ok(youcef?.limits.some((l) => /grande taille/.test(l.fr)));
  });
});
