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
      className={cn("grid gap-3", className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "group flex min-h-16 w-full items-center gap-4 rounded-md border p-4 text-start transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "border-primary bg-accent"
                : option.disabled
                  ? /* A dashed hairline, not a faded copy of a live row: lowered
                       opacity drags the reason text under the contrast floor,
                       and the reason is the whole point of showing it. */
                    "cursor-not-allowed border-dashed border-border"
                  : "border-input hover:bg-secondary",
            )}
          >
            {Icon && (
              <Icon
                aria-hidden="true"
                className={cn("size-6 shrink-0", selected ? "text-primary" : "text-muted-foreground")}
              />
            )}
            <span className="min-w-0 flex-1">
              <span
                className={cn("block font-medium", selected ? "text-accent-foreground" : "text-foreground")}
              >
                {option.label}
              </span>
              {/* Kept inside the item so it is part of the option's own
                  content; keep descriptions to one short line so the
                  accessible name does not become a paragraph. */}
              {option.description && (
                <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
              )}
            </span>
            {/* Slot always reserved, so choosing an option never reflows the
                list under the user's finger. */}
            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
              {selected && <Check className="size-5 text-primary" />}
            </span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
