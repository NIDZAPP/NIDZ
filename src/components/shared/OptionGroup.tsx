import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Option<T extends string> = {
  value: T;
  label: string;
  /** One short line explaining what the choice actually means. Omit it rather
      than padding the row with a restatement of the label. */
  description?: string;
  icon?: LucideIcon;
  /** A picture in place of the icon tile — an animal's portrait. Decorative:
      the label still names the option. */
  art?: React.ReactNode;
  /** Shown but not choosable. The description must then say why: an option
      that is greyed out with no reason reads as a broken control, and an
      option silently left out hides a fact the person may need — "this
      sitter does not take cats" is worth seeing next to the cat. */
  disabled?: boolean;
};

/**
 * A single-choice list rendered as full-width rows.
 *
 * Built on Radix RadioGroup so arrow keys move between options and only the
 * group takes one tab stop — hand-rolled `role="radio"` buttons get this
 * wrong. Rows rather than chips whenever the choice carries a description or
 * is the entire question on a screen; `Chip` stays for compact multi-select.
 *
 * The selected state shows a check glyph as well as the teal border, so it is
 * never carried by colour alone (design system §12.2).
 */
export default function OptionGroup<T extends string>({
  label,
  labelledBy,
  describedBy,
  invalid,
  groupRef,
  value,
  onChange,
  options,
  className,
}: {
  /** Accessible name for the group. Prefer `labelledBy` when the question is
      already on screen — naming the group twice announces it twice. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  /** A plain ref prop rather than `forwardRef`, which cannot carry a generic
      parameter without erasing `T` at every call site. */
  groupRef?: React.Ref<HTMLDivElement>;
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      ref={groupRef}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      /* Focus lands here on a failed submit, so the group has to carry the
         error itself: an unnamed wrapper div announces nothing. */
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      value={value ?? ""}
      onValueChange={(v) => onChange(v as T)}
      className={cn("grid gap-2.5", className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value && !option.disabled;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "group flex min-h-[4.25rem] w-full items-center gap-3.5 rounded-xl p-3.5 text-start",
              "transition-[transform,box-shadow,background-color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              /* Disabled wins over selected: an impossible option must never
                 wear the "you chose this" style, whatever value was passed. */
              option.disabled
                ? /* A dashed outline on the ground, not a faded copy of a live
                     row: lowered opacity drags the reason text under the
                     contrast floor, and the reason is the point of showing it. */
                  "cursor-not-allowed border border-dashed border-input/60"
                : selected
                  ? "bg-card shadow-[inset_0_0_0_2px_hsl(var(--primary)),0_8px_24px_-8px_hsl(var(--shadow)/0.14)]"
                  : "bg-card shadow-card active:scale-[0.99] [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-raised",
            )}
          >
            {option.art ? (
              <span aria-hidden="true" className="size-11 shrink-0 overflow-hidden rounded-full">
                {option.art}
              </span>
            ) : Icon && (
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                )}
              >
                <Icon className="size-[1.375rem]" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[0.9375rem]", selected ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                {option.label}
              </span>
              {/* Kept inside the item so it is part of the option's own
                  content; one short line, so the accessible name does not
                  become a paragraph. */}
              {option.description && (
                <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{option.description}</span>
              )}
            </span>
            {/* The radio itself: an empty ring that fills teal with a check.
                Slot always reserved, so choosing never reflows the list. */}
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                option.disabled
                  ? "border-2 border-dashed border-input/60"
                  : selected
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-input",
              )}
            >
              {selected && <Check className="size-4 animate-pop" strokeWidth={3} />}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
