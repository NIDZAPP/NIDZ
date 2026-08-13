import { Check, Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { RequestStatus } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * The status of a care request.
 *
 * Each status carries an icon as well as a colour, so the meaning is never
 * transmitted by colour alone (design system §12.2, §25).
 *
 * "Refusée" is a normal, legitimate outcome — a sitter whose home has a cat
 * declining a cat-intolerant dog is the matching working correctly — so it is
 * NOT destructive red. Red is reserved for danger, error and destruction
 * (§12.1). It uses the neutral surface instead.
 *
 * Pending uses the soft-teal "en attente" treatment from the audit's colour
 * table: an unfinished state, not a warning.
 */
const STYLES: Record<RequestStatus, { className: string; icon: typeof Check }> = {
  pending: { className: "bg-primary-soft text-primary", icon: Clock },
  accepted: { className: "bg-success/10 text-success", icon: Check },
  declined: { className: "bg-secondary text-muted-foreground", icon: X },
};

export default function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  const { className: tone, icon: Icon } = STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {t(`request.status.${status}`)}
    </span>
  );
}
