import { useCallback, useRef, useState } from "react";

import { nearestWilaya } from "@/data/algeria";

/* ---------------------------------------------------------------------------
   « À PROXIMITÉ DE MOI » (Nidz 1.7 §11.2) — the device position, used once.

   Asked only when the person presses the button (never on arrival, never
   because « nearby » was selected). The browser's answer is turned at once
   into the wilaya whose chef-lieu is nearest (`algeria/positions.ts`) and the
   coordinates are dropped: they are not stored, not put in an address, not
   sent anywhere. The wilaya is a SUGGESTION the person confirms — a border
   town can be nearer the next wilaya's chef-lieu than its own.

   Every outcome has its own state, and none is dressed up as success:
   unsupported (no API, or a page not served securely), denied, unavailable,
   too slow, outside the area Nidz covers.
   ------------------------------------------------------------------------ */

export type NearbyState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "found"; wilayaId: string }
  | { status: "denied" | "unavailable" | "timeout" | "unsupported" | "outside" };

export function useNearbyWilaya() {
  const [state, setState] = useState<NearbyState>({ status: "idle" });
  const asking = useRef(false);

  const locate = useCallback(() => {
    if (asking.current) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator) || !window.isSecureContext) {
      setState({ status: "unsupported" });
      return;
    }
    asking.current = true;
    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        asking.current = false;
        const wilayaId = nearestWilaya(position.coords.latitude, position.coords.longitude);
        setState(wilayaId ? { status: "found", wilayaId } : { status: "outside" });
      },
      (error) => {
        asking.current = false;
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable",
        });
      },
      /* Town-level is all that is used: no high accuracy, a recent fix is fine. */
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 10 * 60_000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, locate, reset };
}
