import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarX,
  Check,
  Eye,
  FileText,
  LifeBuoy,
  PawPrint,
  Search,
  Settings as SettingsIcon,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { HomeHeart } from "@/components/icons/nidz-icons";
import { LIST_GROUP, REGISTER_ROW, ROW_ICON } from "@/components/shared/register";
import { SETTINGS_PATH, ACCOUNT_PATH } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import { communeWithWilaya, getWilaya } from "@/data/algeria";
import { WELCOME_PATH, hasSession, sitterVisibility } from "@/data/navigation";
import { localized } from "@/data/types";
import type { Workspace } from "@/data/workspace";
import { useAppLocale } from "@/hooks/use-locale";
import { useSwitchWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

/** The account form, returning here once saved (and Back returning here). */
const EDIT_ACCOUNT = `/owner/account?next=${encodeURIComponent(ACCOUNT_PATH)}`;

/**
 * COMPTE — the person, in one place (Nidz 1.6).
 *
 * The last tab of both bars. 1.5 had one screen called "Compte" that was
 * really the settings: the language picker filled a phone screen before the
 * person's own name appeared, and their animals were a separate tab. The
 * approved split:
 *
 *   Compte       who you are (or that you are browsing without an account),
 *                your animals, your two spaces, help and safety;
 *   Paramètres   behind the gear at the top-right — language, security and
 *                privacy, the reset, the test tools.
 *
 * Everything here is a fact the person gave or a door to a real screen.
 * Browsing without an account is stated as a normal state, with what an
 * account is for — never as a wall (public discovery needs nothing).
 */
export default function Account() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const switchWorkspace = useSwitchWorkspace();
  const active = state.activeWorkspace === "sitter" && state.sitter ? "sitter" : "owner";
  const account = state.account;
  const visibility = sitterVisibility(state);

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;

  const place = account
    ? (communeWithWilaya(account.communeId, lng) ??
      (account.wilayaId ? localized(getWilaya(account.wilayaId)?.name ?? { en: "", fr: "", ar: "" }, lng) : null))
    : null;

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("account.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        {/* The gear at the top end — top-left in Arabic — where people look
            for settings. Paramètres is its own screen (§22.4). */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("account.title")}</h1>
          <Link
            to={SETTINGS_PATH}
            title={t("nav.settings")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-pill transition-[transform,background-color] duration-150 ease-out hover:bg-secondary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <SettingsIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">{t("nav.settings")}</span>
          </Link>
        </div>

        {account && (
          <section aria-label={t("account.identity.title")} className="surface mt-5 flex items-center gap-4 p-4">
            {account.photoUrl ? (
              <img src={account.photoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-semibold text-brand"
              >
                {account.firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <bdi className="block break-words text-name font-semibold text-foreground">
                {account.firstName} {account.lastName}
              </bdi>
              <span className="mt-0.5 block break-words text-sm text-muted-foreground">
                {place ? <bdi>{place}</bdi> : t("account.identity.noPlace")}
              </span>
            </span>
          </section>
        )}

        <div className={cn("mt-3", LIST_GROUP)}>
          <Row
            to={EDIT_ACCOUNT}
            icon={<UserRound className="size-5" />}
            label={t("account.personal.title")}
            line={t("account.personal.line")}
          />
          {active === "owner" && (
            <Row
              to="/"
              icon={<PawPrint className="size-5" />}
              label={t("home.views.animals")}
              line={
                state.pets.length > 0
                  ? state.pets.map((p) => p.name).filter(Boolean).join(" · ")
                  : t("account.pets.empty")
              }
            />
          )}
        </div>

        {/* The switch: one row per space, the current one marked. The other
            lands where that side begins (`workspaceHome`, NAV-01) — or its
            first step when it does not exist yet, or the step where an
            unfinished profile stopped. Nothing is erased by switching. */}
        <section aria-labelledby="account-spaces" className="mt-8">
          <h2 id="account-spaces" className="text-title font-semibold text-foreground">
            {t("account.spaces.title")}
          </h2>
          <div className={cn("mt-3", LIST_GROUP)}>
            {(["owner", "sitter"] as const).map((space) => (
              <SpaceRow
                key={space}
                space={space}
                current={active === space}
                line={
                  space === "owner"
                    ? t("workspace.toOwner")
                    : visibility === "none"
                      ? t("account.spaces.sitterNone")
                      : visibility === "draft"
                        ? t("account.spaces.sitterDraft")
                        : visibility === "hidden"
                          ? t("account.spaces.sitterHidden")
                          : t("workspace.toSitter")
                }
                onSwitch={space === "sitter" && !state.sitter ? undefined : () => switchWorkspace(space)}
              />
            ))}
          </div>
        </section>

        {/* « Mon profil pet-sitter » — the 1.6 « Mon profil » tab, now here
            (§22.2): every section of the professional profile, its preview
            and its publication status, in one place. */}
        {active === "sitter" && state.sitter && (
          <section aria-labelledby="account-sitter" className="mt-8">
            <h2 id="account-sitter" className="text-title font-semibold text-foreground">
              {t("account.sitterProfile.title")}
            </h2>
            <div className={cn("mt-3", LIST_GROUP)}>
              <Row
                to="/sitter/profile"
                icon={<HomeHeart className="size-5" />}
                label={t("account.sitterProfile.sections")}
                line={t(`account.sitterProfile.status.${visibility}`)}
              />
              <Row
                to="/sitter/preview"
                icon={<Eye className="size-5" />}
                label={t("account.sitterProfile.preview")}
                line={t("account.sitterProfile.previewLine")}
              />
              {visibility === "listed" && (
                <Row
                  to={`/sitters/${state.sitter.profile.id}`}
                  icon={<Eye className="size-5" />}
                  label={t("account.publicProfile.title")}
                  line={t("account.publicProfile.line")}
                />
              )}
              <Row
                to="/sitter/profile/availability"
                icon={<CalendarX className="size-5" />}
                label={t("account.sitterProfile.availability")}
                line={t("account.sitterProfile.availabilityLine")}
              />
            </div>
          </section>
        )}

        <section aria-labelledby="account-help" className="mt-8">
          <h2 id="account-help" className="text-title font-semibold text-foreground">
            {t("account.help.title")}
          </h2>
          <div className={cn("mt-3", LIST_GROUP)}>
            <Row to="/help" icon={<LifeBuoy className="size-5" />} label={t("nav.help")} line={t("account.help.helpLine")} />
            <Row
              to="/policies"
              icon={<FileText className="size-5" />}
              label={t("nav.policies")}
              line={t("account.help.policiesLine")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Chevron() {
  return <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />;
}

function Row({ to, icon, label, line }: { to: string; icon: ReactNode; label: string; line: string }) {
  return (
    <Link to={to} className={REGISTER_ROW}>
      <span aria-hidden="true" className={ROW_ICON}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{line}</span>
      </span>
      <Chevron />
    </Link>
  );
}

function SpaceRow({
  space,
  current,
  line,
  onSwitch,
}: {
  space: Workspace;
  current: boolean;
  line: string;
  /** Absent: the sitter side does not exist yet, so the row starts it. */
  onSwitch?: () => void;
}) {
  const { t } = useTranslation();
  const SpaceIcon = space === "owner" ? Search : HomeHeart;
  const icon = (
    <span aria-hidden="true" className={ROW_ICON}>
      <SpaceIcon className="size-5" />
    </span>
  );
  const label = t(`account.spaces.${space}`);
  const text = (sub: string) => (
    <span className="min-w-0 flex-1">
      <span className="block font-medium text-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-muted-foreground">{sub}</span>
    </span>
  );

  if (current) {
    return (
      <div className={cn(REGISTER_ROW, "hover:bg-transparent")} aria-current="true">
        {icon}
        {text(t("account.spaces.current"))}
        <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
      </div>
    );
  }
  if (!onSwitch) {
    return (
      <Link to="/sitter/start" className={REGISTER_ROW}>
        {icon}
        {text(line)}
        <Chevron />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onSwitch} className={cn(REGISTER_ROW, "w-full text-start")}>
      {icon}
      {text(line)}
      <Chevron />
    </button>
  );
}
