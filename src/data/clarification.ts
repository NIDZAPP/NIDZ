/* ---------------------------------------------------------------------------
   CLARIFICATION BEFORE A DECISION (Audit 1.3 LOT 07).

   A sitter shown only "Accepter" and "Refuser" has to decide on what the
   request says, or decline for want of a detail. This lets either side add a
   QUESTION to a pending request, and the other side answer it, before anyone
   decides.

   WHAT IT IS NOT. It is not messaging. There is no server, so nothing written
   here reaches another person's phone: a question exists only in this
   browser, on the request it belongs to, and every surface that shows one
   says so. No notification, no SMS, no "delivered", no "read", and no meeting
   is ever confirmed — a question about meeting before the stay is a question
   like any other.

   Asking changes NOTHING about the request's status: it stays "pending" while
   questions are exchanged, and only accepting or declining moves it. The
   animal, the dates and the sitter stay exactly as they were sent.

   THE CONTRACT A BACKEND WILL REPLACE. Everything below is pure data and pure
   functions over a request, so the future server version is a change of
   transport, not of model:

     GET  /requests/:id/messages        → ClarificationMessage[]
     POST /requests/:id/messages        { author, text } → ClarificationMessage
       - server stamps `id` and `createdAt`, and sets `author` from the
         authenticated identity — never from the client;
       - refused unless the request is pending and the caller is its owner or
         its sitter;
       - delivery, read state and notifications become real THERE, and only
         then may the interface mention them.

   Until then `addClarification` (reducer) is the transport.
   ------------------------------------------------------------------------ */

import type { CareRequest } from "./types";

/** Who wrote it — a side of the request, not a person's identity. */
export type ClarificationAuthor = "sitter" | "owner";

export type ClarificationMessage = {
  id: string;
  author: ClarificationAuthor;
  text: string;
  createdAt: string;
};

/** Long enough for a real question, short enough to stay a question. */
export const CLARIFICATION_MAX_LENGTH = 500;

/** Starting points for the sitter, as editable text. "Can we meet first?" is
    one of them: a question, never a confirmed meeting. */
export const SITTER_QUESTION_KEYS = [
  "clarify.suggest.meet",
  "clarify.suggest.otherAnimals",
  "clarify.suggest.routine",
] as const;

export function threadOf(request: Pick<CareRequest, "thread">): ClarificationMessage[] {
  return request.thread ?? [];
}

/** Whether a question can be added at all: only while nothing is decided. */
export function canClarify(request: Pick<CareRequest, "status">): boolean {
  return request.status === "pending";
}

/** The last word is the other side's — what each side's screen flags. */
export function awaitingReplyFrom(request: Pick<CareRequest, "thread" | "status">): ClarificationAuthor | null {
  if (!canClarify(request)) return null;
  const last = threadOf(request).at(-1);
  if (!last) return null;
  return last.author === "sitter" ? "owner" : "sitter";
}

export function newMessage(author: ClarificationAuthor, text: string): ClarificationMessage {
  return {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    author,
    text: text.trim().slice(0, CLARIFICATION_MAX_LENGTH),
    createdAt: new Date().toISOString(),
  };
}

/** Storage is untrusted: keep only whole messages. */
export function restoreThread(value: unknown): ClarificationMessage[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((m): ClarificationMessage[] => {
    if (typeof m !== "object" || m === null) return [];
    const raw = m as Record<string, unknown>;
    if (raw.author !== "sitter" && raw.author !== "owner") return [];
    if (typeof raw.id !== "string" || typeof raw.text !== "string" || !raw.text.trim()) return [];
    /* A duplicated id would be a duplicated React key. */
    if (seen.has(raw.id)) return [];
    seen.add(raw.id);
    return [
      {
        id: raw.id,
        author: raw.author,
        text: raw.text.slice(0, CLARIFICATION_MAX_LENGTH),
        /* Formatted on screen: an unparseable date is dropped, not shown. */
        createdAt:
          typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt)) ? raw.createdAt : "",
      },
    ];
  });
}
