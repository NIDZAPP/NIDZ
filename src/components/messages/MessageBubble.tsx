import { cn } from "@/lib/utils";

/**
 * One message, as a bubble (Nidz 1.4). Shared by the clarification thread on a
 * request and the Messages space, so a local note looks the same everywhere.
 *
 * Mine sit at the inline END on the soft teal tint; theirs at the inline
 * START on the neutral fill. Which is which is said in words too (`author`),
 * never by side or colour alone. A bubble shows WHEN it was written on this
 * device — never "delivered", "read" or "seen": nothing here leaves the
 * browser (design system §0.1 — no simulated read receipts).
 */
export default function MessageBubble({
  mine,
  author,
  meta,
  children,
  className,
}: {
  mine: boolean;
  author: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start", className)}>
      <p className="mb-1 px-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{author}</span>
        {meta && <span> · {meta}</span>}
      </p>
      {/* `dir="auto"`: a message is the writer's own text, in whichever
          script they wrote it — a French note inside the Arabic interface
          keeps its punctuation where it belongs. */}
      <div
        dir="auto"
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed text-foreground",
          mine ? "rounded-ee-md bg-primary-soft" : "rounded-es-md bg-muted",
        )}
      >
        {children}
      </div>
    </div>
  );
}
