import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import { PET_CATEGORIES, SPECIES, type PetCategory, type Species } from "@/data/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   THE ANIMAL CATALOGUE AS A GRID (Nidz 1.7).

   One component for the one classification owners and sitters share
   (`animal-catalogue.ts`): three cards to a row, the supplied illustration
   and the name, in catalogue order — dog, cat, bird first. The same cards on
   both sides, so « chien » means the same thing everywhere.

   Two modes, two honest roles:

     single  the owner's « Pour quel animal ? ». Toggle buttons (`aria-pressed`)
             in a group: one at a time, a second tap on the chosen card
             deselects it — a radio group cannot be emptied, and correcting a
             mis-tap must be easy (§6.2). « Autre » closes the grid.
     multi   the sitter's accepted animals: checkboxes, several on. No
             « Autre »: nobody is assumed to accept an animal Nidz cannot
             name.

   THE FOCUS EFFECT (single). Once an animal is chosen, the other cards step
   back — a 2px blur, lower opacity, a hair smaller — while the chosen one
   stays sharp with the teal ring and check. Two reasons it is safe: the
   names stay in the accessibility tree untouched (the effect is pure CSS on
   the visual layer), and every blurred card is still a live button, so
   choosing another animal is one tap, not two. Under reduced motion the
   change is instant and the scale is dropped.

   Selected = a 2.5px teal ring + a check badge, never colour alone (§12.2).
   ------------------------------------------------------------------------ */

const CARD = cn(
  "group relative flex min-h-11 flex-col overflow-hidden rounded-xl bg-card text-start",
  "transition-[transform,box-shadow,filter,opacity] duration-200 ease-out active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
);

/* The selection ring is drawn on an overlay: an inset shadow on the button
   paints BELOW its children, so the full-width picture hid it everywhere
   but the label strip (colour review 1.7). Teal on the sand ground ≥ 3.1:1. */
const ring = (selected: boolean) =>
  selected
    ? "shadow-[0_10px_24px_-10px_hsl(var(--shadow)/0.35)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_2.5px_hsl(var(--primary))]"
    : "shadow-card [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-raised";

/** The cards around a chosen one step back — a little smaller. Only their
    PICTURE dims and blurs (`RECEDED_ART`): the label stays sharp in the muted
    ink (6.3:1), and the button itself is never filtered, so its focus ring
    keeps full contrast. These cards are still live: tapping one chooses it. */
const RECEDED = "scale-[0.97] motion-reduce:scale-100";
const RECEDED_ART =
  "opacity-[0.55] blur-[2px] saturate-[0.7] group-focus-visible:opacity-100 group-focus-visible:blur-0 group-focus-visible:saturate-100";

function CardBody({
  category,
  label,
  selected,
  receded = false,
  eager,
}: {
  category: PetCategory;
  label: string;
  selected?: boolean;
  receded?: boolean;
  eager?: boolean;
}) {
  return (
    <>
      <AnimalPortrait
        species={category}
        eager={eager}
        className={cn(
          "aspect-square w-full transition-[filter,opacity] duration-200 ease-out motion-reduce:transition-none",
          receded && RECEDED_ART,
        )}
      />
      <span className="flex min-h-[2.75rem] items-center px-2.5 py-2">
        <span
          className={cn(
            "line-clamp-2 text-[0.875rem] font-semibold leading-tight transition-colors duration-200 sm:text-[0.9375rem]",
            receded ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
      </span>
      {selected !== undefined && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute end-2 top-2 flex size-6 items-center justify-center rounded-full transition-colors duration-150",
            selected ? "bg-primary text-primary-foreground" : "bg-card/85 shadow-[inset_0_0_0_1.5px_hsl(var(--input))]",
          )}
        >
          {selected && <Check className="size-3.5 animate-pop" strokeWidth={3} />}
        </span>
      )}
    </>
  );
}

/** Arrow keys move through the grid three to a row; Home / End jump. Reading
    order follows the page direction, so ArrowRight moves backwards in RTL. */
function useGridKeys(columns = 3) {
  const root = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("button[data-cell]") ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step: Record<string, number> = {
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    let next = index;
    if (event.key in step) next = index + step[event.key];
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, next))]?.focus();
  };
  return { root, onKeyDown };
}

type Common = {
  className?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Rows above the fold load eagerly; the rest lazily. */
  eagerCount?: number;
};

export function AnimalGridSingle({
  value,
  onChange,
  includeOther = true,
  invalid,
  groupRef,
  className,
  labelledBy,
  describedBy,
  eagerCount = 9,
  extra,
}: Common & {
  value: PetCategory | null;
  /** `null` when the chosen card is tapped again. */
  onChange: (category: PetCategory | null) => void;
  includeOther?: boolean;
  invalid?: boolean;
  groupRef?: Ref<HTMLDivElement>;
  extra?: ReactNode;
}) {
  const { t } = useTranslation();
  const keys = useGridKeys();
  const categories = includeOther ? PET_CATEGORIES : SPECIES;
  return (
    <div
      ref={(node) => {
        (keys.root as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof groupRef === "function") groupRef(node);
        else if (groupRef) (groupRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="group"
      tabIndex={-1}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      onKeyDown={keys.onKeyDown}
      className={cn("grid grid-cols-3 gap-2.5 focus:outline-none sm:gap-3", className)}
    >
      {categories.map((category, index) => {
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            data-cell
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : category)}
            className={cn(CARD, ring(selected), value !== null && !selected && RECEDED)}
          >
            <CardBody
              category={category}
              label={category === "other" ? t("catalogue.other") : t(`species.${category}`)}
              selected={selected}
              receded={value !== null && !selected}
              eager={index < eagerCount}
            />
          </button>
        );
      })}
      {extra}
    </div>
  );
}

export function AnimalGridMulti({
  values,
  onToggle,
  className,
  labelledBy,
  describedBy,
  eagerCount = 9,
}: Common & {
  values: readonly Species[];
  onToggle: (species: Species) => void;
}) {
  const { t } = useTranslation();
  const keys = useGridKeys();
  return (
    <div
      ref={keys.root}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={keys.onKeyDown}
      className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", className)}
    >
      {SPECIES.map((species, index) => {
        const selected = values.includes(species);
        return (
          <button
            key={species}
            type="button"
            data-cell
            role="checkbox"
            aria-checked={selected}
            onClick={() => onToggle(species)}
            className={cn(CARD, ring(selected))}
          >
            <CardBody category={species} label={t(`speciesPlural.${species}`)} selected={selected} eager={index < eagerCount} />
          </button>
        );
      })}
    </div>
  );
}
