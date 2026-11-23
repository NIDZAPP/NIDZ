/**
 * The grouped list — Nidz 1.4's one pattern for a list of navigable things.
 *
 * Rows live INSIDE one white card (`LIST_GROUP`), separated by inner hairlines,
 * like a settings list on a phone: the card says "these belong together", the
 * hairline says "these are separate". A row is never a card of its own here —
 * that silhouette belongs to choices (`OptionGroup`) and to results.
 *
 * Hover is the neutral `secondary` tint: one hover surface, one meaning.
 */
export const LIST_GROUP = "surface overflow-hidden divide-y divide-border";

export const REGISTER_ROW =
  "flex min-h-16 w-full items-center justify-between gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/** The round icon tile at the start of a row. */
export const ROW_ICON = "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary";
