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
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border py-10", className)}>
      <h2 className="text-name font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
