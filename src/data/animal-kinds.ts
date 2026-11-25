/* ---------------------------------------------------------------------------
   ANIMAL KINDS — the breed or species UNDER a category (Nidz 1.4, extended
   to the thirteen categories in 1.7).

   Two levels, two jobs:

     1. the CATEGORY — `Species` (types.ts) described by `animal-catalogue.ts`.
        Shared by owners and sitters.
     2. the KIND — this file: « Sloughi », « Persan », « Chardonneret »,
        « Python royal ». A fact the owner gives about one animal.

   WHAT CHANGED IN 1.7. Before, a kind was detail only and matching never read
   it. A sitter can now say « certaines races uniquement » (§19), so a kind
   decides compatibility with THAT sitter, through `compatibility.ts` — and
   only there. A kind still never widens a sitter's acceptance beyond the
   category they ticked, and an unknown kind is never a match.

   ORDER. Each list starts with what an owner here is likely to look for, so
   the first screenful answers most people. That order is a practical one, not
   a popularity statistic: Nidz has no Algerian registration data and shows
   no « populaire » label anywhere (§7.1). Where the list carries a « mixed /
   common » entry it comes first, because it is the most common honest answer.

   Not exhaustive by design — « Autre » takes a free name, and « Je ne sais
   pas » is a complete answer.

   IDS NEVER MOVE. A stored pet points at `dog.sloughi`; renaming or removing
   an id silently turns a recorded fact into a free-text one at best. Add new
   entries; do not repurpose old ones. The two parrots that 1.4 listed under
   « Oiseau » (`bird.grey-parrot`, `bird.conure`) now belong to « Perroquet »
   with the SAME ids — `restorePet` moves a stored bird carrying one of them
   to the parrot category, reading the owner's own answer rather than
   inventing one.
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

/** See the header for what the order means and does not mean. */
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
    k("dog.amstaff", "American Staffordshire terrier", "American Staffordshire Terrier", "أمريكان ستافوردشاير تيرير", ["amstaff", "pitbull", "pit bull", "staff"]),
    k("dog.poodle", "Caniche", "Poodle", "بودل", ["caniche"]),
    k("dog.maltese", "Bichon maltais", "Maltese", "مالطي", ["bichon"]),
    k("dog.bichon-frise", "Bichon frisé", "Bichon Frise", "بيشون فريزيه", ["bichon"]),
    k("dog.yorkshire", "Yorkshire terrier", "Yorkshire Terrier", "يوركشاير تيرير", ["yorkie"]),
    k("dog.chihuahua", "Chihuahua", "Chihuahua", "شيواوا"),
    k("dog.shih-tzu", "Shih tzu", "Shih Tzu", "شيه تزو"),
    k("dog.pomeranian", "Spitz nain (loulou de Poméranie)", "Pomeranian", "بوميرانيان", ["spitz"]),
    k("dog.beagle", "Beagle", "Beagle", "بيغل"),
    k("dog.cocker", "Cocker anglais", "English Cocker Spaniel", "كوكر سبانيل"),
    k("dog.french-bulldog", "Bouledogue français", "French Bulldog", "بولدوغ فرنسي", ["bulldog"]),
    k("dog.english-bulldog", "Bulldog anglais", "English Bulldog", "بولدوغ إنجليزي", ["bulldog"]),
    k("dog.border-collie", "Border collie", "Border Collie", "بوردر كولي", ["collie"]),
    k("dog.australian-shepherd", "Berger australien", "Australian Shepherd", "راعي أسترالي", ["aussie"]),
    k("dog.white-shepherd", "Berger blanc suisse", "White Swiss Shepherd", "راعي سويسري أبيض", ["berger blanc"]),
    k("dog.great-dane", "Dogue allemand", "Great Dane", "الدانماركي الكبير", ["dogue"]),
    k("dog.jack-russell", "Jack Russell terrier", "Jack Russell Terrier", "جاك راسل تيرير", ["jack russel"]),
    k("dog.dachshund", "Teckel", "Dachshund", "داشهند", ["teckel", "dachshund"]),
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
    k("cat.abyssinian", "Abyssin", "Abyssinian", "حبشي"),
    k("cat.norwegian", "Norvégien", "Norwegian Forest Cat", "قط الغابات النرويجي", ["norvegien"]),
    k("cat.birman", "Sacré de Birmanie", "Birman", "بيرمي", ["birman", "birmanie"]),
    k("cat.russian-blue", "Bleu russe", "Russian Blue", "الأزرق الروسي"),
    k("cat.exotic", "Exotic shorthair", "Exotic Shorthair", "إكزوتيك قصير الشعر", ["exotic"]),
  ],
  /* Small cage and aviary birds. Parrots are their own category below. */
  bird: [
    k("bird.goldfinch", "Chardonneret élégant", "European goldfinch", "حسون (مقنين)", ["maknine", "mekkine", "chardonneret"]),
    k("bird.canary", "Canari", "Canary", "كناري", ["serin"]),
    k("bird.budgerigar", "Perruche ondulée", "Budgerigar", "بادجي (ببغاء أسترالي)", ["perruche", "budgie"]),
    k("bird.cockatiel", "Calopsitte", "Cockatiel", "كوكتيل", ["calopsitte"]),
    k("bird.lovebird", "Inséparable", "Lovebird", "طائر الحب", ["inseparable"]),
    k("bird.zebra-finch", "Diamant mandarin", "Zebra finch", "عصفور الزيبرا", ["mandarin"]),
    k("bird.greenfinch", "Verdier d'Europe", "European greenfinch", "الخضيري", ["verdier"]),
    k("bird.gouldian-finch", "Diamant de Gould", "Gouldian finch", "عصفور غولد", ["gould"]),
    k("bird.pigeon", "Pigeon", "Pigeon", "حمام"),
    k("bird.turtledove", "Tourterelle", "Turtle dove", "يمام", ["tourterelle"]),
    k("bird.quail", "Caille", "Quail", "سمّان", ["caille"]),
  ],
  parrot: [
    /* Same ids as 1.4, now filed where they belong. */
    k("bird.grey-parrot", "Perroquet gris du Gabon", "African grey parrot", "ببغاء رمادي إفريقي", ["gris du gabon", "perroquet"]),
    k("parrot.ringneck", "Perruche à collier", "Rose-ringed parakeet", "الدرة المطوقة", ["collier", "ringneck"]),
    k("parrot.alexandrine", "Perruche alexandre", "Alexandrine parakeet", "ببغاء الإسكندر", ["alexandre"]),
    k("bird.conure", "Conure", "Conure", "ببغاء الكونيور"),
    k("parrot.amazon", "Amazone", "Amazon parrot", "ببغاء الأمازون", ["amazone"]),
    k("parrot.senegal", "Youyou du Sénégal", "Senegal parrot", "ببغاء سنغالي", ["youyou"]),
    k("parrot.quaker", "Perruche moine (conure veuve)", "Monk parakeet", "ببغاء الراهب", ["moine", "quaker"]),
    k("parrot.cockatoo", "Cacatoès", "Cockatoo", "كوكاتو", ["cacatoes"]),
    k("parrot.macaw", "Ara", "Macaw", "ببغاء المكاو", ["ara"]),
    k("parrot.eclectus", "Grand éclectus", "Eclectus parrot", "ببغاء الإكليكتوس", ["eclectus"]),
    k("parrot.caique", "Caïque", "Caique", "ببغاء الكايك", ["caique"]),
  ],
  rabbit: [
    k("rabbit.mixed", "Croisé (lapin domestique)", "Mixed breed (domestic rabbit)", "أرنب منزلي هجين", ["croise", "commun"]),
    k("rabbit.dwarf", "Lapin nain", "Netherland dwarf", "أرنب قزم", ["nain"]),
    k("rabbit.lop", "Bélier nain", "Mini lop", "أرنب ذو الأذنين المتدليتين", ["belier", "lop"]),
    k("rabbit.lionhead", "Tête de lion", "Lionhead", "أرنب رأس الأسد", ["lion"]),
    k("rabbit.angora", "Angora", "Angora", "أرنب أنغورا"),
    k("rabbit.rex", "Rex", "Rex", "أرنب ريكس"),
    k("rabbit.dutch", "Hollandais", "Dutch", "أرنب هولندي"),
    k("rabbit.english-spot", "Papillon", "English Spot", "أرنب الفراشة", ["papillon"]),
    k("rabbit.flemish-giant", "Géant des Flandres", "Flemish Giant", "عملاق فلاندرز", ["geant"]),
  ],
  guineaPig: [
    k("guinea-pig.american", "Poil court (américain)", "American (short-haired)", "قصير الشعر (أمريكي)", ["americain", "poil court"]),
    k("guinea-pig.mixed", "Croisé", "Mixed breed", "هجين", ["croise"]),
    k("guinea-pig.abyssinian", "Abyssin", "Abyssinian", "حبشي"),
    k("guinea-pig.peruvian", "Péruvien", "Peruvian", "بيروفي", ["peruvien"]),
    k("guinea-pig.teddy", "Teddy", "Teddy", "تيدي"),
    k("guinea-pig.rex", "Rex", "Rex", "ريكس"),
    k("guinea-pig.crested", "Couronné", "Crested", "متوّج", ["couronne"]),
    k("guinea-pig.sheltie", "Sheltie (silkie)", "Sheltie (Silkie)", "شلتي", ["silkie"]),
    k("guinea-pig.texel", "Texel", "Texel", "تكسل"),
    k("guinea-pig.skinny", "Skinny (sans poils)", "Skinny (hairless)", "سكيني (بلا شعر)", ["sans poil"]),
  ],
  hamster: [
    k("hamster.syrian", "Hamster doré (syrien)", "Syrian hamster", "هامستر سوري (ذهبي)", ["dore", "syrien"]),
    k("hamster.campbell", "Hamster russe (Campbell)", "Campbell's dwarf hamster", "هامستر روسي (كامبل)", ["russe", "campbell"]),
    k("hamster.winter-white", "Hamster russe blanc", "Winter white dwarf hamster", "هامستر روسي أبيض", ["russe", "djungarian"]),
    k("hamster.roborovski", "Hamster de Roborovski", "Roborovski hamster", "هامستر روبوروفسكي", ["robo"]),
    k("hamster.chinese", "Hamster de Chine", "Chinese hamster", "هامستر صيني"),
  ],
  mouse: [],
  ferret: [],
  fish: [
    k("fish.goldfish", "Poisson rouge", "Goldfish", "سمكة ذهبية", ["rouge"]),
    k("fish.betta", "Combattant (betta)", "Betta (Siamese fighting fish)", "سمكة البيتا المقاتلة", ["betta", "combattant"]),
    k("fish.guppy", "Guppy", "Guppy", "غوبي"),
    k("fish.community", "Plusieurs espèces (aquarium communautaire)", "Several species (community tank)", "عدة أنواع (حوض مشترك)", ["aquarium", "communautaire"]),
    k("fish.platy", "Platy", "Platy", "بلاتي"),
    k("fish.molly", "Molly", "Molly", "مولي"),
    k("fish.neon", "Néon", "Neon tetra", "نيون", ["neon", "tetra"]),
    k("fish.swordtail", "Xipho (porte-épée)", "Swordtail", "ذيل السيف", ["xipho"]),
    k("fish.angelfish", "Scalaire", "Angelfish", "سمكة الملاك", ["scalaire"]),
    k("fish.corydoras", "Corydoras", "Corydoras", "كوريدوراس"),
    k("fish.cichlid", "Cichlidé africain", "African cichlid", "سيكليد أفريقي", ["cichlide"]),
    k("fish.discus", "Discus", "Discus", "ديسكس"),
    k("fish.koi", "Koï", "Koi", "سمك الكوي", ["koi"]),
    k("fish.clownfish", "Poisson-clown (eau de mer)", "Clownfish (saltwater)", "سمكة المهرج (مياه مالحة)", ["clown"]),
  ],
  turtle: [
    k("turtle.graeca", "Tortue mauresque (grecque)", "Spur-thighed tortoise", "سلحفاة إغريقية (مغاربية)", ["grecque", "mauresque", "graeca"]),
    k("turtle.slider", "Tortue de Floride", "Red-eared slider", "سلحفاة ذات الأذنين الحمراوين", ["floride"]),
    k("turtle.hermann", "Tortue d'Hermann", "Hermann's tortoise", "سلحفاة هيرمان"),
    k("turtle.horsfield", "Tortue des steppes (russe)", "Horsfield's tortoise", "السلحفاة الروسية", ["russe", "steppes"]),
    k("turtle.sulcata", "Tortue sillonnée (sulcata)", "Sulcata tortoise", "سلحفاة سولكاتا", ["sulcata"]),
    k("turtle.musk", "Tortue musquée", "Musk turtle", "سلحفاة المسك", ["musquee"]),
  ],
  snake: [
    k("snake.corn", "Serpent des blés", "Corn snake", "ثعبان الذرة", ["corn", "bles"]),
    k("snake.ball-python", "Python royal", "Ball python", "الأصلة الملكية", ["python", "royal"]),
    k("snake.king", "Serpent-roi", "Kingsnake", "ثعبان الملك", ["roi", "king"]),
    k("snake.milk", "Serpent laitier", "Milk snake", "ثعبان الحليب", ["laitier"]),
    k("snake.hognose", "Hétérodon (nez de cochon)", "Hognose snake", "ثعبان أنف الخنزير", ["hognose"]),
    k("snake.boa", "Boa constricteur", "Boa constrictor", "أفعى البوا العاصرة", ["boa"]),
    k("snake.burmese-python", "Python molure (birman)", "Burmese python", "الأصلة البورمية", ["birman", "molure"]),
  ],
  chameleon: [
    k("chameleon.common", "Caméléon commun", "Common chameleon", "الحرباء الشائعة", ["commun"]),
    k("chameleon.veiled", "Caméléon casqué (du Yémen)", "Veiled chameleon", "الحرباء المحجبة (اليمنية)", ["yemen", "casque"]),
    k("chameleon.panther", "Caméléon panthère", "Panther chameleon", "حرباء النمر", ["panthere"]),
    k("chameleon.jackson", "Caméléon de Jackson", "Jackson's chameleon", "حرباء جاكسون"),
  ],
};

/** Ids that used to belong to another category, and the category they belong
    to now. Read only by storage migration (`restorePet`). */
export const MOVED_KINDS: Readonly<Record<string, { from: Species; to: Species }>> = {
  "bird.grey-parrot": { from: "bird", to: "parrot" },
  "bird.conure": { from: "bird", to: "parrot" },
};

const BY_ID = new Map<string, { species: Species; kind: AnimalKind }>(
  (Object.entries(ANIMAL_KINDS) as [Species, readonly AnimalKind[]][]).flatMap(([species, kinds]) =>
    kinds.map((kind) => [kind.id, { species, kind }] as const),
  ),
);

export function kindsOf(species: Species): readonly AnimalKind[] {
  return ANIMAL_KINDS[species];
}

/** The category a listed kind belongs to, whatever category it is asked
    about — used to repair a record filed under the wrong one. */
export function speciesOfKind(id: string | null | undefined): Species | null {
  if (!id) return null;
  return BY_ID.get(id)?.species ?? null;
}

/** The kind behind an id, but only if it belongs to `species` — a stored
    "cat.persian" on a dog is not a breed, it is a broken record. */
export function getKind(id: string | null | undefined, species: Species | "other"): AnimalKind | null {
  if (!id || species === "other") return null;
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
