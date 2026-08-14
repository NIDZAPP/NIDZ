/* ---------------------------------------------------------------------------
   DEMONSTRATION SITTERS — NOT REAL PEOPLE, NOT REAL LISTINGS.

   This is the single source of sitter data in the application. Nothing here
   may be duplicated into a component: a screen that needs a sitter imports
   from this module.

   Every field is something a person would DECLARE about themselves
   (design system §6 A). There is deliberately no rating, review, verification
   flag, response time, completed-stay count or online status anywhere in this
   file, and none may be added: Nidz has no mechanism that produces any of
   them, and inventing them is forbidden (§6.1, §7, §8.3, §40).

   `isDemoFixture: true` is what every surface reads to decide whether to mark
   an entry as an example. It is not decoration — it is the flag that keeps
   the demonstration honest.

   No photographs. A stock portrait presented as a sitter is explicitly an
   anti-pattern (§21, §40), so the interface uses a neutral monogram until
   real, consented photography exists.
   ------------------------------------------------------------------------ */

import { addDays, toISODate, today } from "@/utils/dates";
import type { CareType, DateRange, SitterProfile } from "./types";

/** Unavailability is authored as day offsets from "today" so a fixture written
    once never drifts into the past and starts claiming a sitter is free during
    a week that has already happened. */
type DemoUnavailable = { fromDay: number; toDay: number };

type DemoSitterSeed = Omit<
  SitterProfile,
  "declaredUnavailable" | "isDemoFixture" | "confirmedSections"
> & {
  unavailable: DemoUnavailable[];
};

function range(fromDay: number, toDay: number): DateRange {
  const base = today();
  return { start: toISODate(addDays(base, fromDay)), end: toISODate(addDays(base, toDay)) };
}

