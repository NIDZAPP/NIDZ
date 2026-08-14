/* ---------------------------------------------------------------------------
   REVIEWS — marketplace evidence, not decoration (§44-46).

   A review is what someone said after a stay that actually happened. That
   sentence is the whole specification, and it has two consequences the code
   has to enforce rather than merely document:

   1. A REVIEW IMPLIES A COMPLETED INTERACTION. It is therefore not something
      an owner can leave on a whim, and not something Nidz can show for a
      sitter nobody has used. Every review here carries the care it followed.

   2. NO STARS FOR A SITTER NOBODY HAS RATED. §46 is explicit: a new sitter
      shows "New on Nidz", never `0.0`, because a zero renders as a bad score
      rather than an absent one. `summarise` returns `null` for an empty list
      precisely so that no caller can average nothing into a number.

   WHERE THESE COME FROM TODAY: the demo fixtures only. Those sitters are
   openly fictional and their reviews are part of the same fiction — which is
   why `Review` carries `isDemoFixture` and every surface that renders one says
   so. A profile the visitor builds has no reviews at all, and gets the cold
   start. That is not a gap in the demo; it is the honest state of a sitter
   nobody has used yet, and it is the state most real sitters will be in.

   Reviews, external references and verification are three different things
   (§45) and are never merged into one flattering score.
   ------------------------------------------------------------------------ */

import type { CareType } from "./types";

/** Whole stars only. A half-star average is a precision claim about a
    subjective judgement. */
export type Rating = 1 | 2 | 3 | 4 | 5;
export const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];

export type Review = {
  id: string;
  sitterId: string;
  /** Public identity of the author, same convention as everywhere else: first
      name and an initial (§27). Never a full legal name. */
  authorName: string;
  rating: Rating;
  /** The author's own words. Nidz does not translate user content, so this is
      one string, not a `Localized`. */
  body: string;
  /** ISO date of the review. */
  createdAt: string;
  /** The service this followed, so a reader can tell a boarding review from a
      walk review — a five-star walk says little about a two-week stay. */
  careType: CareType;
  /** The sitter's reply, when they made one. Threaded under the review rather
      than presented as a second opinion. */
  reply: { body: string; createdAt: string } | null;
  /** True for reviews shipped as part of a demo fixture. Read by every surface
      that renders one, exactly like `SitterProfile.isDemoFixture`. */
  isDemoFixture: boolean;
};

export type ReviewSummary = {
  count: number;
  /** Mean rating, rounded to one decimal for display only. */
  average: number;
  /** How many reviews at each star level, 1..5. The shape of the opinion
      matters more than its mean: four fives and one one is not a four. */
  distribution: Record<Rating, number>;
};

/**
 * Summarise a review list, or `null` when there is nothing to summarise.
 *
 * Returning `null` rather than a zeroed summary is the mechanism behind §46.
 * A caller cannot accidentally render "0.0 ★ (0)" for a new sitter, because
 * there is no object to read those fields off.
 */
export function summarise(reviews: readonly Review[]): ReviewSummary | null {
  if (reviews.length === 0) return null;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<Rating, number>;
  let total = 0;
  for (const review of reviews) {
    distribution[review.rating] += 1;
    total += review.rating;
  }

  return {
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
    distribution,
  };
}

/** Newest first. A review's usefulness decays, and a reader deciding today
    cares most about what happened most recently. */
export function byNewest(reviews: readonly Review[]): Review[] {
  return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function reviewsFor(reviews: readonly Review[], sitterId: string): Review[] {
  return byNewest(reviews.filter((review) => review.sitterId === sitterId));
}
