import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUp, CalendarDays, Info, MapPin } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import MessageBubble from "@/components/messages/MessageBubble";
import BackButton from "@/components/shared/BackButton";
import EmptyState from "@/components/shared/EmptyState";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { communeWithWilaya } from "@/data/algeria";
import { parseCriteria } from "@/data/criteria";
import {
  EMPTY_CONTEXT,
  MESSAGE_MAX_LENGTH,
  newConversation,
  newConversationMessage,
  type Conversation,
  type ConversationContext,
  type ConversationSide,
} from "@/data/conversations";
import { forSharing, kindLabel } from "@/data/pets";
import { conversationWith, findConversation, findSitter, sitterCanAnswer } from "@/data/repository";
import { requestPath } from "@/data/request-draft";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, formatRelativeTime } from "@/utils/dates";

/**
 * ONE CONVERSATION (Nidz 1.4, step 5) — a full-screen thread, like every
 * messaging app, with the care being discussed pinned on top.
 *
 * Two addresses:
 *   /messages/:id             an existing conversation;
 *   /messages/to/:sitterId    the owner's door from a profile. If a
 *                             conversation with that sitter exists, it opens;
 *                             otherwise the first message creates it, with
 *                             the brief (animal, care, dates) as its context.
 *
 * What a message is: a note kept in this browser ("Ajouter le message", never
 * "Envoyer"). The notice under the context says who, if anyone, could ever
 * read it — nobody for an example profile; the visitor's own sitter space for
 * their own profile. There is no "sent", "delivered", "seen" or typing
 * indicator anywhere: nothing here could know (design system §0.1).
 */
