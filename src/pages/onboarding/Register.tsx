import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Phone } from "lucide-react";

import { REGISTER_STEPS, REGISTER_STEP_IDS, isProviderId, type AuthProviderId, type RegisterStep } from "@/auth/providers";
import FlowScreen from "@/components/shared/FlowScreen";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import PhotoField from "@/components/shared/PhotoField";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoNotice } from "@/components/shared/trust";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LOGIN_PATH, REGISTER_PATH, START_PATH, afterSignInPath, hasSession } from "@/data/navigation";
import { publicNameOf } from "@/data/publications";
import { PHONE_PREFIX } from "@/data/types";
import { clearDraft, clearFormDrafts, useFormDraft } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { isolate } from "@/utils/format";
import { sameOriginPath } from "@/utils/safe-path";

import {
  afterJourney,
  endJourney,
  historyIndex,
  markJourneyStart,
  markJourneyStep,
  setAfterJourney,
  stepsBackToStart,
} from "./register-history";

/* ---------------------------------------------------------------------------
   OPENING AN ACCOUNT (Nidz 1.7 §3) — three journeys, one account.

     Google / Apple   name → phone → code → photo
     Phone number     phone → code → name → photo

   then the first choice of activity (`/start`). One account holds both
   spaces; nothing is asked twice later — the sitter onboarding reads the name
   and number from here.

   WHAT IS REAL AND WHAT IS NOT. There is no Google, Apple or SMS integration
   in this prototype (`src/auth/providers.ts`), so:

     - choosing Google or Apple contacts nobody; the name step says so and
       the person types the name a provider would have returned;
     - no code is sent; the code step says so at full weight and accepts any
       six digits, and the number is recorded as NOT verified;
     - the account lives in this browser only.

   The answers are a draft (`nidz.draft.registration`) until the last step:
   Back keeps them, and an interrupted sign-up resumes at the step it reached.
   One account per device: if one exists, the screen offers to sign in to it
   instead of quietly creating a second.
   ------------------------------------------------------------------------ */

const SCOPE = "registration";
const DIGITS = /^\d{9}$/;

type RegistrationDraft = {
  method: string;
  firstName: string;
  lastName: string;
  phone: string;
  code: string;
  photo: string;
  /** The furthest step reached, to resume an interrupted sign-up. */
  reached: string;
};

const EMPTY: RegistrationDraft = { method: "", firstName: "", lastName: "", phone: "", code: "", photo: "", reached: "" };

function useRegistration() {
  return useFormDraft<RegistrationDraft>(SCOPE, () => ({ ...EMPTY }));
}

const methodOf = (draft: RegistrationDraft): AuthProviderId | null => (isProviderId(draft.method) ? draft.method : null);

function stepsOf(method: AuthProviderId): readonly RegisterStep[] {
  return REGISTER_STEPS[method];
}

function nextQuery(next: string | null) {
  return next ? `?next=${encodeURIComponent(next)}` : "";
}

/** Has this step's own answer been given? */
function stepDone(step: RegisterStep, draft: RegistrationDraft): boolean {
  switch (step) {
    case "name":
      return Boolean(draft.firstName.trim() && draft.lastName.trim());
    case "phone":
      return DIGITS.test(draft.phone.replace(/\s+/g, ""));
    case "code":
      return /^\d{6}$/.test(draft.code);
    case "photo":
      return true;
  }
}

/* ------------------------------------------------------------ the method */

