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
  datasetVersion: "1.2.0",
  /** When this file was assembled and checked. */
  compiledOn: "2026-08-14",

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
      scope:
        "Complete commune lists for ten wilayas only: Alger, Oran, Blida, Constantine, Annaba, Sétif, Tizi Ouzou, Béjaïa, Boumerdès, Tipaza. 371 communes.",
      source:
        "Transcribed from a community dataset (othmanus/algeria-cities) that cites the Ministry of the Interior, reflecting the 58-wilaya division of loi 19-12.",
      verification:
        "The commune COUNT for each of the ten wilayas was checked against independently published figures and matched in every case (Alger 57, Oran 26, Blida 25, Constantine 12, Annaba 12, Sétif 60, Tizi Ouzou 67, Béjaïa 52, Boumerdès 32, Tipaza 28). Individual names were not checked line by line against a primary source.",
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
   * COMMUNE COVERAGE IS PARTIAL, AND THAT IS A DELIBERATE STOP, NOT AN
   * OVERSIGHT.
   *
   * Algeria has 1 541 communes. A complete, internally consistent list exists
   * in more than one community dataset, and the counts spot-checked here match
   * published figures — but none of the candidates was usable as committed
   * reference data:
   *
   *   - othmanus/algeria-cities — 58 wilayas, 1 541 communes, consistent, and
   *     it cites the Ministry of the Interior. It declares NO LICENCE, so it
   *     cannot be redistributed inside this repository. It was used here only
   *     to cross-check the ten wilayas Nidz actually covers.
   *   - ihahachi/Algeria-Cities — claims all 69 wilayas, but states no source,
   *     no method and no date, and invites contributors to correct its data.
   *   - dzcode-io/leblad — MIT licensed, but still on the 48-wilaya division
   *     abolished in 2019.
   *
   * On top of the licensing problem, none of them reflects the commune-level
   * consequences of loi 26-06, whose transition runs to 31 December 2026.
   *
   * To close this: obtain the commune list from a primary Algerian source, or
   * confirm redistribution terms with the maintainer of a complete dataset.
   * The architecture takes it as a data edit — `communes.ts` and the
   * `communeCoverage` flag on each wilaya are the only things that change.
   */
  completeCommuneList: true,

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
