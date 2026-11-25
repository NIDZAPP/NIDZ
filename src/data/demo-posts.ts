/* ---------------------------------------------------------------------------
   EXAMPLE PUBLISHED REQUESTS — NOT REAL OWNERS, NOT REAL ANIMALS (Nidz 1.7).

   They populate the sitter feed so the second matching method can be seen
   working before anybody has published anything. Every one is
   `isDemoFixture: true`, which every surface reads to mark it « Exemple » and
   to say that a proposal sent to it will not be read by anybody.

   The owners are a first name and an initial, like every public identity in
   Nidz; there is no contact detail of any kind, because a post never carries
   one. Dates are day offsets from today, so the feed never drifts into the
   past. The needs are authored in the three languages (`demoNotes`) because
   they are fixture content; a real owner's words are shown as typed.
   ------------------------------------------------------------------------ */

import { emptyPet, forSharing, type Pet, type PetAge } from "./pets";
import type { CarePost } from "./publications";
import type { CareType, Localized, PetCategory } from "./types";
import { addDays, toISODate, today } from "@/utils/dates";

type Seed = {
  id: string;
  ownerName: string;
  species: PetCategory;
  name: string;
  kindId: string | null;
  age: PetAge | null;
  careType: CareType;
  fromDay: number;
  toDay: number;
  wilayaCode: string;
  communeCode: string | null;
  notes: Localized | null;
};

const SEEDS: Seed[] = [
  {
    id: "post-demo-mimi",
    ownerName: "Samir K.",
    species: "cat",
    name: "Mimi",
    kindId: "cat.european",
    age: { status: "known", years: 3, months: 0 },
    careType: "atOwner",
    fromDay: 5,
    toDay: 9,
    wilayaCode: "alger",
    communeCode: "kouba",
    notes: {
      fr: "Prend un demi-comprimé le matin, caché dans sa pâtée. Très craintive avec les inconnus les premiers jours.",
      en: "Takes half a tablet every morning, hidden in her wet food. Very shy with strangers for the first few days.",
      ar: "تتناول نصف قرص كل صباح مخفيًا في طعامها الرطب. خجولة جدًا مع الغرباء في الأيام الأولى.",
    },
  },
  {
    id: "post-demo-noisette",
    ownerName: "Rania B.",
    species: "rabbit",
    name: "Noisette",
    kindId: "rabbit.lop",
    age: { status: "known", years: 1, months: 6 },
    careType: "boarding",
    fromDay: 3,
    toDay: 7,
    wilayaCode: "alger",
    communeCode: "bab-ezzouar",
    notes: {
      fr: "Foin à volonté et légumes frais le soir. Ne supporte pas d'être porté.",
      en: "Unlimited hay and fresh vegetables in the evening. Does not like being picked up.",
      ar: "تبن بلا حدود وخضار طازجة في المساء. لا يحب أن يُحمل.",
    },
  },
  {
    id: "post-demo-rex",
    ownerName: "Leïla H.",
    species: "dog",
    name: "Rex",
    kindId: "dog.german-shepherd",
    age: { status: "known", years: 4, months: 0 },
    careType: "boarding",
    fromDay: 12,
    toDay: 16,
    wilayaCode: "blida",
    communeCode: "boufarik",
    notes: {
      fr: "Réactif avec les chiens mâles. Habitué à deux longues promenades par jour.",
      en: "Reactive with male dogs. Used to two long walks a day.",
      ar: "يتفاعل بحدة مع الكلاب الذكور. معتاد على نزهتين طويلتين يوميًا.",
    },
  },
  {
    id: "post-demo-coco",
    ownerName: "Imane S.",
    species: "parrot",
    name: "Coco",
    kindId: "bird.grey-parrot",
    age: { status: "estimated", years: 12, months: 0 },
    careType: "boarding",
    fromDay: 8,
    toDay: 14,
    wilayaCode: "constantine",
    communeCode: null,
    notes: {
      fr: "Sort de sa cage deux heures par jour sous surveillance. Arrache ses plumes quand il s'ennuie.",
      en: "Out of the cage two hours a day, supervised. Plucks his feathers when bored.",
      ar: "يخرج من قفصه ساعتين يوميًا تحت المراقبة. ينتف ريشه عندما يشعر بالملل.",
    },
  },
  {
    id: "post-demo-lola",
    ownerName: "Omar D.",
    species: "turtle",
    name: "Lola",
    kindId: "turtle.graeca",
    age: { status: "unknown" },
    careType: "atOwner",
    fromDay: 6,
    toDay: 20,
    wilayaCode: "oran",
    communeCode: "bir-el-djir",
    notes: null,
  },
  {
    id: "post-demo-aquarium",
    ownerName: "Walid F.",
    species: "fish",
    name: "Aquarium du salon",
    kindId: "fish.community",
    age: null,
    careType: "atOwner",
    fromDay: 10,
    toDay: 13,
    wilayaCode: "tipaza",
    communeCode: "tipaza",
    notes: {
      fr: "Nourriture une fois par jour, une pincée seulement. Ne pas toucher aux réglages du filtre.",
      en: "Food once a day, a pinch only. Please do not touch the filter settings.",
      ar: "الطعام مرة واحدة يوميًا، رشة صغيرة فقط. يرجى عدم لمس إعدادات المرشح.",
    },
  },
];

function petOf(seed: Seed): Pet {
  const pet = emptyPet(`${seed.id}-pet`, seed.species);
  return { ...pet, name: seed.name, kindId: seed.kindId, ageInfo: seed.age, needsStatus: seed.notes ? null : "nothing" };
}

/** Resolved once at module load, relative to the day the demo is opened. */
export const DEMO_POSTS: (CarePost & { demoNotes: Localized | null })[] = SEEDS.map((seed) => {
  const base = today();
  const created = toISODate(addDays(base, -1));
  return {
    id: seed.id,
    createdAt: `${created}T09:00:00.000Z`,
    updatedAt: `${created}T09:00:00.000Z`,
    pet: forSharing(petOf(seed)),
    petId: null,
    careType: seed.careType,
    dates: { start: toISODate(addDays(base, seed.fromDay)), end: toISODate(addDays(base, seed.toDay)) },
    wilayaCode: seed.wilayaCode,
    communeCode: seed.communeCode,
    ownerName: seed.ownerName,
    status: "open",
    acceptedProposalId: null,
    isDemoFixture: true,
    demoNotes: seed.notes,
  };
});

export function demoNotesOf(post: CarePost): Localized | null {
  return (post as Partial<(typeof DEMO_POSTS)[number]>).demoNotes ?? null;
}
