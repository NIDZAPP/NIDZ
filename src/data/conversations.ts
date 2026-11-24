/* ---------------------------------------------------------------------------
   MESSAGES BEFORE A REQUEST (Nidz 1.4, step 5).

   An owner may want to ask a sitter something before asking for care at all —
   "do you take a dog who has never stayed away?". A CONVERSATION is that
   exchange: one owner, one sitter, the care being considered, and the notes
   written about it.

   WHAT IT IS NOT. Real messaging. There is no server, so nothing written here
   reaches anyone else's phone (design system §0.1: « ne jamais simuler comme
   réels des échanges, notifications ou accusés de lecture »):

     - a message exists only in this browser;
     - it is "ajouté", never "envoyé" or "délivré";
     - there is no read receipt: nothing here can know whether the other
       person saw anything, and no surface may say so;
     - "unread" means only that THIS SPACE, ON THIS DEVICE, has not opened the
       conversation since the other side wrote in it — the same person can hold
       both spaces of one account, exactly as with requests.

   Only the visitor's OWN sitter profile can answer, from the sitter space —
   the same mechanism that lets a request reach "Demandes reçues". An example
   profile has nobody behind it, and every surface says so.

   THE CONTRACT A BACKEND WILL REPLACE (pure data, so it is a change of
   transport, not of model):

     GET  /conversations                 → Conversation[] for the caller's side
     POST /conversations                 { sitterId, context } → Conversation
     POST /conversations/:id/messages    { text } → ConversationMessage
       - the server stamps id, createdAt and author from the authenticated
         identity — never from the client;
     PUT  /conversations/:id/seen        → the caller's own last-opened mark
       - delivery, read receipts and push notifications become real THERE,
         and only then may the interface mention them.
   ------------------------------------------------------------------------ */

import { restorePet, forSharing, type SharedPet } from "./pets";
import { CARE_TYPES, type CareType, type DateRange } from "./types";

export type ConversationSide = "owner" | "sitter";

export type ConversationMessage = {
  id: string;
  author: ConversationSide;
  text: string;
  createdAt: string;
};

/** The care being considered, copied when the conversation starts — like a
    request, so editing the animal later does not rewrite what was asked
    about. Every part is optional: a question can come before any plan. */
export type ConversationContext = {
  pet: SharedPet | null;
  careType: CareType | null;
  dates: DateRange | null;
  communeCode: string | null;
};

export type Conversation = {
  id: string;
  sitterId: string;
  /** The owner's public name (first name + initial), as on a request. */
  ownerName: string;
  createdAt: string;
  context: ConversationContext;
  messages: ConversationMessage[];
  /** When each SPACE of this device last opened the conversation. View state,
      never a read receipt. */
  seen: { owner: string | null; sitter: string | null };
};

export const MESSAGE_MAX_LENGTH = 1000;

export const EMPTY_CONTEXT: ConversationContext = { pet: null, careType: null, dates: null, communeCode: null };

const stamp = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function newConversation(input: {
  sitterId: string;
  ownerName: string;
  context: ConversationContext;
  now?: string;
}): Conversation {
  const now = input.now ?? new Date().toISOString();
  return {
    id: `conv-${stamp()}`,
    sitterId: input.sitterId,
    ownerName: input.ownerName,
    createdAt: now,
    context: input.context,
    messages: [],
    /* The owner is the one starting it, so the owner space has seen it. */
    seen: { owner: now, sitter: null },
  };
}

export function newConversationMessage(author: ConversationSide, text: string, now?: string): ConversationMessage {
  return {
    id: `cmsg-${stamp()}`,
    author,
    text: text.trim().slice(0, MESSAGE_MAX_LENGTH),
    createdAt: now ?? new Date().toISOString(),
  };
}

export function lastMessage(conversation: Conversation): ConversationMessage | null {
  return conversation.messages.at(-1) ?? null;
}

/** Messages the OTHER side added since this side last opened the thread. */
export function unreadCount(conversation: Conversation, side: ConversationSide): number {
  const seenAt = conversation.seen[side];
  return conversation.messages.filter((m) => m.author !== side && (!seenAt || m.createdAt > seenAt)).length;
}

/** The conversations a side can see: all of them for the owner; for the
    sitter, only those addressed to their own profile. */
export function conversationsFor(
  conversations: readonly Conversation[],
  side: ConversationSide,
  ownSitterId: string | null,
): Conversation[] {
  const list = side === "owner" ? [...conversations] : conversations.filter((c) => c.sitterId === ownSitterId);
  /* Most recent activity first. */
  const at = (c: Conversation) => lastMessage(c)?.createdAt ?? c.createdAt;
  return list.sort((a, b) => (at(a) < at(b) ? 1 : at(a) > at(b) ? -1 : 0));
}

/* --------------------------------------------------------------- storage */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
const isISODate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function restoreMessage(raw: unknown): ConversationMessage | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.text !== "string" || !isTime(raw.createdAt)) return null;
  if (raw.author !== "owner" && raw.author !== "sitter") return null;
  return { id: raw.id, author: raw.author, text: raw.text.slice(0, MESSAGE_MAX_LENGTH), createdAt: raw.createdAt };
}

function restoreContext(raw: unknown): ConversationContext {
  if (!isObject(raw)) return EMPTY_CONTEXT;
  const pet = isObject(raw.pet) ? restorePet({ care: {}, ...raw.pet }) : null;
  const d = raw.dates;
  const dates =
    isObject(d) && isISODate(d.start) && isISODate(d.end) && d.start <= d.end ? { start: d.start, end: d.end } : null;
  return {
    pet: pet ? forSharing(pet) : null,
    careType: typeof raw.careType === "string" && (CARE_TYPES as readonly string[]).includes(raw.careType) ? (raw.careType as CareType) : null,
    dates,
    communeCode: typeof raw.communeCode === "string" ? raw.communeCode : null,
  };
}

/** Read the conversations out of untrusted storage; one bad record costs that
    record, one bad message costs that message. */
export function restoreConversations(raw: unknown): Conversation[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((c): Conversation[] => {
    if (!isObject(c) || typeof c.id !== "string" || typeof c.sitterId !== "string" || !isTime(c.createdAt)) return [];
    const seen = isObject(c.seen) ? c.seen : {};
    return [
      {
        id: c.id,
        sitterId: c.sitterId,
        ownerName: typeof c.ownerName === "string" ? c.ownerName : "",
        createdAt: c.createdAt,
        context: restoreContext(c.context),
        messages: Array.isArray(c.messages)
          ? c.messages.map(restoreMessage).filter((m): m is ConversationMessage => m !== null)
          : [],
        seen: { owner: isTime(seen.owner) ? seen.owner : null, sitter: isTime(seen.sitter) ? seen.sitter : null },
      },
    ];
  });
}
