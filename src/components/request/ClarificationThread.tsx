import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import MessageBubble from "@/components/messages/MessageBubble";
import { MessageCircleQuestion } from "lucide-react";

import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CLARIFICATION_MAX_LENGTH,
  SITTER_QUESTION_KEYS,
  canClarify,
  newMessage,
  threadOf,
  type ClarificationAuthor,
} from "@/data/clarification";
import type { CareRequest } from "@/data/types";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { formatDate, toISODate } from "@/utils/dates";

/**
 * Questions on a pending request, before anyone decides (Audit 1.3 LOT 07).
 *
 * Rendered on both sides — the sitter's inbox and the owner's request — over
 * the same `thread` on the same record, so there is nothing to synchronise.
 *
 * HONESTY. Nothing here is transmitted: there is no server. The composer says
 * so under its button, at full text size, and the thread never shows
 * "envoyé", "lu", a delivery tick or a notification. A question about meeting
 * before the stay is offered as a starting point, as a QUESTION — there is no
 * "proposer un rendez-vous" control, because nothing could confirm one.
 *
 * Asking does not change the request's status. Only accepting or declining
 * does, and those live outside this component.
 */
export default function ClarificationThread({
  request,
  side,
  composerOpen,
  onComposerOpenChange,
  headingLevel = "h3",
}: {
  request: CareRequest;
  /** The side of the request the current screen belongs to. */
  side: ClarificationAuthor;
  /** Controlled, so the screen's own "Poser une question" button can open it.
      Closing says why, so the screen can put focus back where it belongs. */
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean, reason?: "added" | "cancelled") => void;
  headingLevel?: "h2" | "h3";
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  /* A question being typed is a draft like any other form (A-01), per
     request and per side. It can only be added while the request is still
     pending: decided in another tab meanwhile, it is refused as a conflict
     rather than reported as added and silently dropped (A-19). */
  const scope = `clarify-${request.id}-${side}`;
  const save = useSave({
    scope,
    watch: (s) => s.requests.find((r) => r.id === request.id)?.status ?? null,
  });
  const [text, setText] = useDraftField(scope, "text", () => "");
  const [error, setError] = useState<string>();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  const ids = useId();
  const Heading = headingLevel;

  /* Focus never falls to <body> (LOT 07 review): opening the composer puts it
     in the field; adding moves it to the thread's heading, where the new
     question is announced as part of the section. Cancelling is the screen's
     to handle (it restores its "Poser une question" button). */
  useEffect(() => {
    if (composerOpen) fieldRef.current?.focus();
  }, [composerOpen]);
  const threadLength = threadOf(request).length;
  useEffect(() => {
    if (focusHeading.current) {
      focusHeading.current = false;
      headingRef.current?.focus();
    }
  }, [threadLength]);

  const thread = threadOf(request);
  const open = canClarify(request);
  if (thread.length === 0 && !(open && composerOpen)) return null;

  const submit = () => {
    if (!text.trim()) {
      setError(t("clarify.required"));
      fieldRef.current?.focus();
      return;
    }
    if (!save.save({ type: "addClarification", id: request.id, message: newMessage(side, text) })) return;
    focusHeading.current = true;
    /* Saved: the composer starts empty again, without writing an empty draft. */
    save.discard();
    setError(undefined);
    onComposerOpenChange(false, "added");
  };

  const authorLabel = (author: ClarificationAuthor) =>
    author === side
      ? t("clarify.you")
      : author === "sitter"
        ? t("clarify.fromSitter")
        : t("clarify.fromOwner");

  return (
    <section aria-labelledby={`${ids}-title`} className="surface mt-3 p-5">
      <Heading
        id={`${ids}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="flex items-center gap-2 text-title font-semibold text-foreground focus:outline-none"
      >
        <MessageCircleQuestion className="size-5 shrink-0 text-primary" aria-hidden="true" />
        {t("clarify.title")}
      </Heading>
      {/* Always stated where the questions are shown: these stay in this
          browser and nobody was notified. */}
      <p className="mt-1 max-w-[64ch] text-sm text-muted-foreground">{t("clarify.localNote")}</p>

      {thread.length > 0 && (
        <ol className="mt-4 space-y-3">
          {thread.map((message) => (
            <li key={message.id}>
              <MessageBubble
                mine={message.author === side}
                author={authorLabel(message.author)}
                meta={message.createdAt ? formatDate(toISODate(new Date(message.createdAt)), lng) : undefined}
              >
                {message.text}
              </MessageBubble>
            </li>
          ))}
        </ol>
      )}

      {open && composerOpen && (
        <form
          noValidate
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {side === "sitter" && (
            <div className="mb-3">
              <p id={`${ids}-suggest`} className="text-sm text-muted-foreground">
                {t("clarify.suggestLabel")}
              </p>
              <div role="group" aria-labelledby={`${ids}-suggest`} className="mt-2 flex flex-wrap gap-2">
                {SITTER_QUESTION_KEYS.map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-11 whitespace-normal py-2 text-start font-medium"
                    onClick={() => {
                      setText(t(key));
                      setError(undefined);
                      fieldRef.current?.focus();
                    }}
                  >
                    {t(key)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DraftNotice className="mb-3 mt-0" save={save} />
          <label htmlFor={`${ids}-field`} className="text-sm font-medium text-foreground">
            {side === "sitter" ? t("clarify.labelSitter") : t("clarify.labelOwner")}
          </label>
          <Textarea
            id={`${ids}-field`}
            ref={fieldRef}
            rows={3}
            maxLength={CLARIFICATION_MAX_LENGTH}
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${ids}-error` : `${ids}-note`}
            className="mt-2"
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
          />
          {error && (
            <p id={`${ids}-error`} role="alert" className="mt-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Secondary, not filled: on the sitter's side "Accepter la
                demande" is the one dominant action in view, and adding a
                question must not compete with it (§4.2). */}
            <Button type="submit" variant="secondary">
              {t("clarify.add")}
            </Button>
            <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => onComposerOpenChange(false, "cancelled")}>
              {t("clarify.cancel")}
            </Button>
          </div>
          <p id={`${ids}-note`} className="mt-2 max-w-[64ch] text-sm text-foreground">
            {t("clarify.notSent")}
          </p>
          <SaveFeedback className="mt-4" save={save} onRetry={submit} />
        </form>
      )}
    </section>
  );
}