export function RegisterStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sameOriginPath(params.get("next"));
  const { state } = useDemo();
  const [draft, setDraft] = useRegistration();
  const signedIn = hasSession(state);
  /* Erasing is a write like any other (A-02): reported if storage refuses. */
  const erase = useSave();
  const eraseAll = () => {
    if (!erase.save({ type: "reset" })) return;
    clearFormDrafts();
  };

  /* This entry is where a finished journey comes back to (register-history). */
  useEffect(() => {
    if (signedIn) endJourney();
    else markJourneyStart(historyIndex());
  }, [signedIn]);

  if (signedIn) return <Navigate to={afterJourney() ?? next ?? afterSignInPath(state)} replace />;

  const method = methodOf(draft);
  /* An interrupted sign-up: offer to resume where it stopped. */
  const resumeStep = method
    ? (stepsOf(method).find((s) => !stepDone(s, draft)) ?? stepsOf(method).at(-1)!)
    : null;

  const choose = (id: AuthProviderId) => {
    setDraft((d) => ({ ...d, method: id, code: "" }));
    navigate(`${REGISTER_PATH}/${stepsOf(id)[0]}${nextQuery(next)}`);
  };

  const existing = state.account;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("register.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen backTo="/welcome" title={t("register.title")} intro={t("register.intro")} topEnd={<LanguageSwitcher />}>
        {existing && (
          <div className="surface mb-6 p-4" role="note">
            <p className="font-semibold text-foreground">
              {t("register.existing.title", { name: isolate(publicNameOf(existing)) })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("register.existing.body")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`${LOGIN_PATH}${nextQuery(next)}`}>{t("register.existing.signIn")}</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-muted-foreground">
                    {t("register.existing.erase")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("register.existing.eraseTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("register.existing.eraseBody")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={eraseAll}>{t("register.existing.eraseConfirm")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <SaveFeedback
              className="mt-3"
              save={erase}
              onRetry={eraseAll}
              failedTitle={t("settings.reset.failedTitle")}
              failedBody={t("settings.reset.failedBody")}
            />
          </div>
        )}

        {!existing && method && resumeStep && draft.reached && (
          <div className="surface mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-foreground">{t("register.resume", { method: t(`register.method.${method}`) })}</p>
            {/* `outline`, not `surface`: a white pill on a white card has only
                its shadow for an edge (button.tsx). */}
            <Button asChild variant="outline">
              <Link to={`${REGISTER_PATH}/${resumeStep}${nextQuery(next)}`}>{t("register.resumeAction")}</Link>
            </Button>
          </div>
        )}

        {!existing && (
          <div className="grid gap-3">
            <Button type="button" size="lg" variant="surface" className="w-full justify-center" onClick={() => choose("google")}>
              <GoogleMark />
              {t("register.method.google")}
            </Button>
            <Button type="button" size="lg" variant="surface" className="w-full justify-center" onClick={() => choose("apple")}>
              <AppleMark />
              {t("register.method.apple")}
            </Button>
            <Button type="button" size="lg" variant="surface" className="w-full justify-center" onClick={() => choose("phone")}>
              <Phone aria-hidden="true" />
              {t("register.method.phone")}
            </Button>
          </div>
        )}

        <DemoNotice className="mt-8" title={t("register.demoTitle")} body={t("register.demoBody")} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("register.haveAccount")}{" "}
          <Link to={`${LOGIN_PATH}${nextQuery(next)}`} className="font-semibold text-primary underline underline-offset-4">
            {t("welcome.signIn")}
          </Link>
        </p>
      </FlowScreen>
    </>
  );
}

/* Neutral, single-colour marks so the buttons are recognisable without
   borrowing a provider's branded button — which would promise an
   integration that does not exist. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.7-.06-1.36-.18-2H12v3.79h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.32ZM12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.6A10 10 0 0 0 12 22Zm-5.6-8.1a6 6 0 0 1 0-3.8V7.5H3.07a10 10 0 0 0 0 9l3.33-2.6ZM12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.5L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="currentColor"
        d="M16.37 12.8c-.02-2.2 1.8-3.26 1.88-3.31a4.05 4.05 0 0 0-3.18-1.72c-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76a4.26 4.26 0 0 0-3.6 2.19c-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.15a9.3 9.3 0 0 0 1.2-2.47 3.83 3.83 0 0 1-2.3-3.55ZM14.2 6.33A3.85 3.85 0 0 0 15.1 3.5a3.93 3.93 0 0 0-2.55 1.32 3.67 3.67 0 0 0-.92 2.73 3.25 3.25 0 0 0 2.57-1.22Z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------- the steps */

