import { createLucideIcon } from "lucide-react";

/* ---------------------------------------------------------------------------
   NIDZ CUSTOM ICONS (1.4)

   The few pictures Lucide does not carry, drawn in Lucide's own grammar: a
   24 × 24 grid, 2px round-capped strokes, no fills. Built with
   `createLucideIcon`, so each one IS a `LucideIcon` — it takes the same props,
   inherits `currentColor`, and drops into every `icon: LucideIcon` slot in the
   codebase without a second icon type.

   Rule: when Lucide has the picture, use Lucide. These exist only where it
   does not (a cage, a walk on a lead, a home with someone else's animal in it).
   ------------------------------------------------------------------------ */

/** Boarding: the animal stays in the sitter's home. A house with a heart. */
export const HomeHeart = createLucideIcon("HomeHeart", [
  ["path", { d: "M3 10.5 12 3l9 7.5", key: "roof" }],
  ["path", { d: "M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9", key: "walls" }],
  [
    "path",
    {
      d: "M12 17.5s-3.5-2-3.5-4.25A1.75 1.75 0 0 1 12 12.4a1.75 1.75 0 0 1 3.5.85c0 2.25-3.5 4.25-3.5 4.25Z",
      key: "heart",
    },
  ],
]);

/** A visit at the owner's home: the sitter comes with a key. */
export const HomeKey = createLucideIcon("HomeKey", [
  ["path", { d: "M3 10.5 12 3l9 7.5", key: "roof" }],
  ["path", { d: "M5 9v10a2 2 0 0 0 2 2h4", key: "walls-l" }],
  ["path", { d: "M19 9v3", key: "walls-r" }],
  ["circle", { cx: "15", cy: "17", r: "2.25", key: "bow" }],
  ["path", { d: "m16.6 18.6 3.9 3.9", key: "blade" }],
  ["path", { d: "m19.2 21.2 1.3-1.3", key: "bit" }],
]);

/** A walk: a lead with its handle loop and clip. */
export const Leash = createLucideIcon("Leash", [
  ["path", { d: "M6.5 3.5a3 3 0 1 1-.8 5.9", key: "loop" }],
  ["path", { d: "M5.7 9.4c1.8 3.4 4.6 6.4 9.3 8.6", key: "line" }],
  ["rect", { x: "14.5", y: "16.5", width: "4", height: "5", rx: "1.5", transform: "rotate(-30 16.5 19)", key: "clip" }],
  ["circle", { cx: "19.6", cy: "6.6", r: "1.6", key: "paw-a" }],
  ["circle", { cx: "17.4", cy: "10.2", r: "1.2", key: "paw-b" }],
]);

/** A bird cage: dome, ring and bars. */
export const BirdCage = createLucideIcon("BirdCage", [
  ["path", { d: "M12 2v2", key: "hook" }],
  ["path", { d: "M5 21V11a7 7 0 0 1 14 0v10", key: "dome" }],
  ["path", { d: "M3 21h18", key: "base" }],
  ["path", { d: "M9.5 21V8.5", key: "bar-l" }],
  ["path", { d: "M14.5 21V8.5", key: "bar-r" }],
  ["path", { d: "M5 15h14", key: "perch" }],
]);

/** A balcony: a door opening onto a railing. */
export const Balcony = createLucideIcon("Balcony", [
  ["path", { d: "M8 13V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8", key: "door" }],
  ["path", { d: "M3 13h18", key: "rail" }],
  ["path", { d: "M3 21h18", key: "floor" }],
  ["path", { d: "M5 13v8M9.5 13v8M14.5 13v8M19 13v8", key: "bars" }],
]);

/** Nidz's info mark: a small "!" in a circle, used only to open secondary
    explanations (design system amendment 0.1-F). Same picture as Lucide's
    CircleAlert, renamed so its job is legible at the call site. */
export const InfoMark = createLucideIcon("InfoMark", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "ring" }],
  ["path", { d: "M12 7.5v5.5", key: "bar" }],
  ["path", { d: "M12 16.5h.01", key: "dot" }],
]);
