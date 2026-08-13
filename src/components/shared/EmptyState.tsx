import type { ReactNode } from "react";

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
  className,
  /** `h1` when this state IS the page — otherwise the page has no first-level
      heading at all and its outline starts at level 2. */
  headingLevel = "h2",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    /* No rule: in every call site this is the last thing on the page, so a
       bottom border read as a stray underline beneath a lone button. */
    <div className={cn("py-10", className)}>
      <Heading className="text-name font-semibold text-foreground">{title}</Heading>
      <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
