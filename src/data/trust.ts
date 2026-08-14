/* ---------------------------------------------------------------------------
   TRUST EVIDENCE — modelled in the DATA, not only in the labels (§41).

   Audit 1.1 kept trust provenance as a rendering rule: a component decided
   which of four bylines to print. That works until two screens disagree. §41
   asks for the category to travel WITH the fact, so a claim cannot be moved to
   a different screen and quietly change what it is evidence of.

   The four sources, and what each one costs to produce:

     declared   someone typed it. Free. Says nothing about whether it is true.
     verified   Nidz ran a defined check with a traceable result.
     community  other people who actually used Nidz said it.
     platform   Nidz computed it from activity it can observe.

   WHAT EXISTS TODAY: `declared`, and `community` ONLY inside the demo
   fixtures, where the sitters are openly fictional and their reviews are part
   of the same fiction. Nothing is `verified` and nothing is `platform`,
   because no process and no counter exists to produce either.

   The gap between "we have a type for it" and "we have one" is the whole
   point of this file. Having `verified` in the union does not make anything
   verified, and `BADGE_CRITERIA` below defines badges that are deliberately
   never awarded.
   ------------------------------------------------------------------------ */

export type EvidenceSource = "declared" | "verified" | "community" | "platform";

/** Sources with a real mechanism behind them right now. */
export const AVAILABLE_SOURCES: readonly EvidenceSource[] = ["declared", "community"];

export function hasMechanism(source: EvidenceSource): boolean {
  return AVAILABLE_SOURCES.includes(source);
}

/* ---------------------------------------------------------- verification */

/**
 * The states a verification moves through (§66).
 *
 * All six are defined because a partial implementation is how "submitted"
 * quietly starts being rendered as "verified". None of them is reachable
 * today: Nidz runs no checks. `not_started` is the only value any real record
 * holds.
 */
export type VerificationState =
  | "not_started"
  | "submitted"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

/** In the order a verification would move through them. Exported so the sitter
    can be SHOWN the model rather than have it exist only in this file: a
    process nobody can see is indistinguishable from a process that will never
    be built, and §66 asks for the states to be stated. */
export const VERIFICATION_STATES: readonly VerificationState[] = [
  "not_started",
  "submitted",
  "pending",
  "verified",
  "rejected",
  "expired",
];

export type VerificationDomain = "phone" | "email" | "identity" | "credential";

export const VERIFICATION_DOMAINS: readonly VerificationDomain[] = [
  "phone",
  "email",
  "identity",
  "credential",
];

/**
 * What Nidz would verify, and what it actually does.
 *
 * Every entry is `not_started` and there is no code path that changes one.
 * Adding a transition means adding the process behind it in the same change —
 * otherwise a state machine becomes a costume.
 */
export const VERIFICATION_STATUS: Record<VerificationDomain, VerificationState> = {
  phone: "not_started",
  email: "not_started",
  identity: "not_started",
  credential: "not_started",
};

/* --------------------------------------------------------------- badges */

/**
 * Badge DEFINITIONS, with nothing awarded.
 *
 * §42 requires every badge to carry an identifier, a label, a reason, an
 * evidence source, a criteria definition, a state and a review policy. Writing
 * the criteria down first is what stops a badge from being invented backwards
 * to fit a screen that looked empty.
 *
 * §43 is the other half: none of these may become a ranking input. A sitter
 * must not rank first because they already rank first.
 */
export type BadgeDefinition = {
  id: string;
  /** i18n key for the label shown to a user. */
  labelKey: string;
  /** What kind of evidence could ever award it. */
  source: EvidenceSource;
  /** The rule, in plain terms, as an i18n key. A badge whose criteria cannot
      be written in one sentence is a badge nobody can contest. */
  criteriaKey: string;
  /** Whether Nidz can currently produce the evidence. All false. */
  awardable: false;
};

export const BADGE_CRITERIA: readonly BadgeDefinition[] = [
  {
    id: "identity-verified",
    labelKey: "trust.badge.identityVerified.label",
    source: "verified",
    criteriaKey: "trust.badge.identityVerified.criteria",
    awardable: false,
  },
  {
    id: "credential-verified",
    labelKey: "trust.badge.credentialVerified.label",
    source: "verified",
    criteriaKey: "trust.badge.credentialVerified.criteria",
    awardable: false,
  },
  {
    id: "experienced-sitter",
    labelKey: "trust.badge.experienced.label",
    source: "platform",
    criteriaKey: "trust.badge.experienced.criteria",
    awardable: false,
  },
  {
    id: "responsive",
    labelKey: "trust.badge.responsive.label",
    source: "platform",
    criteriaKey: "trust.badge.responsive.criteria",
    awardable: false,
  },
];

/** No badge is awarded to anybody. Kept as a function rather than an empty
    array literal so the call sites read as a question being asked, and so the
    day one becomes awardable there is one place to change. */
export function badgesFor(): readonly BadgeDefinition[] {
  return BADGE_CRITERIA.filter((badge) => badge.awardable);
}
