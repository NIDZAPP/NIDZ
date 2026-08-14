import type { Localized } from "@/data/types";

/**
 * The wilayas of Algeria, as of loi 26-06 (Journal Officiel, 4 April 2026).
 *
 * READ `metadata.ts` BEFORE TREATING THIS AS AUTHORITATIVE. In particular,
 * `officialCode` is `null` for the eleven wilayas created in 2026: published
 * sources disagree about their numbers, and guessing would be exactly the
 * fabrication the audit forbids. `id` is the stable identifier, and the only
 * thing Nidz stores, routes on or compares.
 *
 * `communeCoverage` is an honest statement about THIS dataset, not about the
 * country. "none" means Nidz does not yet carry the commune list for that
 * wilaya — never that the wilaya has no communes.
 *
 * Committed rather than fetched: this is reference data that changes with a
 * law, not at runtime.
 */
export type Wilaya = {
  /** Stable internal id. Survives a rename or a renumbering; safe in a URL. */
  id: string;
  /** The official current code, ONLY where it has been verified. */
  officialCode: string | null;
  name: Localized;
  communeCoverage: "complete" | "none";
};

export const WILAYAS: readonly Wilaya[] = [
  { id: "adrar", officialCode: "01", communeCoverage: "none", name: { fr: "Adrar", en: "Adrar", ar: "أدرار" } },
  { id: "chlef", officialCode: "02", communeCoverage: "none", name: { fr: "Chlef", en: "Chlef", ar: "الشلف" } },
  { id: "laghouat", officialCode: "03", communeCoverage: "none", name: { fr: "Laghouat", en: "Laghouat", ar: "الأغواط" } },
  { id: "oum-el-bouaghi", officialCode: "04", communeCoverage: "none", name: { fr: "Oum El Bouaghi", en: "Oum El Bouaghi", ar: "أم البواقي" } },
  { id: "batna", officialCode: "05", communeCoverage: "none", name: { fr: "Batna", en: "Batna", ar: "باتنة" } },
  { id: "bejaia", officialCode: "06", communeCoverage: "complete", name: { fr: "Béjaïa", en: "Béjaïa", ar: "بجاية" } },
  { id: "biskra", officialCode: "07", communeCoverage: "none", name: { fr: "Biskra", en: "Biskra", ar: "بسكرة" } },
  { id: "bechar", officialCode: "08", communeCoverage: "none", name: { fr: "Béchar", en: "Béchar", ar: "بشار" } },
  { id: "blida", officialCode: "09", communeCoverage: "complete", name: { fr: "Blida", en: "Blida", ar: "البليدة" } },
  { id: "bouira", officialCode: "10", communeCoverage: "none", name: { fr: "Bouira", en: "Bouira", ar: "البويرة" } },
  { id: "tamanrasset", officialCode: "11", communeCoverage: "none", name: { fr: "Tamanrasset", en: "Tamanrasset", ar: "تمنراست" } },
  { id: "tebessa", officialCode: "12", communeCoverage: "none", name: { fr: "Tébessa", en: "Tébessa", ar: "تبسة" } },
  { id: "tlemcen", officialCode: "13", communeCoverage: "none", name: { fr: "Tlemcen", en: "Tlemcen", ar: "تلمسان" } },
  { id: "tiaret", officialCode: "14", communeCoverage: "none", name: { fr: "Tiaret", en: "Tiaret", ar: "تيارت" } },
  { id: "tizi-ouzou", officialCode: "15", communeCoverage: "complete", name: { fr: "Tizi Ouzou", en: "Tizi Ouzou", ar: "تيزي وزو" } },
  { id: "alger", officialCode: "16", communeCoverage: "complete", name: { fr: "Alger", en: "Algiers", ar: "الجزائر" } },
  { id: "djelfa", officialCode: "17", communeCoverage: "none", name: { fr: "Djelfa", en: "Djelfa", ar: "الجلفة" } },
  { id: "jijel", officialCode: "18", communeCoverage: "none", name: { fr: "Jijel", en: "Jijel", ar: "جيجل" } },
  { id: "setif", officialCode: "19", communeCoverage: "complete", name: { fr: "Sétif", en: "Sétif", ar: "سطيف" } },
  { id: "saida", officialCode: "20", communeCoverage: "none", name: { fr: "Saïda", en: "Saïda", ar: "سعيدة" } },
  { id: "skikda", officialCode: "21", communeCoverage: "none", name: { fr: "Skikda", en: "Skikda", ar: "سكيكدة" } },
  { id: "sidi-bel-abbes", officialCode: "22", communeCoverage: "none", name: { fr: "Sidi Bel Abbès", en: "Sidi Bel Abbès", ar: "سيدي بلعباس" } },
  { id: "annaba", officialCode: "23", communeCoverage: "complete", name: { fr: "Annaba", en: "Annaba", ar: "عنابة" } },
  { id: "guelma", officialCode: "24", communeCoverage: "none", name: { fr: "Guelma", en: "Guelma", ar: "قالمة" } },
  { id: "constantine", officialCode: "25", communeCoverage: "complete", name: { fr: "Constantine", en: "Constantine", ar: "قسنطينة" } },
  { id: "medea", officialCode: "26", communeCoverage: "none", name: { fr: "Médéa", en: "Médéa", ar: "المدية" } },
  { id: "mostaganem", officialCode: "27", communeCoverage: "none", name: { fr: "Mostaganem", en: "Mostaganem", ar: "مستغانم" } },
  { id: "msila", officialCode: "28", communeCoverage: "none", name: { fr: "M'Sila", en: "M'Sila", ar: "المسيلة" } },
  { id: "mascara", officialCode: "29", communeCoverage: "none", name: { fr: "Mascara", en: "Mascara", ar: "معسكر" } },
  { id: "ouargla", officialCode: "30", communeCoverage: "none", name: { fr: "Ouargla", en: "Ouargla", ar: "ورقلة" } },
  { id: "oran", officialCode: "31", communeCoverage: "complete", name: { fr: "Oran", en: "Oran", ar: "وهران" } },
  { id: "el-bayadh", officialCode: "32", communeCoverage: "none", name: { fr: "El Bayadh", en: "El Bayadh", ar: "البيض" } },
  { id: "illizi", officialCode: "33", communeCoverage: "none", name: { fr: "Illizi", en: "Illizi", ar: "إليزي" } },
  { id: "bordj-bou-arreridj", officialCode: "34", communeCoverage: "none", name: { fr: "Bordj Bou Arreridj", en: "Bordj Bou Arreridj", ar: "برج بوعريريج" } },
  { id: "boumerdes", officialCode: "35", communeCoverage: "complete", name: { fr: "Boumerdès", en: "Boumerdès", ar: "بومرداس" } },
  { id: "el-tarf", officialCode: "36", communeCoverage: "none", name: { fr: "El Tarf", en: "El Tarf", ar: "الطارف" } },
  { id: "tindouf", officialCode: "37", communeCoverage: "none", name: { fr: "Tindouf", en: "Tindouf", ar: "تندوف" } },
  { id: "tissemsilt", officialCode: "38", communeCoverage: "none", name: { fr: "Tissemsilt", en: "Tissemsilt", ar: "تيسمسيلت" } },
  { id: "el-oued", officialCode: "39", communeCoverage: "none", name: { fr: "El Oued", en: "El Oued", ar: "الوادي" } },
  { id: "khenchela", officialCode: "40", communeCoverage: "none", name: { fr: "Khenchela", en: "Khenchela", ar: "خنشلة" } },
  { id: "souk-ahras", officialCode: "41", communeCoverage: "none", name: { fr: "Souk Ahras", en: "Souk Ahras", ar: "سوق أهراس" } },
  { id: "tipaza", officialCode: "42", communeCoverage: "complete", name: { fr: "Tipaza", en: "Tipaza", ar: "تيبازة" } },
  { id: "mila", officialCode: "43", communeCoverage: "none", name: { fr: "Mila", en: "Mila", ar: "ميلة" } },
  { id: "ain-defla", officialCode: "44", communeCoverage: "none", name: { fr: "Aïn Defla", en: "Aïn Defla", ar: "عين الدفلة" } },
  { id: "naama", officialCode: "45", communeCoverage: "none", name: { fr: "Naâma", en: "Naâma", ar: "النعامة" } },
  { id: "ain-temouchent", officialCode: "46", communeCoverage: "none", name: { fr: "Aïn Témouchent", en: "Aïn Témouchent", ar: "عين تيموشنت" } },
  { id: "ghardaia", officialCode: "47", communeCoverage: "none", name: { fr: "Ghardaïa", en: "Ghardaïa", ar: "غرداية" } },
  { id: "relizane", officialCode: "48", communeCoverage: "none", name: { fr: "Relizane", en: "Relizane", ar: "غليزان" } },
  { id: "timimoun", officialCode: "49", communeCoverage: "none", name: { fr: "Timimoun", en: "Timimoun", ar: "تيميمون" } },
  { id: "bordj-badji-mokhtar", officialCode: "50", communeCoverage: "none", name: { fr: "Bordj Badji Mokhtar", en: "Bordj Badji Mokhtar", ar: "برج باجي مختار" } },
  { id: "ouled-djellal", officialCode: "51", communeCoverage: "none", name: { fr: "Ouled Djellal", en: "Ouled Djellal", ar: "أولاد جلال" } },
  { id: "beni-abbes", officialCode: "52", communeCoverage: "none", name: { fr: "Béni Abbès", en: "Béni Abbès", ar: "بني عباس" } },
  { id: "in-salah", officialCode: "53", communeCoverage: "none", name: { fr: "In Salah", en: "In Salah", ar: "عين صالح" } },
  { id: "in-guezzam", officialCode: "54", communeCoverage: "none", name: { fr: "In Guezzam", en: "In Guezzam", ar: "عين قزام" } },
  { id: "touggourt", officialCode: "55", communeCoverage: "none", name: { fr: "Touggourt", en: "Touggourt", ar: "تقرت" } },
  { id: "djanet", officialCode: "56", communeCoverage: "none", name: { fr: "Djanet", en: "Djanet", ar: "جانت" } },
  { id: "el-meghaier", officialCode: "57", communeCoverage: "none", name: { fr: "El Meghaier", en: "El Meghaier", ar: "المغير" } },
  { id: "el-menia", officialCode: "58", communeCoverage: "none", name: { fr: "El Menia", en: "El Menia", ar: "المنيعة" } },
  { id: "aflou", officialCode: null, communeCoverage: "none", name: { fr: "Aflou", en: "Aflou", ar: "أفلو" } },
  { id: "el-abiodh-sidi-cheikh", officialCode: null, communeCoverage: "none", name: { fr: "El Abiodh Sidi Cheikh", en: "El Abiodh Sidi Cheikh", ar: "الأبيض سيدي الشيخ" } },
  { id: "el-aricha", officialCode: null, communeCoverage: "none", name: { fr: "El Aricha", en: "El Aricha", ar: "العريشة" } },
  { id: "el-kantara", officialCode: null, communeCoverage: "none", name: { fr: "El Kantara", en: "El Kantara", ar: "القنطرة" } },
  { id: "barika", officialCode: null, communeCoverage: "none", name: { fr: "Barika", en: "Barika", ar: "بريكة" } },
  { id: "bou-saada", officialCode: null, communeCoverage: "none", name: { fr: "Bou Saâda", en: "Bou Saâda", ar: "بوسعادة" } },
  { id: "bir-el-ater", officialCode: null, communeCoverage: "none", name: { fr: "Bir El Ater", en: "Bir El Ater", ar: "بئر العاتر" } },
  { id: "ksar-el-boukhari", officialCode: null, communeCoverage: "none", name: { fr: "Ksar El Boukhari", en: "Ksar El Boukhari", ar: "قصر البخاري" } },
  { id: "ksar-chellala", officialCode: null, communeCoverage: "none", name: { fr: "Ksar Chellala", en: "Ksar Chellala", ar: "قصر الشلالة" } },
  { id: "ain-oussera", officialCode: null, communeCoverage: "none", name: { fr: "Aïn Oussera", en: "Aïn Oussera", ar: "عين وسارة" } },
  { id: "messaad", officialCode: null, communeCoverage: "none", name: { fr: "Messaad", en: "Messaad", ar: "مسعد" } },
];
