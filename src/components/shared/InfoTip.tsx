import { useTranslation } from "react-i18next";

import { InfoMark } from "@/components/icons/nidz-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A small grey "!" that opens a secondary explanation (design system
 * amendment 0.1-F).
 *
 * WHAT GOES IN HERE, AND WHAT NEVER DOES. Only the *why* behind a question —
 * "why Nidz asks this", "how this is used". Never something a person needs to
 * answer correctly or to understand a consequence: an error, a constraint, a
 * privacy fact about who sees the answer, a demo marker. Those stay visible.
 * Hiding them behind a tap would make the form shorter by making it less
 * honest.
 *
 * A popover, not a hover tooltip: a tooltip does not open on a phone, and
 * this has to work for a thumb. The trigger is a real button with a name
 * ("Plus d'informations : <topic>"), 32px of hit area around a 18px glyph,
 * and the popover is focusable and dismissible with Escape (Radix).
 */
export default function InfoTip({
  topic,
  children,
  className,
}: {
  /** What the explanation is about — completes the button's accessible name. */
  topic: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={t("common.moreInfoAbout", { topic })}
        className={cn(
          "-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/80 transition-colors duration-150",
          "hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <InfoMark className="size-[1.125rem]" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto max-w-[min(20rem,calc(100vw-2rem))] text-sm leading-relaxed text-muted-foreground">
        {children}
      </PopoverContent>
    </Popover>
  );
}