export function RegisterStepScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { step: rawStep } = useParams();
  const [params] = useSearchParams();
  const next = sameOriginPath(params.get("next"));
  const { state } = useDemo();
  const [draft, setDraft, clearRegistration] = useRegistration();
  const save = useSave({ scope: SCOPE });
  const [error, setError] = useState<string | undefined>();
  const [lastError, setLastError] = useState<string | undefined>();
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  /* Set while going back to `/register` after the account was saved: this
     step must not also redirect, or the destination would flash first. */
  const finishing = useRef(false);

  useEffect(() => {
    if (!finishing.current) markJourneyStep(historyIndex());
  }, [rawStep]);

  const method = methodOf(draft);
  const step = REGISTER_STEP_IDS.find((s) => s === rawStep) ?? null;

  if (hasSession(state)) return finishing.current ? null : <Navigate to={next ?? afterSignInPath(state)} replace />;
  if (!method || !step || !stepsOf(method).includes(step)) return <Navigate to={`${REGISTER_PATH}${nextQuery(next)}`} replace />;

  const steps = stepsOf(method);
  const index = steps.indexOf(step);
  /* A step is reachable only once the ones before it are answered: a
     bookmark into the middle resumes at the first unanswered one. */
  const firstMissing = steps.slice(0, index).find((s) => !stepDone(s, draft));
  if (firstMissing) return <Navigate to={`${REGISTER_PATH}/${firstMissing}${nextQuery(next)}`} replace />;

  const prev = index === 0 ? REGISTER_PATH : `${REGISTER_PATH}/${steps[index - 1]}`;
  const advance = () => {
    const following = steps[index + 1];
    setDraft((d) => ({ ...d, reached: following ?? step }));
    if (following) navigate(`${REGISTER_PATH}/${following}${nextQuery(next)}`);
  };

  /* `photo` is passed when the choice was made in this same tap (« Passer »):
     the draft state it was written to is not read back until the next
     render, and would still hold the photo that was skipped. */
  const finish = ({ photo = draft.photo }: { photo?: string } = {}) => {
    const digits = draft.phone.replace(/\s+/g, "");
    const saved = save.save({
      type: "setAccount",
      account: {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        dateOfBirth: null,
        wilayaId: null,
        communeId: null,
        ownedSpecies: [],
        phoneNumber: digits,
        accountComplete: true,
        createdAt: new Date().toISOString(),
        signInMethod: method,
        photoUrl: photo || undefined,
      },
    });
    if (!saved) return;
    clearRegistration();
    clearDraft(SCOPE);
    /* Leave no finished step behind the destination (register-history). */
    const destination = next ?? START_PATH;
    const back = stepsBackToStart(historyIndex());
    if (back) {
      finishing.current = true;
      setAfterJourney(destination);
      navigate(-back);
    } else {
      endJourney();
      navigate(destination, { replace: true });
    }
  };

  const progress = { current: index + 1, total: steps.length, label: t("register.progress", { current: index + 1, total: steps.length }) };

  const submit = () => {
    setError(undefined);
    setLastError(undefined);
    if (step === "name") {
      let failed = false;
      if (!draft.firstName.trim()) {
        setError(t("request.name.firstRequired"));
        firstRef.current?.focus();
        failed = true;
      }
      if (!draft.lastName.trim()) {
        setLastError(t("request.name.lastRequired"));
        if (!failed) lastRef.current?.focus();
        failed = true;
      }
      if (failed) return;
    }
    if (step === "phone") {
      const digits = draft.phone.replace(/\s+/g, "");
      if (!DIGITS.test(digits)) {
        setError(t("request.phone.invalid"));
        phoneRef.current?.focus();
        return;
      }
    }
    if (step === "code" && !/^\d{6}$/.test(draft.code)) {
      setError(t("register.code.invalid"));
      return;
    }
    if (step === "photo") return finish();
    advance();
  };

  const titles: Record<RegisterStep, string> = {
    name: t("register.name.title"),
    phone: t("register.phone.title"),
    code: t("register.code.title"),
    photo: t("register.photo.title"),
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {titles[step]}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo={`${prev}${nextQuery(next)}`}
        progress={progress}
        stepKey={step}
        title={titles[step]}
        intro={t(`register.${step}.intro`)}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form="register-step" size="lg">
            {step === "photo" ? t("register.finish") : t("common.continue")}
          </Button>
        }
        secondaryAction={
          step === "photo" ? (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => {
                setDraft((d) => ({ ...d, photo: "" }));
                finish({ photo: "" });
              }}
            >
              {t("register.photo.skip")}
            </Button>
          ) : undefined
        }
      >
        <form
          id="register-step"
          noValidate
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {step === "name" && (
            <>
              {method !== "phone" && (
                <DemoNotice title={t("register.name.providerTitle", { provider: t(`register.provider.${method}`) })} body={t("register.name.providerBody", { provider: t(`register.provider.${method}`) })} />
              )}
              <FieldShell label={t("request.name.firstLabel")} error={error}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={firstRef}
                    value={draft.firstName}
                    autoComplete="given-name"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, firstName: value }));
                      setError(undefined);
                    }}
                  />
                )}
              </FieldShell>
              <FieldShell label={t("request.name.lastLabel")} help={t("ownerAccount.lastNameHelp")} error={lastError}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={lastRef}
                    value={draft.lastName}
                    autoComplete="family-name"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, lastName: value }));
                      setLastError(undefined);
                    }}
                  />
                )}
              </FieldShell>
            </>
          )}

          {step === "phone" && (
            <FieldShell label={t("register.phone.label")} help={t("register.phone.help")} error={error}>
              {({ id, describedBy, invalid }) => (
                <div className="flex items-stretch gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-11 shrink-0 items-center rounded-md bg-secondary px-3 text-sm font-medium text-foreground"
                  >
                    <bdi>{PHONE_PREFIX}</bdi>
                  </span>
                  <Input
                    id={id}
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    value={draft.phone}
                    autoComplete="tel-national"
                    placeholder="5XX XX XX XX"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      /* A new number means a new code. */
                      setDraft((d) => ({ ...d, phone: value, code: "" }));
                      setError(undefined);
                    }}
                  />
                </div>
              )}
            </FieldShell>
          )}

          {step === "code" && (
            <>
              <DemoNotice title={t("register.code.demoTitle")} body={t("register.code.demoBody")} />
              <div>
                <p id="register-code-label" className="text-[0.9375rem] font-medium text-foreground">
                  {t("register.code.label", { phone: `${PHONE_PREFIX} ${draft.phone.replace(/\s+/g, "")}` })}
                </p>
                <div dir="ltr" className="mt-3 flex justify-start rtl:justify-end">
                  <InputOTP
                    maxLength={6}
                    value={draft.code}
                    onChange={(value) => {
                      setDraft((d) => ({ ...d, code: value.replace(/\D/g, "") }));
                      setError(undefined);
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-labelledby="register-code-label"
                    aria-describedby={error ? "register-code-error" : undefined}
                    onComplete={() => undefined}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p id="register-code-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Link
                  to={`${REGISTER_PATH}/phone${nextQuery(next)}`}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4"
                >
                  {t("register.code.changeNumber")}
                </Link>
              </div>
            </>
          )}

          {step === "photo" && (
            <PhotoField
              label={t("register.photo.label")}
              value={draft.photo || null}
              shape="circle"
              onChange={(photo) => setDraft((d) => ({ ...d, photo: photo ?? "" }))}
              placeholder={
                <span className="flex size-full items-center justify-center bg-brand-soft text-2xl font-semibold text-foreground">
                  {(draft.firstName.trim().charAt(0) || "·").toUpperCase()}
                </span>
              }
            />
          )}
          <SaveFeedback save={save} onRetry={submit} />
        </form>
      </FlowScreen>
    </>
  );
}

