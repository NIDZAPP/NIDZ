import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SITTER_DASHBOARD, cameFromDashboard } from "@/data/sitter-sections";

/**
 * Leave a sitter section editor for "Mon profil".
 *
 * Opened from the dashboard (the usual case), the editor pops history, so the
 * stack stays `… → Mon profil` and Back from there goes where it went before
 * the edit. Opened any other way — a deep link, the first pass of the join
 * flow — it replaces itself with the dashboard instead of stacking one.
 */
export function useReturnToDashboard(): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (cameFromDashboard(location.state) && idx > 0) navigate(-1);
    else navigate(SITTER_DASHBOARD, { replace: true });
  }, [navigate, location.state]);
}
