/* ---------------------------------------------------------------------------
   DEMO STATE — the whole application's mutable state, in one reducer.

   WHAT THIS IS NOT: it is not an account system, not a session, not a
   security boundary and not a backend. It is browser-local state that makes
   the demonstration coherent — the request an "owner" sends is literally the
   same object the "sitter" answers, because there is only one of it.

   Nothing here is transmitted anywhere. There is no server in this project,
   so "creating an account" writes a name into localStorage and nothing else,
   and every screen that touches it has to say so.

   Chosen over Redux/Zustand deliberately: this is one reducer with a dozen
   actions behind a context. Adding a store library would be a dependency for
   an effect the platform already provides (design system §33.12).
   ------------------------------------------------------------------------ */

import {
  EMPTY_NEED,
  asLocalized,
  type CareRequest,
  type DateRange,
  type Localized,
  type OwnerNeed,
  type Pet,
  type RequestStatus,
  type SitterProfile,
  type Species,
} from "@/data/types";
import type { AppLocale } from "@/i18n";
import { emptyCareConditions, restoreCareConditions } from "@/data/care-conditions";
import { forSharing, restorePet } from "@/data/pets";
import { restoreRequestDraft, type RequestDraft } from "@/data/request-draft";
import { canClarify, restoreThread, type ClarificationMessage } from "@/data/clarification";
import {
  NO_CAPABILITIES,
  isWorkspace,
  type AccountCapabilities,
  type Workspace,
} from "@/data/workspace";

/** Bumped twice by Audit 1.2: v2 added account capabilities and an active
    workspace, v3 turned the flat pet into a species discriminated union. A
    version this code does not recognise is discarded rather than read
    optimistically, so a returning visitor never crashes on a renamed field.

    Pets need no version branch of their own: `restorePet` reads every shape
    Nidz has shipped and runs on every path that reaches `restore`. */
const STORAGE_VERSION = 3;

/** Versions whose records this build can read in full.
 *
 * v2 differs from v3 only in the pet shape, which `restorePet` normalises, so
 * a v2 record is upgraded on read rather than thrown away. Anything outside
 * this list is discarded — see `loadState`. */
const READABLE_VERSIONS: readonly number[] = [2, 3];

/** The version now lives INSIDE the record rather than in the key, so future
    versions migrate in place instead of orphaning the previous one. */
const STORAGE_KEY = "nidz.demo";

/** Audit 1.1's key. Read once, migrated, then removed — see `loadState`. */
const LEGACY_STORAGE_KEY = "nidz.demo.v1";

/**
 * A local, unverified identity — a name typed into this browser.
 *
 * Nothing here was checked by anybody. There is no sign-in, no session, no
 * token and no verification of any field, and no surface may suggest
 * otherwise.
 *
 * Audit 1.2 replaced `phoneConfirmed` with `accountComplete`. The old name
 * described a SIMULATED code step, and every guard in the app was really
 * asking "did this person finish the account steps" — so the field now says
 * that, and the simulated verification it was named after is gone (§92: with
 * no OTP provider, never claim a code was sent).
 */
export type DemoAccount = {
  firstName: string;
  lastName: string;
  /** ISO `YYYY-MM-DD`. **Private.** Required by §16 and held against a future
      eligibility rule — there is no age rule today, and no code reads this
      field for anything. Never rendered on any surface (§95). */
  dateOfBirth: string | null;
  /** Where this person is, at administrative granularity. Nidz holds no exact
      address for anyone, so there is nothing more precise to leak (§29). */
  wilayaId: string | null;
  communeId: string | null;
  /** Which animals they have. Multi-select — one household is often not one
      species. Used to make the first search relevant, never as a claim about
      the animals themselves. */
  ownedSpecies: Species[];
  /** Optional and unverified. Private by default: it is never exchanged with
      another user without explicit consent (§78). */
  phoneNumber: string;
  /** The account steps were completed. NOT a verification of anything. */
  accountComplete: boolean;
  createdAt: string;
};

