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
  type CareRequest,
  type OwnerNeed,
  type Pet,
  type RequestStatus,
  type SitterProfile,
} from "@/data/types";
import {
  NO_CAPABILITIES,
  isWorkspace,
  type AccountCapabilities,
  type Workspace,
} from "@/data/workspace";

/** Bumped by Audit 1.2, which added account capabilities and an active
    workspace. A version this code does not recognise is discarded rather than
    read optimistically, so a returning visitor never crashes on a renamed
    field. */
const STORAGE_VERSION = 2;

/** The version now lives INSIDE the record rather than in the key, so future
    versions migrate in place instead of orphaning the previous one. */
const STORAGE_KEY = "nidz.demo";

/** Audit 1.1's key. Read once, migrated, then removed — see `loadState`. */
const LEGACY_STORAGE_KEY = "nidz.demo.v1";

/** A local, unverified identity. `phoneConfirmed` records that the person
    completed the SIMULATED code step — it is not phone verification, and no
    surface may present it as one. */
export type DemoAccount = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneConfirmed: boolean;
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
};

export function emptySitterProfile(id: string): SitterProfile {
  return {
    id,
    publicName: "",
    communeCode: "",
    headline: { fr: "", en: "", ar: "" },
    about: { fr: "", en: "", ar: "" },
    experience: { years: 0, species: [], professional: null },
    services: [],
    rates: {},
    acceptedSpecies: [],
    acceptedDogSizes: [],
    maxAnimals: 1,
    /* Unanswered, not "apartment with no outdoor space". Seeding a value here
       pre-selected it in the builder — teal border and check glyph, this
       system's own signal for "you chose this" — and published it as a
       declaration on the profile. */
    housing: { type: null, outdoor: null, residentPets: [], conditions: null },
    careMethods: [],
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
  | { type: "setAccount"; account: DemoAccount }
  | { type: "confirmPhone" }
  | { type: "addRequest"; request: CareRequest }
  | { type: "respondToRequest"; id: string; status: Exclude<RequestStatus, "pending"> }
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

    case "setAccount":
      /* Creating the account is what grants the owner capability. It is a fact
         about what this person can now do — send a request — not a claim about
         who they are, and it never revokes the sitter side. */
      return {
        ...state,
        account: action.account,
        capabilities: { ...state.capabilities, owner: true },
      };

    case "confirmPhone":
      return state.account ? { ...state, account: { ...state.account, phoneConfirmed: true } } : state;

    case "addRequest":
      return { ...state, requests: [action.request, ...state.requests] };

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
    a live preview only — the rest of the pet survives. */
function stripTransientFields(state: DemoState): DemoState {
  const sitter = state.sitter;
  return {
    ...state,
    pets: state.pets.map(({ photoUrl: _photoUrl, ...pet }) => pet),
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
function restoreSitter(value: unknown): SitterWorkspace | null {
  if (typeof value !== "object" || value === null) return null;
  const workspace = value as Record<string, unknown>;
  const profile = workspace.profile as Partial<SitterProfile> | undefined;
  if (!profile || typeof profile !== "object") return null;

  const arrays = [profile.services, profile.acceptedSpecies, profile.acceptedDogSizes, profile.careMethods, profile.limits, profile.declaredUnavailable];
  if (arrays.some((a) => !Array.isArray(a))) return null;
  if (typeof profile.id !== "string" || typeof profile.publicName !== "string") return null;
  if (typeof profile.rates !== "object" || profile.rates === null) return null;
  if (typeof profile.housing !== "object" || profile.housing === null) return null;

  return {
    profile: profile as SitterProfile,
    published: workspace.published === true,
    idDocument:
      typeof workspace.idDocument === "object" && workspace.idDocument !== null
        ? (workspace.idDocument as SitterWorkspace["idDocument"])
        : null,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Only the two flags, only when they are actually booleans. A hand-edited
    `{"owner":"yes"}` grants nothing. */
function restoreCapabilities(value: unknown): AccountCapabilities {
  if (!isObject(value)) return NO_CAPABILITIES;
  return { owner: value.owner === true, sitter: value.sitter === true };
}

function restore(parsed: Record<string, unknown>): DemoState {
  const arrayOfObjects = (v: unknown) => (Array.isArray(v) && v.every(isObject) ? v : null);

  const account = isObject(parsed.account) ? (parsed.account as unknown as DemoAccount) : null;
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
    pets: (arrayOfObjects(parsed.pets) as Pet[] | null) ?? [],
    requests: (arrayOfObjects(parsed.requests) as CareRequest[] | null) ?? [],
    sitter,
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
      /* A version this build does not know about — a record written by a NEWER
         build, say, after the visitor moved back a version — is discarded
         rather than read field by field and half-understood. */
      return current.version === STORAGE_VERSION ? restore(current) : INITIAL_STATE;
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
