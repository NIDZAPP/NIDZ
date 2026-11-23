import { PawPrint } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * The Nidz lockup: the terracotta paw on its soft tile, and the name.
 *
 * Not a logo — PRODUCT.md records that a real brand asset set exists or is
 * being produced, and this stands in for it without inventing a mark. The paw
 * is one of the few deliberate places terracotta appears (non-interactive).
 * The name comes from `common.appName` so it reads نيدز in Arabic.
 */
export default function BrandMark({ className, onDeep = false }: { className?: string; onDeep?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          onDeep ? "bg-white/10 text-sand" : "bg-brand-soft text-brand",
        )}
      >
        <PawPrint className="size-[1.125rem]" strokeWidth={2.25} />
      </span>
      <span className={cn("text-lg font-semibold tracking-tight", onDeep ? "text-white" : "text-foreground")}>
        {t("common.appName")}
      </span>
    </span>
  );
}
