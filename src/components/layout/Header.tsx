import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useDemo } from "@/state/demo/context";

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent text-accent-foreground font-semibold"
      : "hover:bg-secondary"
  }`;

export default function Header() {
  const { t } = useTranslation();
  const { state } = useDemo();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display text-xl tracking-tight">
            {t("common.appName")}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/search" className={navLinkCls} end>
              {t("nav.search")}
            </NavLink>
            <NavLink to="/owner/requests" className={navLinkCls} end>
              {t("ownerRequests.title")}
            </NavLink>
            {/* Only once a sitter profile exists — a destination that would be
                empty for everyone else is not navigation. */}
            {state.sitter && (
              <NavLink to="/sitter/requests" className={navLinkCls} end>
                {t("sitterRequests.title")}
              </NavLink>
            )}
            {/* Admin is intentionally not exposed in public navigation. The /admin route remains reachable directly. */}
            <NavLink to="/help" className={navLinkCls} end>
              {t("nav.help")}
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild className="hidden md:inline-flex">
            <Link to="/search">{t("home.searchCta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
