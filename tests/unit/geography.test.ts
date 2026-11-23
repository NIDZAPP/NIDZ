/* Audit 1.3.1 — the commune dataset, and the one location rule every form
   applies. Counts are those stated by the law that last drew each wilaya:
   loi 26-06 (JO n° 25, 2026), loi 19-12 (JO n° 78, 2019), otherwise the 1984
   division. */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  COMMUNES,
  WILAYAS,
  checkLocation,
  communesOf,
  getCommune,
  hasCommuneCoverage,
  normalizeCommuneId,
  placeName,
  searchCommunes,
  wilayaOfPlace,
} from "@/data/algeria";
import { canPublish } from "@/data/sitter-sections";
import { emptySitterProfile, loadState } from "@/state/demo/reducer";
import type { SitterProfile } from "@/data/types";

const EXPECTED: Record<string, number> = {
  // loi 26-06 — the ten parents and the eleven new wilayas
  laghouat: 12, batna: 53, biskra: 22, tebessa: 24, tlemcen: 49, tiaret: 36, djelfa: 18, medea: 43, msila: 24, "el-bayadh": 15,
  aflou: 12, barika: 8, "el-kantara": 5, "bir-el-ater": 4, "el-aricha": 4, "ksar-chellala": 6, "ain-oussera": 10, messaad: 8,
  "ksar-el-boukhari": 21, "bou-saada": 23, "el-abiodh-sidi-cheikh": 7,
  // loi 19-12 — parents still as it left them, and the ten 2019 wilayas
  adrar: 16, bechar: 11, tamanrasset: 5, ouargla: 7, illizi: 4, "el-oued": 22, ghardaia: 10,
  timimoun: 10, "bordj-badji-mokhtar": 2, "ouled-djellal": 6, "beni-abbes": 10, "in-salah": 3, "in-guezzam": 2, touggourt: 14,
  djanet: 2, "el-meghaier": 8, "el-menia": 3,
  // untouched since 1984
  chlef: 35, "oum-el-bouaghi": 29, bejaia: 52, blida: 25, bouira: 45, "tizi-ouzou": 67, alger: 57, jijel: 28, setif: 60,
  saida: 16, skikda: 38, "sidi-bel-abbes": 52, annaba: 12, guelma: 34, constantine: 12, mostaganem: 32, mascara: 47, oran: 26,
  "bordj-bou-arreridj": 34, boumerdes: 32, "el-tarf": 24, tindouf: 2, tissemsilt: 22, khenchela: 21, "souk-ahras": 26, tipaza: 28,
  mila: 32, "ain-defla": 36, naama: 12, "ain-temouchent": 28, relizane: 38,
};

describe("commune dataset", () => {
  test("69 wilayas, 1 541 communes, as both laws state in their article 3", () => {
    assert.equal(WILAYAS.length, 69);
    assert.equal(COMMUNES.length, 1541);
    assert.equal(Object.values(EXPECTED).reduce((a, b) => a + b, 0), 1541);
  });
  test("every wilaya has its communes, in the count its law gives", () => {
    for (const w of WILAYAS) {
      assert.equal(communesOf(w.id).length, EXPECTED[w.id], w.id);
      assert.equal(hasCommuneCoverage(w.id), true, w.id);
    }
  });
  test("ids are unique, every commune names a real wilaya, and every name is filled in", () => {
    assert.equal(new Set(COMMUNES.map((c) => c.id)).size, COMMUNES.length);
    const wilayaIds = new Set(WILAYAS.map((w) => w.id));
    for (const c of COMMUNES) {
      assert.ok(wilayaIds.has(c.wilayaId), c.id);
      assert.ok(c.name.fr.trim() && c.name.ar.trim(), c.id);
      assert.equal(c.name.en, c.name.fr);
      assert.ok(!/\s{2}/.test(c.name.fr + c.name.ar), `double space in ${c.id}`);
    }
  });
  test("ids saved before the dataset grew still resolve, unchanged", () => {
    for (const [id, wilaya] of [
      ["hydra", "alger"], ["el-biar", "alger"], ["kouba", "alger"], ["bab-ezzouar", "alger"], ["cheraga", "alger"],
      ["oran", "oran"], ["bejaia", "bejaia"], ["setif", "setif"], ["ain-benian", "alger"],
    ]) {
      assert.equal(getCommune(id)?.wilayaId, wilaya, id);
    }
    assert.equal(normalizeCommuneId("elBiar"), "el-biar");
    assert.equal(normalizeCommuneId("oran-centre"), "oran");
  });
  test("communes reassigned by the laws sit under their new wilaya", () => {
    const where = (name: string) => COMMUNES.filter((c) => c.name.fr === name).map((c) => c.wilayaId);
    assert.deepEqual(where("Barika"), ["barika"]);
    assert.deepEqual(where("Bou Saada"), ["bou-saada"]);
    assert.deepEqual(where("Tabelbala"), ["beni-abbes"], "loi 19-12, art. 52 bis 3");
    assert.deepEqual(where("El Borma"), ["touggourt"], "loi 19-12, art. 52 bis 6");
    assert.deepEqual(where("Hassi Fehal"), ["el-menia"]);
  });
  test("a commune is findable without accents, in its wilaya", () => {
    assert.ok(searchCommunes("ain ouessara", "ain-oussera").some((c) => c.name.fr === "Aïn Ouessara"));
    assert.equal(searchCommunes("hydra", "oran").length, 0);
  });
});

