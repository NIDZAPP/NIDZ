import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { clearStoredState } from "@/state/demo/reducer";

/**
 * The last resort.
 *
 * `useDemo()` throws by design when a screen is mounted outside the provider,
 * `ProvenanceLabel` throws in development when a trust category with no
 * mechanism is rendered, and `localStorage` is user-writable input that
 * validation narrows but cannot make impossible. All three are deliberate
 * crash paths, and until now nothing caught them — a hand-edited storage key
 * could take the whole page to blank.
 *
 * The recovery offered is the honest one: clear what this browser is holding
 * and start again. There is no server state to reconcile with.
 *
 * Deliberately not translated. It renders when React has already failed, and
 * reading i18n here would risk failing for the same reason.
 */
type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Nidz crashed:", error, info.componentStack);
  }

  /* The keys come from the modules that own them, never as literals here.
     They were literals, and Audit 1.2 moved the demo record from
     `nidz.demo.v1` to `nidz.demo` — which left this button clearing a key
     nothing uses any more. It would then reload, re-read the same poisoned
     record and crash again, while the copy above promised otherwise. A
     recovery control that does not recover is worse than no control. */
  private reset = () => {
    clearStoredState();
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="container flex min-h-dvh items-center py-10">
        <div className="mx-auto max-w-[560px]">
          <h1 className="text-h1 font-semibold text-foreground">Something went wrong</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            This demonstration keeps everything in your browser, so nothing was lost anywhere else.
            Clearing what it is holding should get you moving again.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Clear and restart
          </button>
        </div>
      </div>
    );
  }
}
