import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

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
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center gap-2.5 rounded-full border px-5 text-[0.9375rem] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-input bg-card text-foreground hover:bg-secondary",
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
        {selected ? <Check className="size-4" /> : Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </span>
      {children}
    </button>
  );
}

export default Chip;
