import { Ban, CalendarX, Check, Clock, Megaphone, PencilLine, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * The status of a request, a published request or a proposal (Nidz 1.7).
 *
 * Each status carries an icon as well as a colour, so the meaning is never
 * transmitted by colour alone (design system §12.2, §25).
 *
 * Declined, withdrawn, not retained, cancelled and past are normal outcomes,
 * not errors, so none of them is destructive red — red is reserved for
 * danger, error and destruction (§12.1). They share the neutral surface and
 * differ by icon and word.
 *
 * Waiting is sand + a clock: an unfinished state, not a warning. « Publiée »
 * (a post open to proposals) is the same family with a megaphone. Only an
 * acceptance is green — and it means two people agreed, nothing more.
 */
export type StatusKey =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "cancelled"
  | "expired"
  | "open"
  | "notRetained"
  | "outdated";

const STYLES: Record<StatusKey, { className: string; icon: typeof Check }> = {
  pending: { className: "bg-sand text-foreground", icon: Clock },
  open: { className: "bg-sand text-foreground", icon: Megaphone },
  accepted: { className: "bg-success/10 text-success", icon: Check },
  declined: { className: "bg-secondary text-muted-foreground", icon: X },
  notRetained: { className: "bg-secondary text-muted-foreground", icon: X },
  withdrawn: { className: "bg-secondary text-muted-foreground", icon: Undo2 },
  cancelled: { className: "bg-secondary text-muted-foreground", icon: Ban },
  expired: { className: "bg-secondary text-muted-foreground", icon: CalendarX },
  /* The owner changed the request after this proposal: neutral, like the
     other ended states — it says what happened, not a fault. */
  outdated: { className: "bg-secondary text-muted-foreground", icon: PencilLine },
};

export default function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const { t } = useTranslation();
  const { className: tone, icon: Icon } = STYLES[status];

  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold", tone, className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}
