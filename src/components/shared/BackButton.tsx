import { useContext } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BackSlotContext } from "@/components/shared/top-bar";
import { useBack } from "@/hooks/use-back";
import { cn } from "@/lib/utils";

/**
 * The one back control in Nidz (§86) — and, since the 1.4 corrections, one
 * FORM of it: a white round button with an ink arrow, at the inline start of
 * the sticky top bar, on every secondary screen.
 *
 * Audit 1.2 requires a visible back affordance on every screen that is not a
 * root, on both sides of the marketplace. Until 1.4 it came in three shapes
 * (a bare glyph, a labelled pill in the page body, a round pill in a bar), and
 * the labelled one scrolled away with the content. Now:
 *
 *  - **One shape.** `size-11` (44px, the Nidz floor for an important mobile
 *    action, §17), `bg-card` white, `text-foreground` ink (#18211F, 14.5:1 on
 *    white), the bar-control shadow so it reads on the mist ground.
 *  - **One place.** Inside the browsable shell the control portals into the
 *    header's back slot (see `BackSlotContext`); flow steps and conversations
 *    render it in their own bar, which has the same height and container
 *    (`TOP_BAR_ROW`). Either way it is at the inline start of a sticky bar —
 *    top-left, top-right in Arabic (§34) — and never overlaps the content,
 *    which scrolls under the bar's ground rather than under the button.
 *  - **Direction.** `ArrowLeft` is mirrored under `dir="rtl"`, so it points
 *    back rather than pointing left.
 *  - **An accessible name.** The control is icon-only; the name is carried by
 *    `sr-only` text. A screen that can say where back goes ("Retour aux
 *    résultats") passes it as `label` — it is still the name assistive
 *    technology announces, and the tooltip a mouse user gets.
 *
 * `fallback` is required, not optional. See `useBack`: a deep link or a guard
 * redirect leaves nothing in history, and a back control that silently does
 * nothing — or silently leaves the site — is worse than none. Making it a
 * required argument means the compiler asks every screen where "back" goes.
 */
export default function BackButton({
  fallback,
  label,
  className,
}: {
  /** Where back goes when there is no Nidz history to pop — a deep link, a
      fresh tab, or a screen arrived at through `<Navigate replace>`. */
  fallback: string;
  /** Overrides the generic name when a screen can say something better, e.g.
      "Back to results". */
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const goBack = useBack(fallback);
  const slot = useContext(BackSlotContext);
  const name = label ?? t("common.back");

  const button = (
    <button
      type="button"
      onClick={goBack}
      title={name}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-pill",
        "transition-[transform,background-color] duration-150 ease-out hover:bg-secondary active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <ArrowLeft className="size-5 rtl:-scale-x-100" strokeWidth={2.25} aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </button>
  );

  return slot ? createPortal(button, slot) : button;
}