/** The sitter's own profile-in-progress. `idDocument` records only that a
    file was chosen locally. It is never uploaded and it NEVER becomes a
    verification: an added document means "vérification en attente" and
    nothing more (Audit p.449). */
export type SitterWorkspace = {
  profile: SitterProfile;
  published: boolean;
  idDocument: { fileName: string; addedAt: string } | null;
};

export type DemoState = {
  version: number;
  /** The intro has been seen — a returning visitor is not shown it again. */
  entered: boolean;
  account: DemoAccount | null;
  /**
   * What this account is ABLE to do. Both may be true; that is the point.
   *
   * `owner` is granted when the quick owner account is created. `sitter` is
   * granted when a sitter profile exists at all — starting the builder opens
   * the workspace, even before anything is published. Whether a sitter
   * DESTINATION is worth navigating to is a different and narrower question,
   * answered by `sitter.published` in `workspace-nav.ts`.
   */
  capabilities: AccountCapabilities;
  /**
   * Which side the visitor is currently looking at.
   *
   * Separate from `capabilities` on purpose: this is a view, not an identity,
   * and switching it must never discard the other side's data.
   */
  activeWorkspace: Workspace;
  need: OwnerNeed;
  pets: Pet[];
  requests: CareRequest[];
  sitter: SitterWorkspace | null;
  /**
   * The request the owner was last preparing, as a bookmark to its URL.
   *
   * Not a request: it has no status and nobody else can see it. It lets an
   * owner who wandered off mid-request find the same sitter again instead of
   * starting over (Audit 1.3 LOT 01). See `src/data/request-draft.ts` for why
   * the URL, not this record, is the source of truth.
   *
   * Added without a version bump: it is additive, and a record written before
   * it simply has none.
   */
  requestDraft: RequestDraft | null;
};

export const INITIAL_STATE: DemoState = {
  version: STORAGE_VERSION,
  entered: false,
  account: null,
  capabilities: NO_CAPABILITIES,
  /* Owner is the honest default: it is the only side a visitor can use without
     having built anything. */
  activeWorkspace: "owner",
  need: EMPTY_NEED,
  pets: [],
  requests: [],
  sitter: null,
  requestDraft: null,
};

export function emptySitterProfile(id: string): SitterProfile {
  return {
    id,
    publicName: "",
    communeCode: "",
    headline: { fr: "", en: "", ar: "" },
    about: { fr: "", en: "", ar: "" },
    /* Every question unanswered. `unknown` is not a default answer — it is
       the absence of one, and the profile renders it as absence (§54). */
    experience: {
      years: 0,
      species: [],
      puppiesKittens: "unknown",
      seniors: "unknown",
      specialNeeds: "unknown",
      oralMedication: "unknown",
      multipleAnimals: "unknown",
      reactiveAnimals: "unknown",
      paidBefore: "unknown",
      volunteered: "unknown",
    },
    /* `kind: null` is "not asked yet". "No professional background" is the
       separate, deliberate answer `"none"`. */
    professional: {
      kind: null,
      detail: { fr: "", en: "", ar: "" },
      years: null,
      canEvidence: "unknown",
    },
    services: [],
    rates: {},
    acceptedSpecies: [],
    acceptedDogSizes: [],
    maxAnimals: 1,
    confirmedSections: [],
    /* Unanswered, not "apartment with no outdoor space". Seeding a value here
       pre-selected it in the builder — teal border and check glyph, this
       system's own signal for "you chose this" — and published it as a
       declaration on the profile. */
    housing: {
      type: null,
      outdoor: null,
      residentPets: [],
      canSeparateAnimals: "unknown",
      conditions: null,
    },
    care: emptyCareConditions(),
    limits: [],
    declaredUnavailable: [],
    /** The person's own profile is not an example — the demo marker belongs
        to the fixtures, not to what the user typed. */
    isDemoFixture: false,
  };
}

