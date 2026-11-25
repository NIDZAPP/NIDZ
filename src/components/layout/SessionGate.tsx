import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { signedOutRedirect } from "@/data/navigation";
import { useDemo } from "@/state/demo/context";

/**
 * Signing out locks the account's screens (Nidz 1.7 §2, §24). Without this,
 * Back after « Se déconnecter » reopened the messages, the requests and
 * their Withdraw / Cancel buttons, and Compte. One gate around every route,
 * so no screen has to remember to check: a private address on a signed-out
 * device goes to « Se connecter », which returns to it.
 */
export default function SessionGate({ children }: { children: ReactNode }) {
  const { state } = useDemo();
  const { pathname, search } = useLocation();
  const redirect = signedOutRedirect(state, pathname, search);
  if (redirect) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}