describe("one location rule for every form", () => {
  test("the commune is optional for every wilaya", () => {
    for (const w of WILAYAS) assert.equal(checkLocation({ wilayaCode: w.id, communeCode: null }, { wilayaRequired: true }), null);
  });
  test("the wilaya is required where the form says so", () => {
    assert.equal(checkLocation({ wilayaCode: null, communeCode: null }, { wilayaRequired: true }), "wilayaRequired");
    assert.equal(checkLocation({ wilayaCode: null, communeCode: null }, { wilayaRequired: false }), null);
  });
  test("nothing that names no place, or a commune of another wilaya", () => {
    assert.equal(checkLocation({ wilayaCode: "atlantis", communeCode: null }, { wilayaRequired: true }), "unknownWilaya");
    assert.equal(checkLocation({ wilayaCode: "oran", communeCode: "hydra" }, { wilayaRequired: true }), "communeOutsideWilaya");
    assert.equal(checkLocation({ wilayaCode: null, communeCode: "hydra" }, { wilayaRequired: false }), "communeOutsideWilaya");
    assert.equal(checkLocation({ wilayaCode: "alger", communeCode: "hydra" }, { wilayaRequired: true }), null);
  });
});

describe("a sitter located by wilaya only", () => {
  const sitter = (): SitterProfile => ({
    ...emptySitterProfile("me"),
    publicName: "Lina K.",
    wilayaCode: "aflou",
    communeCode: "",
    headline: { en: "Cats at home.", fr: "Cats at home.", ar: "Cats at home." },
    services: ["walk"],
    rates: { walk: 500 },
    acceptedSpecies: ["cat"],
  });
  test("can publish — registration is not blocked by the commune", () => {
    assert.equal(canPublish(sitter()), true);
  });
  test("is shown at the precision given", () => {
    assert.equal(placeName(sitter(), "fr"), "Aflou");
    assert.equal(placeName({ ...sitter(), wilayaCode: "alger", communeCode: "hydra" }, "fr"), "Hydra, Alger");
  });
  test("a profile saved before the change gets its wilaya from its commune", () => {
    const g = globalThis as unknown as { window?: unknown };
    const disk = new Map<string, string>();
    g.window = { localStorage: { getItem: (k: string) => disk.get(k) ?? null, setItem: () => {}, removeItem: () => {} } };
    try {
      const legacy = { ...emptySitterProfile("me"), communeCode: "hydra" } as Partial<SitterProfile>;
      delete legacy.wilayaCode;
      disk.set("nidz.demo", JSON.stringify({ version: 3, sitter: { profile: legacy, published: false, idDocument: null } }));
      assert.equal(loadState().sitter?.profile.wilayaCode, "alger");
      disk.set(
        "nidz.demo",
        JSON.stringify({ version: 3, sitter: { profile: { ...legacy, wilayaCode: "oran", communeCode: "nowhere" }, published: false, idDocument: null } }),
      );
      const restored = loadState().sitter?.profile;
      assert.equal(restored?.wilayaCode, "oran");
      assert.equal(restored?.communeCode, "", "a commune that names nothing is dropped, not shown");
      assert.equal(wilayaOfPlace(restored!), "oran");
    } finally {
      delete g.window;
    }
  });
});