export type DemoAction =
  | { type: "enter" }
  | { type: "setWorkspace"; workspace: Workspace }
  | { type: "setNeed"; patch: Partial<OwnerNeed> }
  | { type: "savePet"; pet: Pet }
  | { type: "removePet"; id: string }
  | { type: "setAccount"; account: DemoAccount }
  | { type: "completeAccount" }
  | { type: "addRequest"; request: CareRequest }
  | { type: "touchRequestDraft"; sitterId: string; search: string }
  | { type: "handoffPet"; sitterId: string; search: string; petId: string }
  | { type: "consumePetHandoff" }
  | { type: "discardRequestDraft" }
  | { type: "respondToRequest"; id: string; status: Exclude<RequestStatus, "pending"> }
  | { type: "addClarification"; id: string; message: ClarificationMessage }
  | { type: "startSitterProfile"; id: string }
  | { type: "patchSitterProfile"; patch: Partial<SitterProfile> }
  | { type: "setIdDocument"; fileName: string }
  | { type: "clearIdDocument" }
  | { type: "publishSitterProfile" }
  | { type: "reset" };

export function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "enter":
      return { ...state, entered: true };

    /* Changes the view only. Capabilities and every slice of data are left
       exactly as they are — switching to the sitter side must never look like
       giving up being an owner. */
    case "setWorkspace":
      return { ...state, activeWorkspace: action.workspace };

    case "setNeed":
      return { ...state, need: { ...state.need, ...action.patch } };

    case "savePet": {
      const exists = state.pets.some((p) => p.id === action.pet.id);
      return {
        ...state,
        pets: exists ? state.pets.map((p) => (p.id === action.pet.id ? action.pet : p)) : [...state.pets, action.pet],
      };
    }

    case "removePet":
      return {
        ...state,
        pets: state.pets.filter((p) => p.id !== action.id),
        /* A brief pointing at a deleted animal is a brief about nothing. The
           species stays — it is still what the owner was looking for — but the
           reference is cleared rather than left dangling for `/search` and the
           request summary to resolve to null. Requests already sent keep their
           own COPY of the pet, so deleting an animal never rewrites what a
           sitter was asked to look after. */
        need: state.need.petId === action.id ? { ...state.need, petId: null } : state.need,
      };

    case "setAccount":
      /* Creating the account is what grants the owner capability. It is a fact
         about what this person can now do — send a request — not a claim about
         who they are, and it never revokes the sitter side. */
      return {
        ...state,
        account: action.account,
        capabilities: { ...state.capabilities, owner: true },
      };

    case "completeAccount":
      return state.account ? { ...state, account: { ...state.account, accountComplete: true } } : state;

    case "addRequest":
      return {
        ...state,
        requests: [action.request, ...state.requests],
        /* Sent, so no longer in preparation. A draft for a DIFFERENT sitter is
           left alone: it is still unsent. */
        requestDraft:
          state.requestDraft?.sitterId === action.request.sitterId ? null : state.requestDraft,
      };

    case "touchRequestDraft": {
      const current = state.requestDraft;
      /* Same sitter, same URL: nothing to record. Returning the same object
         matters — the summary dispatches this from an effect, and a fresh
         object on every render would be a render loop. */
      if (current && current.sitterId === action.sitterId && current.search === action.search) return state;
      return {
        ...state,
        requestDraft: {
          sitterId: action.sitterId,
          search: action.search,
          /* A hand-off addressed to this sitter survives a URL change; one for
             another sitter is meaningless once the owner moved on. */
          petHandoff: current?.sitterId === action.sitterId ? current.petHandoff : null,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    case "handoffPet":
      return {
        ...state,
        requestDraft: {
          sitterId: action.sitterId,
          search:
            state.requestDraft?.sitterId === action.sitterId ? state.requestDraft.search : action.search,
          petHandoff: action.petId,
          updatedAt: new Date().toISOString(),
        },
      };

    case "consumePetHandoff":
      return state.requestDraft?.petHandoff
        ? { ...state, requestDraft: { ...state.requestDraft, petHandoff: null } }
        : state;

    case "discardRequestDraft":
      return state.requestDraft ? { ...state, requestDraft: null } : state;

    case "addClarification":
      /* A question is added to a PENDING request and touches nothing else —
         not the status, the animal, the dates or the sitter. On a decided
         request it is refused: there is nothing left to clarify. */
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id && canClarify(r) && action.message.text
            ? { ...r, thread: [...(r.thread ?? []), action.message] }
            : r,
        ),
      };

    case "respondToRequest":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, status: action.status, respondedAt: new Date().toISOString() } : r,
        ),
      };

    case "startSitterProfile":
      /* Idempotent about the PROFILE — re-entering the flow must not wipe one
         in progress — but the capability is granted either way: opening the
         builder is what opens that side of the account.

         It deliberately does NOT move the active workspace. This fires from the
         first tap on the sitter introduction, before a single field is filled
         in, and moving the workspace there would permanently relocate `/` to an
         empty sitter inbox for anyone who tapped once and changed their mind —
         against the initial state's own reasoning that owner is the default
         precisely because it is the side you can use without having built
         anything. Publishing is what moves it. */
      return {
        ...state,
        capabilities: { ...state.capabilities, sitter: true },
        sitter:
          state.sitter ?? { profile: emptySitterProfile(action.id), published: false, idDocument: null },
      };

    case "patchSitterProfile":
      return state.sitter
        ? { ...state, sitter: { ...state.sitter, profile: { ...state.sitter.profile, ...action.patch } } }
        : state;

    case "setIdDocument":
      return state.sitter
        ? {
            ...state,
            sitter: {
              ...state.sitter,
              /* Adding a document does NOT set any verified flag anywhere.
                 There is no such flag, and there must not be one. */
              idDocument: { fileName: action.fileName, addedAt: new Date().toISOString() },
            },
          }
        : state;

    case "clearIdDocument":
      /* Back to null, not to an empty file name with a timestamp: on the one
         screen where "a document is present" must never be overstated, the
         state has to say plainly that none is. */
      return state.sitter ? { ...state, sitter: { ...state.sitter, idDocument: null } } : state;

    case "publishSitterProfile":
      /* Publishing is the moment the sitter side becomes somewhere with
         content, so it is the moment the account moves there. */
      return state.sitter
        ? { ...state, activeWorkspace: "sitter", sitter: { ...state.sitter, published: true } }
        : state;

    case "reset":
      return INITIAL_STATE;

    default:
      return state;
  }
}

