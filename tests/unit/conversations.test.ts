import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  conversationsFor,
  newConversation,
  newConversationMessage,
  restoreConversations,
  unreadCount,
  EMPTY_CONTEXT,
  type Conversation,
} from "@/data/conversations";
import { notificationsFor, unreadThreads } from "@/data/notifications";
import { INITIAL_STATE, reducer, type DemoState } from "@/state/demo/reducer";

/* Nidz 1.4 step 5 — messages before a request, kept on this device. "Unread"
   is view state of ONE SPACE, never a read receipt; nothing is delivered. */

const T0 = "2026-11-20T10:00:00.000Z";
const T1 = "2026-11-20T11:00:00.000Z";
const T2 = "2026-11-20T12:00:00.000Z";

const conv = (patch: Partial<Conversation> = {}): Conversation => ({
  ...newConversation({ sitterId: "sitter-local", ownerName: "Lina K.", context: EMPTY_CONTEXT, now: T0 }),
  ...patch,
});

describe("conversations", () => {
  test("the starter's own space has seen it; the other has not", () => {
    const c = conv();
    assert.equal(c.seen.owner, T0);
    assert.equal(c.seen.sitter, null);
  });

  test("unread counts only the OTHER side's messages since this side opened it", () => {
    const c = conv({
      messages: [newConversationMessage("owner", "Bonjour", T1), newConversationMessage("sitter", "Oui ?", T2)],
    });
    assert.equal(unreadCount(c, "sitter"), 1, "the owner's message is unread for the sitter space");
    assert.equal(unreadCount(c, "owner"), 1, "the sitter's reply is unread for the owner space");
    assert.equal(unreadCount({ ...c, seen: { owner: T2, sitter: T2 } }, "owner"), 0);
  });

  test("a sitter sees only conversations addressed to their own profile", () => {
    const mine = conv();
    const other = conv({ id: "c2", sitterId: "amina-b" });
    assert.equal(conversationsFor([mine, other], "owner", "sitter-local").length, 2);
    assert.deepEqual(conversationsFor([mine, other], "sitter", "sitter-local").map((c) => c.id), [mine.id]);
    assert.equal(conversationsFor([mine, other], "sitter", null).length, 0);
  });

  test("storage is untrusted: bad records and bad messages are dropped, not trusted", () => {
    const good = conv({ messages: [newConversationMessage("owner", "Bonjour", T1)] });
    const restored = restoreConversations([
      good,
      { id: 3 },
      { ...good, id: "c3", messages: [{ id: "m", author: "admin", text: "x", createdAt: T1 }, null] },
    ]);
    assert.equal(restored.length, 2);
    assert.equal(restored[0].messages.length, 1);
    assert.equal(restored[1].messages.length, 0);
    assert.deepEqual(restoreConversations("nope"), []);
  });

  test("reducer: start once, add a message, mark seen only forwards", () => {
    let state: DemoState = { ...INITIAL_STATE };
    const c = conv();
    state = reducer(state, { type: "startConversation", conversation: c });
    state = reducer(state, { type: "startConversation", conversation: c });
    assert.equal(state.conversations.length, 1);
    state = reducer(state, { type: "addConversationMessage", id: c.id, message: newConversationMessage("owner", "Salut", T1) });
    state = reducer(state, { type: "addConversationMessage", id: c.id, message: newConversationMessage("owner", "   ", T1) });
    assert.equal(state.conversations[0].messages.length, 1, "an empty message is refused");
    state = reducer(state, { type: "markConversationSeen", id: c.id, side: "sitter", at: T2 });
    state = reducer(state, { type: "markConversationSeen", id: c.id, side: "sitter", at: T1 });
    assert.equal(state.conversations[0].seen.sitter, T2, "seen never moves backwards");
  });

  test("notifications are derived from local state, and unread threads drive the badge", () => {
    const c = conv({ messages: [newConversationMessage("owner", "Bonjour", T1)] });
    const state: DemoState = {
      ...INITIAL_STATE,
      sitter: { profile: { id: "sitter-local", publicName: "Lina K.", acceptedSpecies: [] }, published: true, hidden: false, idDocument: null } as unknown as DemoState["sitter"],
      conversations: [c],
    };
    assert.equal(unreadThreads(state, "sitter"), 1);
    assert.equal(unreadThreads(state, "owner"), 0);
    const items = notificationsFor(state, "sitter");
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "message");
    assert.equal(items[0].text.key, "notifications.message");
    assert.equal(notificationsFor(state, "owner").length, 0);
    /* Switching « Messages » off in Paramètres hides it and the badge. */
    const quiet: DemoState = { ...state, preferences: { ...state.preferences, notifications: { ...state.preferences.notifications, messages: false } } };
    assert.equal(notificationsFor(quiet, "sitter").length, 0);
    assert.equal(unreadThreads(quiet, "sitter"), 0);
  });
});
