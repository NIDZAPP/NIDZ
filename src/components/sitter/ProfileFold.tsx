import { useRef } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A section of the public sitter profile that opens and closes (Nidz 1.4
 * corrections, "Profil pet-sitter — sections déroulantes").
 *
 * Closed by default, the card is its heading, a chevron, and a SUMMARY — the
 * one or two lines that must never be hidden behind a tap: how many animals at
 * once and in what home, the first thing the sitter cannot accept. Opening it
 * swaps the summary for the full section.
 *
 * Built on Radix Accordion, so the heading level, `aria-expanded`,
 * `aria-controls`, keyboard (Enter/Space, and arrows between folds) and the
 * hidden state of closed content are the primitive's, not ours. The heading
 * stays a real heading (`Header asChild`), so heading navigation in a screen
 * reader still lists every section of the profile, open or not.
 *
 * Motion (Emil Kowalski's bar, `animate` skill): occasional, purpose = no
 * jarring jump when a long section appears. Height + opacity on the content
 * (the accepted exception for accordions — Radix measures the height), the
 * summary's row collapsing on the same curve and duration so the card grows
 * as one movement, and the chevron turning half a turn. All on the existing
 * tokens: `accordion-down` 220ms / `accordion-up` 180ms and `ease-out`
 * (cubic-bezier(0.23, 1, 0.32, 1)). The global reduced-motion rule in
 * src/index.css makes all of it instant.
 */
export function ProfileFolds({
  value,
  onValueChange,
  children,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  children: ReactNode;
}) {
  return (
    <AccordionPrimitive.Root type="multiple" value={value} onValueChange={onValueChange} className="space-y-3 md:space-y-4">
      {children}
    </AccordionPrimitive.Root>
  );
}

export function ProfileFold({
  value,
  open,
  title,
  heading: Heading,
  summary,
  children,
}: {
  value: string;
  /** Whether this fold is open — passed down so the summary can leave the
      accessibility tree while the full section is showing. */
  open: boolean;
  title: string;
  heading: "h2" | "h3";
  /** Always-visible essentials while closed. */
  summary?: ReactNode;
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <AccordionPrimitive.Item value={value} className="surface group/fold">
      <AccordionPrimitive.Header asChild>
        <Heading className="text-title font-semibold text-foreground">
          <AccordionPrimitive.Trigger
            ref={trigger}
            className={cn(
              "group/trigger flex w-full items-center gap-3 rounded-xl p-5 text-start md:px-7 md:py-6",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            )}
          >
            <span className="min-w-0 flex-1">{title}</span>
            {/* The chevron is the affordance, in the action colour on its
                soft tile; it turns to point up while the section is open. */}
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary",
                "transition-[background-color,color] duration-150 ease-out",
                /* Real pointers only: a tap fires a hover that sticks, and a
                   filled tile left behind reads as a selected state. */
                "[@media(hover:hover)_and_(pointer:fine)]:group-hover/trigger:bg-primary",
                "[@media(hover:hover)_and_(pointer:fine)]:group-hover/trigger:text-primary-foreground",
              )}
            >
              <ChevronDown
                className="size-5 transition-transform duration-200 ease-out group-data-[state=open]/fold:rotate-180"
                strokeWidth={2.25}
              />
            </span>
          </AccordionPrimitive.Trigger>
        </Heading>
      </AccordionPrimitive.Header>

      {summary && (
        /* A row that collapses as the content opens (grid 1fr → 0fr), so the
           card changes height in one movement rather than jumping by the
           summary's lines first. Out of the accessibility tree while open:
           the section itself says the same thing in full. A tap on it opens
           the section too — the trigger is the keyboard path. */
        /* The negative top margin (title → summary = 12px rather than the
           trigger's 20px) sits on THIS element, outside the clipping box:
           inside it, it pulled the first line up under the clip and cut the
           tops off its letters. It stays while the row is collapsed, so the
           opened section starts at the same 12px. */
        <div
          aria-hidden={open || undefined}
          className={cn(
            "-mt-2 grid transition-[grid-template-rows,opacity] duration-200 ease-out md:-mt-3",
            open ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div onClick={() => trigger.current?.click()} className="cursor-pointer px-5 pb-5 md:px-7 md:pb-6">
              {summary}
            </div>
          </div>
        </div>
      )}

      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-5 pb-5 md:px-7 md:pb-7">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