const SEEDS: DemoSitterSeed[] = [
  {
    id: "amina-b",
    publicName: "Amina B.",
    communeCode: "hydra",
    headline: {
      fr: "Je garde les chiens chez moi, dans une maison avec cour clôturée.",
      en: "I board dogs at my home, a house with a fenced yard.",
      ar: "أستقبل الكلاب في بيتي، وهو منزل بفناء مسيَّج.",
    },
    about: {
      fr: "J'ai grandi avec des chiens et j'en garde régulièrement pour mes voisins depuis plusieurs années. Chez moi, un chien vit comme un membre de la famille : il dort à l'intérieur, sort dans la cour plusieurs fois par jour et fait une longue promenade le matin.",
      en: "I grew up with dogs and have been looking after my neighbours' dogs for several years. At my place a dog lives like part of the family: it sleeps indoors, goes out into the yard several times a day and gets a long walk each morning.",
      ar: "نشأت وسط الكلاب وأحرسها بانتظام لجيراني منذ سنوات. في بيتي يعيش الكلب كفرد من العائلة: ينام في الداخل، ويخرج إلى الفناء عدة مرات يوميًا، ويحظى بنزهة طويلة كل صباح.",
    },
    experience: {
      years: 6,
      species: ["dog"],
      puppiesKittens: "unknown",
      seniors: "yes",
      specialNeeds: "no",
      oralMedication: "yes",
      multipleAnimals: "yes",
      reactiveAnimals: "no",
      paidBefore: "yes",
      volunteered: "unknown",
    },
    professional: {
      kind: "none",
      detail: { fr: "", en: "", ar: "" },
      years: null,
      canEvidence: "unknown",
    },
    services: ["boarding", "walk"],
    rates: { boarding: 1200, walk: 600 },
    acceptedSpecies: ["dog"],
    acceptedDogSizes: ["small", "medium", "large"],
    maxAnimals: 2,
    housing: {
      type: "house",
      outdoor: "yard",
      residentPets: [{ species: "dog", count: 1 }],
      canSeparateAnimals: "no",
      conditions: {
        fr: "La cour est clôturée sur tout son périmètre. Je vis au rez-de-chaussée, sans escalier à monter.",
        en: "The yard is fenced all the way round. I live on the ground floor, with no stairs to climb.",
        ar: "الفناء مسيَّج بالكامل. أسكن في الطابق الأرضي دون درج.",
      },
    },
    care: {
      /* House with a fenced yard, dog sleeps indoors, long walk each morning —
         all of it straight out of her bio. */
      movement: "wholeHome",
      restrictedRooms: { en: "", fr: "", ar: "" },
      containment: { use: "never", reason: { en: "", fr: "", ar: "" } },
      maxHoursAlone: 4,
      presence: "mostOfDay",
      sleeping: "livingSpace",
      feeding: "ownerFoodOwnRoutine",
      enrichment: {
        en: "A long walk every morning and the yard whenever the dog wants it. I am around most of the day.",
        fr: "Une longue promenade chaque matin et la cour à volonté. Je suis là la plus grande partie de la journée.",
        ar: "نزهة طويلة كل صباح والفناء متاح متى شاء الكلب. أكون في البيت معظم اليوم.",
      },
      transport: ["onFoot"],
      emergency: {
        canReachVet: "yes",
        plan: {
          en: "There is a vet a ten-minute walk away. I would call the owner first, and go straight there if I could not reach them.",
          fr: "Il y a un vétérinaire à dix minutes à pied. J’appellerais d’abord le propriétaire, et j’irais directement si je n’arrivais pas à le joindre.",
          ar: "هناك طبيب بيطري على بعد عشر دقائق سيراً. سأتصل بالمالك أولاً، وأذهب مباشرة إن لم أستطع الوصول إليه.",
        },
      },
      dog: { walksPerDay: 2, walkMinutes: 45, offLeash: "no", gardenAccess: "yes" },
      cat: { litterBoxes: null, indoorOnly: "unknown", hidingSpaces: "unknown" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Je ne peux pas accueillir de chat : mon chien ne les supporte pas.",
        en: "I cannot take a cat: my own dog does not tolerate them.",
        ar: "لا يمكنني استقبال قطة: كلبي لا يتحمّلها.",
      },
      {
        fr: "Je ne garde pas de chien non sociable avec les autres chiens.",
        en: "I do not board a dog that is not comfortable around other dogs.",
        ar: "لا أستقبل كلبًا غير اجتماعي مع الكلاب الأخرى.",
      },
    ],
    unavailable: [{ fromDay: 18, toDay: 25 }],
  },
  {
    id: "karim-b",
    publicName: "Karim B.",
    communeCode: "el-biar",
    headline: {
      fr: "Promenades quotidiennes et gardes courtes, sept jours sur sept.",
      en: "Daily walks and short stays, seven days a week.",
      ar: "تمشية يومية وحضانة قصيرة، طوال أيام الأسبوع.",
    },
    about: {
      fr: "Je travaille à domicile, donc je suis présent toute la journée. Je propose surtout des promenades régulières et des gardes de quelques nuits. J'habite un appartement calme avec un grand balcon, et je sors les chiens trois fois par jour.",
      en: "I work from home, so I am around all day. I mainly offer regular walks and stays of a few nights. I live in a quiet flat with a large balcony and take dogs out three times a day.",
      ar: "أعمل من المنزل، لذلك أكون متواجدًا طوال اليوم. أقدّم بالأساس تمشية منتظمة وحضانة لبضع ليالٍ. أسكن شقة هادئة بشرفة واسعة، وأُخرج الكلاب ثلاث مرات يوميًا.",
    },
    experience: {
      years: 3,
      species: ["dog"],
      puppiesKittens: "unknown",
      seniors: "unknown",
      specialNeeds: "no",
      oralMedication: "unknown",
      multipleAnimals: "no",
      reactiveAnimals: "no",
      paidBefore: "yes",
      volunteered: "no",
    },
    professional: {
      kind: "none",
      detail: { fr: "", en: "", ar: "" },
      years: null,
      canEvidence: "unknown",
    },
    services: ["boarding", "walk"],
    rates: { boarding: 900, walk: 500 },
    acceptedSpecies: ["dog"],
    acceptedDogSizes: ["small", "medium"],
    maxAnimals: 1,
    housing: {
      type: "apartment",
      outdoor: "balcony",
      residentPets: [],
      canSeparateAnimals: "unknown",
      conditions: {
        fr: "Appartement au 3e étage avec ascenseur. Pas d'autre animal chez moi.",
        en: "Third-floor flat with a lift. No other animal at home.",
        ar: "شقة في الطابق الثالث مع مصعد. لا يوجد حيوان آخر في البيت.",
      },
    },
    care: {
      /* One dog at a time, in a flat. He crates at night and says why — the
         section exists so that this can be stated plainly rather than
         discovered on collection day. */
      movement: "someRooms",
      restrictedRooms: {
        en: "the bedroom",
        fr: "la chambre",
        ar: "غرفة النوم",
      },
      containment: {
        use: "atNight",
        reason: {
          en: "I use an open crate at night only. My flat has a balcony without a safety rail and I would rather the dog slept somewhere I know is safe. It stays open during the day.",
          fr: "J’utilise une caisse ouverte, la nuit seulement. Mon appartement a un balcon sans rambarde de sécurité et je préfère que le chien dorme dans un endroit sûr. Elle reste ouverte la journée.",
          ar: "أستعمل قفصاً مفتوحاً في الليل فقط. شقتي بها شرفة دون حاجز أمان وأفضّل أن ينام الكلب في مكان آمن. يبقى مفتوحاً طوال النهار.",
        },
      },
      maxHoursAlone: 5,
      presence: "morningsEvenings",
      sleeping: "ownQuietRoom",
      feeding: "ownerFoodAndRoutine",
      enrichment: { en: "", fr: "", ar: "" },
      transport: ["onFoot"],
      emergency: { canReachVet: "yes", plan: { en: "", fr: "", ar: "" } },
      dog: { walksPerDay: 3, walkMinutes: 30, offLeash: "no", gardenAccess: "no" },
      cat: { litterBoxes: null, indoorOnly: "unknown", hidingSpaces: "unknown" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Je ne peux pas accueillir de grand chien : mon appartement est trop petit.",
        en: "I cannot take a large dog: my flat is too small.",
        ar: "لا يمكنني استقبال كلب كبير: شقتي صغيرة جدًا.",
      },
    ],
    unavailable: [],
  },
  {
    id: "sarah-m",
    publicName: "Sarah M.",
    communeCode: "kouba",
    headline: {
      fr: "Je m'occupe des chats chez leurs propriétaires, matin et soir.",
      en: "I look after cats in their own homes, morning and evening.",
      ar: "أعتني بالقطط في بيوت أصحابها، صباحًا ومساءً.",
    },
    about: {
      fr: "Beaucoup de chats sont plus sereins chez eux que déplacés ailleurs. Je passe deux fois par jour : nourriture, eau fraîche, litière, jeu, et un message avec des nouvelles à chaque visite. Je m'occupe aussi des traitements quand il y en a.",
      en: "Many cats are calmer at home than moved somewhere new. I come by twice a day: food, fresh water, litter, play, and a message with news after every visit. I also handle medication when there is any.",
      ar: "كثير من القطط تكون أهدأ في بيتها من نقلها إلى مكان جديد. أمرّ مرتين يوميًا: الطعام، الماء العذب، الرمل، اللعب، ورسالة بالأخبار بعد كل زيارة. كما أتولى الأدوية عند الحاجة.",
    },
    experience: {
      years: 4,
      species: ["cat"],
      puppiesKittens: "yes",
      seniors: "yes",
      specialNeeds: "yes",
      oralMedication: "yes",
      multipleAnimals: "yes",
      reactiveAnimals: "unknown",
      paidBefore: "yes",
      volunteered: "yes",
    },
    professional: {
      kind: "shelter",
      detail: {
        en: "Two years volunteering with a cat rescue association: feeding rounds, medication and socialising new arrivals.",
        fr: "Deux ans de bénévolat dans une association de sauvetage de chats : distribution des repas, traitements et socialisation des nouveaux arrivants.",
        ar: "سنتان من التطوّع في جمعية لإنقاذ القطط: توزيع الوجبات، إعطاء الأدوية، وتأنيس الوافدين الجدد.",
      },
      years: 2,
      /* She says she could show something. Nothing checks it, and no badge
         follows from it (§68). */
      canEvidence: "yes",
    },
    services: ["atOwner"],
    rates: { atOwner: 800 },
    acceptedSpecies: ["cat"],
    acceptedDogSizes: [],
    maxAnimals: 3,
    housing: {
      type: "apartment",
      outdoor: "none",
      residentPets: [{ species: "cat", count: 2 }],
      canSeparateAnimals: "no",
      conditions: null,
    },
    care: {
      /* She goes to the owner's home, so most of the household questions are
         not hers to answer and she has left them alone. That is what an
         at-owner sitter's section honestly looks like. */
      movement: null,
      restrictedRooms: { en: "", fr: "", ar: "" },
      containment: { use: "never", reason: { en: "", fr: "", ar: "" } },
      maxHoursAlone: null,
      presence: "shortVisits",
      sleeping: null,
      feeding: "ownerFoodAndRoutine",
      enrichment: {
        en: "I stay a while at each visit rather than just filling the bowl — play, brushing, and time on the floor with the cat.",
        fr: "Je reste un moment à chaque visite plutôt que de remplir la gamelle et partir : jeu, brossage, et du temps par terre avec le chat.",
        ar: "أبقى مدة في كل زيارة بدل ملء الوعاء والمغادرة: لعب، تمشيط، ووقت على الأرض مع القطة.",
      },
      transport: ["noTransport"],
      emergency: {
        canReachVet: "no",
        plan: {
          en: "I have no vehicle, so I would call the owner and their vet straight away rather than move the cat myself.",
          fr: "Je n’ai pas de véhicule : j’appellerais immédiatement le propriétaire et son vétérinaire plutôt que de déplacer le chat moi-même.",
          ar: "لا أملك سيارة، لذا سأتصل فوراً بالمالك وبطبيبه البيطري بدل نقل القطة بنفسي.",
        },
      },
      dog: { walksPerDay: null, walkMinutes: null, offLeash: "unknown", gardenAccess: "unknown" },
      cat: { litterBoxes: 1, indoorOnly: "yes", hidingSpaces: "yes" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Je ne fais pas de garde chez moi : mes deux chats n'acceptent pas d'autres chats.",
        en: "I do not board at my own home: my two cats do not accept other cats.",
        ar: "لا أستقبل في بيتي: قطتاي لا تقبلان قططًا أخرى.",
      },
    ],
    unavailable: [{ fromDay: 3, toDay: 6 }],
  },
  {
    id: "youcef-h",
    publicName: "Youcef H.",
    communeCode: "bab-ezzouar",
    headline: {
      fr: "Appartement calme, sans autre animal. J'accueille un chat ou un petit chien.",
      en: "Quiet flat, no other animals. I take one cat or one small dog.",
      ar: "شقة هادئة بلا حيوانات أخرى. أستقبل قطة واحدة أو كلبًا صغيرًا.",
    },
    about: {
      fr: "Je garde un seul animal à la fois, pour qu'il ait toute la place et toute l'attention. L'appartement est calme et sans autre animal, ce qui convient bien aux animaux craintifs ou âgés. J'envoie des photos tous les jours.",
      en: "I take one animal at a time so it gets all the space and all the attention. The flat is quiet and has no other animals, which suits shy or older animals well. I send photos every day.",
      ar: "أستقبل حيوانًا واحدًا في كل مرة ليحظى بكل المساحة وكل الاهتمام. الشقة هادئة وبلا حيوانات أخرى، وهو ما يناسب الحيوانات الخجولة أو المسنّة. أرسل صورًا يوميًا.",
    },
    experience: {
      years: 2,
      species: ["cat", "dog"],
      puppiesKittens: "no",
      seniors: "yes",
      specialNeeds: "unknown",
      oralMedication: "unknown",
      multipleAnimals: "no",
      reactiveAnimals: "no",
      paidBefore: "unknown",
      volunteered: "no",
    },
    professional: {
      kind: "none",
      detail: { fr: "", en: "", ar: "" },
      years: null,
      canEvidence: "unknown",
    },
    services: ["boarding"],
    rates: { boarding: 800 },
    acceptedSpecies: ["cat", "dog"],
    acceptedDogSizes: ["small"],
    maxAnimals: 1,
    housing: {
      type: "apartment",
      outdoor: "balcony",
      residentPets: [],
      canSeparateAnimals: "unknown",
      conditions: {
        fr: "Balcon fermé et sécurisé. Immeuble calme, 2e étage sans ascenseur.",
        en: "Enclosed, secured balcony. Quiet building, second floor with no lift.",
        ar: "شرفة مغلقة ومؤمّنة. عمارة هادئة، الطابق الثاني بدون مصعد.",
      },
    },
    care: {
      /* Deliberately the thinnest section of the six: he has answered three
         questions and left the rest. His profile is the one that shows what a
         mostly-empty care section looks like — no penalty, no shaming, just
         fewer lines on the public page. */
      movement: "wholeHome",
      restrictedRooms: { en: "", fr: "", ar: "" },
      containment: { use: null, reason: { en: "", fr: "", ar: "" } },
      maxHoursAlone: 6,
      presence: null,
      sleeping: null,
      feeding: null,
      enrichment: { en: "", fr: "", ar: "" },
      transport: [],
      emergency: { canReachVet: "unknown", plan: { en: "", fr: "", ar: "" } },
      dog: { walksPerDay: null, walkMinutes: null, offLeash: "unknown", gardenAccess: "unknown" },
      cat: { litterBoxes: null, indoorOnly: "unknown", hidingSpaces: "unknown" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Un seul animal à la fois, je n'accepte pas deux animaux de foyers différents.",
        en: "One animal at a time — I do not take two animals from different homes.",
        ar: "حيوان واحد فقط في كل مرة، ولا أقبل حيوانين من بيتين مختلفين.",
      },
      {
        fr: "Pas de chien de grande taille : il n'y a pas d'ascenseur.",
        en: "No large dog: there is no lift in the building.",
        ar: "لا أستقبل كلبًا كبير الحجم: لا يوجد مصعد.",
      },
    ],
    unavailable: [],
  },
  {
    id: "nadia-l",
    publicName: "Nadia L.",
    communeCode: "cheraga",
    headline: {
      fr: "Maison avec jardin, habituée aux chats comme aux chiens.",
      en: "House with a garden, used to both cats and dogs.",
      ar: "منزل بحديقة، معتادة على القطط والكلاب معًا.",
    },
    about: {
      fr: "Nous sommes une famille avec un jardin clôturé, et il y a toujours eu des animaux à la maison. Je peux séparer les espaces quand un animal a besoin de calme, et je préfère toujours une rencontre avant la garde pour vérifier que tout le monde s'entend.",
      en: "We are a family with a fenced garden and there have always been animals at home. I can separate the spaces when an animal needs quiet, and I always prefer meeting beforehand to check everyone gets along.",
      ar: "نحن عائلة لديها حديقة مسيَّجة، وكانت الحيوانات دائمًا حاضرة في البيت. يمكنني فصل المساحات عندما يحتاج الحيوان إلى الهدوء، وأفضّل دائمًا لقاءً قبل الحضانة للتأكد من التفاهم بين الجميع.",
    },
    experience: {
      years: 10,
      species: ["cat", "dog"],
      puppiesKittens: "yes",
      seniors: "yes",
      specialNeeds: "yes",
      oralMedication: "yes",
      multipleAnimals: "yes",
      reactiveAnimals: "unknown",
      paidBefore: "yes",
      volunteered: "yes",
    },
    professional: {
      kind: "none",
      detail: { fr: "", en: "", ar: "" },
      years: null,
      canEvidence: "unknown",
    },
    services: ["boarding", "atOwner", "walk"],
    rates: { boarding: 1500, atOwner: 900, walk: 700 },
    acceptedSpecies: ["cat", "dog"],
    acceptedDogSizes: ["small", "medium", "large"],
    maxAnimals: 3,
    housing: {
      type: "house",
      outdoor: "garden",
      residentPets: [
        { species: "cat", count: 1 },
        { species: "dog", count: 1 },
      ],
      canSeparateAnimals: "yes",
      conditions: {
        fr: "Jardin entièrement clôturé. Deux enfants vivent à la maison.",
        en: "Fully fenced garden. Two children live at the house.",
        ar: "حديقة مسيَّجة بالكامل. طفلان يعيشان في البيت.",
      },
    },
    care: {
      /* Family house, fenced garden, two children, and she can separate the
         spaces — the fullest section of the six, matching a sitter who takes
         three animals across two species. */
      movement: "wholeHome",
      restrictedRooms: {
        en: "the children's bedrooms",
        fr: "les chambres des enfants",
        ar: "غرف الأطفال",
      },
      containment: { use: "never", reason: { en: "", fr: "", ar: "" } },
      maxHoursAlone: 3,
      presence: "alwaysSomeone",
      sleeping: "ownQuietRoom",
      feeding: "ownerFoodOwnRoutine",
      enrichment: {
        en: "There is always someone at home. The dogs go out into the garden through the day, and a cat that wants quiet gets a room to itself.",
        fr: "Il y a toujours quelqu’un à la maison. Les chiens sortent au jardin dans la journée, et un chat qui veut du calme a une pièce pour lui.",
        ar: "هناك دائماً أحد في البيت. تخرج الكلاب إلى الحديقة خلال النهار، والقطة التي تريد الهدوء تحصل على غرفة لها وحدها.",
      },
      transport: ["onFoot", "ownVehicle"],
      emergency: {
        canReachVet: "yes",
        plan: {
          en: "We have a car and a vet we already use for our own animals. I would call the owner on the way.",
          fr: "Nous avons une voiture et un vétérinaire que nous utilisons déjà pour nos propres animaux. J’appellerais le propriétaire en chemin.",
          ar: "لدينا سيارة وطبيب بيطري نتعامل معه لحيواناتنا. سأتصل بالمالك في الطريق.",
        },
      },
      dog: { walksPerDay: 2, walkMinutes: 40, offLeash: "no", gardenAccess: "yes" },
      cat: { litterBoxes: 2, indoorOnly: "yes", hidingSpaces: "yes" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Je n'accepte pas d'animal qui ne supporte ni les enfants ni les autres animaux.",
        en: "I do not take an animal that is uncomfortable with children or other animals.",
        ar: "لا أقبل حيوانًا لا يتحمّل الأطفال أو الحيوانات الأخرى.",
      },
    ],
    unavailable: [{ fromDay: 30, toDay: 40 }],
  },
  {
    id: "yasmine-t",
    publicName: "Yasmine T.",
    /* The commune is simply "Oran". Audit 1.1's fixture said "oran-centre",
       which is not a commune of the wilaya — the reference dataset that
       replaced the hand-written subset does not contain it. The old id still
       resolves for saved briefs and bookmarks, via `LEGACY_COMMUNE_IDS`. */
    communeCode: "oran",
    headline: {
      fr: "Visites et promenades à Oran, matin et fin de journée.",
      en: "Visits and walks in Oran, mornings and late afternoons.",
      ar: "زيارات وتمشية في وهران، صباحًا وآخر النهار.",
    },
    about: {
      fr: "Je passe chez vous pour nourrir, sortir et tenir compagnie à votre animal. Je suis étudiante, disponible surtout tôt le matin et en fin de journée, et je préviens toujours si un horaire doit bouger.",
      en: "I come to your home to feed, walk and keep your animal company. I am a student, mostly available early in the morning and late in the day, and I always let you know if a time has to move.",
      ar: "أمرّ إلى بيتك لإطعام حيوانك وإخراجه ومؤانسته. أنا طالبة، متاحة خصوصًا في الصباح الباكر وآخر النهار، وأُخبر دائمًا إذا اضطر الموعد للتغيير.",
    },
    experience: {
      years: 2,
      species: ["cat", "dog"],
      puppiesKittens: "unknown",
      seniors: "unknown",
      specialNeeds: "no",
      oralMedication: "no",
      multipleAnimals: "yes",
      reactiveAnimals: "no",
      paidBefore: "no",
      volunteered: "unknown",
    },
    professional: {
      kind: "vetStudent",
      detail: {
        en: "Second-year veterinary student. Not a qualification, and nothing here is checked.",
        fr: "Étudiante en deuxième année de médecine vétérinaire. Ce n’est pas un diplôme, et rien ici n’est vérifié.",
        ar: "طالبة في السنة الثانية من الطب البيطري. هذه ليست شهادة، ولا يُتحقق من أي شيء هنا.",
      },
      years: 2,
      canEvidence: "no",
    },
    services: ["atOwner", "walk"],
    rates: { atOwner: 700, walk: 500 },
    acceptedSpecies: ["cat", "dog"],
    acceptedDogSizes: ["small", "medium"],
    maxAnimals: 2,
    housing: {
      type: "apartment",
      outdoor: "none",
      residentPets: [],
      canSeparateAnimals: "unknown",
      conditions: null,
    },
    care: {
      /* At-owner visits and walks, so the home questions are not hers either.
         The vet student who cannot drive: "can you reach a vet" is answered
         "no" and explained, which is more useful to an owner than a blank. */
      movement: null,
      restrictedRooms: { en: "", fr: "", ar: "" },
      containment: { use: "never", reason: { en: "", fr: "", ar: "" } },
      maxHoursAlone: null,
      presence: "shortVisits",
      sleeping: null,
      feeding: "ownerFoodAndRoutine",
      enrichment: { en: "", fr: "", ar: "" },
      transport: ["onFoot", "taxi"],
      emergency: {
        canReachVet: "no",
        plan: {
          en: "I do not drive. I would call the owner, then their vet, and take a taxi if the vet said to come.",
          fr: "Je ne conduis pas. J’appellerais le propriétaire, puis son vétérinaire, et je prendrais un taxi si le vétérinaire me disait de venir.",
          ar: "لا أقود السيارة. سأتصل بالمالك ثم بطبيبه البيطري، وآخذ سيارة أجرة إن طلب مني الحضور.",
        },
      },
      dog: { walksPerDay: 2, walkMinutes: 30, offLeash: "no", gardenAccess: "no" },
      cat: { litterBoxes: null, indoorOnly: "unknown", hidingSpaces: "yes" },
      bird: { outOfCageHours: null, flightSafeRoom: "unknown", coversAtNight: "unknown" },
    },
    limits: [
      {
        fr: "Je ne garde pas d'animal chez moi, uniquement des visites à domicile.",
        en: "I do not board animals at my place — home visits only.",
        ar: "لا أستقبل الحيوانات في بيتي، زيارات منزلية فقط.",
      },
    ],
    unavailable: [],
  },
];

