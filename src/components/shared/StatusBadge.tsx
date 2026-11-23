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
 * Pending is sand + a clock (1.4): an unfinished state, not a warning, and
 * not the teal "selected" tint. An unsent draft never wears it — nothing has
 * been sent until a request exists.
 */
const STYLES: Record<RequestStatus, { className: string; icon: typeof Check }> = {
  pending: { className: "bg-sand text-foreground", icon: Clock },
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
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {t(`request.status.${status}`)}
    </span>
  );
}
