import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { AnimalPortrait, SPECIES_TILE } from "@/components/illustrations/animals";
import { SPECIES, type Species } from "@/data/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   THE ANIMAL CATEGORIES, AS ILLUSTRATED CARDS (Nidz 1.4, step 3).

   One component for the one classification owners and sitters share
   (`SPECIES` in src/data/types.ts): the owner picks the animal that needs
   care, the sitter ticks the animals they accept, the home offers them as a
   way in. Same three cards, same order, same words — so "chien" means the
   same thing on both sides of the marketplace.

   The cards are the CATEGORY. Breeds and kinds (src/data/animal-kinds.ts) are
   detail about one animal and never widen or narrow matching.

   Three modes, three honest roles:
     - `pick`    buttons — choosing IS the action (the home's quick start);
     - `single`  a Radix radio group — arrow keys, one tab stop;
     - `multi`   checkboxes — several can be on.
   Selected = a 2.5px teal ring + a check badge, never colour alone (§12.2).
   ------------------------------------------------------------------------ */

const CARD = cn(
  "group relative flex min-h-11 flex-col overflow-hidden rounded-xl text-start",
  "transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

function CardBody({ species, label, selected, sub }: { species: Species; label: string; selected?: boolean; sub?: string }) {
  return (
    <>
      <AnimalPortrait
        species={species}
        tile={false}
        className="mx-auto aspect-square w-full max-w-[9rem] transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-0.5"
      />
      <span className="flex items-center justify-between gap-1 px-3 pb-3">
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] font-semibold text-foreground">{label}</span>
          {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
        </span>
      </span>
      {selected !== undefined && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute end-2 top-2 flex size-6 items-center justify-center rounded-full transition-colors duration-150",
            selected ? "bg-primary text-primary-foreground" : "bg-card/80 shadow-[inset_0_0_0_1.5px_hsl(var(--input))]",
          )}
        >
          {selected && <Check className="size-3.5 animate-pop" strokeWidth={3} />}
        </span>
      )}
    </>
  );
}

const ring = (selected: boolean) =>
  selected
    ? "shadow-[inset_0_0_0_2.5px_hsl(var(--primary)),0_8px_20px_-8px_hsl(var(--shadow)/0.25)]"
    : "shadow-card [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-raised";

type Common = {
  /** Label per species; defaults to `species.<s>` (singular). */
  labelFor?: (species: Species) => string;
  subFor?: (species: Species) => string | undefined;
  className?: string;
  /** A card after the three, e.g. « Mon animal n'est pas dans la liste ». */
  extra?: ReactNode;
};

export function AnimalCategoryPicker({
  onPick,
  labelledBy,
  ...common
}: Common & { onPick: (species: Species) => void; labelledBy?: string }) {
  const { t } = useTranslation();
  const label = common.labelFor ?? ((s: Species) => t(`species.${s}`));
  return (
    <div role="group" aria-labelledby={labelledBy} className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", common.className)}>
      {SPECIES.map((species) => (
        <button
          key={species}
          type="button"
          onClick={() => onPick(species)}
          className={cn(CARD, SPECIES_TILE[species], ring(false))}
        >
          <CardBody species={species} label={label(species)} sub={common.subFor?.(species)} />
        </button>
      ))}
      {common.extra}
    </div>
  );
}

export function AnimalCategoryRadio({
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid,
  groupRef,
  ...common
}: Common & {
  value: Species | null;
  onChange: (species: Species) => void;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  groupRef?: React.Ref<HTMLDivElement>;
}) {
  const { t } = useTranslation();
  const label = common.labelFor ?? ((s: Species) => t(`species.${s}`));
  return (
    <RadioGroupPrimitive.Root
      ref={groupRef}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      value={value ?? ""}
      onValueChange={(v) => onChange(v as Species)}
      className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", common.className)}
    >
      {SPECIES.map((species) => {
        const selected = value === species;
        return (
          <RadioGroupPrimitive.Item
            key={species}
            value={species}
            className={cn(CARD, SPECIES_TILE[species], ring(selected))}
          >
            <CardBody species={species} label={label(species)} selected={selected} sub={common.subFor?.(species)} />
          </RadioGroupPrimitive.Item>
        );
      })}
      {common.extra}
    </RadioGroupPrimitive.Root>
  );
}

export function AnimalCategoryChecks({
  values,
  onToggle,
  labelledBy,
  describedBy,
  ...common
}: Common & {
  values: readonly Species[];
  onToggle: (species: Species) => void;
  labelledBy?: string;
  describedBy?: string;
}) {
  const { t } = useTranslation();
  const label = common.labelFor ?? ((s: Species) => t(`speciesPlural.${s}`));
  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className={cn("grid grid-cols-3 gap-2.5 sm:gap-3", common.className)}>
      {SPECIES.map((species) => {
        const selected = values.includes(species);
        return (
          <button
            key={species}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => onToggle(species)}
            className={cn(CARD, SPECIES_TILE[species], ring(selected))}
          >
            <CardBody species={species} label={label(species)} selected={selected} sub={common.subFor?.(species)} />
          </button>
        );
      })}
      {common.extra}
    </div>
  );
}
