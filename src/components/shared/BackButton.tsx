import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBack } from "@/hooks/use-back";
import { cn } from "@/lib/utils";

/**
 * The one back control in Nidz (§86).
 *
 * Audit 1.2 requires a visible back affordance on every screen that is not a
 * root, on both sides of the marketplace. Before this it existed only inside
 * `FlowScreen`, so a browsable screen reached from a tab — a sitter profile, a
 * request detail — had no way back except the browser's own chrome, which a
 * PWA installed to the home screen does not show at all.
 *
 * Three things this component is responsible for, so that fifteen screens are
 * not:
 *
 *  - **Direction.** `ArrowLeft` is mirrored under `dir="rtl"`, so it points
 *    back rather than pointing left. Icons whose meaning is spatial get
 *    mirrored; icons whose meaning is not (a paw, a clock) never do.
 *  - **A real target.** `size-11` is 44px, the Nidz floor for an important
 *    mobile action (§17). The negative inline-start margin pulls the glyph back
 *    to the container edge so the target grows inward rather than pushing the
 *    title off the optical grid.
 *  - **An accessible name.** The control is icon-only, so the name is carried
 *    by `sr-only` text rather than left to the glyph.
 *
 * `fallback` is required, not optional. See `useBack`: a deep link or a guard
 * redirect leaves nothing in history, and a back control that silently does
 * nothing — or silently leaves the site — is worse than none. Making it a
 * required argument means the compiler asks every screen where "back" goes.
 */
export default function BackButton({
  fallback,
  label,
  variant = "bare",
  className,
}: {
  /** Where back goes when there is no Nidz history to pop — a deep link, a
      fresh tab, or a screen arrived at through `<Navigate replace>`. */
  fallback: string;
  /** Overrides the generic name when a screen can say something better, e.g.
      "Back to results". Becomes visible text under `variant="labelled"`. */
  label?: string;
  /**
   * `bare` — icon only, name carried by `sr-only` text. Correct inside a top
   * bar, where the bar itself supplies the context.
   *
   * `labelled` — the name is visible. Correct in the body of a browsable
   * screen, where a lone 44px square above a heading on a white page is an
   * orphan with no context to inherit. It also doubles as the only breadcrumb
   * Nidz needs: someone who arrived on a shared profile link learns where the
   * screen sits from the control that takes them there.
   */
  variant?: "bare" | "labelled";
  className?: string;
}) {
  const { t } = useTranslation();
  const goBack = useBack(fallback);
  const name = label ?? t("common.back");

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        /* The negative inline-start margin pulls the glyph out to the container
           edge, so the target grows inward and the icon stays optically aligned
           with the heading below it rather than pushing the column off-grid. */
        "-ms-2 inline-flex shrink-0 items-center rounded-md transition-colors hover:bg-secondary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "labelled"
          ? "min-h-11 gap-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          : "size-11 justify-center text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-5 rtl:-scale-x-100" aria-hidden="true" />
      {variant === "labelled" ? <span>{name}</span> : <span className="sr-only">{name}</span>}
    </button>
  );
}
