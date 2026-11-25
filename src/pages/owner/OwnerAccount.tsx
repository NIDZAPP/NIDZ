import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { Chip } from "@/components/shared/Chip";
import { SPECIES_ICON } from "@/components/shared/species";
import { ACCOUNT_PATH } from "@/components/layout/workspace-nav";
import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell, LocationFields } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkLocation } from "@/data/algeria";
import { REGISTER_PATH } from "@/data/navigation";
import { PHONE_PREFIX, SPECIES, type Species } from "@/data/types";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { sameOriginPath } from "@/utils/safe-path";

const FORM_ID = "owner-account";

/** Algerian mobile numbers are 9 digits after the country code. */
const DIGITS = /^\d{9}$/;

/**
 * The quick owner account (§16).
 *
 * ONE screen, not four. Audit 1.1 asked for a name, then a number, then a
 * simulated code, then continued — three of which existed to stage a
 * verification that never happened. §15 wants this to be fast, and everything
 * before it works without an account at all: browsing, filtering and reading a
 * profile need no identity, so the first time Nidz asks for one is the first
 * time it genuinely needs one.
 *
 * WHAT IS ASKED FOR, AND WHY — the §96 test applied field by field:
 *
 *   - First and last name. A sitter deciding whether to take your animal is
 *     entitled to know who is asking. Only the first name and an initial ever
 *     become public (§27).
 *   - Date of birth: withdrawn at Audit 1.3 LOT 08 — see below.
 *   - Wilaya and commune — OPTIONAL. How Nidz makes the first search relevant. It
 *     is administrative granularity on purpose — Nidz holds no exact address
 *     for anyone, so there is nothing more precise to leak (§29).
 *   - Which animals you have. Multi-select, because a household is often not
 *     one species. It seeds discovery; it is not a claim about the animals,
 *     which are described properly on their own profiles.
 *   - Phone. OPTIONAL and unverified, and private by default: it is never
 *     exchanged with another user without explicit consent (§78).
 *
 * Nothing here is checked by anybody, and the note under the action says so.
 *
 * AUDIT 1.3 LOT 08 — ONLY WHAT THE ACTION NEEDS. The one thing a request
 * needs from its sender is a name, so the name is the only required answer.
 * The date of birth is no longer asked at all: nothing read it, and the rule
 * it was "held against" does not exist — asking for private data with no use
 * is the friction (and the privacy cost) the audit names. It will be asked
 * when an eligibility rule exists, at the point it applies. The area is
 * optional and says what it is for; the phone and the animals already were.
 *
 * The answers are kept as an unsaved draft (`useFormDraft`, in localStorage
 * since Audit 1.3.1), so stepping out to Compte to change the language,
 * reloading, or closing the app and coming back does not empty the form. The
 * account is written only once storage confirms it, and a change made to the
 * same account in another tab meanwhile is never silently overwritten.
 */
