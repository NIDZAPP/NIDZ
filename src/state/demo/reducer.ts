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
  CARE_TYPES,
  DOG_SIZES,
  EMPTY_NEED,
  NEED_STEPS,
  REQUEST_STATUSES,
  asLocalized,
  isPetCategory,
  isSpecies,
  type CareRequest,
  type CareType,
  type DateRange,
  type DogSize,
  type KindAcceptance,
  type Localized,
  type OwnerNeed,
  type Pet,
  type RequestStatus,
  type SitterProfile,
  type Species,
} from "@/data/types";
import { normalizeAcceptance } from "@/data/compatibility";
import { getKind } from "@/data/animal-kinds";
import {
  POST_STATUSES,
  liveProposal,
  restoreProposal,
  type CarePost,
  type Proposal,
} from "@/data/publications";
import { DEFAULT_PREFERENCES, restorePreferences, type Preferences } from "@/data/preferences";
import type { AppLocale } from "@/i18n";
import { emptyCareConditions, restoreCareConditions } from "@/data/care-conditions";
import { forSharing, restorePet, restorePhoto } from "@/data/pets";
import { restoreRequestDraft, type RequestDraft } from "@/data/request-draft";
import { canClarify, restoreThread, type ClarificationMessage } from "@/data/clarification";
import {
  restoreConversations,
  type Conversation,
  type ConversationMessage,
  type ConversationSide,
} from "@/data/conversations";
import { isISODate } from "@/utils/dates";
import { getWilayaOfCommune, normalizeCommuneId, normalizeWilayaId } from "@/data/algeria";
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
const STORAGE_VERSION = 4;

/** Versions whose records this build can read in full.
 *
 * v2 differs from v3 only in the pet shape, which `restorePet` normalises, so
 * a v2 record is upgraded on read rather than thrown away. Anything outside
 * this list is discarded — see `loadState`. */
const READABLE_VERSIONS: readonly number[] = [2, 3, 4];
/* v4 (Nidz 1.7): thirteen animal categories, published requests and
   proposals, a local session, preferences and blocks. Every v3 field is read
   unchanged or migrated in place (`restorePet`, `restoreSitter`), so a v3
   record is upgraded on read, never discarded. */

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
  /** The way of signing up the person CHOSE (Nidz 1.7 §3). Nothing was
      contacted: Google, Apple and the SMS provider are not connected in this
      prototype, so this records a path through the screens, never an identity
      proven by anyone. Null for accounts created before 1.7. */
  signInMethod: SignInMethod | null;
  /** Profile photograph, a small data URL made on the device. Optional. */
  photoUrl?: string;
};

export type SignInMethod = "google" | "apple" | "phone";

/** The sitter's own profile-in-progress. `idDocument` records only that a
    file was chosen locally. It is never uploaded and it NEVER becomes a
    verification: an added document means "vérification en attente" and
    nothing more (Audit p.449). */
export type SitterWorkspace = {
  profile: SitterProfile;
  published: boolean;
  /** The sitter chose, in Paramètres, to stop being found for now — without
      unpublishing or losing anything (Nidz 1.7 §23.1). */
  hidden: boolean;
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
  /**
   * Messages before a request (Nidz 1.4). Local notes between the owner and a
   * sitter — never delivered anywhere; see `src/data/conversations.ts`.
   * Added without a version bump: additive, and a record written before it
   * simply has none.
   */
  conversations: Conversation[];
  /**
   * Whether this device is « signed in » to the account it holds (Nidz 1.7).
   * A local session, not an authentication: signing out keeps every record
   * and shows the welcome screen; signing in again reopens the same account.
   */
  signedIn: boolean;
  /** Care requests the owner PUBLISHED, and the proposals sitters made on
      posts (see `src/data/publications.ts`). */
  posts: CarePost[];
  proposals: Proposal[];
  preferences: Preferences;
  /** Sitters this person chose not to see again. Local to this device. */
  blockedSitters: string[];
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
  conversations: [],
  signedIn: false,
  posts: [],
  proposals: [],
  preferences: DEFAULT_PREFERENCES,
  blockedSitters: [],
};

