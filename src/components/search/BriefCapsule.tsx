import { PawPrint, SlidersHorizontal } from "lucide-react";
import { Link, type To } from "react-router-dom";
import { useId } from "react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import type { Species } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * THE BRIEF CAPSULE — Nidz 1.4's signature move.
 *
 * The owner's question rides above every result as one floating pill, like a
 * notification that stays: the animal (its portrait), what is asked (care,
 * dates, place, budget), and the way to change it. It is the "course over the
 * terrain": every card below is an answer to what the capsule says.
 *
 * One control, one tab stop. Its accessible name is the action ("Modifier la
 * recherche, 2 critères"), and the visible summary is attached as its
 * description, so a screen reader hears both without the summary becoming
 * the name.
 */
export default function BriefCapsule({
  species,
  title,
  parts,
  emptyText,
  actionLabel,
  actionText,
  count = 0,
  onClick,
  to,
  replace,
  state,
  className,
}: {
  species: Species | null;
  /** The animal, in words: "Grands chiens", "Chat", "Tous les animaux". */
  title: string;
  /** What else is asked, each part isolated for bidi. */
  parts: string[];
  emptyText: string;
  /** Accessible name of the control. */
  actionLabel: string;
  /** Visible text of the inner action pill ("Modifier"). */
  actionText: string;
  count?: number;
  onClick?: () => void;
  to?: To;
  /** With `to`: replace the history entry (an edit that must not leave the
      old version one Back away). */
  replace?: boolean;
  /** With `to`: router state, e.g. `{ editBrief: true }` to open the editor. */
  state?: unknown;
  className?: string;
}) {
  const id = useId();
  const body = (
    <>
      {species ? (
        <AnimalPortrait species={species} className="size-11 shrink-0 rounded-full" />
      ) : (
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <PawPrint className="size-5" />
        </span>
      )}
      <span id={`${id}-summary`} className="min-w-0 flex-1 text-start">
        <bdi className="block truncate text-[0.9375rem] font-semibold leading-tight text-foreground">{title}</bdi>
        <span className="mt-0.5 block truncate text-[0.8125rem] leading-tight text-muted-foreground">
          {parts.length === 0
            ? emptyText
            : parts.map((part, i) => (
                <span key={`${i}-${part}`}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <bdi>{part}</bdi>
                </span>
              ))}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary-hover"
      >
        <SlidersHorizontal className="size-4" />
        <span className="hidden min-[360px]:inline">{actionText}</span>
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground text-[0.6875rem] font-bold text-primary">
            {count}
          </span>
        )}
      </span>
    </>
  );

  const cls = cn(
    "group flex w-full items-center gap-3 rounded-full bg-card p-1.5 shadow-raised",
    "transition-transform duration-150 ease-out active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  return to ? (
    <Link to={to} replace={replace} state={state} aria-label={actionLabel} aria-describedby={`${id}-summary`} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={actionLabel} aria-describedby={`${id}-summary`} className={cls}>
      {body}
    </button>
  );
}
