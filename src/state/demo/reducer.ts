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

/** Bumping this discards incompatible state saved by an older build rather
    than crashing a returning visitor on a renamed field. */
const STORAGE_VERSION = 1;
const STORAGE_KEY = "nidz.demo.v1";

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
  need: OwnerNeed;
  pets: Pet[];
  requests: CareRequest[];
  sitter: SitterWorkspace | null;
};

export const INITIAL_STATE: DemoState = {
  version: STORAGE_VERSION,
  entered: false,
  account: null,
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
      return { ...state, account: action.account };

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
      /* Idempotent: re-entering the flow must not wipe a profile in progress. */
      return state.sitter
        ? state
        : { ...state, sitter: { profile: emptySitterProfile(action.id), published: false, idDocument: null } };

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
      return state.sitter ? { ...state, sitter: { ...state.sitter, published: true } } : state;

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

function restore(parsed: Record<string, unknown>): DemoState {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  const arrayOfObjects = (v: unknown) => (Array.isArray(v) && v.every(isObject) ? v : null);

  return {
    version: STORAGE_VERSION,
    entered: parsed.entered === true,
    account: isObject(parsed.account) ? (parsed.account as unknown as DemoAccount) : null,
    need: isObject(parsed.need) ? { ...EMPTY_NEED, ...(parsed.need as Partial<OwnerNeed>) } : EMPTY_NEED,
    pets: (arrayOfObjects(parsed.pets) as Pet[] | null) ?? [],
    requests: (arrayOfObjects(parsed.requests) as CareRequest[] | null) ?? [],
    sitter: restoreSitter(parsed.sitter),
  };
}

export function loadState(): DemoState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return INITIAL_STATE;
    const record = parsed as Record<string, unknown>;
    if (record.version !== STORAGE_VERSION) return INITIAL_STATE;
    return restore(record);
  } catch {
    /* Corrupt or unreadable (private mode, quota, hand-edited): start clean
       rather than trapping the visitor on a crashing screen. */
    return INITIAL_STATE;
  }
}

export function saveState(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripTransientFields(state)));
  } catch {
    /* Storage unavailable — the demo keeps working in memory for this tab. */
  }
}

export function clearStoredState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