/** The public sitter directory. Resolved once at module load, so the declared
    unavailability is always relative to the day the demo is opened. (A tab
    left open across midnight keeps the previous day's anchor; harmless for a
    demo, and a reload re-anchors it.) */
export const DEMO_SITTERS: SitterProfile[] = SEEDS.map(({ unavailable, ...seed }) => ({
  ...seed,
  declaredUnavailable: unavailable.map((u) => range(u.fromDay, u.toDay)),
  /* Nobody sat in the dashboard and confirmed a section on a fixture, so it
     claims none. Fixtures are never shown in the dashboard anyway; the empty
     array is what is true rather than what is convenient. */
  confirmedSections: [],
  isDemoFixture: true,
}));

export function getDemoSitter(id: string | undefined): SitterProfile | null {
  if (!id) return null;
  return DEMO_SITTERS.find((s) => s.id === id) ?? null;
}

/**
 * The services a sitter actually offers.
 *
 * `services` is the declaration and `rates` only supplies prices, so this is
 * the single answer to "what does this person do" — reading `Object.keys(rates)`
 * instead lets the two drift, and a service with no price is not something the
 * owner can be quoted for.
 */
export function offeredServices(sitter: SitterProfile): CareType[] {
  return sitter.services.filter((service) => typeof sitter.rates[service] === "number");
}