export default function OwnerAccount() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useDemo();

  const account = state.account;
  const save = useSave({
    scope: "owner-account",
    watch: (s) =>
      s.account && {
        firstName: s.account.firstName,
        lastName: s.account.lastName,
        wilayaId: s.account.wilayaId,
        communeId: s.account.communeId,
        ownedSpecies: s.account.ownedSpecies,
        phoneNumber: s.account.phoneNumber,
      },
  });
  const [form, setForm, clearDraft] = useFormDraft("owner-account", () => ({
    firstName: account?.firstName ?? "",
    lastName: account?.lastName ?? "",
    wilayaId: (account?.wilayaId ?? null) as string | null,
    communeId: (account?.communeId ?? null) as string | null,
    species: (account?.ownedSpecies ?? []) as Species[],
    phone: account?.phoneNumber ?? "",
  }));
  const { firstName, lastName, wilayaId, communeId, phone } = form;
  /* Narrowed to species this build knows: the draft came out of storage. */
  const species = form.species.filter((s): s is Species => (SPECIES as readonly string[]).includes(s));
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    location?: string;
    phone?: string;
  }>({});

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const wilayaRef = useRef<HTMLButtonElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  /* Where to go once the account exists. Carried in the URL rather than held in
     state, so the return trip survives a reload and a shared link cannot strand
     someone on a screen with no way onward. Parsed rather than pattern-matched
     — see `sameOriginPath`: a cross-origin value here throws out of the submit
     handler AFTER the account has been created, leaving a dead button and
     half-applied state. */
  const next = sameOriginPath(searchParams.get("next"));
  /* Editing an account that exists (or creating one from Compte) is a detour
     from Compte: it returns there, and Back goes there — not to the sign-in
     gateway, which is only the way in when a request or a message asked for
     an account (1.6). */
  const fromAccount = Boolean(state.account) || next === ACCOUNT_PATH;
  const destination = next ?? (state.account ? ACCOUNT_PATH : "/");
  const backTo = fromAccount ? (next ?? ACCOUNT_PATH) : next ? `/auth?next=${encodeURIComponent(next)}` : "/auth";

  /* Since 1.7 an account is OPENED only through `/register` (§3): its number,
     its simulated code step and its one-account-per-device rule. This screen
     edits an account that exists; without one it forwards there, with `next`,
     as `/auth` does. */
  if (!account) return <Navigate to={`${REGISTER_PATH}${next ? `?next=${encodeURIComponent(next)}` : ""}`} replace />;

  const toggleSpecies = (value: Species) =>
    set({ species: species.includes(value) ? species.filter((s) => s !== value) : [...species, value] });

  const submit = (force = false) => {
    const nextErrors: typeof errors = {};
    if (!firstName.trim()) nextErrors.firstName = t("request.name.firstRequired");
    if (!lastName.trim()) nextErrors.lastName = t("request.name.lastRequired");
    /* The area stays optional here (LOT 08) — but what IS given follows the
       same rule as every location form: a commune only within its wilaya. */
    if (checkLocation({ wilayaCode: wilayaId, communeCode: communeId }, { wilayaRequired: false })) {
      nextErrors.location = t("location.invalid");
    }

    /* Optional — but if something was typed, it has to be a number, because a
       half-typed one is worse than none. */
    const digits = phone.replace(/\s+/g, "");
    if (digits && !DIGITS.test(digits)) nextErrors.phone = t("request.phone.invalid");

    setErrors(nextErrors);
    if (nextErrors.firstName) return firstRef.current?.focus();
    if (nextErrors.lastName) return lastRef.current?.focus();
    if (nextErrors.location) return wilayaRef.current?.focus();
    if (nextErrors.phone) return phoneRef.current?.focus();

    const saved = save.save(
      (base) => ({
        type: "setAccount",
        account: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          /* Kept if an earlier build collected it; never asked any more. */
          dateOfBirth: base.account?.dateOfBirth ?? null,
          wilayaId,
          communeId,
          ownedSpecies: species,
          phoneNumber: digits,
          accountComplete: true,
          createdAt: base.account?.createdAt ?? new Date().toISOString(),
          signInMethod: base.account?.signInMethod ?? null,
          photoUrl: base.account?.photoUrl,
        },
      }),
      { force },
    );
    /* No account on disk, no "account created" journey (Audit 1.3.1 A-02):
       the form stays, filled in, with the reason and a retry. */
    if (!saved) return;
    clearDraft();
    navigate(destination, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("ownerAccount.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        /* The gateway, still carrying the return trip — without `next`, Back and
           then "create an account" again would lose the request it was for. */
        backTo={backTo}
        title={t("ownerAccount.title")}
        intro={t("ownerAccount.intro")}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {/* Creating and editing are different promises: "Créer mon compte"
                on an account that exists reads as making a second one. */}
            {state.account ? t("ownerAccount.save") : t("ownerAccount.cta")}
          </Button>
        }
        footNote={<DemoLine>{t("ownerAccount.storageNote")}</DemoLine>}
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FieldShell label={t("request.name.firstLabel")} error={errors.firstName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={firstRef}
                value={firstName}
                autoComplete="given-name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  set({ firstName: e.target.value });
                  setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
              />
            )}
          </FieldShell>

          <FieldShell
            label={t("request.name.lastLabel")}
            help={t("ownerAccount.lastNameHelp")}
            error={errors.lastName}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={lastRef}
                value={lastName}
                autoComplete="family-name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  set({ lastName: e.target.value });
                  setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
              />
            )}
          </FieldShell>

          <LocationFields
            locale={locale}
            wilayaCode={wilayaId}
            communeCode={communeId}
            wilayaRef={wilayaRef}
            onChange={(nextLocation) => {
              set({ wilayaId: nextLocation.wilayaCode, communeId: nextLocation.communeCode });
              setErrors((prev) => ({ ...prev, location: undefined }));
            }}
            wilayaLabel={t("ownerAccount.wilayaLabel")}
            wilayaPlaceholder={t("need.location.wilayaPlaceholder")}
            communeLabel={t("need.location.communeLabel")}
            anyCommuneLabel={t("ownerAccount.communeUnspecified")}
            help={t("ownerAccount.locationHelp")}
            error={errors.location}
          />

          <div>
            <p id="owner-species-label" className="text-sm font-medium text-foreground">
              {t("ownerAccount.speciesLabel")}
            </p>
            <p id="owner-species-help" className="mt-1 text-sm text-muted-foreground">
              {t("ownerAccount.speciesHelp")}
            </p>
            {/* Multi-select, so `Chip`'s checkbox role is the honest one — and
                no answer is required: someone can create an account before they
                have decided what they are looking for. */}
            <div
              role="group"
              aria-labelledby="owner-species-label"
              aria-describedby="owner-species-help"
              className="mt-3 flex flex-wrap gap-2"
            >
              {SPECIES.map((value) => (
                <Chip
                  key={value}
                  selected={species.includes(value)}
                  icon={SPECIES_ICON[value]}
                  onClick={() => toggleSpecies(value)}
                >
                  {t(`species.${value}`)}
                </Chip>
              ))}
            </div>
          </div>

          <FieldShell
            label={t("ownerAccount.phoneLabel")}
            help={t("ownerAccount.phoneHelp")}
            error={errors.phone}
          >
            {({ id, describedBy, invalid }) => (
              <div className="flex items-stretch gap-2">
                {/* An inert constant, not a selector: nothing here does anything
                    with a country, so a control that changes nothing would be
                    worse than an honest label. */}
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 shrink-0 items-center rounded-md bg-secondary px-3 text-sm font-medium text-foreground"
                >
                  {PHONE_PREFIX}
                </span>
                <Input
                  id={id}
                  ref={phoneRef}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  autoComplete="tel-national"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  onChange={(e) => {
                    set({ phone: e.target.value });
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                />
              </div>
            )}
          </FieldShell>
          <SaveFeedback save={save} onRetry={() => submit()} onKeepMine={() => submit(true)} />
        </form>
      </FlowScreen>
    </>
  );
}
