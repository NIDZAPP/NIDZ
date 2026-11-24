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
 * It must never be smaller or quieter than the thing it qualifies, and never
 * compete chromatically with the primary action.
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
    /* 1.4: a notification card. Same shape as an iOS banner — an icon tile,
       a bold line, the explanation — at the same visual weight as the content
       it qualifies, never a footnote (CLAUDE.md, "Simulated behaviour carries
       a DemoNotice at full weight"). A neutral tile, not the action teal: it
       informs, it is not something to press. */
    <div className={cn("flex gap-3 rounded-xl bg-card p-4 shadow-card", className)}>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
        <Info className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export function DemoLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
