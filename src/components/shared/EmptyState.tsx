import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * An empty state must do three things (design system §23): say what is
 * missing, say what the person can do about it, and not look like an error.
 *
 * So: no icon-in-a-circle, no illustration, no muted grey box. It is set as
 * quiet editorial text on the page ground, at the same measure as the content
 * that would have been there.
 */
export default function EmptyState({
  title,
  body,
  action,
  icon: Icon,
  art,
  className,
  /** `h1` when this state IS the page — otherwise the page has no first-level
      heading at all and its outline starts at level 2. */
  headingLevel = "h2",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  /** A Lucide picture of what is missing, on a soft round tile. */
  icon?: LucideIcon;
  /** Or an illustration, when the empty state is the whole screen. */
  art?: ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    /* 1.4: a card, centred, with a picture of what is missing. It says what
       is missing and what to do, and it does not look like an error. */
    <div className={cn("surface flex flex-col items-center px-6 py-10 text-center", className)}>
      {art ? (
        <div className="mb-5">{art}</div>
      ) : Icon ? (
        <span aria-hidden="true" className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-7" />
        </span>
      ) : null}
      <Heading className="text-title font-semibold text-foreground">{title}</Heading>
      <p className="mt-2 max-w-[48ch] text-base leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
