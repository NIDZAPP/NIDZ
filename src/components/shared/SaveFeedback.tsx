import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, History, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SaveController } from "@/hooks/use-save";
import { cn } from "@/lib/utils";

/** After a control removes itself (a discarded draft, a taken version), focus
    goes to the screen's heading rather than falling to the page body. */
function focusHeadingAfterRender(from: HTMLElement | null) {
  const heading = from?.closest("main")?.querySelector<HTMLElement>("h1");
  requestAnimationFrame(() => heading?.focus());
}

/**
 * What a form says when a save did NOT happen (Audit 1.3.1 A-02 / A-19).
 *
 * The visitor's input is untouched — the form never moved on — and this says
 * so in plain words (§18: "Impossible d'enregistrer…", never "Erreur 422"),
 * with colour, text and an icon (§25). It takes focus as it appears, and is
 * scrolled to the middle of the screen: on a phone the action bar is pinned
 * to the bottom and the message could otherwise sit under it. Focus is what
 * announces it — a group named by its title and described by its text — so it
 * is not also a live region, which many screen readers would read twice.
 *
 *  - storage refused → "Réessayer" runs the same submit again. A retry that
 *    fails again is announced again (`attempt`).
 *  - another tab changed the data → the visitor chooses: keep their version
 *    (an explicit overwrite), or take the saved one (their draft is dropped).
 *    A conflict is a choice, not a fault, so it is not drawn in red (§26).
 */
export function SaveFeedback({
  save,
  onRetry,
  onKeepMine,
  failedTitle,
  failedBody,
  className,
}: {
  save: Pick<SaveController, "failure" | "attempt" | "discard">;
  /** Re-run the form's submit. */
  onRetry: () => void;
  /** Re-run the form's submit, overwriting the other tab's change. Omit where
      overwriting is not a choice — a decision on a request another tab has
      already decided cannot be "kept": the only way on is what is saved. */
  onKeepMine?: () => void;
  /** For an action that is not a save — erasing, deleting — so the message
      does not talk about saving. */
  failedTitle?: string;
  failedBody?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const { failure, attempt } = save;

  useEffect(() => {
    if (!failure || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    ref.current.scrollIntoView({ block: "center" });
  }, [failure, attempt]);

  if (!failure) return null;
  const conflict = failure === "conflict";
  const Icon = conflict ? Info : AlertCircle;

  return (
    <div
      /* Remounted on every failed attempt, so each one is announced. */
      key={attempt}
      ref={ref}
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      tabIndex={-1}
      data-save-failure={failure}
      className={cn("border-y border-border py-4 focus:outline-none", className)}
    >
      <p
        id={`${id}-title`}
        className={cn("flex items-start gap-2 text-sm font-medium", conflict ? "text-foreground" : "text-destructive")}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {conflict ? t("save.conflictTitle") : (failedTitle ?? t("save.failedTitle"))}
      </p>
      <p id={`${id}-body`} className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
        {conflict
          ? onKeepMine
            ? t("save.conflictBody")
            : t("save.conflictBodySingle")
          : (failedBody ?? t("save.failedBody"))}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {conflict ? (
          <>
            {onKeepMine && (
              <Button type="button" variant="outline" onClick={onKeepMine}>
                {t("save.keepMine")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                focusHeadingAfterRender(ref.current);
                save.discard();
              }}
            >
              {t("save.useSaved")}
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onRetry}>
            {t("save.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * A form reopened on what the visitor had typed before (A-01) — said, so a
 * restored draft is never mistaken for saved data. One line, at the density of
 * a demo marker, with the way back to what is actually saved.
 */
export function DraftNotice({
  save,
  className,
}: {
  save: Pick<SaveController, "restored" | "discard">;
  className?: string;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  if (!save.restored) return null;
  return (
    <div
      ref={ref}
      data-draft-restored=""
      className={cn("mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground", className)}
    >
      <p className="flex items-start gap-1.5">
        <History className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{t("save.draftRestored")}</span>
      </p>
      {/* 44px like every other link-styled action, and underlined: primary
          against the muted line beside it must not be a colour-only cue. */}
      <Button
        type="button"
        variant="link"
        className="h-11 px-0 underline"
        onClick={() => {
          focusHeadingAfterRender(ref.current);
          save.discard();
        }}
      >
        {t("save.discardDraft")}
      </Button>
    </div>
  );
}
