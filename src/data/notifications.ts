/* ---------------------------------------------------------------------------
   NOTIFICATIONS — the slot, honestly filled (Nidz 1.4, extended in 1.7).

   What Nidz WOULD tell someone, derived from what actually happened on this
   device: a reply in a conversation, a question waiting on a request, a new
   direct request, a decision, a proposal on a published request, a proposal
   accepted or not retained, an arrangement called off, a care starting soon,
   published requests matching a sitter's profile. Nothing is invented and
   nothing is pushed: there is no SMS, no e-mail, no push notification, and
   the screen that shows these says so. Pure functions of the state — the
   list a server would send is the same list, with delivery made real there.

   Each item has a TOPIC, and the person's notification preferences
   (`preferences.ts`) decide which optional topics are shown. Essential ones
   — about a request or a proposal the person is part of — always are.
   ------------------------------------------------------------------------ */

import { awaitingReplyFrom } from "./clarification";
import { compatibility } from "./compatibility";
import { unreadCount, lastMessage, type ConversationSide } from "./conversations";
import { offeredServices, overlapsDeclaredUnavailable } from "./offer";
import { topicEnabled, type NotificationTopic } from "./preferences";
import { acceptsProposals, proposalAwaitsOwner, requestAwaitsSitter } from "./publications";
import {
  conversationsOf,
  feedPosts,
  findPost,
  postsPublished,
  proposalsReceived,
  proposalsSent,
  requestsReceived,
  requestsSent,
  sitterNameFor,
} from "./repository";
import type { DemoState } from "@/state/demo/reducer";
import { addDays, toISODate, today } from "@/utils/dates";

export type NotificationTone = "neutral" | "positive" | "ended";

export type LocalNotification = {
  id: string;
  /** Decides the icon. */
  kind:
    | "message"
    | "question"
    | "incoming"
    | "decision"
    | "proposal"
    | "proposalDecision"
    | "cancelled"
    | "reminder"
    | "opportunities";
  topic: NotificationTopic;
  tone: NotificationTone;
  at: string;
  to: string;
  /** i18n key and its values; the screen translates. */
  text: { key: string; values: Record<string, string | number> };
};

/** Matching profile, nearby opportunities: counted, never announced as new. */
function opportunityCount(state: DemoState): number {
  const profile = state.sitter?.profile;
  if (!profile || profile.acceptedSpecies.length === 0) return 0;
  const todayISO = toISODate(today());
  return feedPosts(state).filter(
    (post) =>
      acceptsProposals(post, todayISO) &&
      compatibility(profile, { species: post.pet.species, kindId: post.pet.kindId, kindOther: post.pet.kindOther }).level !==
        "incompatible" &&
      offeredServices(profile).includes(post.careType) &&
      !overlapsDeclaredUnavailable(profile, post.dates),
  ).length;
}