/* --------------------------------------------------------------- storage */

/** Object URLs are revoked when the document unloads, so a persisted one
    points at nothing after a reload and renders a broken image. The photo is
    a live preview only — the rest of the pet survives.

    Requests are stripped too. A request carries a COPY of the pet, so the
    photo rode along into storage and stayed there as a dead `blob:` URL —
    quietly breaking the "never persisted" rule this comment states, and the
    F5 invariant in the regression checklist. */
function stripTransientFields(state: DemoState): DemoState {
  const sitter = state.sitter;
  return {
    ...state,
    pets: state.pets.map(({ photoUrl: _photoUrl, ...pet }) => pet),
    requests: state.requests.map((request) => ({
      ...request,
      pet: (({ photoUrl: _photoUrl, ...pet }) => pet)(request.pet) as CareRequest["pet"],
    })),
    sitter: sitter
      ? { ...sitter, profile: { ...sitter.profile, photoUrl: undefined } }
      : null,
  };
}

/**
 * localStorage is user-writable, so its contents are untrusted input, not
 * typed state. Without a shape check, `{"version":1,"pets":"x"}` would produce
 * a `DemoState` whose `pets` is a string and crash the persistence effect on
 * the next render — a white screen, because a hand-edited storage key should
 * never be able to take the app down. Each slice is validated independently so
 * one bad field costs only that field.
 */
