/* ---------------------------------------------------------------------------
   ALGERIAN ADMINISTRATIVE REFERENCE — PROVENANCE.

   This file exists because the audit is explicit that geography must never be
   fabricated, and that a dataset may only be committed alongside its source,
   its source date, the territorial version it reflects and the date it was
   verified. It records all four, INCLUDING what could not be verified.

   Read `KNOWN_GAPS` before treating anything here as authoritative.
   ------------------------------------------------------------------------ */

export type ReferenceLayer = {
  /** What this layer covers. */
  scope: string;
  /** Where the values came from. */
  source: string;
  /** What was actually checked, and against what. */
  verification: string;
  /** Whether the layer has been checked against a primary Algerian source
      (the Journal Officiel or a ministry publication). */
  verifiedAgainstPrimarySource: boolean;
};

export const GEOGRAPHY_METADATA = {
  /** Bump when the shape or the contents change materially. */
  datasetVersion: "1.3.1",
  /** When this file was assembled and checked. */
  compiledOn: "2026-11-23",

  /**
   * The territorial division this reference is built against.
   *
   * Algeria's division has changed twice in six years, which is exactly why
   * the design system calls this external data that goes stale rather than a
   * constant. 48 wilayas (1984) → 58 (loi 19-12, 11 December 2019) → 69
   * (loi 26-06, published in the Journal Officiel on 4 April 2026, announced
   * in the Council of Ministers on 16 November 2025).
   */
  territorialVersion: {
    wilayaCount: 69,
    establishedBy: "Loi n° 26-06",
    publishedInJournalOfficiel: "2026-04-04",
    announced: "2025-11-16",
    /* The 11 new wilayas' transfer of competences runs to 31 December 2026,
       with the parent wilayas continuing to administer them meanwhile. So the
       COMMUNE-level consequences of this reform are still in transition. */
    transitionEnds: "2026-12-31",
    previousDivision: {
      wilayaCount: 58,
      establishedBy: "Loi n° 19-12",
      dated: "2019-12-11",
    },
  },

  layers: {
    wilayas: {
      scope: "All 69 wilayas.",
      source:
        "Names and codes 01–58 from the division established by loi 19-12 (2019), cross-checked against a community dataset that cites the Ministry of the Interior. The eleven wilayas created by loi 26-06 were taken from concordant press reporting of the law.",
      verification:
        "The 58 established wilayas are internally consistent across sources and their names are stable and widely attested. For the eleven new wilayas only the NAMES are concordant across the sources consulted — see KNOWN_GAPS.newWilayaCodes.",
      verifiedAgainstPrimarySource: false,
    } satisfies ReferenceLayer,

    communes: {
      scope: "All 1 541 communes, under all 69 wilayas.",
      source:
        "Membership — which wilaya each commune belongs to — is read from the Journal Officiel wherever a law re-drew the map: loi 19-12 (JO n° 78, 18 December 2019) for the ten 2019 wilayas and their seven parents, loi 26-06 (JO n° 25, 5 April 2026) for the eleven 2026 wilayas and their ten parents. Everywhere else it is the 1984 division, which those laws left untouched. Names: the Journal Officiel's French spelling for the 539 communes those two laws list, and the MIT-licensed dzcode-io/leblad dataset (v1.0.3, data v1.1) for the others. Arabic names: leblad. The six El Bayadh communes leblad omits are named in loi 26-06 itself; their Arabic names are the usual spellings, checked against othmanus/algeria-cities for those six rows only. The ten wilayas Nidz already carried keep their rows exactly as they were.",
      verification:
        "Every commune count was checked against the count the law states: 21/21 wilayas named by loi 26-06 and 17/17 still-current wilayas named by loi 19-12 match their article, and the total is the 1 541 that both laws state in their article 3. Each Journal Officiel name was paired with a leblad commune of the same parent wilaya; every pair that was not an exact spelling match was reviewed by hand, and the Arabic name was used to confirm the four leblad abbreviations corrected here (B. B. Arreridj, M Chedallah, Ben M Hidi, El Fedjoudj Boughrara Sa). Names outside the two laws, and the membership of the 31 wilayas neither law touched (taken from leblad's 1984 division; their per-wilaya counts agree with othmanus/algeria-cities, and with the JO counts they sum to the law's 1 541), were not checked line by line against a primary source — so this layer is PARTLY, not wholly, verified against the Journal Officiel.",
      verifiedAgainstPrimarySource: false,
    } satisfies ReferenceLayer,
  },
} as const;

/**
 * What this reference does NOT establish. Kept in code, not in a document that
 * drifts, because these are the claims a future contributor is most likely to
 * make on its behalf by accident.
 */
export const KNOWN_GAPS = {
  /**
   * THE CODES OF THE ELEVEN NEW WILAYAS ARE NOT INCLUDED, DELIBERATELY.
   *
   * The eleven names are concordant across every source consulted. The code
   * assignment is not: two otherwise-reliable sources give completely
   * different numbers for the same eleven names (one has 60 Barika / 68 Bou
   * Saâda, another has 63 Barika / 64 Bou Saâda). One of them is wrong and
   * nothing available here decides which.
   *
   * So `officialCode` is `null` for those eleven, which is what the design
   * system asks for — a stable internal id always, an official code only where
   * verified. Nothing in Nidz depends on the number.
   *
   * To close this: read the code list in loi 26-06 in the Journal Officiel.
   */
  newWilayaCodes: true,

  /**
   * COMMUNE COVERAGE IS COMPLETE; WHAT IS NOT GUARANTEED IS THE SPELLING.
   *
   * Audit 1.3.1 closed the old gap (ten wilayas out of 69) with sources that
   * can be committed: the Journal Officiel for membership — public law — and
   * dzcode-io/leblad (MIT) for names and Arabic names. Two datasets were
   * consulted and NOT copied: othmanus/algeria-cities declares no licence, and
   * oussamidat/algerie-decoupage-administratif is ODbL, whose share-alike
   * terms this repository does not take on. They were used only to locate the
   * Journal Officiel texts and to cross-check counts — and the Journal
   * Officiel disagrees with othmanus on two communes (Tabelbala belongs to
   * Béni Abbès and El Borma to Touggourt), so the law was followed.
   *
   * What remains open:
   *
   *   - Names outside loi 19-12 and loi 26-06 are leblad's transliteration,
   *     not the Journal Officiel's. A commune may be spelled differently in a
   *     later decree (some were renamed after 1991).
   *   - Arabic names are leblad's, not the Arabic edition of the JO.
   *   - The 2026 wilayas are administered by their parent wilayas until
   *     31 December 2026 (loi 26-06, art. 54). Nidz lists each commune under
   *     the wilaya the law assigns it to, not the one still running it.
   *
   * None of this is a claim about where Nidz operates: see COVERAGE_IS_NOT_SUPPLY.
   */
  completeCommuneList: false,

  /**
   * ARABIC NAMES FOR THE ELEVEN NEW WILAYAS were written from the standard
   * Arabic spellings of towns that already existed, not lifted from an
   * official list. They are not machine-invented, but they are not sourced
   * from the Journal Officiel either.
   */
  newWilayaArabicNames: true,
} as const;

/**
 * Coverage is not supply.
 *
 * Having all 69 wilayas here says nothing about whether anyone offers care in
 * them. No screen may turn this dataset into a claim of national coverage
 * (§33) — a search in an area with no sitters shows an honest empty state.
 */
export const COVERAGE_IS_NOT_SUPPLY = true;