export function allNotificationsFor(state: DemoState, side: ConversationSide): LocalNotification[] {
  const out: LocalNotification[] = [];
  const push = (n: LocalNotification) => out.push(n);

  for (const c of conversationsOf(state, side)) {
    const count = unreadCount(c, side);
    const last = lastMessage(c);
    if (count > 0 && last) {
      push({
        id: `message-${c.id}`,
        kind: "message",
        topic: "messages",
        tone: "neutral",
        at: last.createdAt,
        to: `/messages/${c.id}`,
        text: { key: "notifications.message", values: { name: side === "owner" ? sitterNameFor(state, c.sitterId) : c.ownerName, count } },
      });
    }
  }

  const todayISO = toISODate(today());
  const requests = side === "owner" ? requestsSent(state) : requestsReceived(state);
  for (const r of requests) {
    const detail = side === "owner" ? `/owner/requests/${r.id}` : "/sitter/requests?tab=received";
    if (requestAwaitsSitter(r, todayISO) && awaitingReplyFrom(r) === side) {
      push({
        id: `question-${r.id}`,
        kind: "question",
        topic: "requests",
        tone: "neutral",
        at: r.thread?.at(-1)?.createdAt ?? r.createdAt,
        to: detail,
        text: { key: "notifications.question", values: { pet: r.pet.name } },
      });
    }
    if (side === "owner" && (r.status === "accepted" || r.status === "declined") && r.respondedAt) {
      push({
        id: `decision-${r.id}`,
        kind: "decision",
        topic: "updates",
        tone: r.status === "accepted" ? "positive" : "ended",
        at: r.respondedAt,
        to: detail,
        text: { key: `notifications.decision.${r.status}`, values: { name: sitterNameFor(state, r.sitterId), pet: r.pet.name } },
      });
    }
    if (side === "sitter" && requestAwaitsSitter(r, todayISO)) {
      push({
        id: `incoming-${r.id}`,
        kind: "incoming",
        topic: "requests",
        tone: "neutral",
        at: r.createdAt,
        to: detail,
        text: { key: "notifications.incoming", values: { name: r.ownerName, pet: r.pet.name } },
      });
    }
    /* Called off by the OTHER side: that is news; one's own action is not. */
    if (r.status === "cancelled" && r.respondedAt && r.cancelledBy && r.cancelledBy !== side) {
      push({
        id: `cancelled-${r.id}`,
        kind: "cancelled",
        topic: "updates",
        tone: "ended",
        at: r.respondedAt,
        to: side === "owner" ? detail : "/sitter/requests?tab=validated",
        text: { key: "notifications.cancelled", values: { pet: r.pet.name } },
      });
    }
    if (side === "sitter" && r.status === "withdrawn" && r.respondedAt) {
      push({
        id: `withdrawn-${r.id}`,
        kind: "cancelled",
        topic: "updates",
        tone: "ended",
        at: r.respondedAt,
        to: detail,
        text: { key: "notifications.withdrawn", values: { name: r.ownerName, pet: r.pet.name } },
      });
    }
  }

  if (side === "owner") {
    for (const p of proposalsReceived(state)) {
      const post = findPost(state, p.postId);
      if (!post) continue;
      if (proposalAwaitsOwner(p, post, todayISO)) {
        push({
          id: `proposal-${p.id}`,
          kind: "proposal",
          topic: "proposals",
          tone: "neutral",
          at: p.createdAt,
          to: `/owner/posts/${post.id}`,
          text: { key: p.simulated ? "notifications.proposalSimulated" : "notifications.proposal", values: { name: sitterNameFor(state, p.sitterId), pet: post.pet.name } },
        });
      }
      if (p.status === "cancelled" && p.cancelledBy === "sitter" && p.respondedAt) {
        push({
          id: `post-cancelled-${p.id}`,
          kind: "cancelled",
          topic: "updates",
          tone: "ended",
          at: p.respondedAt,
          to: `/owner/posts/${post.id}`,
          text: { key: "notifications.cancelled", values: { pet: post.pet.name } },
        });
      }
    }
  } else {
    for (const p of proposalsSent(state)) {
      const post = findPost(state, p.postId);
      if (!post || !p.respondedAt) continue;
      if (p.status === "accepted" || p.status === "declined" || p.status === "notRetained" || p.status === "outdated") {
        push({
          id: `proposal-decision-${p.id}`,
          kind: "proposalDecision",
          topic: "updates",
          tone: p.status === "accepted" ? "positive" : "ended",
          at: p.respondedAt,
          to: `/sitter/posts/${post.id}`,
          text: { key: `notifications.proposalDecision.${p.status}`, values: { name: post.ownerName, pet: post.pet.name } },
        });
      }
      if (p.status === "cancelled" && p.cancelledBy === "owner") {
        push({
          id: `proposal-cancelled-${p.id}`,
          kind: "cancelled",
          topic: "updates",
          tone: "ended",
          at: p.respondedAt,
          to: `/sitter/posts/${post.id}`,
          text: { key: "notifications.cancelled", values: { pet: post.pet.name } },
        });
      }
    }
  }

  /* Reminders: an agreed care starting within the next three days. Derived
     from the dates the two people agreed on — not a booking engine. */
  const soon = toISODate(addDays(today(), 3));
  const agreed =
    side === "owner"
      ? [
          ...requestsSent(state).filter((r) => r.status === "accepted").map((r) => ({ id: r.id, pet: r.pet.name, dates: r.dates, to: `/owner/requests/${r.id}` })),
          ...postsPublished(state).filter((p) => p.status === "accepted").map((p) => ({ id: p.id, pet: p.pet.name, dates: p.dates, to: `/owner/posts/${p.id}` })),
        ]
      : [
          ...requestsReceived(state).filter((r) => r.status === "accepted").map((r) => ({ id: r.id, pet: r.pet.name, dates: r.dates, to: "/sitter/requests?tab=validated" })),
          ...proposalsSent(state)
            .filter((p) => p.status === "accepted")
            .flatMap((p) => {
              const post = findPost(state, p.postId);
              return post ? [{ id: p.id, pet: post.pet.name, dates: post.dates, to: `/sitter/posts/${post.id}` }] : [];
            }),
        ];
  for (const a of agreed) {
    if (a.dates.start >= todayISO && a.dates.start <= soon) {
      push({
        id: `reminder-${a.id}`,
        kind: "reminder",
        topic: "reminders",
        tone: "neutral",
        at: `${todayISO}T00:00:00.000Z`,
        to: a.to,
        text: { key: "notifications.reminder", values: { pet: a.pet, date: a.dates.start } },
      });
    }
  }

  if (side === "sitter") {
    const count = opportunityCount(state);
    if (count > 0) {
      push({
        id: "opportunities",
        kind: "opportunities",
        topic: "opportunities",
        tone: "neutral",
        at: `${todayISO}T00:00:00.000Z`,
        to: "/sitter/feed",
        text: { key: "notifications.opportunities", values: { count } },
      });
    }
  }

  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** What the person chose to see (Paramètres › Notifications). */
export function notificationsFor(state: DemoState, side: ConversationSide): LocalNotification[] {
  return allNotificationsFor(state, side).filter((n) => topicEnabled(state.preferences, n.topic));
}

/** Unread conversations for the tab badge: a count of THREADS, not of
    notifications, so it means one thing. Respects the « Messages » switch. */
export function unreadThreads(state: DemoState, side: ConversationSide): number {
  if (!topicEnabled(state.preferences, "messages")) return 0;
  return conversationsOf(state, side).filter((c) => unreadCount(c, side) > 0).length;
}
