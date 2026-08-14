import type { Localized } from "./types";

/* ---------------------------------------------------------------------------
   THE CARE PORTFOLIO — evidence of care, not a social network (§47-49).

   What it is for: showing that this person has actually looked after animals,
   and what that looks like in their home. A sitter with no reviews yet can
   still be assessable if you can see how they set up a room, how they walk a
   dog, what a stay actually involves.

   WHAT IT IS NOT, and this is enforced by absence rather than by policy:
   there are no followers, no follower count, no likes, no stories, no
   reposting, no public comments, no ranking and no feed (§49). None of those
   fields exist here, so none of them can be rendered.

   CONSENT IS A STATE, NOT AN ASSUMPTION (§48).

   A photograph of an owner's animal belongs to that owner as much as to the
   sitter who took it. Uploading one, or sending it in a message, is not
   permission to publish it — so a portfolio item starts `private` and only a
   granted consent moves it to `public`. Withdrawal is a state of its own
   rather than a deletion, because "they changed their mind" and "it was never
   asked" are different facts and a system that conflates them cannot be
   audited.

   WHAT NIDZ CANNOT DO ABOUT THIS TODAY: enforce any of it. There is no
   backend, so consent is a field a browser holds, and nothing stops a
   determined person editing it. The states are real; the enforcement is not,
   and no screen may imply otherwise.
   ------------------------------------------------------------------------ */

import type { Species } from "./types";

/**
 * Where a photo stands with the person whose animal is in it.
 *
 * `private` is the starting point for everything, including a photo the sitter
 * took themselves — because they cannot tell from the file whose animal it is.
 */
export type ConsentState =
  | "private"
  | "consent_requested"
  | "consent_granted"
  | "public"
  | "consent_withdrawn";

/** Only one state means "may be shown to anyone". */
export function isPublishable(consent: ConsentState): boolean {
  return consent === "public";
}

/** What the item shows. Not a mood board: each is a kind of care. */
export type PortfolioActivity =
  | "walk"
  | "enrichment"
  | "homeStay"
  | "feeding"
  | "play"
  | "careSetup";

export const PORTFOLIO_ACTIVITIES: readonly PortfolioActivity[] = [
  "walk",
  "enrichment",
  "homeStay",
  "feeding",
  "play",
  "careSetup",
];

export type PortfolioItem = {
  id: string;
  sitterId: string;
  /**
   * The image.
   *
   * For a fixture this is a description rather than a file: Nidz has no
   * consented photography, and a stock photograph presented as a real stay is
   * the anti-pattern §21 and §40 name. For an item the visitor adds it is an
   * object URL — never uploaded, never persisted.
   */
  imageUrl?: string;
  /** The sitter's own words about what is happening. */
  /** The sitter's own words about the moment. `Localized` like every other
      free-text field on a profile — a fixture is authored in all three
      languages, and what a real sitter types goes into all three slots. */
  caption: Localized;
  createdAt: string;
  species: Species;
  activity: PortfolioActivity;
  consent: ConsentState;
  isDemoFixture: boolean;
};

/** Only what may actually be shown, newest first. The filter is applied here
    rather than at each call site so a screen cannot forget it. */
export function publicItemsFor(
  items: readonly PortfolioItem[],
  sitterId: string,
): PortfolioItem[] {
  return items
    .filter((item) => item.sitterId === sitterId && isPublishable(item.consent))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
