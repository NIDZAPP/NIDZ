import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * The links, at every width. The copyright line, only where there is room.
 *
 * This footer is currently the ONLY route to `/help` and `/policies` — Audit
 * 1.2 took them out of the header because they are not tasks, and Settings does
 * not exist until Group 15. Hiding it below `md` therefore did something much
 * worse than tidy a phone layout: it made the two screens that state what the
 * prototype cannot do unreachable on the primary device, and with them the demo
 * reset, which lives inside `/help`. "You can erase everything" has to stay
 * true on a phone.
 *
 * What is dropped below `md` is the copyright line, which is the one part
 * nobody came for.
 *
 * The separation from the page is space, not a surface: on the white ground a
 * filled footer would be the only large block of colour on most screens, and it
 * would read as more important than the content above it.
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-border md:mt-24">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground md:flex-row">
        <p className="hidden md:block">
          © {new Date().getFullYear()} {t("common.appName")}
        </p>
        <nav aria-label={t("nav.footerLabel")} className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link className="hover:underline" to="/policies">
            {t("nav.policies")}
          </Link>
          <Link className="hover:underline" to="/help">
            {t("nav.help")}
          </Link>
          <Link className="hover:underline" to="/settings">
            {t("nav.account")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
