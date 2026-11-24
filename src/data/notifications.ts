/* ---------------------------------------------------------------------------
   NOTIFICATIONS — the slot, honestly filled (Nidz 1.4, step 5).

   What Nidz WOULD tell someone, derived from what actually happened on this
   device: a reply in a conversation, a question waiting on a request, a
   decision on a request, a new request received. Nothing is invented and
   nothing is pushed: there is no SMS, no e-mail, no push notification, and
   the screen that shows these says so. Pure functions of the state — the
   list a server would send is the same list, with delivery made real there.
   ------------------------------------------------------------------------ */

import { awaitingReplyFrom } from "./clarification";
import { unreadCount, lastMessage, type ConversationSide } from "./conversations";
import { conversationsOf, requestsReceived, requestsSent, sitterNameFor } from "./repository";
import type { DemoState } from "@/state/demo/reducer";

export type LocalNotification =
  | { id: string; kind: "message"; at: string; to: string; name: string; count: number }
  | { id: string; kind: "question"; at: string; to: string; petName: string }
  | { id: string; kind: "decision"; at: string; to: string; status: "accepted" | "declined"; name: string; petName: string }
  | { id: string; kind: "incoming"; at: string; to: string; petName: string; name: string };

export function notificationsFor(state: DemoState, side: ConversationSide): LocalNotification[] {
  const out: LocalNotification[] = [];

  for (const c of conversationsOf(state, side)) {
    const count = unreadCount(c, side);
    const last = lastMessage(c);
    if (count > 0 && last) {
      out.push({
        id: `message-${c.id}`,
        kind: "message",
        at: last.createdAt,
        to: `/messages/${c.id}`,
        name: side === "owner" ? sitterNameFor(state, c.sitterId) : c.ownerName,
        count,
      });
    }
  }

  const requests = side === "owner" ? requestsSent(state) : requestsReceived(state);
  for (const r of requests) {
    const detail = side === "owner" ? `/owner/requests/${r.id}` : "/sitter/requests";
    if (awaitingReplyFrom(r) === side) {
      out.push({ id: `question-${r.id}`, kind: "question", at: r.thread?.at(-1)?.createdAt ?? r.createdAt, to: detail, petName: r.pet.name });
    }
    if (side === "owner" && r.status !== "pending" && r.respondedAt) {
      out.push({
        id: `decision-${r.id}`,
        kind: "decision",
        at: r.respondedAt,
        to: detail,
        status: r.status,
        name: sitterNameFor(state, r.sitterId),
        petName: r.pet.name,
      });
    }
    if (side === "sitter" && r.status === "pending") {
      out.push({ id: `incoming-${r.id}`, kind: "incoming", at: r.createdAt, to: detail, petName: r.pet.name, name: r.ownerName });
    }
  }

  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** Unread conversations for the header badge: a count of THREADS, not of
    notifications, so it means one thing. */
export function unreadThreads(state: DemoState, side: ConversationSide): number {
  return conversationsOf(state, side).filter((c) => unreadCount(c, side) > 0).length;
}
