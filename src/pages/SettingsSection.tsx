import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Copy, Download, LogOut, Trash2 } from "lucide-react";

import BackButton from "@/components/shared/BackButton";
import ConfirmAction from "@/components/shared/ConfirmAction";
import OptionGroup from "@/components/shared/OptionGroup";
import { LIST_GROUP, REGISTER_ROW } from "@/components/shared/register";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { LocationFields } from "@/components/shared/fields";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { checkLocation } from "@/data/algeria";
import { APP_STAGE, APP_VERSION, LICENSES } from "@/data/app-info";
import { WELCOME_PATH, hasSession, sitterVisibility } from "@/data/navigation";
import { ESSENTIAL_TOPICS, OPTIONAL_TOPICS, topicEnabled, type NotificationTopic } from "@/data/preferences";
import { isPubliclyListed, sitterNameFor } from "@/data/repository";
import { PHONE_PREFIX } from "@/data/types";
import { SUPPORTED_LOCALES, hasExplicitLocale, setLocale, type AppLocale } from "@/i18n";
import { clearFormDrafts } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { readStoredRaw } from "@/state/demo/reducer";

import { SETTINGS_SECTIONS } from "./settings-sections";

const LOCALE_LABEL_KEY: Record<AppLocale, string> = { en: "common.english", fr: "common.french", ar: "common.arabic" };
const LANGUAGE_OPTIONS: AppLocale[] = [...SUPPORTED_LOCALES];
const EDIT_ACCOUNT = (back: string) => `/owner/account?next=${encodeURIComponent(back)}`;

/**
 * One category of Paramètres (Nidz 1.7 §23). Every row is either a control
 * that genuinely changes something here, a link to where that thing lives,
 * or ONE line stating what the prototype cannot do — never a switch that
 * does nothing.
 */
