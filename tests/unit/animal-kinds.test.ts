import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ANIMAL_KINDS, getKind, searchKinds } from "@/data/animal-kinds";
import { EMPTY_CRITERIA, matchSitters, petFit, type SearchCriteria } from "@/data/criteria";
import { DEMO_SITTERS } from "@/data/demo-sitters";
import { emptyPet, kindLabel, restorePet, withSpecies, type Pet } from "@/data/pets";
import { SPECIES } from "@/data/types";

/* Nidz 1.4 step 3 — the animal classification has two levels: the category
   (dog, cat, bird), which matching reads, and the kind (breed, species),
   which it never does. These tests hold the second half of that sentence. */

const c = (patch: Partial<SearchCriteria>): SearchCriteria => ({ ...EMPTY_CRITERIA, ...patch });
const ids = (criteria: SearchCriteria) => matchSitters(DEMO_SITTERS, criteria).map((r) => r.sitter.id);

describe("animal kinds", () => {
  test("every category has kinds, and every id is unique and prefixed by its category", () => {
    const all = SPECIES.flatMap((s) => ANIMAL_KINDS[s].map((k) => ({ s, id: k.id })));
    assert.equal(new Set(all.map((k) => k.id)).size, all.length);
    for (const { s, id } of all) assert.ok(id.startsWith(`${s}.`), id);
    for (const s of SPECIES) assert.ok(ANIMAL_KINDS[s].length > 0);
  });

  test("every kind is named in all three languages", () => {
    for (const s of SPECIES)
      for (const k of ANIMAL_KINDS[s]) for (const lng of ["fr", "en", "ar"] as const) assert.ok(k.name[lng].trim(), `${k.id} ${lng}`);
  });

  test("a kind only belongs to its own category", () => {
    assert.equal(getKind("dog.sloughi", "dog")?.id, "dog.sloughi");
    assert.equal(getKind("dog.sloughi", "cat"), null);
    assert.equal(getKind("nonsense", "dog"), null);
  });

  test("search ignores case and accents and reads every language and alias", () => {
    assert.ok(searchKinds("dog", "MALINOIS").some((k) => k.id === "dog.malinois"));
    assert.ok(searchKinds("dog", "aidi").some((k) => k.id === "dog.aidi"));
    assert.ok(searchKinds("bird", "maknine").some((k) => k.id === "bird.goldfinch"));
    assert.ok(searchKinds("cat", "فارسي").some((k) => k.id === "cat.persian"));
    assert.equal(searchKinds("dog", "zzzz").length, 0);
  });

  test("matching never reads the kind: the same sitters, with or without a breed", () => {
    for (const species of SPECIES) {
      const base = ids(c({ species }));
      for (const kind of ANIMAL_KINDS[species]) {
        const pet = { ...emptyPet("p", species), kindId: kind.id } as Pet;
        assert.deepEqual(ids(c({ species })), base, kind.id);
        for (const sitter of DEMO_SITTERS) {
          assert.deepEqual(petFit(pet, sitter), petFit(emptyPet("p", species), sitter), `${kind.id} / ${sitter.id}`);
        }
      }
    }
  });

  test("the matching module does not import the kinds at all", () => {
    const source = readFileSync(new URL("../../src/data/criteria.ts", import.meta.url), "utf8");
    assert.ok(!/animal-kinds/.test(source));
  });
});

describe("pets carry their kind", () => {
  test("a new pet has none; changing species clears it", () => {
    const dog = { ...emptyPet("p", "dog"), kindId: "dog.sloughi" } as Pet;
    assert.equal(emptyPet("p", "cat").kindId, null);
    const cat = withSpecies(dog, "cat");
    assert.equal(cat.kindId, null);
    assert.equal(cat.kindOther, "");
  });

  test("a stored id from another category is dropped, not shown as a breed", () => {
    const pet = restorePet({ id: "p", species: "cat", name: "Mimi", kindId: "dog.sloughi" });
    assert.equal(pet?.kindId, null);
  });

  test("a pre-1.4 bird keeps its free-text species, moved to kindOther", () => {
    const pet = restorePet({ id: "b", species: "bird", name: "Coco", details: { kind: "Perruche" } });
    assert.equal(pet?.kindOther, "Perruche");
    assert.equal(pet && kindLabel(pet, "fr"), "Perruche");
  });

  test("the label is the listed name in the interface language, else the owner's words", () => {
    const listed = { ...emptyPet("p", "bird"), kindId: "bird.goldfinch" } as Pet;
    assert.equal(kindLabel(listed, "fr"), "Chardonneret élégant");
    assert.equal(kindLabel(listed, "en"), "European goldfinch");
    const other = { ...emptyPet("p", "dog"), kindOther: "Shar-pei" } as Pet;
    assert.equal(kindLabel(other, "fr"), "Shar-pei");
    assert.equal(kindLabel(emptyPet("p", "cat"), "fr"), null);
  });
});