export function emptySitterProfile(id: string): SitterProfile {
  return {
    id,
    publicName: "",
    wilayaCode: "",
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
    acceptedKinds: {},
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
  | { type: "startConversation"; conversation: Conversation }
  | { type: "addConversationMessage"; id: string; message: ConversationMessage }
  | { type: "markConversationSeen"; id: string; side: ConversationSide; at: string }
  | { type: "startSitterProfile"; id: string }
  | { type: "patchSitterProfile"; patch: Partial<SitterProfile> }
  | { type: "setIdDocument"; fileName: string }
  | { type: "clearIdDocument" }
  | { type: "publishSitterProfile" }
  | { type: "setSitterHidden"; hidden: boolean }
  /* Nidz 1.7 — session */
  | { type: "signIn" }
  | { type: "signOut" }
  | { type: "setAccountPhoto"; photoUrl: string | null }
  | { type: "clearNeed" }
  /* Nidz 1.7 — direct requests */
  | { type: "withdrawRequest"; id: string }
  | { type: "cancelRequest"; id: string; by: "owner" | "sitter" }
  /* Nidz 1.7 — published requests and proposals */
  | { type: "publishPost"; post: CarePost }
  | { type: "updatePost"; id: string; patch: Partial<Pick<CarePost, "careType" | "dates" | "wilayaCode" | "communeCode">> }
  | { type: "withdrawPost"; id: string }
  | { type: "addProposal"; proposal: Proposal }
  | { type: "withdrawProposal"; id: string }
  | { type: "respondToProposal"; id: string; status: "accepted" | "declined" }
  | { type: "cancelPostArrangement"; postId: string; by: "owner" | "sitter" }
  /* Nidz 1.7 — preferences and safety */
  | { type: "setPreferences"; patch: Partial<Preferences> }
  | { type: "blockSitter"; id: string }
  | { type: "unblockSitter"; id: string }
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
      return {
        ...state,
        need: {
          ...state.need,
          ...action.patch,
          /* A step reached is the journey being touched: it is what lets the
             draft card say « en cours » truthfully. */
          updatedAt: action.patch.step ? new Date().toISOString() : (action.patch.updatedAt ?? state.need.updatedAt),
        },
      };

    case "clearNeed":
      return state.need === EMPTY_NEED ? state : { ...state, need: EMPTY_NEED };

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
         who they are, and it never revokes the sitter side. Saving it is also
         being « signed in » on this device. */
      return {
        ...state,
        account: { ...action.account, photoUrl: action.account.photoUrl ?? state.account?.photoUrl },
        capabilities: { ...state.capabilities, owner: true },
        signedIn: true,
        entered: true,
      };

    case "setAccountPhoto":
      if (!state.account) return state;
      return { ...state, account: { ...state.account, photoUrl: action.photoUrl ?? undefined } };

    /* A local session (Nidz 1.7). Signing in is only possible for the account
       this device holds; signing out keeps every record. */
    case "signIn":
      return state.account ? { ...state, signedIn: true, entered: true } : state;

    case "signOut":
      return state.signedIn ? { ...state, signedIn: false } : state;

    case "completeAccount":
      return state.account ? { ...state, account: { ...state.account, accountComplete: true } } : state;

    case "addRequest":
      /* The same request twice (a double tap, another tab) is one request. */
      if (state.requests.some((r) => r.id === action.request.id)) return state;
      return {
        ...state,
        requests: [action.request, ...state.requests],
        /* The care journey reached its end: a request exists. */
        need: { ...state.need, step: null, updatedAt: null },
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

    /* A conversation is created once; a second start with the same id (a
       double tap, another tab) adds nothing. */
    case "startConversation":
      return state.conversations.some((c) => c.id === action.conversation.id)
        ? state
        : { ...state, conversations: [...state.conversations, action.conversation] };

    /* A message touches only its conversation's thread. An empty one is
       refused rather than stored as a blank bubble. */
    case "addConversationMessage":
      return action.message.text
        ? {
            ...state,
            conversations: state.conversations.map((c) =>
              c.id === action.id ? { ...c, messages: [...c.messages, action.message] } : c,
            ),
          }
        : state;

    /* View state: when this SPACE last opened the thread. Never moves
       backwards, so two tabs cannot un-read each other. */
    case "markConversationSeen": {
      const target = state.conversations.find((c) => c.id === action.id);
      const previous = target?.seen[action.side];
      if (!target || (previous && previous >= action.at)) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, seen: { ...c.seen, [action.side]: action.at } } : c,
        ),
      };
    }

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
      /* Only a PENDING request can be decided. The screen never offered a
         second decision, but a second tab still showing the buttons could
         have flipped an acceptance into a refusal (Audit 1.3.1 A-19). */
      if (!state.requests.some((r) => r.id === action.id && r.status === "pending")) return state;
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, status: action.status, respondedAt: new Date().toISOString() } : r,
        ),
      };

    /* Only a request still waiting can be taken back, and only an accepted one
       can be called off. Both are final and keep the record (§20.4). */
    case "withdrawRequest":
      if (!state.requests.some((r) => r.id === action.id && r.status === "pending")) return state;
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, status: "withdrawn", respondedAt: new Date().toISOString() } : r,
        ),
      };

    case "cancelRequest":
      if (!state.requests.some((r) => r.id === action.id && r.status === "accepted")) return state;
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id
            ? { ...r, status: "cancelled", cancelledBy: action.by, respondedAt: new Date().toISOString() }
            : r,
        ),
      };

    /* ------------------------------------------------ published requests */

    case "publishPost":
      /* Idempotent on the id the confirmation screen minted once, so a second
         tap — or a second tab replaying the same confirmation — cannot
         publish the same request twice (§13.2). */
      if (state.posts.some((p) => p.id === action.post.id)) return state;
      return {
        ...state,
        posts: [action.post, ...state.posts],
        need: { ...state.need, step: null, updatedAt: null },
      };

    case "updatePost": {
      const post = state.posts.find((p) => p.id === action.id);
      if (!post || post.status !== "open") return state;
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.id ? { ...p, ...action.patch, updatedAt: new Date().toISOString() } : p,
        ),
      };
    }

    case "withdrawPost": {
      const post = state.posts.find((p) => p.id === action.id);
      if (!post || post.status !== "open") return state;
      const at = new Date().toISOString();
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === action.id ? { ...p, status: "withdrawn", updatedAt: at } : p)),
        /* Nobody is left waiting on a post that no longer exists. */
        proposals: state.proposals.map((p) =>
          p.postId === action.id && p.status === "pending" ? { ...p, status: "notRetained", respondedAt: at } : p,
        ),
      };
    }

    case "addProposal": {
      const { proposal } = action;
      /* One live proposal per sitter per post (§14.2), and only on a post
         still open. Fixture posts are open by construction. */
      if (state.proposals.some((p) => p.id === proposal.id)) return state;
      if (liveProposal(state.proposals, proposal.postId, proposal.sitterId)) return state;
      const own = state.posts.find((p) => p.id === proposal.postId);
      if (own && own.status !== "open") return state;
      return { ...state, proposals: [proposal, ...state.proposals] };
    }

    case "withdrawProposal":
      if (!state.proposals.some((p) => p.id === action.id && p.status === "pending")) return state;
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.id ? { ...p, status: "withdrawn", respondedAt: new Date().toISOString() } : p,
        ),
      };

    case "respondToProposal": {
      const target = state.proposals.find((p) => p.id === action.id && p.status === "pending");
      const post = target && state.posts.find((p) => p.id === target.postId);
      /* Only the owner of an OPEN post decides, and only once. */
      if (!target || !post || post.status !== "open") return state;
      const at = new Date().toISOString();
      if (action.status === "declined") {
        return {
          ...state,
          proposals: state.proposals.map((p) => (p.id === target.id ? { ...p, status: "declined", respondedAt: at } : p)),
        };
      }
      /* ONE acceptance per post, in one write: the post closes, and every
         other proposal still waiting is told it was not retained (§14.3). */
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === post.id ? { ...p, status: "accepted", acceptedProposalId: target.id, updatedAt: at } : p,
        ),
        proposals: state.proposals.map((p) =>
          p.id === target.id
            ? { ...p, status: "accepted", respondedAt: at }
            : p.postId === post.id && p.status === "pending"
              ? { ...p, status: "notRetained", respondedAt: at }
              : p,
        ),
      };
    }

    case "cancelPostArrangement": {
      const post = state.posts.find((p) => p.id === action.postId && p.status === "accepted");
      if (!post) return state;
      const at = new Date().toISOString();
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === post.id ? { ...p, status: "cancelled", updatedAt: at } : p)),
        proposals: state.proposals.map((p) =>
          p.id === post.acceptedProposalId ? { ...p, status: "cancelled", cancelledBy: action.by, respondedAt: at } : p,
        ),
      };
    }

    /* --------------------------------------------- preferences and safety */

    case "setPreferences":
      return {
        ...state,
        preferences: restorePreferences({
          ...state.preferences,
          ...action.patch,
          notifications: { ...state.preferences.notifications, ...(action.patch.notifications ?? {}) },
        }),
      };

    case "blockSitter":
      return state.blockedSitters.includes(action.id)
        ? state
        : { ...state, blockedSitters: [...state.blockedSitters, action.id] };

    case "unblockSitter":
      return { ...state, blockedSitters: state.blockedSitters.filter((id) => id !== action.id) };

    case "setSitterHidden":
      return state.sitter ? { ...state, sitter: { ...state.sitter, hidden: action.hidden } } : state;

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
          state.sitter ?? { profile: emptySitterProfile(action.id), published: false, hidden: false, idDocument: null },
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
  /* Since 1.7 a photo the person chose is a small data URL made on the device
     (`utils/photo.ts`) and IS kept — it survives a reload. An object URL is
     still a live preview only and is dropped. Copies inside requests, posts
     and conversations never carry one: the owner's own animal record does. */
  const keep = (url: string | undefined) => restorePhoto(url);
  return {
    ...state,
    account: state.account ? { ...state.account, photoUrl: keep(state.account.photoUrl) } : null,
    pets: state.pets.map((pet) => ({ ...pet, photoUrl: keep(pet.photoUrl) })),
    posts: state.posts.map((post) => ({
      ...post,
      pet: (({ photoUrl: _photoUrl, ...pet }) => pet)(post.pet) as CarePost["pet"],
    })),
    requests: state.requests.map((request) => ({
      ...request,
      pet: (({ photoUrl: _photoUrl, ...pet }) => pet)(request.pet) as CareRequest["pet"],
    })),
    sitter: sitter
      ? { ...sitter, profile: { ...sitter.profile, photoUrl: keep(sitter.profile.photoUrl) } }
      : null,
    /* A conversation carries a copy of the pet too — same dead-URL rule. */
    conversations: state.conversations.map((c) =>
      c.context.pet
        ? { ...c, context: { ...c.context, pet: (({ photoUrl: _photoUrl, ...pet }) => pet)(c.context.pet) as Conversation["context"]["pet"] } }
        : c,
    ),
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

/**
 * The sitter's wilaya and commune, out of storage (Audit 1.3.1).
 *
 * Profiles saved before the commune became optional have no `wilayaCode` — it
 * is DERIVED from their commune, which is reading a fact, not inventing one
 * (B3). A commune that names nothing, or that does not belong to the stored
 * wilaya, is dropped rather than shown under the wrong place; the commune
 * wins over a contradicting wilaya because it was the more precise answer.
 */
function restoreSitterLocation(wilaya: unknown, commune: unknown): { wilayaCode: string; communeCode: string } {
  const communeCode = normalizeCommuneId(typeof commune === "string" ? commune : null);
  if (communeCode) return { wilayaCode: getWilayaOfCommune(communeCode)?.id ?? "", communeCode };
  return { wilayaCode: normalizeWilayaId(typeof wilaya === "string" ? wilaya : null) ?? "", communeCode: "" };
}

/**
 * A dog-size restriction declared before Nidz 1.7, as one of the sitter's own
 * limits. Size is no longer a matching rule, but what the sitter said is a
 * fact about what they can take, and dropping it would quietly widen their
 * offer. Null when they accepted every size (or declared none).
 */
const SIZE_WORDS: Record<DogSize, Localized> = {
  small: { fr: "petite", en: "small", ar: "الصغيرة" },
  medium: { fr: "moyenne", en: "medium", ar: "المتوسطة" },
  large: { fr: "grande", en: "large", ar: "الكبيرة" },
};

export function sizeRestrictionLimit(sizes: readonly DogSize[]): Localized | null {
  const kept = DOG_SIZES.filter((size) => sizes.includes(size));
  if (kept.length === 0 || kept.length === DOG_SIZES.length) return null;
  const join = (locale: "fr" | "en" | "ar", and: string) =>
    kept.map((size) => SIZE_WORDS[size][locale]).join(and);
  return {
    fr: `Chiens acceptés : de ${join("fr", " et de ")} taille uniquement.`,
    en: `Dogs accepted: ${join("en", " and ")} dogs only.`,
    ar: `الكلاب المقبولة: ذات الأحجام ${join("ar", " و")} فقط.`,
  };
}

function restoreAcceptedKinds(value: unknown, accepted: readonly Species[]): Partial<Record<Species, KindAcceptance>> {
  if (typeof value !== "object" || value === null) return {};
  const raw = value as Record<string, unknown>;
  const out: Partial<Record<Species, KindAcceptance>> = {};
  for (const species of accepted) {
    const entry = normalizeAcceptance(species, raw[species]);
    if (entry) out[species] = entry;
  }
  return out;
}

function restoreSitter(value: unknown): SitterWorkspace | null {
  if (typeof value !== "object" || value === null) return null;
  const workspace = value as Record<string, unknown>;
  const profile = workspace.profile as Partial<SitterProfile> | undefined;
  if (!profile || typeof profile !== "object") return null;

  const legacySizes = (profile as unknown as { acceptedDogSizes?: unknown }).acceptedDogSizes;
  const arrays = [profile.services, profile.acceptedSpecies, profile.limits, profile.declaredUnavailable];
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
  const acceptedSpecies = (profile.acceptedSpecies as unknown[]).filter(isSpecies);
  /* Nidz 1.7 migration, idempotent: a pre-1.7 dog-size restriction becomes a
     declared limit, once; the retired field is not written back. */
  const sizeLimit =
    acceptedSpecies.includes("dog") && Array.isArray(legacySizes)
      ? sizeRestrictionLimit(legacySizes.filter((v): v is DogSize => (DOG_SIZES as readonly unknown[]).includes(v)))
      : null;
  const { acceptedDogSizes: _retired, ...profileRest } = profile as Partial<SitterProfile> & { acceptedDogSizes?: unknown };
  const restored: SitterProfile = {
    ...empty,
    ...profileRest,
    acceptedSpecies,
    acceptedKinds: restoreAcceptedKinds(profile.acceptedKinds, acceptedSpecies),
    photoUrl: restorePhoto(profile.photoUrl),
    /* Read by `canPublish` (now on /search, through `publicSitters`) with
       `.trim()`: a stored null or a pre-Localized string here took the
       results page down. */
    ...restoreSitterLocation(profile.wilayaCode, profile.communeCode),
    headline: normaliseLocalized(profile.headline, empty.headline),
    about: normaliseLocalized(profile.about, empty.about),
    limits: [
      ...(profile.limits as unknown[])
        .map((limit) => normaliseLocalized(limit, asLocalized("")))
        .filter((l) => l.en.trim() || l.fr.trim() || l.ar.trim()),
      ...(sizeLimit ? [sizeLimit] : []),
    ],
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
    hidden: workspace.hidden === true,
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
    ownedSpecies: Array.isArray(value.ownedSpecies) ? value.ownedSpecies.filter(isSpecies) : [],
    phoneNumber: str(value.phoneNumber),
    accountComplete: value.accountComplete === true,
    createdAt: str(value.createdAt) || new Date().toISOString(),
    signInMethod: value.signInMethod === "google" || value.signInMethod === "apple" || value.signInMethod === "phone" ? value.signInMethod : null,
    photoUrl: restorePhoto(value.photoUrl),
  };
}

/** One published request, validated like a direct one: an animal (re-shared
    without its care plan), whole dates, a known service, status and place. */
function restorePost(raw: Record<string, unknown>): CarePost[] {
  const pet = restorePet(isObject(raw.pet) ? { care: {}, ...raw.pet } : null);
  const dates = raw.dates as Partial<DateRange> | undefined;
  if (!pet || typeof raw.id !== "string" || !raw.id) return [];
  if (!isObject(dates) || !isISODate(dates.start) || !isISODate(dates.end) || dates.start > dates.end) return [];
  if (typeof raw.careType !== "string" || !(CARE_TYPES as readonly string[]).includes(raw.careType)) return [];
  if (!(POST_STATUSES as readonly unknown[]).includes(raw.status)) return [];
  const wilayaCode = normalizeWilayaId(typeof raw.wilayaCode === "string" ? raw.wilayaCode : null);
  if (!wilayaCode) return [];
  const communeCode = normalizeCommuneId(typeof raw.communeCode === "string" ? raw.communeCode : null);
  const createdAt = typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt)) ? raw.createdAt : null;
  if (!createdAt) return [];
  return [
    {
      id: raw.id,
      createdAt,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
      pet: forSharing(pet),
      petId: typeof raw.petId === "string" ? raw.petId : null,
      careType: raw.careType as CareType,
      dates: { start: dates.start, end: dates.end },
      wilayaCode,
      communeCode: communeCode && getWilayaOfCommune(communeCode)?.id === wilayaCode ? communeCode : null,
      ownerName: typeof raw.ownerName === "string" ? raw.ownerName : "",
      status: raw.status as CarePost["status"],
      acceptedProposalId: typeof raw.acceptedProposalId === "string" ? raw.acceptedProposalId : null,
      /* A stored record is never a fixture: fixtures are not persisted. */
      isDemoFixture: false,
    },
  ];
}

