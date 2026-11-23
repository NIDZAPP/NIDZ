/* ---------------------------------------------------------------------------
   ANIMAL KINDS — breeds for dogs and cats, species for birds (Nidz 1.4).

   The detail UNDER a category. Nidz classifies animals in two levels, and
   the two levels do different jobs:

     1. the CATEGORY — `Species` in types.ts: dog, cat, bird. Shared by owners
        and sitters, and the only level matching reads (with the dog's size).
     2. the KIND — this file: "Sloughi", "Persan", "Chardonneret". A fact the
        owner gives about one animal, shown to a sitter with a request.

   A KIND NEVER WIDENS OR NARROWS MATCHING. `criteria.ts` does not import this
   file, and tests/unit/animal-kinds.test.ts holds that: a sitter who takes
   dogs takes a Sloughi, and nothing here can make a sitter appear for a
   rabbit. Extending what Nidz matches is a product decision (design system
   §0.1), not a side effect of a longer list.

   Reference data, not a fixture: a starting list of what Algerian owners
   commonly keep, in three languages. Not exhaustive by design — « Mon animal
   n'est pas dans la liste » takes a free name for everything else, and an
   owner who does not know answers nothing at all (the field is optional).

   IDS NEVER MOVE. A stored pet points at `dog.sloughi`; renaming or removing
   an id silently turns a recorded fact into a free-text one at best. Add new
   entries; do not repurpose old ones.
   ------------------------------------------------------------------------ */

import type { Localized, Species } from "./types";

export type AnimalKind = {
  id: string;
  name: Localized;
  /** Other names people type: a local name, a spelling without accents. */
  aliases?: string[];
};

const k = (id: string, fr: string, en: string, ar: string, aliases?: string[]): AnimalKind => ({
  id,
  name: { fr, en, ar },
  aliases,
});

/** Ordered by how often an owner here is likely to look for it, so the first
    screenful answers most people before they type anything. */