/** The sitter workspace is the one slice whose shape reaches an unguarded
    `.filter`/`.some` — `/search` puts a published profile straight into the
    match pool — so a container check is not enough. Anything missing a
    required array or string is discarded rather than crashing the results. */
/**
 * A `Localized` record out of storage, or the fallback.
 *
 * Storage is untrusted input (B2), and this field in particular changed shape
 * mid-audit: a bare string is accepted and promoted rather than discarded, so
 * a sitter who typed their background before the change keeps it.
 */
function normaliseLocalized(value: unknown, fallback: Localized): Localized {
  if (typeof value === "string") return asLocalized(value);
  if (typeof value !== "object" || value === null) return fallback;
  const raw = value as Record<string, unknown>;
  const pick = (key: AppLocale) => (typeof raw[key] === "string" ? (raw[key] as string) : "");
  return { en: pick("en"), fr: pick("fr"), ar: pick("ar") };
}

function restoreSitter(value: unknown): SitterWorkspace | null {
  if (typeof value !== "object" || value === null) return null;
  const workspace = value as Record<string, unknown>;
  const profile = workspace.profile as Partial<SitterProfile> | undefined;
  if (!profile || typeof profile !== "object") return null;

  const arrays = [
    profile.services,
    profile.acceptedSpecies,
    profile.acceptedDogSizes,
    profile.limits,
    profile.declaredUnavailable,
  ];
  if (arrays.some((a) => !Array.isArray(a))) return null;
  if (typeof profile.id !== "string" || typeof profile.publicName !== "string") return null;
  if (typeof profile.rates !== "object" || profile.rates === null) return null;
  if (typeof profile.housing !== "object" || profile.housing === null) return null;

  /* Fields Audit 1.2 added. A profile saved before them has no `professional`
     record and no capability answers, so a screen reading
     `sitter.professional.kind` would crash on a returning sitter's own draft.
     Filled with UNANSWERED values rather than plausible ones: this is a
     migration, and a migration that invents a declaration is exactly what the
     regression checklist forbids (B3). */
  const empty = emptySitterProfile(profile.id);
  const restored: SitterProfile = {
    ...empty,
    ...profile,
    experience: { ...empty.experience, ...(profile.experience ?? {}) },
    professional: {
      ...empty.professional,
      ...(profile.professional ?? {}),
      /* `detail` was a plain string in the first 1.2 draft of this record. A
         string reaching `localized()` returns undefined and renders "undefined"
         on the sitter's own profile, so it is normalised rather than trusted. */
      detail: normaliseLocalized(profile.professional?.detail, empty.professional.detail),
    },
    housing: { ...empty.housing, ...(profile.housing ?? {}) },
    /* Validated field by field, and handed the retired 1.1 `careMethods` so a
       draft written before §57 keeps what can be carried forward. */
    care: restoreCareConditions(
      profile.care,
      (profile as unknown as { careMethods?: unknown }).careMethods,
    ),
    confirmedSections: Array.isArray(profile.confirmedSections)
      ? profile.confirmedSections.filter((id): id is string => typeof id === "string")
      : [],
  };

  return {
    profile: restored,
    published: workspace.published === true,
    idDocument:
      typeof workspace.idDocument === "object" && workspace.idDocument !== null
        ? (workspace.idDocument as SitterWorkspace["idDocument"])
        : null,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The account, validated field by field.
 *
 * It was the one slice still cast rather than restored, which stopped being
 * harmless when `ownedSpecies` arrived: it is read straight into state and
 * then `.filter`-ed on the first chip tap, so a hand-edited `"dog"` string
 * got past an `isObject` check and threw. B2 states the rule as "validated per
 * slice"; this is the slice that was not.
 */
function restoreAccount(value: unknown): DemoAccount | null {
  if (!isObject(value)) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const nullableStr = (v: unknown) => (typeof v === "string" && v ? v : null);
  if (!str(value.firstName) && !str(value.lastName)) return null;
  return {
    firstName: str(value.firstName),
    lastName: str(value.lastName),
    dateOfBirth: nullableStr(value.dateOfBirth),
    wilayaId: nullableStr(value.wilayaId),
    communeId: nullableStr(value.communeId),
    /* Narrowed to species this build knows. A stored "rabbit" would otherwise
       reach a `Record<Species, ...>` lookup and render undefined. */
    ownedSpecies: Array.isArray(value.ownedSpecies)
      ? value.ownedSpecies.filter((s): s is Species => s === "dog" || s === "cat" || s === "bird")
      : [],
    phoneNumber: str(value.phoneNumber),
    accountComplete: value.accountComplete === true,
    createdAt: str(value.createdAt) || new Date().toISOString(),
  };
}

/**
 * One stored request, validated (Audit 1.3).
 *
 * Requests were the one slice still restored by a container check alone, so a
 * request whose animal lacked a detail field — hand-edited, or written by an
 * older build — reached `petFacts` and took the sitter's whole inbox down.
 * The animal now goes through `restorePet`, which fills every unanswered
 * question with `unknown`, and is then re-shared without the private care
 * plan. A request with no usable animal, sitter, dates or status is dropped.
 */
function restoreRequest(raw: Record<string, unknown>): CareRequest[] {
  const pet = restorePet(isObject(raw.pet) ? { care: {}, ...raw.pet } : null);
  const dates = raw.dates as Partial<DateRange> | undefined;
  const status = raw.status;
  if (!pet || typeof raw.id !== "string" || typeof raw.sitterId !== "string") return [];
  if (!isObject(dates) || typeof dates.start !== "string" || typeof dates.end !== "string") return [];
  if (status !== "pending" && status !== "accepted" && status !== "declined") return [];
  if (typeof raw.careType !== "string") return [];
  return [
    {
      ...(raw as unknown as CareRequest),
      pet: forSharing(pet),
      dates: { start: dates.start, end: dates.end },
      status,
      thread: restoreThread(raw.thread),
    },
  ];
}

/** Only the two flags, only when they are actually booleans. A hand-edited
    `{"owner":"yes"}` grants nothing. */
function restoreCapabilities(value: unknown): AccountCapabilities {
  if (!isObject(value)) return NO_CAPABILITIES;
  return { owner: value.owner === true, sitter: value.sitter === true };
}

function restore(parsed: Record<string, unknown>): DemoState {
  const arrayOfObjects = (v: unknown) => (Array.isArray(v) && v.every(isObject) ? v : null);

  const account = restoreAccount(parsed.account);
  const sitter = restoreSitter(parsed.sitter);
  const stored = restoreCapabilities(parsed.capabilities);

  return {
    version: STORAGE_VERSION,
    entered: parsed.entered === true,
    account,
    /* Clamped against the data that is actually here, not trusted as written.
       Each slice is validated independently — by design, so one bad field costs
       only that field — which means `restoreSitter` can legitimately discard a
       malformed profile while `capabilities.sitter` still says `true`. That
       combination sends `/` to an inbox for a profile that no longer exists and
       advertises a draft that was thrown away. A capability describes what the
       stored data supports; it cannot outlive it. */
    capabilities: {
      owner: stored.owner && account !== null,
      sitter: stored.sitter && sitter !== null,
    },
    activeWorkspace: isWorkspace(parsed.activeWorkspace) ? parsed.activeWorkspace : "owner",
    need: isObject(parsed.need) ? { ...EMPTY_NEED, ...(parsed.need as Partial<OwnerNeed>) } : EMPTY_NEED,
    /* Per-pet rather than per-array: one corrupt animal costs that animal, not
       the whole list. `restorePet` also migrates the pre-1.2 flat shape. */
    pets: Array.isArray(parsed.pets)
      ? parsed.pets.map(restorePet).filter((pet): pet is Pet => pet !== null)
      : [],
    requests: ((arrayOfObjects(parsed.requests) as Record<string, unknown>[] | null) ?? []).flatMap(restoreRequest),
    sitter,
    requestDraft: restoreRequestDraft(parsed.requestDraft),
  };
}

/**
 * Audit 1.1 → 1.2.
 *
 * The two fields v1 never had are DERIVED FROM WHAT IS THERE, never assumed:
 *
 *   - `capabilities.owner` from the existence of an account. Someone who
 *     completed the 1.1 account really can send a request.
 *   - `capabilities.sitter` from the existence of a sitter workspace. Someone
 *     who opened the 1.1 builder really does have a sitter side.
 *
 * That is reading a fact, not inventing one, which is the line the regression
 * checklist draws (B3). Nothing here fabricates a declaration: no housing type,
 * no service, no rate and no verification state is filled in — a v1 profile
 * that left a field unanswered still has it unanswered, because `restore`
 * copies the profile as it was and `emptySitterProfile` is not consulted.
 *
 * `activeWorkspace` is not derivable from v1 at all — nothing recorded which
 * side the visitor was last looking at — so it takes the initial value rather
 * than a guess dressed as a memory.
 */
function migrateFromV1(parsed: Record<string, unknown>): DemoState {
  const restored = restore(parsed);
  return {
    ...restored,
    capabilities: {
      owner: restored.account !== null,
      sitter: restored.sitter !== null,
    },
    activeWorkspace: INITIAL_STATE.activeWorkspace,
  };
}

function readRecord(key: string): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  return isObject(parsed) ? parsed : null;
}

export function loadState(): DemoState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const current = readRecord(STORAGE_KEY);
    if (current) {
      /* v2 and v3 are both readable, and that distinction matters.
         The ONLY shape that changed between them is the pet, and `restorePet`
         already reads the v2 flat pet — so discarding a v2 record would throw
         away an account, its pets, its requests and its sitter workspace to
         avoid a migration this code has already written. Version mismatch
         discards in order to prevent a CRASH (checklist B4); it is not a
         licence to delete a version this build can understand.

         A version this build does not know — a record written by a NEWER build,
         after the visitor moved back — is still discarded rather than read
         field by field and half-understood. */
      return READABLE_VERSIONS.includes(current.version as number)
        ? restore(current)
        : INITIAL_STATE;
    }

    const legacy = readRecord(LEGACY_STORAGE_KEY);
    if (legacy && legacy.version === 1) {
      const migrated = migrateFromV1(legacy);
      /* The old record is removed ONLY once the new one is known to be on
         disk. Ordering alone is not enough: `saveState` swallows its own
         exception, so on a full quota or in Safari private mode it returns
         normally having written nothing — and `removeItem` succeeds in exactly
         those cases. That combination would destroy the visitor's account,
         pets, requests and sitter profile silently. If the write failed, the
         v1 record stays and migration is retried on the next load. */
      if (saveState(migrated)) window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
    /* A legacy record of some other version is not migratable; leave it alone
       rather than deleting data this build cannot interpret. */
    return INITIAL_STATE;
  } catch {
    /* Corrupt or unreadable (private mode, quota, hand-edited): start clean
       rather than trapping the visitor on a crashing screen. */
    return INITIAL_STATE;
  }
}

/** Returns whether the record actually reached storage. The migration depends
    on the answer before it deletes anything. */
export function saveState(state: DemoState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripTransientFields(state)));
    return true;
  } catch {
    /* Storage unavailable — the demo keeps working in memory for this tab. */
    return false;
  }
}

export function clearStoredState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    /* The 1.1 key too. "You can erase everything" has to be true even for a
       visitor whose migration had not run yet, and a leftover record under the
       old key would come back on the next load. */
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