/* --------------------------------------------------------------- sign in */

/**
 * « Se connecter » (§2.2). With no server, there is one account Nidz can
 * open: the one kept in this browser. The screen names it and opens it —
 * after a confirmation, never silently — and says that no identity was
 * checked. With no account here, it says so and offers to open one: an
 * account made on another phone is not reachable from this one.
 */
export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sameOriginPath(params.get("next"));
  const { state, commit } = useDemo();
  const [failed, setFailed] = useState(false);

  if (hasSession(state)) return <Navigate to={next ?? afterSignInPath(state)} replace />;
  const account = state.account;

  const signIn = () => {
    const result = commit({ type: "signIn" });
    if (!result.ok) {
      setFailed(true);
      return;
    }
    navigate(next ?? afterSignInPath(result.state), { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("login.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo="/welcome"
        title={t("login.title")}
        topEnd={<LanguageSwitcher />}
        action={
          account ? (
            <Button type="button" size="lg" onClick={signIn}>
              {t("login.continueAs", { name: publicNameOf(account) })}
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to={`${REGISTER_PATH}${nextQuery(next)}`}>{t("welcome.createAccount")}</Link>
            </Button>
          )
        }
      >
        {account ? (
          <div className="surface flex items-center gap-4 p-4">
            {account.photoUrl ? (
              <img src={account.photoUrl} alt="" className="size-14 rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-xl font-semibold text-foreground">
                {account.firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                <bdi>
                  {account.firstName} {account.lastName}
                </bdi>
              </p>
              <p className="text-sm text-muted-foreground">
                {account.signInMethod ? t(`login.via.${account.signInMethod}`) : t("login.viaLocal")}
              </p>
            </div>
          </div>
        ) : (
          <div className="surface p-4">
            <p className="font-semibold text-foreground">{t("login.noneTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("login.noneBody")}</p>
          </div>
        )}
        {failed && (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {t("save.failedTitle")}
          </p>
        )}
        <DemoNotice className="mt-8" title={t("login.demoTitle")} body={t("login.demoBody")} />
      </FlowScreen>
    </>
  );
}
