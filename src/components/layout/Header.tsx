import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
  }`;

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display text-xl tracking-tight">
            {t("common.appName")}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/search" className={navLinkCls} end>
              {t("nav.search")}
            </NavLink>
            <NavLink to="/pets" className={navLinkCls} end>
              {t("nav.pets")}
            </NavLink>
            <NavLink to="/sitter/dashboard" className={navLinkCls} end>
              {t("nav.dashboard")}
            </NavLink>
            {/* Admin is intentionally not exposed in public navigation. The /admin route remains reachable directly. */}
            <NavLink to="/help" className={navLinkCls} end>
              {t("nav.help")}
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 rtl:space-x-reverse">
          <LanguageSwitcher />
          <Button asChild variant="hero" className="hidden md:inline-flex">
            <Link to="/search">{t("home.searchCta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
