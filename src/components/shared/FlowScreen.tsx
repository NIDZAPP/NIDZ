import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import BackButton from "@/components/shared/BackButton";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { cn } from "@/lib/utils";

/**
 * The shell every step of the owner and sitter flows is built on.
 *
 * One shell, so the two sides of the marketplace cannot drift into two
 * different products (design system §22 — "ne pas créer deux applications
 * entièrement séparées"). It gives each step the same parts: a slim top bar,
 * the question, the fields, and one dominant action.
 *
 * Layout notes:
 *  - `min-h-dvh` flex column with the action bar last: on a short step the bar
 *    sits under the content, on a long one it pins to the bottom edge, so the
 *    primary action is always in thumb reach without ever overlaying a field
 *    (§15, §30).
 *  - The back control is `BackButton`, shared with the browsable shell so both
 *    sides of the app have one back affordance rather than two that drift. It
 *    sits at the inline start, which is top-right in Arabic (§34).
 *  - Focus and scroll are managed here rather than in fifteen screens: React
 *    Router resets neither, so without this a keyboard user loses their place
 *    on every step and a screen-reader user hears nothing on navigation.
 */
export default function FlowScreen({
  backTo,
  backLabel,
  progress,
  eyebrow,
  title,
  intro,
  children,
  action,
  secondaryAction,
  footNote,
  headerExtra,
  showLanguageSwitcher = false,
  wide = false,
  /** Changes to this value re-run the scroll-and-focus reset. Pass the step
      key when several steps share one mounted FlowScreen. */
  stepKey,
}: {
  /** Where back goes. Omit on a root screen: the audit is explicit that root
      screens carry no back control (Audit p.23).

      A path rather than a callback, because the value a step actually needs to
      supply is its logical parent — every screen was writing the same
      `useBack(parent)` line to turn one into the other. `BackButton` owns that
      now. */
  backTo?: string;
  backLabel?: string;
  /** Discreet completion indicator, for the multi-step sitter profile builder.
      Deliberately no "Étape 4 sur 7" text (Audit p.363) — the position is
      exposed to assistive technology, not printed on the screen. */
  progress?: { current: number; total: number; label: string };
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
  /** The one dominant action for this step. */
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** Small print under the action — privacy notes, demo markers. */
  footNote?: ReactNode;
  /** Rendered between the intro and the fields, full column width. */
  headerExtra?: ReactNode;
  showLanguageSwitcher?: boolean;
  /** Widen the column for steps that show a summary rather than a form. */
  wide?: boolean;
  stepKey?: string;
}) {
  const { t } = useTranslation();
  const heading = useRef<HTMLHeadingElement>(null);
  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    /* No visible ring: `:focus-visible` also matches programmatic focus, so a
       ring would box the heading on every arrival including mouse ones — the
       same trade-off a skip link makes. */
    heading.current?.focus({ preventScroll: true });
  }, [stepKey, title]);

  const measure = wide ? "max-w-[720px]" : "max-w-[560px]";
  const hasTopBar = Boolean(backTo || progress || showLanguageSwitcher);

  return (
    /* `has-pinned-action` is what src/index.css keys the bottom scroll padding
       on — the document is the scroll container, but only a screen with a
       pinned action bar needs the room under it. */
    <div className="has-pinned-action flex min-h-dvh flex-col bg-background">
      {hasTopBar && (
        <div className="sticky top-0 z-30 border-b border-border bg-background shadow-chrome-b">
          <div className="container flex h-14 items-center gap-4">
            {backTo ? (
              <BackButton fallback={backTo} label={backLabel} />
            ) : (
              <span className="size-11 shrink-0" aria-hidden="true" />
            )}

            {progress ? (
              <div
                role="progressbar"
                aria-label={t("common.progress")}
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.current}
                aria-valuetext={progress.label}
                /* `--track` exists for exactly this (see src/index.css): a
                   light neutral would be invisible against the page ground,
                   and `--border` would not separate from the primary fill. */
                className="h-1 flex-1 overflow-hidden rounded-full bg-track"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : (
              <span className="flex-1" />
            )}

            {showLanguageSwitcher && <LanguageSwitcher compact />}
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="container pb-10 pt-6 md:pb-16 md:pt-10">
          <div className={cn("mx-auto", measure)}>
            {eyebrow && (
              <p className="eyebrow mb-3">{eyebrow}</p>
            )}
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-h1 font-semibold text-foreground focus:outline-none md:text-h1-lg"
            >
              {title}
            </h1>
            {intro && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
            {headerExtra}
            {children && <div className="mt-8 md:mt-10">{children}</div>}
          </div>
        </div>
      </main>

      {(action || secondaryAction || footNote) && (
        <div
          className="sticky bottom-0 z-30 border-t border-border bg-background shadow-chrome-t"
          /* The iOS home indicator overlaps a bottom-pinned bar and erodes the
             44px target underneath it. */
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="container py-4">
            <div className={cn("mx-auto", measure)}>
              {footNote && <div className="mb-3 text-sm text-muted-foreground">{footNote}</div>}
              {/* DOM order is primary then secondary, so assistive technology
                  and the tab order reach the dominant action first. Reversed
                  on mobile so it is also the one closest to the thumb; on
                  desktop it sits at the inline start, matching /search. */}
              <div
                className={cn(
                  "flex flex-col-reverse gap-3 sm:flex-row sm:items-center",
                  /* Full width on mobile, intrinsic on desktop — enforced here
                     rather than asked of every screen (§17). */
                  "[&>*]:w-full sm:[&>*]:w-auto",
                )}
              >
                {action}
                {secondaryAction}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
