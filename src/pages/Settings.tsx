import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import BackButton from "@/components/shared/BackButton";
import { LIST_GROUP, REGISTER_ROW, ROW_ICON } from "@/components/shared/register";
import { ACCOUNT_PATH } from "@/components/layout/workspace-nav";
import { APP_VERSION } from "@/data/app-info";
import { SETTINGS_SECTIONS } from "./settings-sections";
import { cn } from "@/lib/utils";

/**
 * PARAMÈTRES (Nidz 1.7 §23) — behind the gear of Compte, shared by both
 * spaces. Seven categories, each its own screen (`SettingsSection`), so the
 * index stays a short list rather than one long scroll:
 *
 *   Sécurité et confidentialité · Notifications · Préférences ·
 *   Localisation · Aide et assistance · Informations légales · Gestion du
 *   compte.
 *
 * Only controls that do something in this prototype exist; what needs a
 * server is named once, in words, where it belongs — never a dead switch.
 * Payments, receipts and payouts have no section at all: there is no
 * payment in Nidz, and an empty « Moyens de paiement » page would imply
 * one is coming (the slot is documented in docs/NIDZ-1.7-NAVIGATION.md).
 */


export default function Settings() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  /* The 1.6 address of the reset (`/settings#reset`, linked from Aide) now
     lives in « Gestion du compte ». */
  if (hash === "#reset") return <Navigate to="/settings/account#reset" replace />;

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("settings.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <BackButton fallback={ACCOUNT_PATH} />
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("settings.title")}</h1>

        <nav aria-label={t("settings.title")} className={cn("mt-6", LIST_GROUP)}>
          {SETTINGS_SECTIONS.map(({ id, icon: Icon }) => (
            <Link key={id} to={`/settings/${id}`} className={REGISTER_ROW}>
              <span aria-hidden="true" className={ROW_ICON}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{t(`settings.sections.${id}.title`)}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t(`settings.sections.${id}.line`)}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <p className="mt-6 px-1 text-sm text-muted-foreground">
          {t("settings.versionLine", { version: APP_VERSION })}
        </p>
      </div>
    </div>
  );
}