export default function SettingsSection() {
  const { t } = useTranslation();
  const { section } = useParams();
  const { state } = useDemo();
  const known = SETTINGS_SECTIONS.some((s) => s.id === section);

  if (!known) return <Navigate to="/settings" replace />;
  /* Help and legal information are readable without an account; the rest is
     about an account. */
  if (!hasSession(state) && section !== "help" && section !== "legal") return <Navigate to={WELCOME_PATH} replace />;

  const title = t(`settings.sections.${section}.title`);

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-[720px]">
        <BackButton fallback="/settings" />
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{title}</h1>
        <div className="mt-6 space-y-8">
          {section === "security" && <Security />}
          {section === "notifications" && <Notifications />}
          {section === "preferences" && <Preferences />}
          {section === "location" && <LocationPrefs />}
          {section === "help" && <HelpSection />}
          {section === "legal" && <Legal />}
          {section === "account" && <AccountManagement />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Block({ id, title, children, note }: { id: string; title: string; children: ReactNode; note?: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-title font-semibold text-foreground">
        {title}
      </h2>
      {note && <p className="mt-1.5 max-w-[64ch] text-sm text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function LinkRow({ to, label, line }: { to: string; label: string; line?: string }) {
  return (
    <Link to={to} className={REGISTER_ROW}>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        {line && <span className="mt-0.5 block text-sm text-muted-foreground">{line}</span>}
      </span>
      <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}

function InfoRow({ label, line }: { label: string; line: string }) {
  return (
    <div className={cn(REGISTER_ROW, "items-start hover:bg-transparent")}>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{line}</span>
      </span>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  line,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  line?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className={cn(REGISTER_ROW, "hover:bg-transparent")}>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block font-medium text-foreground">{label}</span>
        {line && <span className="mt-0.5 block text-sm text-muted-foreground">{line}</span>}
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

/** The browser's answer for one permission, when it gives one. */
function usePermission(name: "geolocation"): "granted" | "denied" | "prompt" | "unknown" {
  const [value, setValue] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const update = () => status && setValue(status.state as "granted" | "denied" | "prompt");
    navigator.permissions
      ?.query({ name })
      .then((s) => {
        status = s;
        update();
        s.addEventListener("change", update);
      })
      .catch(() => setValue("unknown"));
    return () => status?.removeEventListener("change", update);
  }, [name]);
  return value;
}

/* ------------------------------------------------ security and privacy */

function Security() {
  const { t } = useTranslation();
  const { state, commit } = useDemo();
  const account = state.account;
  const geo = usePermission("geolocation");
  const visibility = sitterVisibility(state);
  const [exported, setExported] = useState(false);

  const exportData = () => {
    const raw = readStoredRaw();
    if (typeof raw !== "string") return;
    const blob = new Blob([JSON.stringify(JSON.parse(raw), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nidz-mes-donnees.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <>
      <Block id="sec-account" title={t("settings.security.accountTitle")}>
        <div className={LIST_GROUP}>
          <LinkRow
            to={EDIT_ACCOUNT("/settings/security")}
            label={t("settings.security.phone")}
            line={account?.phoneNumber ? `${PHONE_PREFIX} ${account.phoneNumber} · ${t("settings.security.unverified")}` : t("settings.security.noPhone")}
          />
          <InfoRow
            label={t("settings.security.method")}
            line={account?.signInMethod ? t(`settings.security.methodValue.${account.signInMethod}`) : t("settings.security.methodLocal")}
          />
          <InfoRow label={t("settings.security.session")} line={t("settings.security.sessionLine")} />
          <LinkRow to="/settings/account" label={t("settings.account.signOut")} line={t("settings.security.signOutLine")} />
        </div>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{t("settings.security.notAvailable")}</p>
      </Block>

      <Block id="sec-privacy" title={t("settings.security.privacyTitle")}>
        <div className={LIST_GROUP}>
          <InfoRow label={t("settings.security.personalInfo")} line={t("settings.security.personalInfoLine")} />
          {state.sitter && (
            <SwitchRow
              id="sitter-hidden"
              label={t("settings.security.profileVisible")}
              line={
                visibility === "draft"
                  ? t("settings.security.profileDraft")
                  : state.sitter.hidden
                    ? t("settings.security.profileHiddenLine")
                    : t("settings.security.profileVisibleLine")
              }
              checked={!state.sitter.hidden}
              disabled={!state.sitter.published}
              onChange={(visible) => commit({ type: "setSitterHidden", hidden: !visible })}
            />
          )}
          <InfoRow label={t("settings.security.location")} line={t(`settings.security.locationLine.${geo}`)} />
        </div>
      </Block>

      <Block id="sec-blocked" title={t("settings.security.blockedTitle")} note={t("settings.security.blockedNote")}>
        {state.blockedSitters.length === 0 ? (
          <p className="surface p-4 text-sm text-muted-foreground">{t("settings.security.blockedNone")}</p>
        ) : (
          <ul role="list" className={LIST_GROUP}>
            {state.blockedSitters.map((id) => (
              <li key={id} className={cn(REGISTER_ROW, "hover:bg-transparent")}>
                <bdi className="min-w-0 flex-1 font-medium text-foreground">{sitterNameFor(state, id)}</bdi>
                <Button type="button" variant="surface" onClick={() => commit({ type: "unblockSitter", id })}>
                  {t("settings.security.unblock")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block id="sec-data" title={t("settings.security.dataTitle")} note={t("settings.security.dataNote")}>
        <div className="surface p-4">
          <ul role="list" className="grid gap-1 text-sm text-foreground">
            <li>{t("settings.security.dataCount.pets", { count: state.pets.length })}</li>
            <li>{t("settings.security.dataCount.requests", { count: state.requests.length })}</li>
            <li>{t("settings.security.dataCount.posts", { count: state.posts.length })}</li>
            <li>{t("settings.security.dataCount.conversations", { count: state.conversations.length })}</li>
          </ul>
          <Button type="button" variant="surface" className="mt-4" onClick={exportData}>
            <Download aria-hidden="true" />
            {t("settings.security.export")}
          </Button>
          {exported && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {t("settings.security.exported")}
            </p>
          )}
        </div>
        <div className={cn("mt-3", LIST_GROUP)}>
          <LinkRow to="/policies#privacy" label={t("settings.security.privacyPolicy")} />
        </div>
      </Block>
    </>
  );
}

/* ---------------------------------------------------------- notifications */

function Notifications() {
  const { t } = useTranslation();
  const { state, commit } = useDemo();
  const side = state.activeWorkspace;
  const set = (topic: NotificationTopic, value: boolean) =>
    commit({ type: "setPreferences", patch: { notifications: { ...state.preferences.notifications, [topic]: value } } });
  const optional = OPTIONAL_TOPICS.filter((topic) => topic !== "opportunities" || state.sitter);

  return (
    <>
      <DemoNotice title={t("settings.notifications.demoTitle")} body={t("settings.notifications.demoBody")} />
      <Block id="notif-essential" title={t("settings.notifications.essentialTitle")} note={t("settings.notifications.essentialNote")}>
        <div className={LIST_GROUP}>
          {ESSENTIAL_TOPICS.map((topic) => (
            <SwitchRow
              key={topic}
              id={`notif-${topic}`}
              label={t(`settings.notifications.topics.${topic}`)}
              checked
              disabled
              onChange={() => undefined}
            />
          ))}
        </div>
      </Block>
      <Block id="notif-optional" title={t("settings.notifications.optionalTitle")}>
        <div className={LIST_GROUP}>
          {optional.map((topic) => (
            <SwitchRow
              key={topic}
              id={`notif-${topic}`}
              label={t(`settings.notifications.topics.${topic}`)}
              line={topic === "promotions" ? t("settings.notifications.promotionsLine") : topic === "opportunities" && side !== "sitter" ? t("settings.notifications.opportunitiesLine") : undefined}
              checked={topicEnabled(state.preferences, topic)}
              onChange={(value) => set(topic, value)}
            />
          ))}
        </div>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------ preferences */

function Preferences() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state, commit } = useDemo();
  const explicit = hasExplicitLocale();
  return (
    <>
      <Block
        id="pref-language"
        title={t("settings.language.title")}
        note={explicit ? t("settings.language.chosen") : t("settings.language.following")}
      >
        <OptionGroup
          labelledBy="pref-language"
          value={locale}
          onChange={setLocale}
          options={LANGUAGE_OPTIONS.map((lng) => ({ value: lng, label: t(LOCALE_LABEL_KEY[lng]) }))}
        />
      </Block>
      <Block id="pref-a11y" title={t("settings.preferences.a11yTitle")}>
        <div className={LIST_GROUP}>
          <SwitchRow
            id="reduce-motion"
            label={t("settings.preferences.reduceMotion")}
            line={t("settings.preferences.reduceMotionLine")}
            checked={state.preferences.reduceMotion}
            onChange={(value) => commit({ type: "setPreferences", patch: { reduceMotion: value } })}
          />
        </div>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{t("settings.preferences.appearanceNote")}</p>
      </Block>
    </>
  );
}

/* --------------------------------------------------------------- location */

function LocationPrefs() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state } = useDemo();
  const account = state.account;
  const geo = usePermission("geolocation");
  const save = useSave({ watch: (s) => s.account && { wilayaId: s.account.wilayaId, communeId: s.account.communeId } });
  const [place, setPlace] = useState({ wilayaCode: account?.wilayaId ?? null, communeCode: account?.communeId ?? null });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  const submit = (force = false) => {
    if (checkLocation(place, { wilayaRequired: false })) {
      setError(t("location.invalid"));
      return;
    }
    const result = save.save(
      (base) =>
        base.account
          ? { type: "setAccount", account: { ...base.account, wilayaId: place.wilayaCode, communeId: place.communeCode } }
          : null,
      { force },
    );
    if (result) setSaved(true);
  };

  return (
    <>
      <Block id="loc-area" title={t("settings.location.areaTitle")} note={t("settings.location.areaNote")}>
        <div className="surface space-y-4 p-4">
          <LocationFields
            locale={locale}
            wilayaCode={place.wilayaCode}
            communeCode={place.communeCode}
            onChange={(next) => {
              setPlace(next);
              setSaved(false);
              setError(undefined);
            }}
            wilayaLabel={t("ownerAccount.wilayaLabel")}
            wilayaPlaceholder={t("need.location.wilayaPlaceholder")}
            communeLabel={t("need.location.communeLabel")}
            anyCommuneLabel={t("ownerAccount.communeUnspecified")}
            anyWilayaLabel={t("settings.location.noArea")}
            error={error}
          />
          <Button type="button" onClick={() => submit()}>
            {t("ownerAccount.save")}
          </Button>
          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("settings.location.saved")}
            </p>
          )}
          <SaveFeedback save={save} onRetry={() => submit()} onKeepMine={() => submit(true)} />
        </div>
      </Block>
      <Block id="loc-permission" title={t("settings.location.permissionTitle")}>
        <div className={LIST_GROUP}>
          <InfoRow label={t("settings.security.location")} line={t(`settings.security.locationLine.${geo}`)} />
        </div>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{t("settings.location.radiusNote")}</p>
      </Block>
      {state.sitter && (
        <div className={LIST_GROUP}>
          <LinkRow to="/sitter/join/location" label={t("settings.location.sitterArea")} line={t("settings.location.sitterAreaLine")} />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------- help */

function HelpSection() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<"problem" | "feedback">("problem");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const report = `${t(`settings.help.kind.${kind}`)} — Nidz ${APP_VERSION}\n${navigator.userAgent}\n\n${text.trim()}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className={LIST_GROUP}>
        <LinkRow to="/help" label={t("settings.help.center")} line={t("settings.help.centerLine")} />
        <LinkRow to="/help#faq" label={t("settings.help.faq")} />
      </div>
      <Block id="help-contact" title={t("settings.help.contactTitle")} note={t("settings.help.contactNote")}>
        <div className="surface space-y-4 p-4">
          <OptionGroup
            labelledBy="help-contact"
            value={kind}
            onChange={(v) => {
              setKind(v);
              setCopied(false);
            }}
            options={[
              { value: "problem" as const, label: t("settings.help.kind.problem") },
              { value: "feedback" as const, label: t("settings.help.kind.feedback") },
            ]}
          />
          <Textarea
            aria-label={t("settings.help.textLabel")}
            rows={5}
            value={text}
            maxLength={2000}
            placeholder={t("settings.help.placeholder")}
            onChange={(e) => {
              setText(e.target.value);
              setCopied(false);
            }}
          />
          <Button type="button" variant="surface" disabled={!text.trim()} onClick={() => void copy()}>
            <Copy aria-hidden="true" />
            {t("settings.help.copy")}
          </Button>
          {copied && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("settings.help.copied")}
            </p>
          )}
        </div>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ legal */

function Legal() {
  const { t } = useTranslation();
  return (
    <>
      <div className={LIST_GROUP}>
        <InfoRow label={t("settings.legal.version")} line={t("settings.legal.versionLine", { version: APP_VERSION, stage: t(`settings.legal.stage.${APP_STAGE}`) })} />
        <LinkRow to="/policies#terms" label={t("settings.legal.terms")} />
        <LinkRow to="/policies#privacy" label={t("settings.security.privacyPolicy")} />
        <LinkRow to="/policies" label={t("settings.legal.legalInfo")} />
      </div>
      <Block id="legal-licenses" title={t("settings.legal.licensesTitle")} note={t("settings.legal.licensesNote")}>
        <ul role="list" className={LIST_GROUP}>
          {LICENSES.map((l) => (
            <li key={l.name} className={cn(REGISTER_ROW, "min-h-12 hover:bg-transparent")}>
              <span className="font-medium text-foreground">{l.name}</span>
              <span className="text-sm text-muted-foreground">{l.licence}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 px-1 text-sm text-muted-foreground">{t("settings.legal.illustrations")}</p>
      </Block>
    </>
  );
}

/* ----------------------------------------------------- account management */

function AccountManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { state, commit } = useDemo();
  const erase = useSave();

  useEffect(() => {
    if (hash !== "#reset") return;
    const frame = window.requestAnimationFrame(() => document.getElementById("reset")?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  const signOut = () => {
    if (commit({ type: "signOut" }).ok) navigate(WELCOME_PATH, { replace: true });
  };
  /* Everything this browser holds, gone — and confirmed gone before saying
     so (A-02). There is no server copy to delete, and the dialog says so. */
  const eraseAll = () => {
    if (!erase.save({ type: "reset" })) return;
    clearFormDrafts();
    navigate(WELCOME_PATH, { replace: true });
  };

  return (
    <>
      <Block id="acc-session" title={t("settings.account.sessionTitle")}>
        <div className="surface p-4">
          <p className="text-sm text-muted-foreground">{t("settings.account.signOutBody")}</p>
          <ConfirmAction
            className="mt-3"
            trigger={
              <>
                <LogOut aria-hidden="true" />
                {t("settings.account.signOut")}
              </>
            }
            title={t("settings.account.signOutTitle")}
            body={t("settings.account.signOutConfirmBody")}
            confirm={t("settings.account.signOut")}
            onConfirm={signOut}
          />
        </div>
      </Block>

      <Block id="acc-delete" title={t("settings.account.deleteTitle")}>
        <div id="reset" className="surface scroll-mt-20 p-4">
          <p className="text-sm text-muted-foreground">{t("settings.account.deleteBody")}</p>
          <ConfirmAction
            className="mt-3"
            destructive
            trigger={
              <>
                <Trash2 aria-hidden="true" />
                {t("settings.account.delete")}
              </>
            }
            title={t("settings.account.deleteConfirmTitle")}
            body={t("settings.account.deleteConfirmBody")}
            confirm={t("settings.account.deleteConfirm")}
            onConfirm={eraseAll}
          />
          <SaveFeedback
            className="mt-4"
            save={erase}
            onRetry={eraseAll}
            failedTitle={t("settings.reset.failedTitle")}
            failedBody={t("settings.reset.failedBody")}
          />
        </div>
      </Block>

      {/* TEST TOOLING, separate from the product (Audit 1.3 LOT 07): with no
          other users, the only way to see the sitter side receive a request
          or a message is to address one to your own profile. */}
      {state.sitter && isPubliclyListed(state, state.sitter.profile) && (
        <section aria-labelledby="settings-tools" className="rounded-xl border border-dashed border-input p-4">
          <h2 id="settings-tools" className="text-title font-semibold text-foreground">
            {t("settings.tools.title")}
          </h2>
          <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">{t("settings.tools.body")}</p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Button asChild variant="surface">
              <Link to={`/owner/request/${state.sitter.profile.id}`}>{t("settings.tools.selfRequest")}</Link>
            </Button>
            <Button asChild variant="surface">
              <Link to={`/messages/to/${state.sitter.profile.id}`}>{t("settings.tools.selfMessage")}</Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
