/**
 * A `next=` parameter, reduced to a path this app can safely navigate to.
 *
 * WHY NOT A PATTERN MATCH. The obvious guard —
 * `raw.startsWith("/") && !raw.startsWith("//")` — reads as sufficient and is
 * not. `/\evil.com` passes it, and the WHATWG URL parser treats a backslash as
 * an authority slash for special schemes, so the browser resolves it to
 * `http://evil.com/`. `/%09/evil.com` passes too: `URLSearchParams` decodes it
 * to a tab, which the parser strips from the input entirely before resolving.
 *
 * What happens next is worse than a redirect. React Router's `replace()` calls
 * `history.replaceState` with no try/catch, so a cross-origin value throws a
 * `SecurityError` out of the submit handler — *after* the account has already
 * been created. The button reads as dead and the state is half-applied. The
 * `push` path is the genuine open redirect: it catches the failure and falls
 * back to `window.location.assign`.
 *
 * So this parses with the same parser the browser will use, rather than trying
 * to out-guess it, and returns only same-origin paths. Nothing can disagree
 * with a check that uses the real implementation.
 */
export function sameOriginPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    /* `/.//example.org` resolves to a same-origin URL whose PATH is
       `//example.org` — which, handed to `history.replaceState`, is a
       protocol-relative URL to another host. React Router then throws a
       SecurityError out of the caller (or, on a push, falls back to a real
       navigation off-site). A path never legitimately starts with two
       slashes here. */
    if (url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    /* Not a URL this browser can make sense of, so not somewhere to send
       anyone. */
    return null;
  }
}
