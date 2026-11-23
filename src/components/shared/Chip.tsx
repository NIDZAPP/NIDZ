import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const chipClass = (selected: boolean) =>
  cn(
    /* A pill, like every control in 1.4. White with a hairline at rest so it
       reads both on the mist ground and inside a white card; teal tint, a
       1.5px teal ring and a check when chosen — never colour alone (§12.2).
       min-h-11 holds the Nidz ~44px floor (§17). */
    "inline-flex min-h-11 select-none items-center gap-2 rounded-full px-4 text-[0.9375rem] transition-[transform,background-color,box-shadow,color] duration-150 ease-out active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    selected
      ? "bg-primary-soft font-semibold text-primary shadow-[inset_0_0_0_1.5px_hsl(var(--primary))]"
      : "bg-card font-normal text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)),0_1px_2px_hsl(var(--shadow)/0.05)] hover:bg-secondary",
  );

function ChipGlyph({ selected, icon: Icon }: { selected: boolean; icon?: LucideIcon }) {
  return (
    <span className="flex size-[1.125rem] shrink-0 items-center justify-center" aria-hidden="true">
      {selected ? (
        <Check className="size-[1.125rem] animate-pop" strokeWidth={2.5} />
      ) : Icon ? (
        <Icon className="size-[1.125rem] text-muted-foreground" />
      ) : null}
    </span>
  );
}

/**
 * A multi-select filter chip.
 *
 * `checkbox` is the honest role — several can be on at once. The check glyph
 * means the selected state is never carried by colour alone (design system
 * §12.2), and the glyph slot is always reserved so toggling never reflows the
 * row under the user's finger. `min-h-12` clears the Nidz ~44px touch floor
 * (§17).
 */
export function Chip({
  selected,
  onClick,
  icon: Icon,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button type="button" role="checkbox" aria-checked={selected} onClick={onClick} className={chipClass(selected)}>
      <ChipGlyph selected={selected} icon={Icon} />
      {children}
    </button>
  );
}

/**
 * The single-select form of the same chip.
 *
 * Radix RadioGroup, so arrow keys move between the options and the group takes
 * one tab stop — a row of hand-rolled `role="radio"` buttons gets both wrong.
 * Used wherever a filter has exactly one answer, which after the need flow is
 * every filter: the brief the owner defined and the filters they adjust are
 * the same single-valued model.
 */
export function ChipGroup<T extends string>({
  label,
  labelledBy,
  describedBy,
  value,
  onChange,
  options,
  className,
}: {
  /** Use when there is no visible label. When there IS one, pass its id as
      `labelledBy` instead — naming the group twice makes screen readers
      announce the question twice. */
  label?: string;
  labelledBy?: string;
  /** Help text that belongs to the question, announced with the group. */
  describedBy?: string;
  /** `null` renders the group with NOTHING selected. Needed wherever the
      absence of an answer is a real state: pre-selecting an option shows the
      user a choice they never made. */
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: LucideIcon }[];
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value ?? ""}
      onValueChange={(v) => onChange(v as T)}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={chipClass(value === option.value)}
        >
          <ChipGlyph selected={value === option.value} icon={option.icon} />
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

export default Chip;
