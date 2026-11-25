/* ---------------------------------------------------------------------------
   SIGN-IN PROVIDERS — the boundary, and nothing behind it.

   Audit 1.2 asks for a gateway offering Google, Microsoft and phone. It also
   forbids, in the same breath, faking any of them: no silently-created "Google
   verified account", no invented external token, no claim that a provider
   authenticated anybody, and no SMS that was never sent (§14, §91, §92).

   Those two requirements are only compatible one way. This module declares the
   providers Nidz intends to support and states, per provider, that the
   integration is NOT configured. The gateway renders them from this list, so
   there is exactly one place where a provider could ever be marked available —
   and marking one available without wiring it is then a visible, deliberate
   lie rather than an accident of drift.

   WHAT DOES NOT EXIST HERE, AND MUST NOT BE ADDED WITHOUT THE REAL THING:
     - OAuth clients, redirect handling, PKCE, tokens, refresh, sessions
     - an OTP sender, an OTP store, or a code anyone could verify
     - any notion of a user proven to be who they say they are

   The one thing that does work is the local demo identity: a name typed into
   this browser. It is not authentication and no screen may present it as any.
   ------------------------------------------------------------------------ */

/* Nidz 1.7 §3: Google, Apple and a phone number. Microsoft (Audit 1.2) is no
   longer offered. */
export type AuthProviderId = "google" | "apple" | "phone";

/**
 * Why a provider cannot be used.
 *
 * A string rather than a boolean so the interface can say something true and
 * specific instead of "unavailable", which reads as a temporary outage.
 */
export type AuthUnavailableReason = "notConfigured";

export type AuthProviderDescriptor = {
  id: AuthProviderId;
  /** i18n key for the button label, e.g. "Continue with Google". */
  labelKey: string;
  /**
   * Availability is a constant, not a runtime check, and that is the point:
   * there is no configuration that could make it true, because there is no
   * integration to configure. When one is built, this becomes a real check
   * against real configuration — and the gateway needs no change.
   */
  available: false;
  reason: AuthUnavailableReason;
};

export const AUTH_PROVIDERS: readonly AuthProviderDescriptor[] = [
  { id: "google", labelKey: "register.method.google", available: false, reason: "notConfigured" },
  { id: "apple", labelKey: "register.method.apple", available: false, reason: "notConfigured" },
  { id: "phone", labelKey: "register.method.phone", available: false, reason: "notConfigured" },
];

/**
 * Nidz 1.7: the three ways of opening an account are shown as the JOURNEYS
 * they will be — the screens, in order — and each is walked through with a
 * prototype notice at full weight wherever the real thing would contact a
 * provider. Nothing here is skipped silently and nothing is claimed:
 *
 *   google / apple  the name a provider would return is typed by the person
 *                   (« Google n'a pas été contacté ») — then the phone and
 *                   the code, like every account;
 *   phone           the code step says no SMS was sent and accepts any six
 *                   digits; the number is recorded as NOT verified.
 *
 * `available` stays `false` for all three: that is the fact the screens read.
 */
export const REGISTER_STEPS: Record<AuthProviderId, readonly RegisterStep[]> = {
  google: ["name", "phone", "code", "photo"],
  apple: ["name", "phone", "code", "photo"],
  phone: ["phone", "code", "name", "photo"],
};

export type RegisterStep = "name" | "phone" | "code" | "photo";
export const REGISTER_STEP_IDS: readonly RegisterStep[] = ["name", "phone", "code", "photo"];

export function isProviderId(value: unknown): value is AuthProviderId {
  return value === "google" || value === "apple" || value === "phone";
}

/** True when at least one provider could actually sign someone in. Today this
    is `false`, and the gateway uses it to decide whether the provider list is
    a choice or a statement of intent. */
export function hasWorkingProvider(): boolean {
  return AUTH_PROVIDERS.some((p) => p.available);
}

/**
 * The state a real phone sign-in would move through, written down now so that
 * whoever builds it does not have to re-derive it — and so that nothing in the
 * meantime quietly implements a subset and calls the result "verified".
 *
 * Not exported into any screen: there is no phone verification, so there is no
 * state to render. `verified` must never be reachable from a hardcoded code.
 */
export type FuturePhoneVerificationState =
  | "phone_entered"
  | "otp_requested"
  | "otp_pending"
  | "verified"
  | "failed"
  | "expired";
