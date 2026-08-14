import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Chip } from "@/components/shared/Chip";
import { SPECIES_ICON } from "@/components/shared/species";
import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell, LocationFields } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHONE_PREFIX, SPECIES, type Species } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { toISODate, today } from "@/utils/dates";
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
 *   - Date of birth. Required by §16, and PRIVATE: never rendered on any
 *     surface and never sent to a sitter. It is held against a future
 *     eligibility rule and is NOT one today — §52 sets an adults-only rule for
 *     sitters and says nothing about owners, so enforcing one here would invent
 *     a product decision nobody has made. Until that decision exists the field
 *     is validated as a real past date and used for nothing else, and this is
 *     the whole of what it does.
 *   - Wilaya and commune. This is how Nidz makes the first search relevant. It
 *     is administrative granularity on purpose — Nidz holds no exact address
 *     for anyone, so there is nothing more precise to leak (§29).
 *   - Which animals you have. Multi-select, because a household is often not
 *     one species. It seeds discovery; it is not a claim about the animals,
 *     which are described properly on their own profiles.
 *   - Phone. OPTIONAL and unverified, and private by default: it is never
 *     exchanged with another user without explicit consent (§78).
 *
 * Nothing here is checked by anybody, and the note under the action says so.
 */
export default function OwnerAccount() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useDemo();

  const account = state.account;
  const [firstName, setFirstName] = useState(account?.firstName ?? "");
  const [lastName, setLastName] = useState(account?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(account?.dateOfBirth ?? "");
  const [wilayaId, setWilayaId] = useState(account?.wilayaId ?? null);
  const [communeId, setCommuneId] = useState(account?.communeId ?? null);
  const [species, setSpecies] = useState<Species[]>(account?.ownedSpecies ?? []);
  const [phone, setPhone] = useState(account?.phoneNumber ?? "");

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    wilaya?: string;
    phone?: string;
  }>({});

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);
  const wilayaRef = useRef<HTMLButtonElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  /* Where to go once the account exists. Carried in the URL rather than held in
     state, so the return trip survives a reload and a shared link cannot strand
     someone on a screen with no way onward. Parsed rather than pattern-matched
     — see `sameOriginPath`: a cross-origin value here throws out of the submit
     handler AFTER the account has been created, leaving a dead button and
     half-applied state. */
  const destination = sameOriginPath(searchParams.get("next")) ?? "/";

  const toggleSpecies = (value: Species) =>
    setSpecies((current) =>
      current.includes(value) ? current.filter((s) => s !== value) : [...current, value],
    );

  const submit = () => {
    const nextErrors: typeof errors = {};
    if (!firstName.trim()) nextErrors.firstName = t("request.name.firstRequired");
    if (!lastName.trim()) nextErrors.lastName = t("request.name.lastRequired");

    if (!dateOfBirth) {
      nextErrors.dateOfBirth = t("ownerAccount.dobRequired");
    } else if (dateOfBirth > toISODate(today())) {
      /* A birth date in the future is a typo, not a person. Caught here rather
         than accepted and rendered back as a fact. */
      nextErrors.dateOfBirth = t("ownerAccount.dobFuture");
    }

    if (!wilayaId) nextErrors.wilaya = t("ownerAccount.wilayaRequired");

    /* Optional — but if something was typed, it has to be a number, because a
       half-typed one is worse than none. */
    const digits = phone.replace(/\s+/g, "");
    if (digits && !DIGITS.test(digits)) nextErrors.phone = t("request.phone.invalid");

    setErrors(nextErrors);
    if (nextErrors.firstName) return firstRef.current?.focus();
    if (nextErrors.lastName) return lastRef.current?.focus();
    if (nextErrors.dateOfBirth) return dobRef.current?.focus();
    if (nextErrors.wilaya) return wilayaRef.current?.focus();
    if (nextErrors.phone) return phoneRef.current?.focus();

    dispatch({
      type: "setAccount",
      account: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        wilayaId,
        communeId,
        ownedSpecies: species,
        phoneNumber: digits,
        accountComplete: true,
        createdAt: account?.createdAt ?? new Date().toISOString(),
      },
    });
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
        backTo="/auth"
        title={t("ownerAccount.title")}
        intro={t("ownerAccount.intro")}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("ownerAccount.cta")}
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
                  setFirstName(e.target.value);
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
                  setLastName(e.target.value);
                  setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
              />
            )}
          </FieldShell>

          <FieldShell
            label={t("ownerAccount.dobLabel")}
            help={t("ownerAccount.dobHelp")}
            error={errors.dateOfBirth}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                ref={dobRef}
                type="date"
                value={dateOfBirth}
                /* The platform's own picker, keyboard support and localisation,
                   and `max` prevents a future date rather than flagging it red
                   afterwards (§18 — prevention over error). */
                max={toISODate(today())}
                autoComplete="bday"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
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
              setWilayaId(nextLocation.wilayaCode);
              setCommuneId(nextLocation.communeCode);
              setErrors((prev) => ({ ...prev, wilaya: undefined }));
            }}
            wilayaLabel={t("need.location.wilayaLabel")}
            wilayaPlaceholder={t("need.location.wilayaPlaceholder")}
            communeLabel={t("need.location.communeLabel")}
            anyCommuneLabel={t("ownerAccount.communeUnspecified")}
            help={t("ownerAccount.locationHelp")}
            error={errors.wilaya}
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
                    setPhone(e.target.value);
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                />
              </div>
            )}
          </FieldShell>
        </form>
      </FlowScreen>
    </>
  );
}
