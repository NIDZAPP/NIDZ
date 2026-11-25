import { CircleCheck, CircleHelp, CircleSlash, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { CARE_ICON } from "@/components/icons/domain-icons";
import { AnimalPortrait } from "@/components/illustrations/animals";
import { ageText, categoryText } from "@/components/request/pet-facts";
import StatusBadge from "@/components/shared/StatusBadge";
import { postStatusKey, useNeedsText } from "./post-status";
import { placeName } from "@/data/algeria";
import type { Compatibility } from "@/data/compatibility";
import { kindLabel } from "@/data/pets";
import type { CarePost } from "@/data/publications";
import { localized } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/utils/dates";
import { isolate } from "@/utils/format";

/* ---------------------------------------------------------------------------
   PUBLISHED REQUESTS ON SCREEN (Nidz 1.7) — the pieces the sitter feed, the
   owner's Demandes and the details share, so a post reads the same wherever
   it appears.
   ------------------------------------------------------------------------ */

/** One published request as a row-card: the animal, the service and dates,
    the approximate area, and its status. A link. */
export function PostCard({
  post,
  to,
  compat,
  showStatus = true,
  className,
  footer,
}: {
  post: CarePost;
  to: string;
  compat?: Compatibility | null;
  showStatus?: boolean;
  className?: string;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const kind = kindLabel(post.pet, locale);
  const age = ageText(post.pet, t);
  const needs = useNeedsText(post);
  const CareIcon = CARE_ICON[post.careType];
  const area = placeName({ wilayaCode: post.wilayaCode, communeCode: post.communeCode }, locale);

  return (
    <li className={cn("list-none", className)}>
      <Link
        to={to}
        className="surface surface-press flex gap-3.5 p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <AnimalPortrait species={post.pet.species} className="size-[4.5rem] shrink-0 rounded-lg" sizes="72px" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[0.9375rem] font-semibold leading-snug text-foreground">
              <bdi>{post.pet.name}</bdi>
              <span className="font-normal text-muted-foreground">
                {" "}
                · {categoryText(post.pet, t)}
                {kind ? ` · ${kind}` : ""}
              </span>
            </p>
            {showStatus && <StatusBadge status={postStatusKey(post)} />}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
            <CareIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              {t(`care.${post.careType}`)} · {formatDateRange(post.dates, locale)}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isolate(area ?? "")}
            {age ? ` · ${age}` : ""}
          </p>
          {needs.kind === "text" && (
            <p className="mt-1.5 line-clamp-2 text-sm text-foreground">
              <span className="font-medium">{t("needs.labelInline")} </span>
              {needs.text}
            </p>
          )}
          {compat && <CompatLine compat={compat} className="mt-2" />}
          {post.isDemoFixture && <p className="mt-1.5 text-xs font-medium text-muted-foreground">{t("posts.example")}</p>}
          {footer}
        </div>
      </Link>
    </li>
  );
}

/** Compatibility in words, with an icon — for the sitter's feed (« vos
    critères ») and for an owner's view of a sitter. Never a percentage. */
export function CompatLine({
  compat,
  className,
  perspective = "sitter",
}: {
  compat: Compatibility;
  className?: string;
  perspective?: "sitter" | "owner";
}) {
  const { t } = useTranslation();
  const key =
    compat.level === "confirmed"
      ? `compat.${perspective}.confirmed`
      : compat.level === "unknown"
        ? `compat.${perspective}.unknown.${compat.reason}`
        : `compat.${perspective}.incompatible.${compat.reason}`;
  const Icon = compat.level === "confirmed" ? CircleCheck : compat.level === "unknown" ? CircleHelp : CircleSlash;
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-sm",
        compat.level === "confirmed" ? "text-success" : compat.level === "unknown" ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{t(key)}</span>
    </p>
  );
}

/** « Demande publiée » vs « Demande directe » — the two must never be read
    as the same thing (§14.3). */
export function KindTag({ kind }: { kind: "post" | "direct" | "proposal" }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <FileText className="size-3.5" aria-hidden="true" />
      {t(`requestKind.${kind}`)}
    </span>
  );
}
