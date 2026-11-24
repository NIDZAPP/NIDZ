import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BellRing,
  CircleCheck,
  CircleX,
  Inbox,
  MessageCircle,
  MessageCircleQuestion,
  MessagesSquare,
} from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import EmptyState from "@/components/shared/EmptyState";
import { LIST_GROUP, REGISTER_ROW } from "@/components/shared/register";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { lastMessage, unreadCount, type Conversation, type ConversationSide } from "@/data/conversations";
import { notificationsFor, type LocalNotification } from "@/data/notifications";
import { conversationsOf, sitterNameFor } from "@/data/repository";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { formatRelativeTime } from "@/utils/dates";

/**
 * MESSAGES (Nidz 1.4, step 5) — the conversations of the space you are in,
 * and the notifications slot.
 *
 * Which side: the ACTIVE workspace. The owner sees the conversations they
 * started; the sitter, those addressed to their own profile. One person can
 * hold both, as with requests — that is how a conversation gets an answer in a
 * prototype with no server.
 *
 * Unread is bold plus a count in words ("2 non lus") — never colour alone —
 * and it means only "this space has not opened it since the other side wrote".
 * There is no read receipt anywhere: nothing here could know.
 */
export default function Messages() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const side: ConversationSide = state.activeWorkspace;
  const [tab, setTab] = useState<"conversations" | "notifications">("conversations");

  const conversations = conversationsOf(state, side);
  const notifications = notificationsFor(state, side);

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("messages.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("messages.title")}</h1>

        {/* A segmented control: two views of one space. Tabs semantics, so
            arrow keys move between them. */}
        {/* `max-w-full` and the tighter inline padding below `sm`: with both
            counts showing, two 16px-padded tabs were 297px wide — 9px more
            than a 320px screen has, so the page scrolled sideways. */}
        <div role="tablist" aria-label={t("messages.title")} className="mt-5 inline-flex max-w-full rounded-full bg-card p-1 shadow-pill">
          {(["conversations", "notifications"] as const).map((key) => {
            const count = key === "conversations" ? conversations.filter((c) => unreadCount(c, side) > 0).length : notifications.length;
            const selected = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`messages-tab-${key}`}
                aria-selected={selected}
                aria-controls={`messages-panel-${key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const next = key === "conversations" ? "notifications" : "conversations";
                    setTab(next);
                    document.getElementById(`messages-tab-${next}`)?.focus();
                  }
                }}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm transition-colors duration-150 sm:gap-2 sm:px-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "bg-primary-soft font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`messages.tabs.${key}`)}
                {count > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Once, at full weight, above whichever view is open. */}
        <DemoNotice className="mt-5" title={t("messages.local.title")} body={t("messages.local.body")} />

        <div
          role="tabpanel"
          id={`messages-panel-${tab}`}
          aria-labelledby={`messages-tab-${tab}`}
          className="mt-5"
        >
          {tab === "conversations" ? (
            <ConversationList conversations={conversations} side={side} />
          ) : (
            <NotificationList items={notifications} />
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationList({ conversations, side }: { conversations: Conversation[]; side: ConversationSide }) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title={t(`messages.empty.${side}.title`)}
        body={t(`messages.empty.${side}.body`)}
        action={
          side === "owner" ? (
            <Button asChild>
              <Link to="/search">{t("messages.empty.owner.action")}</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul role="list" className={LIST_GROUP}>
      {conversations.map((c) => {
        const name = side === "owner" ? sitterNameFor(state, c.sitterId) : c.ownerName;
        const last = lastMessage(c);
        const unread = unreadCount(c, side);
        const mine = last?.author === side;
        const preview = last ? last.text : t("messages.noMessageYet");
        return (
          <li key={c.id}>
            <Link to={`/messages/${c.id}`} className={REGISTER_ROW}>
              {/* The person, with the animal the conversation is about tucked
                  against their initial. */}
              <span aria-hidden="true" className="relative shrink-0">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand">
                  {name.charAt(0)}
                </span>
                {c.context.pet && (
                  <AnimalPortrait
                    species={c.context.pet.species}
                    className="absolute -bottom-1 -end-1 size-6 rounded-full ring-2 ring-card"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <bdi className={cn("min-w-0 break-words text-[0.9375rem] text-foreground", unread > 0 ? "font-bold" : "font-semibold")}>
                    {name}
                  </bdi>
                  {last && (
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(last.createdAt, lng)}</span>
                  )}
                </span>
                {/* The unread pill drops under the preview rather than leave it
                    a sliver: in Arabic ("رسالة غير مقروءة") the pill alone
                    took half the row at 320px. */}
                <span className="mt-0.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  {/* The "Vous :" prefix and the message are isolated apart, so a
                      French note inside Arabic clips at ITS end. Two lines, not
                      one: beside the unread pill at 320px a one-line preview
                      was "Bonjour Lina, av…". Still a preview — the thread
                      holds the message. */}
                  <span className={cn("flex min-w-[7rem] flex-1 items-baseline gap-1 text-sm", unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {mine && <span className="shrink-0">{t("messages.youLabel")}</span>}
                    <bdi dir="auto" className="line-clamp-2 min-w-0 break-words">
                      {preview}
                    </bdi>
                  </span>
                  {unread > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground">
                      {t("messages.unread", { count: unread })}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const NOTIFICATION_ICON = {
  message: MessageCircle,
  question: MessageCircleQuestion,
  incoming: Inbox,
} as const;

function NotificationList({ items }: { items: LocalNotification[] }) {
  const { t } = useTranslation();
  const lng = useAppLocale();

  const text = (n: LocalNotification) => {
    switch (n.kind) {
      case "message":
        return t("notifications.message", { name: n.name, count: n.count });
      case "question":
        return t("notifications.question", { pet: n.petName });
      case "decision":
        return t(`notifications.decision.${n.status}`, { name: n.name, pet: n.petName });
      case "incoming":
        return t("notifications.incoming", { name: n.name, pet: n.petName });
    }
  };

  return (
    <>
      <p className="mb-3 flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <BellRing className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t("notifications.note")}
      </p>
      {items.length === 0 ? (
        <EmptyState icon={BellRing} title={t("notifications.empty.title")} body={t("notifications.empty.body")} />
      ) : (
        <ul role="list" className={LIST_GROUP}>
          {items.map((n) => {
            const Icon =
              n.kind === "decision" ? (n.status === "accepted" ? CircleCheck : CircleX) : NOTIFICATION_ICON[n.kind];
            return (
              <li key={n.id}>
                <Link to={n.to} className={REGISTER_ROW}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      n.kind === "decision" && n.status === "accepted" ? "bg-success/10 text-success" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-medium text-foreground">{text(n)}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{formatRelativeTime(n.at, lng)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
