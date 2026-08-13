import { Activity, BadgeCheck, Info, MessageSquare, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   TRUST PROVENANCE (design system §6).

   Every claim shown about a person belongs to exactly one of four categories,
   and each has a fixed treatment. All four are a small Lucide icon plus a
   short label — a byline, never a trophy badge, because §7 forbids cascading
   decorative badges and §6.1 forbids anything that reads as certification
   without a mechanism behind it.

     A. declared   — the person said so                      IN USE
     B. verified   — Nidz ran a real, traceable check        NO MECHANISM
     C. community  — reviews and ratings from real stays     NO MECHANISM
     D. observed   — response time, completed stays, etc.    NO MECHANISM

   Only A has a mechanism today: someone typed it. B, C and D are declared
   here so the vocabulary exists and so nobody invents a fifth category, but
   they must not be rendered until the corresponding process actually exists.
   `ProvenanceLabel` throws in development if one of them is used — cheaper
   than discovering a fake "Identité vérifiée" in a screenshot. In production
   it renders nothing instead: a wrong label is a lie, but a white screen in
   front of a user is not the way to correct it.

   A complete profile is not a verified profile.
   ------------------------------------------------------------------------ */

export type Provenance = "declared" | "verified" | "community" | "observed";

const ICONS = {
  declared: User,
  verified: BadgeCheck,
  community: MessageSquare,
  observed: Activity,
} as const;

const IMPLEMENTED: Provenance[] = ["declared"];

export function ProvenanceLabel({
  kind = "declared",
  className,
  children,
}: {
  kind?: Provenance;
  className?: string;
  /** Extra context appended to the label, e.g. a demo marker. */
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();

  if (!IMPLEMENTED.includes(kind)) {
    if (import.meta.env.DEV) {
      throw new Error(
        `ProvenanceLabel: "${kind}" has no mechanism behind it in Nidz. ` +
          `Showing it would claim a check that never happened (design system §6.1).`,
      );
    }
    return null;
  }

  const Icon = ICONS[kind];
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {t(`trust.${kind}`)}
        {children}
      </span>
    </p>
  );
}

/**
 * The honesty layer for a screen that shows simulated behaviour.
 *
 * Rendered as a ruled notice rather than a filled card: horizontal rules read
 * as editorial apparatus, so it keeps positional weight without competing
 * chromatically with the primary action (§16 ranks space > surface > border >
 * shadow). It must never be smaller or quieter than the thing it qualifies.
 */
export function DemoNotice({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("border-y border-border py-4", className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/**
 * The same marker at the density of a single line — for a summary row or a
 * card footer where a full notice would outweigh the content it qualifies.
 */
export function DemoLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
