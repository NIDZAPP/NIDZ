/**
 * The hairline register row.
 *
 * Nidz's one pattern for a list of navigable things: a rule between siblings
 * rather than a box around each of them. Bordered boxes read as controls —
 * that is `OptionGroup`'s silhouette — and a page of them looks like a
 * dashboard stub. On the white ground of Audit 1.2 this carries more of the
 * layout than it used to, because a white block no longer groups anything by
 * itself (see the note at the top of `src/index.css`).
 *
 * Defined once because it was defined twice, identically, in two screens that
 * both described it as "like every other list of navigable things in the app".
 *
 * `hover:bg-secondary`, not `hover:bg-muted`: `--muted` is 1.08:1 on white and
 * is a shadcn-primitive-only surface. One hover surface, one meaning.
 */
export const REGISTER_ROW =
  "flex items-center justify-between gap-4 border-b border-border py-4 transition-colors first:border-t hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