export const ANIMAL_KINDS: Record<Species, readonly AnimalKind[]> = {
  dog: [
    k("dog.mixed", "Croisé", "Mixed breed", "هجين", ["batard", "bâtard", "croise"]),
    k("dog.german-shepherd", "Berger allemand", "German Shepherd", "راعي ألماني", ["berger"]),
    k("dog.malinois", "Berger belge malinois", "Belgian Malinois", "مالينوا بلجيكي", ["malinois"]),
    k("dog.sloughi", "Sloughi", "Sloughi", "سلوقي", ["slougui", "lévrier"]),
    k("dog.aidi", "Aïdi (chien de l'Atlas)", "Aidi (Atlas Mountain Dog)", "عيدي (كلب الأطلس)", ["aidi", "kabyle", "chien de l'atlas"]),
    k("dog.labrador", "Labrador retriever", "Labrador Retriever", "لابرادور"),
    k("dog.golden", "Golden retriever", "Golden Retriever", "غولدن ريتريفر"),
    k("dog.husky", "Husky sibérien", "Siberian Husky", "هاسكي سيبيري"),
    k("dog.rottweiler", "Rottweiler", "Rottweiler", "روت وايلر"),
    k("dog.doberman", "Dobermann", "Dobermann", "دوبرمان", ["doberman"]),
    k("dog.cane-corso", "Cane corso", "Cane Corso", "كاني كورسو"),
    k("dog.kangal", "Kangal", "Kangal", "كانغال"),
    k("dog.boxer", "Boxer", "Boxer", "بوكسر"),
    k("dog.poodle", "Caniche", "Poodle", "بودل", ["caniche"]),
    k("dog.maltese", "Bichon maltais", "Maltese", "مالطي", ["bichon"]),
    k("dog.yorkshire", "Yorkshire terrier", "Yorkshire Terrier", "يوركشاير تيرير", ["yorkie"]),
    k("dog.chihuahua", "Chihuahua", "Chihuahua", "شيواوا"),
    k("dog.shih-tzu", "Shih tzu", "Shih Tzu", "شيه تزو"),
    k("dog.pomeranian", "Spitz nain (loulou de Poméranie)", "Pomeranian", "بوميرانيان", ["spitz"]),
    k("dog.beagle", "Beagle", "Beagle", "بيغل"),
    k("dog.cocker", "Cocker anglais", "English Cocker Spaniel", "كوكر سبانيل"),
    k("dog.french-bulldog", "Bouledogue français", "French Bulldog", "بولدوغ فرنسي", ["bulldog"]),
  ],
  cat: [
    k("cat.european", "Européen (chat de gouttière)", "Domestic shorthair", "قط منزلي", ["gouttiere", "commun"]),
    k("cat.mixed", "Croisé", "Mixed breed", "هجين", ["croise"]),
    k("cat.persian", "Persan", "Persian", "فارسي"),
    k("cat.siamese", "Siamois", "Siamese", "سيامي"),
    k("cat.turkish-angora", "Angora turc", "Turkish Angora", "أنغورا تركي", ["angora"]),
    k("cat.maine-coon", "Maine coon", "Maine Coon", "ماين كون"),
    k("cat.british-shorthair", "British shorthair", "British Shorthair", "بريطاني قصير الشعر", ["british"]),
    k("cat.scottish-fold", "Scottish fold", "Scottish Fold", "سكوتش فولد"),
    k("cat.himalayan", "Himalayen", "Himalayan", "هيمالايا"),
    k("cat.bengal", "Bengal", "Bengal", "بنغالي"),
    k("cat.ragdoll", "Ragdoll", "Ragdoll", "راغدول"),
    k("cat.chartreux", "Chartreux", "Chartreux", "شارتروز"),
    k("cat.sphynx", "Sphynx", "Sphynx", "سفينكس"),
  ],
  bird: [
    k("bird.goldfinch", "Chardonneret élégant", "European goldfinch", "حسون (مقنين)", ["maknine", "mekkine", "chardonneret"]),
    k("bird.canary", "Canari", "Canary", "كناري", ["serin"]),
    k("bird.budgerigar", "Perruche ondulée", "Budgerigar", "بادجي (ببغاء أسترالي)", ["perruche", "budgie"]),
    k("bird.cockatiel", "Calopsitte", "Cockatiel", "كوكتيل", ["calopsitte"]),
    k("bird.lovebird", "Inséparable", "Lovebird", "طائر الحب", ["inseparable"]),
    k("bird.zebra-finch", "Diamant mandarin", "Zebra finch", "عصفور الزيبرا", ["mandarin"]),
    k("bird.grey-parrot", "Perroquet gris du Gabon", "African grey parrot", "ببغاء رمادي إفريقي", ["gris du gabon", "perroquet"]),
    k("bird.conure", "Conure", "Conure", "ببغاء الكونيور"),
    k("bird.pigeon", "Pigeon", "Pigeon", "حمام"),
    k("bird.turtledove", "Tourterelle", "Turtle dove", "يمام", ["tourterelle"]),
  ],
};

const BY_ID = new Map<string, { species: Species; kind: AnimalKind }>(
  (Object.entries(ANIMAL_KINDS) as [Species, readonly AnimalKind[]][]).flatMap(([species, kinds]) =>
    kinds.map((kind) => [kind.id, { species, kind }] as const),
  ),
);

export function kindsOf(species: Species): readonly AnimalKind[] {
  return ANIMAL_KINDS[species];
}

/** The kind behind an id, but only if it belongs to `species` — a stored
    "cat.persian" on a dog is not a breed, it is a broken record. */
export function getKind(id: string | null | undefined, species: Species): AnimalKind | null {
  if (!id) return null;
  const hit = BY_ID.get(id);
  return hit && hit.species === species ? hit.kind : null;
}

/** Case- and accent-insensitive, over every language's name and the aliases,
    so "malinois", "Malinois" and "مالينوا" all find the same dog. */
export function foldKind(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ْ]/g, "")
    .toLowerCase()
    .trim();
}

export function searchKinds(species: Species, query: string): readonly AnimalKind[] {
  const needle = foldKind(query);
  if (!needle) return ANIMAL_KINDS[species];
  return ANIMAL_KINDS[species].filter((kind) =>
    [kind.name.fr, kind.name.en, kind.name.ar, ...(kind.aliases ?? [])].some((name) => foldKind(name).includes(needle)),
  );
}
