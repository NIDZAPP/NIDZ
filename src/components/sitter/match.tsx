import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isAbsenceReason, reasonKey, type MatchReason } from "@/data/criteria";
import { useReasonLabel } from "@/components/sitter/use-reason-label";
import { cn } from "@/lib/utils";

/**
 * The matched facts, as tokens.
 *
 * Absence-derived reasons are deliberately NOT tokens (see `isAbsenceReason`):
 * "has not declared these dates unavailable" and "no cat declared at home" are
 * equally true of a sitter who never answered the question, and giving them
 * the same tick and tint as facts a sitter actively declared would turn
 * silence into a confirmation. They drop to plain text, one register down.
 * Containment is the match signal, and every label reads without it, so
 * meaning is never carried by colour alone (§12.2).
 */
export function MatchReasonList({
  reasons,
  trailing,
  className,
}: {
  reasons: MatchReason[];
  /** Extra plain-text facts appended after the tokens. */
  trailing?: string[];
  className?: string;
}) {
  const { t } = useTranslation();
  const label = useReasonLabel();

  const tokens = reasons.filter((r) => !isAbsenceReason(r));
  const absences = reasons.filter(isAbsenceReason);

  if (tokens.length === 0 && absences.length === 0 && !trailing?.length) return null;

  return (
    <ul role="list" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {tokens.map((reason) => (
        <li
          key={reasonKey(reason)}
          /* Neutral, not teal: a selected filter chip is teal-on-soft-teal
             with a check, and a match token sat one radius away from it with
             the same colour and the same glyph. They co-occur — the filter
             sheet opens over the register — and one is an interactive
             selection while the other is a read-only fact (§5.2). Containment
             and the check still carry the meaning. */
          className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 font-medium text-foreground"
        >
          <Check className="size-3 shrink-0" aria-hidden="true" />
          {/* The separator lives in the translated string: French puts a space
              before a colon and Arabic uses its own. */}
          <span className="sr-only">{t("search.card.matchLabel")}</span>
          {label(reason)}
        </li>
      ))}
      {trailing && trailing.length > 0 && <li className="text-muted-foreground">{trailing.join(" · ")}</li>}
      {absences.map((reason) => (
        <li key={reasonKey(reason)} className="text-muted-foreground">
          {label(reason)}
        </li>
      ))}
    </ul>
  );
}

/**
 * What does NOT match.
 *
 * A marketplace that volunteers the mismatch is the entire positioning: an
 * owner who learns on the profile that this sitter takes only dogs has been
 * told something useful, not sold to. Muted and marked with a minus, never
 * red — a sitter whose home has a cat declining a cat-intolerant dog is the
 * matching working correctly, not an error (§12.1).
 */
export function MismatchList({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul role="list" className={cn("space-y-1.5 text-sm text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Minus className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
