import { createContext } from "react";

/**
 * The top bar's geometry, shared by every screen that has one (Nidz 1.4
 * corrections, "Bouton retour — règle globale").
 *
 * Three shells draw a top bar — the browsable `Header`, the flow shell
 * `FlowScreen`, and the full-screen conversation `MessageThread` — and the
 * back control sits at the inline start of each. When the three bars had
 * different heights (56px, 64px, 64px), the same button sat 4px lower on a
 * flow step than on a profile, and appeared to jump between screens. One
 * height, one container, one sticky layer: the back button is in the same
 * place everywhere, and stays there while the page scrolls under the bar
 * instead of over it.
 */
/* Opaque on purpose. The 1.4 bar was 85% mist over a blur, and on a long
   profile the cards scrolling under it showed through around the back button —
   read as text colliding with the control. The bar is the same mist as the
   page, so at rest nothing changes; in motion the content simply passes
   under its edge. */
export const TOP_BAR = "sticky top-0 z-40 w-full bg-background";

/** The row inside the bar: 56px on phones, 72px from md. */
export const TOP_BAR_ROW = "container flex h-14 items-center gap-3 md:h-[4.5rem]";

/**
 * Where a browsable screen's back control goes: an element at the inline
 * start of the sticky `Header`, provided by `Layout`. `BackButton` portals into
 * it when it exists, so a screen inside the browsable shell writes
 * `<BackButton fallback=… />` wherever it likes and the control still lands in
 * the bar — visible while the page scrolls, never on top of the content.
 * Outside the shell (flow steps, a conversation) there is no slot and the
 * control renders where it is written, which is their own bar.
 */
export const BackSlotContext = createContext<HTMLElement | null>(null);
