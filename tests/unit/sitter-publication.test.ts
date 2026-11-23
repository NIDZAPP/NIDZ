import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { canPublish, missingRequired, publishSections, sectionCounts } from "@/data/sitter-sections";
import { emptySitterProfile } from "@/state/demo/reducer";
import type { SitterProfile } from "@/data/types";

const base = (): SitterProfile => ({
  ...emptySitterProfile("me"),
  publicName: "Lina K.",
  communeCode: "hydra",
  headline: { en: "Dogs at home.", fr: "Dogs at home.", ar: "Dogs at home." },
  services: ["walk"],
  rates: { walk: 500 },
  acceptedSpecies: ["cat"],
});

describe("publication minimum", () => {
  test("an empty profile cannot be published", () => {
    assert.equal(canPublish(emptySitterProfile("me")), false);
  });
  test("identity, presentation, priced service and animals are enough for walks", () => {
    assert.equal(canPublish(base()), true);
  });
  test("a service without a price is not enough", () => {
    assert.equal(canPublish({ ...base(), rates: {} }), false);
  });
  test("a dog sitter must state sizes", () => {
    const p = { ...base(), acceptedSpecies: ["dog" as const], acceptedDogSizes: [] };
    assert.deepEqual(missingRequired(p).map((s) => s.id), ["animals"]);
  });
  test("boarding makes the home an essential", () => {
    const boarding = { ...base(), services: ["boarding" as const], rates: { boarding: 900 } };
    assert.deepEqual(missingRequired(boarding).map((s) => s.id), ["housing"]);
    const housed = { ...boarding, housing: { ...boarding.housing, type: "house" as const, outdoor: "yard" as const } };
    assert.equal(canPublish(housed), true);
  });
});

describe("counts", () => {
  test("each group is counted on its own, verification never counted", () => {
    const counts = sectionCounts(base());
    assert.deepEqual(counts.publish, { answered: 4, total: publishSections(base()).length });
    assert.equal(counts.enrich.total, 6);
    assert.equal(counts.enrich.answered, 0);
  });
});
