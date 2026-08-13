import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-border">
      <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} {t("common.appName")}</p>
        <nav aria-label={t("nav.footerLabel")} className="flex gap-4">
          <Link className="hover:underline" to="/policies">
            {t("nav.policies")}
          </Link>
          <Link className="hover:underline" to="/help">
            {t("nav.help")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
