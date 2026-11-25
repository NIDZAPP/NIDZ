/**
 * APPROXIMATE position of each wilaya's chef-lieu (town centre), in decimal
 * degrees — Nidz 1.7, for proximity ORDERING only.
 *
 * READ `KNOWN_GAPS` IN `metadata.ts`. These are not survey data: they were
 * compiled from general geographic knowledge of each chef-lieu for 1.7 and
 * have not been checked against a primary Algerian source. They are good to
 * a few kilometres for a town centre, which is what they are used for:
 *
 *   - ordering sitters and published requests from other wilayas, nearest
 *     first, when nothing nearer is available;
 *   - suggesting the wilaya nearest a device position, which the person then
 *     confirms or corrects.
 *
 * They are NEVER shown as a distance or a position, and never stored with a
 * person's record: a chef-lieu is not where anybody lives, and a border town
 * can be nearer another wilaya's chef-lieu than its own.
 */
export const WILAYA_POSITIONS: Readonly<Record<string, readonly [number, number]>> = {
  adrar: [27.874, -0.294],
  chlef: [36.165, 1.334],
  laghouat: [33.8, 2.865],
  "oum-el-bouaghi": [35.877, 7.113],
  batna: [35.556, 6.174],
  bejaia: [36.751, 5.056],
  biskra: [34.851, 5.728],
  bechar: [31.617, -2.217],
  blida: [36.47, 2.828],
  bouira: [36.375, 3.902],
  tamanrasset: [22.785, 5.523],
  tebessa: [35.404, 8.124],
  tlemcen: [34.878, -1.315],
  tiaret: [35.371, 1.317],
  "tizi-ouzou": [36.712, 4.046],
  alger: [36.754, 3.059],
  djelfa: [34.673, 3.263],
  jijel: [36.82, 5.766],
  setif: [36.19, 5.41],
  saida: [34.831, 0.152],
  skikda: [36.876, 6.909],
  "sidi-bel-abbes": [35.19, -0.631],
  annaba: [36.9, 7.766],
  guelma: [36.462, 7.426],
  constantine: [36.365, 6.615],
  medea: [36.264, 2.754],
  mostaganem: [35.931, 0.089],
  msila: [35.706, 4.542],
  mascara: [35.397, 0.14],
  ouargla: [31.949, 5.325],
  oran: [35.697, -0.633],
  "el-bayadh": [33.683, 1.019],
  illizi: [26.508, 8.48],
  "bordj-bou-arreridj": [36.073, 4.761],
  boumerdes: [36.766, 3.477],
  "el-tarf": [36.767, 8.314],
  tindouf: [27.671, -8.147],
  tissemsilt: [35.607, 1.811],
  "el-oued": [33.368, 6.867],
  khenchela: [35.436, 7.143],
  "souk-ahras": [36.286, 7.951],
  tipaza: [36.589, 2.447],
  mila: [36.45, 6.264],
  "ain-defla": [36.264, 1.968],
  naama: [33.267, -0.313],
  "ain-temouchent": [35.297, -1.14],
  ghardaia: [32.491, 3.674],
  relizane: [35.737, 0.556],
  timimoun: [29.263, 0.231],
  "bordj-badji-mokhtar": [21.328, 0.954],
  "ouled-djellal": [34.418, 5.064],
  "beni-abbes": [30.131, -2.167],
  "in-salah": [27.197, 2.468],
  "in-guezzam": [19.573, 5.77],
  touggourt: [33.105, 6.064],
  djanet: [24.554, 9.485],
  "el-meghaier": [33.953, 5.924],
  "el-menia": [30.583, 2.88],
  aflou: [34.113, 2.101],
  "el-abiodh-sidi-cheikh": [32.896, 0.546],
  "el-aricha": [34.222, -1.265],
  "el-kantara": [35.221, 5.708],
  barika: [35.389, 5.366],
  "bou-saada": [35.214, 4.174],
  "bir-el-ater": [34.744, 8.06],
  "ksar-el-boukhari": [35.889, 2.749],
  "ksar-chellala": [35.212, 2.318],
  "ain-oussera": [35.452, 2.906],
  messaad: [34.154, 3.503],
};

const RADIUS_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km. Internal: an ORDERING key, never displayed. */
export function haversineKm(a: readonly [number, number], b: readonly [number, number]): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Approximate distance between two wilayas' chefs-lieux; Infinity when one
    is unknown, so an unplaceable wilaya sorts last rather than first. */
export function wilayaDistanceKm(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  if (a === b) return 0;
  const pa = WILAYA_POSITIONS[a];
  const pb = WILAYA_POSITIONS[b];
  return pa && pb ? haversineKm(pa, pb) : Number.POSITIVE_INFINITY;
}

/** The wilaya whose chef-lieu is nearest a device position — a SUGGESTION
    the person confirms (see the header). Null outside a plausible range of
    Algeria (more than 400 km from every chef-lieu). */
export function nearestWilaya(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best: string | null = null;
  let bestKm = Number.POSITIVE_INFINITY;
  for (const [id, position] of Object.entries(WILAYA_POSITIONS)) {
    const km = haversineKm([lat, lng], position);
    if (km < bestKm) {
      bestKm = km;
      best = id;
    }
  }
  return bestKm <= 400 ? best : null;
}
