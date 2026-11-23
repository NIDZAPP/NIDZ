import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * While a screen's code downloads (Audit 1.3 LOT 09 — states).
 *
 * Says what is happening and nothing more: no skeleton of content that does
 * not exist yet, no spinner that implies a server is working. Shown only
 * after a short delay, so a fast load does not flash it; announced politely
 * to assistive technology.
 */
export default function RouteLoading() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="container flex min-h-[50dvh] items-center justify-center py-10" aria-busy="true">
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {visible ? t("common.loading") : null}
      </p>
    </div>
  );
}
