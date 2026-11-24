/* Text actions, defined once (Nidz 1.4).

   ACTION_LINK — a standalone text action ("Voir toute la liste", "Modifier
   Rex"): teal, semibold, a soft pill on hover, 44px tall. It stands on its
   own line, so it needs no underline: its position and weight say "action".

   INLINE_LINK — a link INSIDE a sentence. Teal against body text is only
   2.97:1, so colour alone cannot mark it (WCAG 1.4.1): it is underlined at
   rest (colour review, 1.4). */
const ACTION_LINK_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-primary transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Starts a line: the soft pill's padding hangs into the start margin. */
export const ACTION_LINK = `-ms-2 ${ACTION_LINK_BASE}`;

/** Ends a heading row ("Voir tout →"): the padding hangs into the end margin. */
export const ACTION_LINK_END = `-me-2 shrink-0 ${ACTION_LINK_BASE}`;

export const INLINE_LINK =
  "font-medium text-primary underline underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