export default function MessageThread() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { id, sitterId: toSitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useDemo();

  const existing = id ? findConversation(state, id) : toSitterId ? conversationWith(state, toSitterId) : null;
  const sitterId = existing?.sitterId ?? toSitterId ?? null;
  const ownSitterId = state.sitter?.profile.id ?? null;
  /* The sitter side reads a conversation only when it is addressed to its own
     profile and the visitor is in the sitter space; everything else is the
     owner's view. */
  const side: ConversationSide =
    existing && state.activeWorkspace === "sitter" && existing.sitterId === ownSitterId ? "sitter" : "owner";

  const sitter = sitterId ? findSitter(state, sitterId).sitter : null;
  const otherName = side === "owner" ? (sitter?.publicName ?? "") : (existing?.ownerName ?? "");
  const answerable = sitterId ? sitterCanAnswer(state, sitterId) : false;

  const scope = `message-${existing?.id ?? `to-${sitterId ?? "none"}`}`;
  const [text, setText] = useDraftField<string>(scope, "text", () => "");
  const [error, setError] = useState<string>();
  const save = useSave({ scope });
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messageCount = existing?.messages.length ?? 0;

  /* Opening the thread marks it opened FOR THIS SPACE — view state, best
     effort, never a receipt. Again whenever the other side's message lands
     while it is open (another tab). */
  useEffect(() => {
    if (!existing) return;
    dispatch({ type: "markConversationSeen", id: existing.id, side, at: new Date().toISOString() });
  }, [existing?.id, side, messageCount, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  /* The composer shrinks back once its text is gone. */
  useEffect(() => {
    if (!text && fieldRef.current) fieldRef.current.style.height = "";
  }, [text]);

  /* One conversation per owner and sitter: the profile's door opens the
     existing thread rather than a second one. */
  if (toSitterId && existing) return <Navigate to={`/messages/${existing.id}`} replace />;

  if (!sitter || (id && !existing)) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="container py-4">
          <BackButton fallback="/messages" variant="round" label={t("messages.thread.back")} />
        </div>
        <main className="container flex-1 pb-10">
          <div className="mx-auto max-w-[640px]">
            <EmptyState headingLevel="h1" title={t("messages.notFound.title")} body={t("messages.notFound.body")} />
          </div>
        </main>
      </div>
    );
  }

  /* Writing needs an account (auth.intro says so); the detour returns here. */
  if (!existing && side === "owner" && !state.account) {
    return <Navigate to={`/auth?next=${encodeURIComponent(`${pathname}${search}`)}`} replace />;
  }

  /* The care being discussed: the conversation's own copy, or — before the
     first message — the brief the owner arrived with. */
  const context: ConversationContext = existing?.context ?? contextFromBrief(state, searchParams);
  const canWrite = side === "sitter" || side === "owner";
  const notice =
    side === "sitter"
      ? t("messages.thread.noticeSitter")
      : answerable
        ? t("messages.thread.noticeOwn")
        : t("messages.thread.noticeExample", { name: otherName });

  const add = () => {
    const body = text.trim();
    if (!body) {
      setError(t("messages.composer.required"));
      fieldRef.current?.focus();
      return;
    }
    const message = newConversationMessage(side, body);
    if (existing) {
      if (!save.save({ type: "addConversationMessage", id: existing.id, message })) return;
      /* Saved: the composer starts empty again without writing an empty
         draft (the same move as the clarification thread). */
      save.discard();
      setError(undefined);
      fieldRef.current?.focus();
      return;
    }
    const account = state.account;
    if (!account || !sitterId) return;
    const conversation: Conversation = newConversation({
      sitterId,
      ownerName: `${account.firstName} ${account.lastName.charAt(0).toUpperCase()}.`,
      context,
    });
    /* One write: the conversation and its first message, or neither. */
    if (
      !save.save([
        { type: "startConversation", conversation },
        { type: "addConversationMessage", id: conversation.id, message },
      ])
    )
      return;
    save.discard();
    navigate(`/messages/${conversation.id}`, { replace: true });
  };

  const requestHref = requestPath(sitter.id, briefSearch(context));
  const CareIcon = context.careType ? CARE_ICON[context.careType] : null;
  const zone = context.communeCode ? communeWithWilaya(context.communeCode, lng) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {otherName}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* -------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-30 bg-background/95 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="container flex h-16 items-center gap-3">
          <BackButton fallback="/messages" variant="round" label={t("messages.thread.back")} />
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand">
            {otherName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.0625rem] font-semibold leading-tight text-foreground">
              <bdi>{otherName}</bdi>
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {side === "owner" ? t("messages.roleSitter") : t("messages.roleOwner")}
            </p>
          </div>
          {side === "owner" && (
            <Button asChild variant="surface" size="sm" className="h-11 shrink-0">
              <Link to={`/sitters/${sitter.id}`} aria-label={t("messages.thread.viewProfile", { name: otherName })}>
                {t("search.card.viewProfile")}
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="container flex-1 pb-6">
        <div className="mx-auto max-w-[640px] space-y-3 pt-1">
          {/* The care being discussed, as a small pass. */}
          <section aria-label={t("messages.thread.contextTitle")} className="surface p-3.5">
            <div className="flex items-center gap-3.5">
              {context.pet ? (
                <AnimalPortrait species={context.pet.species} className="size-12 shrink-0 rounded-full" />
              ) : (
                <span aria-hidden="true" className="size-12 shrink-0 rounded-full bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-semibold text-foreground">
                  {context.pet
                    ? [context.pet.name, t(`species.${context.pet.species}`), kindLabel(context.pet, lng)]
                        .filter(Boolean)
                        .map((part, i) => (
                          <span key={i}>
                            {i > 0 && <span aria-hidden="true"> · </span>}
                            <bdi>{part}</bdi>
                          </span>
                        ))
                    : t("messages.thread.contextNone")}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  {CareIcon && context.careType && (
                    <span className="inline-flex items-center gap-1">
                      <CareIcon className="size-3.5" aria-hidden="true" />
                      {t(`care.${context.careType}`)}
                    </span>
                  )}
                  {context.dates && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      <bdi>{formatDateRange(context.dates, lng)}</bdi>
                    </span>
                  )}
                  {zone && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      <bdi>{zone}</bdi>
                    </span>
                  )}
                </p>
                {existing && <p className="mt-0.5 text-xs text-muted-foreground">{t("messages.thread.contextNote")}</p>}
              </div>
            </div>
            {/* The way from a question to a request, with the same context. */}
            {side === "owner" && (
              <Button asChild className="mt-3 w-full sm:w-auto">
                <Link to={requestHref}>{t("messages.thread.request")}</Link>
              </Button>
            )}
          </section>

          {/* Who, if anyone, could ever read this — at full weight. */}
          <p className="flex items-start gap-2.5 rounded-xl bg-sand/70 p-3.5 text-sm leading-relaxed text-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </p>

          <ol aria-live="polite" className="space-y-3 pt-2">
            {existing?.messages.map((m) => (
              <li key={m.id}>
                <MessageBubble
                  mine={m.author === side}
                  author={m.author === side ? t("messages.you") : otherName}
                  meta={formatRelativeTime(m.createdAt, lng)}
                >
                  {m.text}
                </MessageBubble>
              </li>
            ))}
          </ol>
          <div ref={endRef} />
        </div>
      </main>

      {/* -------------------------------------------------------- composer */}
      {canWrite && (
        <div
          className="sticky bottom-0 z-30 bg-background shadow-chrome-t"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <form
            noValidate
            className="container pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <div className="mx-auto max-w-[640px]">
              <DraftNotice className="mb-2 mt-0" save={save} />
              <SaveFeedback className="mb-3" save={save} onRetry={add} />
              <label htmlFor="message-field" className="mb-1.5 block px-1 text-xs font-medium text-muted-foreground">
                {t("messages.composer.label")}
              </label>
              <div className="flex items-end gap-2">
                <Textarea
                  id="message-field"
                  ref={fieldRef}
                  dir="auto"
                  rows={1}
                  maxLength={MESSAGE_MAX_LENGTH}
                  value={text}
                  placeholder={t("messages.composer.placeholder", { name: otherName })}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "message-error" : undefined}
                  className="max-h-40 min-h-12 resize-none rounded-3xl py-3"
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(undefined);
                    /* Grows with the text, up to the max height. */
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
                <Button type="submit" size="icon" className={cn("size-12 shrink-0")} aria-label={t("messages.composer.add")}>
                  <ArrowUp className="!size-5" aria-hidden="true" strokeWidth={2.5} />
                </Button>
              </div>
              {error && (
                <p id="message-error" role="alert" className="mt-2 px-1 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/** The brief the owner arrived with, as a conversation context: the animal
    named by the brief (a copy, without its private care plan), and the care,
    dates and area from the URL or the saved need. */
function contextFromBrief(
  state: ReturnType<typeof useDemo>["state"],
  params: URLSearchParams,
): ConversationContext {
  const criteria = parseCriteria(params);
  const petId = params.get("pet") ?? state.need.petId;
  const pet = state.pets.find((p) => p.id === petId) ?? null;
  return {
    ...EMPTY_CONTEXT,
    pet: pet ? forSharing(pet) : null,
    careType: criteria.care ?? state.need.careType,
    dates: criteria.dates ?? state.need.dates,
    communeCode: criteria.commune ?? state.account?.communeId ?? null,
  };
}

/** Back into the request flow with the same context. */
function briefSearch(context: ConversationContext): string {
  const params = new URLSearchParams();
  if (context.careType) params.set("care", context.careType);
  if (context.dates) {
    params.set("from", context.dates.start);
    params.set("to", context.dates.end);
  }
  if (context.pet) params.set("pet", context.pet.id);
  return params.toString();
}