/** The brief, field by field (Nidz 1.7 dropped `dogSize`; an old stored one
    is simply not read). */
function restoreNeed(value: unknown): OwnerNeed {
  if (!isObject(value)) return EMPTY_NEED;
  const species = isPetCategory(value.species) ? value.species : null;
  const kindId =
    typeof value.kindId === "string" && species && species !== "other" && getKind(value.kindId, species)
      ? value.kindId
      : null;
  const careType = typeof value.careType === "string" && (CARE_TYPES as readonly string[]).includes(value.careType) ? (value.careType as CareType) : null;
  const dates = value.dates as Partial<DateRange> | null | undefined;
  return {
    species,
    kindId,
    petId: typeof value.petId === "string" ? value.petId : null,
    wilayaCode: normalizeWilayaId(typeof value.wilayaCode === "string" ? value.wilayaCode : null),
    communeCode: normalizeCommuneId(typeof value.communeCode === "string" ? value.communeCode : null),
    dates: isObject(dates) && isISODate(dates.start) && isISODate(dates.end) && dates.start <= dates.end ? { start: dates.start, end: dates.end } : null,
    careType,
    maxPrice: typeof value.maxPrice === "number" && Number.isFinite(value.maxPrice) ? value.maxPrice : null,
    step: (NEED_STEPS as readonly unknown[]).includes(value.step) ? (value.step as OwnerNeed["step"]) : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
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
  /* Every field a screen FORMATS is checked as the thing it formats: an
     unparseable date reached `Intl.DateTimeFormat` and threw "Invalid time
     value" on the owner's list, the request detail and the sitter's inbox. */
  if (!isObject(dates) || !isISODate(dates.start) || !isISODate(dates.end) || dates.start > dates.end) return [];
  if (!(REQUEST_STATUSES as readonly unknown[]).includes(status)) return [];
  if (typeof raw.careType !== "string" || !(CARE_TYPES as readonly string[]).includes(raw.careType)) return [];
  if (typeof raw.createdAt !== "string" || !Number.isFinite(Date.parse(raw.createdAt))) return [];
  return [
    {
      ...(raw as unknown as CareRequest),
      pet: forSharing(pet),
      dates: { start: dates.start, end: dates.end },
      status: status as RequestStatus,
      cancelledBy: raw.cancelledBy === "owner" || raw.cancelledBy === "sitter" ? raw.cancelledBy : undefined,
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
    need: restoreNeed(parsed.need),
    /* Per-pet rather than per-array: one corrupt animal costs that animal, not
       the whole list. `restorePet` also migrates the pre-1.2 flat shape. */
    pets: Array.isArray(parsed.pets)
      ? parsed.pets.map(restorePet).filter((pet): pet is Pet => pet !== null)
      : [],
    requests: ((arrayOfObjects(parsed.requests) as Record<string, unknown>[] | null) ?? []).flatMap(restoreRequest),
    sitter,
    requestDraft: restoreRequestDraft(parsed.requestDraft),
    conversations: restoreConversations(parsed.conversations),
    /* A record written before 1.7 has no session field: someone who had an
       account there was using it, so they stay signed in rather than being
       shown a welcome screen for an account they never left. */
    signedIn: account !== null && (typeof parsed.signedIn === "boolean" ? parsed.signedIn : true),
    posts: ((arrayOfObjects(parsed.posts) as Record<string, unknown>[] | null) ?? []).flatMap(restorePost),
    proposals: Array.isArray(parsed.proposals)
      ? parsed.proposals.map(restoreProposal).filter((p): p is Proposal => p !== null)
      : [],
    preferences: restorePreferences(parsed.preferences),
    blockedSitters: Array.isArray(parsed.blockedSitters)
      ? [...new Set(parsed.blockedSitters.filter((id): id is string => typeof id === "string"))]
      : [],
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

/** The record as this build reads it — the one place that decides which
    stored versions are understood. Shared by the first load and by every
    later re-read (another tab's write, a commit that rebases). */
function stateFromRecord(current: Record<string, unknown>): DemoState {
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
  return READABLE_VERSIONS.includes(current.version as number) ? restore(current) : INITIAL_STATE;
}

export function loadState(): DemoState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const current = readRecord(STORAGE_KEY);
    if (current) return stateFromRecord(current);

    const legacy = readRecord(LEGACY_STORAGE_KEY);
    if (legacy && legacy.version === 1) {
      const migrated = migrateFromV1(legacy);
      /* The old record is removed ONLY once the new one is known to be on
         disk. Ordering alone is not enough: on a full quota or in Safari
         private mode the write can fail while `removeItem` succeeds, and that
         combination would destroy the visitor's account, pets, requests and
         sitter profile silently. If the write failed, the v1 record stays and
         migration is retried on the next load. */
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

/* ------------------------------------------------- reading and writing raw */

/** Storage could not be read at all — distinct from "nothing stored". */
export const UNREADABLE = Symbol("unreadable");

/** The stored record exactly as it sits in localStorage, so a tab can tell
    whether ANOTHER tab wrote since it last looked by comparing strings —
    no revision counter to keep in step, and nothing to migrate. */
export function readStoredRaw(): string | null | typeof UNREADABLE {
  if (typeof window === "undefined") return UNREADABLE;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return UNREADABLE;
  }
}

/** A raw record back into state. Same rules as the first load: untrusted
    input, validated per slice, and an unknown version is not half-read. */
export function stateFromRaw(raw: string | null): DemoState {
  if (raw === null) return INITIAL_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? stateFromRecord(parsed) : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

export type WriteResult = { ok: true; raw: string | null } | { ok: false };

/**
 * Persist a state and CONFIRM it — Audit 1.3.1 A-02.
 *
 * `setItem` throwing (quota, blocked storage) is one way a save fails; a write
 * that returns normally but does not read back is the other, and both used to
 * be swallowed while the screen went on as if the data were kept. The answer
 * is now a fact the caller must act on: `ok` only when the record read back is
 * byte for byte the one written.
 *
 * Back to the initial state means the visitor asked to be forgotten, so the
 * record is removed rather than rewritten with empty values — and a removal is
 * confirmed the same way.
 */
export function writeState(state: DemoState): WriteResult {
  if (typeof window === "undefined") return { ok: false };
  try {
    if (state === INITIAL_STATE) {
      window.localStorage.removeItem(STORAGE_KEY);
      /* The 1.1 key too. "You can erase everything" has to be true even for
         a visitor whose migration had not run yet. */
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return window.localStorage.getItem(STORAGE_KEY) === null ? { ok: true, raw: null } : { ok: false };
    }
    const json = JSON.stringify(stripTransientFields(state));
    const previous = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, json);
    if (window.localStorage.getItem(STORAGE_KEY) === json) return { ok: true, raw: json };
    /* Written but not as written: put back what was there, so the next read
       does not build on a damaged record. */
    try {
      if (previous === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, previous);
    } catch {
      /* nothing more this can do */
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Returns whether the record actually reached storage. The migration depends
    on the answer before it deletes anything. */
export function saveState(state: DemoState): boolean {
  return writeState(state).ok;
}

export function clearStoredState(): void {
  writeState(INITIAL_STATE);
}

/**
 * Re-attach what storage never holds.
 *
 * A photo is an object URL, valid only in the document that made it, so it is
 * stripped on write. When this tab re-reads the record — another tab saved,
 * or a commit rebased on fresh storage — the animals and the profile it
 * already shows must not lose their photo for it. Matched by id: a photo is
 * never moved onto a different animal.
 */
export function carryTransientFields(fresh: DemoState, current: DemoState): DemoState {
  const photos = new Map(current.pets.flatMap((p) => (p.photoUrl ? [[p.id, p.photoUrl] as const] : [])));
  const requestPhotos = new Map(
    current.requests.flatMap((r) => (r.pet.photoUrl ? [[r.id, r.pet.photoUrl] as const] : [])),
  );
  const sitterPhoto =
    current.sitter?.profile.photoUrl && current.sitter.profile.id === fresh.sitter?.profile.id
      ? current.sitter.profile.photoUrl
      : undefined;
  if (!photos.size && !requestPhotos.size && !sitterPhoto) return fresh;
  return {
    ...fresh,
    pets: fresh.pets.map((p) => (!p.photoUrl && photos.has(p.id) ? { ...p, photoUrl: photos.get(p.id) } : p)),
    requests: fresh.requests.map((r) =>
      !r.pet.photoUrl && requestPhotos.has(r.id) ? { ...r, pet: { ...r.pet, photoUrl: requestPhotos.get(r.id) } } : r,
    ),
    sitter:
      fresh.sitter && sitterPhoto && !fresh.sitter.profile.photoUrl
        ? { ...fresh.sitter, profile: { ...fresh.sitter.profile, photoUrl: sitterPhoto } }
        : fresh.sitter,
  };
}

export { STORAGE_KEY };