function cheapestOf(sitter: SitterProfile, pool: CareType[]) {
  if (pool.length === 0) return null;
  const careType = pool.reduce((a, b) => ((sitter.rates[a] as number) <= (sitter.rates[b] as number) ? a : b));
  return { careType, amount: sitter.rates[careType] as number };
}


/**
 * The rate to display for a given search.
 *
 * The price shown must belong to a service the owner actually asked for.
 * Quoting the cheapest of ALL services when several were requested would
 * headline a 700 DZD walk against a "boarding or home visits" search whose
 * real prices are 1500 and 900 — and `/search` filters on this same amount,
 * so it would also let a sitter through a budget they exceed.
 */
export function rateFor(
  sitter: SitterProfile,
  careTypes: CareType[],
): { amount: number; careType: CareType; isFrom: boolean } | null {
  const offered = offeredServices(sitter);
  const asked = careTypes.filter((c) => offered.includes(c));
  /* Narrow to what was asked when anything was; otherwise the whole offer. */
  const pool = asked.length ? asked : offered;
  const cheapest = cheapestOf(sitter, pool);
  if (!cheapest) return null;
  /* "From" only when the quoted price is one of several the pool contains. */
  return { ...cheapest, isFrom: pool.length > 1 };
}

/**
 * Whether the sitter has DECLARED themselves unavailable over any part of the
 * range. A `false` result means "has not declared this period unavailable" —
 * never "confirmed available". Nidz holds no reservations, so the UI must not
 * upgrade this into a booking guarantee (§6.1, §28).
 */
export function overlapsDeclaredUnavailable(sitter: SitterProfile, dates: DateRange): boolean {
  return sitter.declaredUnavailable.some((u) => u.start <= dates.end && dates.start <= u.end);
}
