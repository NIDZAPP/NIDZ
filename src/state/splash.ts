/**
 * "Has the wordmark been shown in this tab."
 *
 * `sessionStorage`, not the demo store: this is a per-tab question, while
 * `entered` means "has been through the introduction", which outlives the tab.
 *
 * It lives in its own module rather than on the entry screen because three
 * unrelated things need it — the entry screen that sets it, the reset in
 * Settings, and the error boundary's recovery — and importing a whole page
 * module to reach one string would pull that page into every chunk that
 * touches it, including the error boundary that wraps the entire app.
 */
export const SPLASH_KEY = "nidz.splash.seen";

/** Forget it, so a reset genuinely starts from the beginning. Safe in private
    mode, where storage access throws. */
export function clearSplash(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SPLASH_KEY);
  } catch {
    /* Nothing was stored, so there is nothing to forget. */
  }
}
