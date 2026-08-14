# Nidz — the design system as built

This documents the system that **exists in the code**, not an aspiration. Every
pattern below has call sites; nothing here is proposed.

Two documents sit above this one and win when they disagree with it:

- `.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md` — product, UX and trust rules.
- `PRODUCT.md` — what Nidz is and what it may claim.

**Product truth outranks every visual decision in this file.**

---

## 1. The rule that shapes everything else

Nidz is a prototype with no backend. The interface may not imply a capability
that does not exist, and several of the visual choices below exist only because
of that:

- No photographs of sitters, because there are no real sitters. A monogram at
  card scale, never a portrait substitute. (The one exception is a photo the
  visitor adds to their *own* profile, which is genuinely theirs.)
- No badges. Trust provenance is a **byline** — a 14px Lucide icon and a 12px
  muted label — never a trophy.
- No rating, review, availability guarantee, distance, response time or
  completed-stay count anywhere in the model or the UI.
- Simulated behaviour is marked with a notice **at least as prominent as the
  thing it qualifies**, never a footnote.

---

## 2. Colour

All colours are HSL triplets on CSS variables in `src/index.css`, mapped to
semantic Tailwind classes in `tailwind.config.ts`. Components never carry a hex
value.

| Token | Value | Role as used |
|---|---|---|
| `background` | `#FFFFFF` | the page ground, everywhere |
| `card` | `#FFFFFF` | **the same colour as the ground.** An opaque surface that has to *cover* something — a dialog, a popover, or a control on a soft surface. Not a grouping device |
| `foreground` | `#18211F` | body and headings |
| `muted-foreground` | `#5B6864` | secondary text, labels, help |
| `primary` | `#0F766E` | **the dominant action, and selection. Nothing else.** |
| `primary-hover` | `#115E59` | hover/pressed on primary |
| `accent` | = `primary-soft` `#E7F3F1` | shadcn's hover / keyboard-highlight / selection surface, and the compatibility token on a result row |
| `brand` | `#A84F32` | terracotta. **Non-interactive only** |
| `brand-soft` | `#F7EAE4` | the one full-bleed editorial band |
| `secondary` | `#EAEFED` | neutral surface: secondary buttons, the phone prefix, and **the single hover surface** for rows and bordered controls |
| `muted` | `#F4F7F6` | 1.08:1 on white — too faint to carry an interaction. shadcn primitives only |
| `track` | `#B6C2BE` | filled-control tracks (progress) |
| `border` | `#DCE3E0` | decorative separation — **never** the only indicator of a control |
| `input` | `#7C8B86` | the functional control boundary, 3.41:1 on background |
| `success` / `warning` / `destructive` / `info` | — | status only |

**Two things are called "accent".** CSS `--accent` is shadcn's neutral
highlight surface, used by 13 primitives. The design system's terracotta lives
on `--brand`. They are not interchangeable, and the comment block at the top of
`src/index.css` explains why: terracotta and teal have nearly identical
luminance, so terracotta on a control reads as important as the primary CTA.

**Terracotta discipline, and why it now matters more.** Audit 1.2 removed the
cream ground *and* retuned `--secondary` / `--muted` out of the warm beige ramp
into the same cool green-grey family as `--border`. That leaves `--brand` and
`--brand-soft` carrying the entire warm half of the brand, so their placement is
a decision rather than decoration. They appear in exactly three places: the
`PawPrint` mark, the entry masthead band (and the splash that settles into it),
and the identity monogram on a sitter card and profile — the warm surface goes
on the *person*, which is also the one place in the product with no photograph
to carry them. Never a button, link, hover or selected state.

**No white card on a white ground.** When something feels like it needs a
container, the answer is almost always a heading and space. Structure comes from
spacing → typography → a hairline register → a soft *semantic* surface →
elevation, in that order. `shadow-chrome-b` / `shadow-chrome-t` exist for the
six sticky planes, which are the only genuinely elevated static things in the
product; there is no card shadow.

**Red is danger only.** "Refuser" is a normal, legitimate outcome — a sitter
declining an animal their home does not suit is the matching working — so it is
an outline button, not a destructive one. `StatusBadge` gives `declined` the
neutral surface for the same reason.

**Colour is never the only carrier.** Selected chips show a check glyph;
compatibility tokens carry a `Check` and an `sr-only` prefix; the active nav tab
carries a top rule, a heavier label and `aria-current`; errors carry text.

---

## 3. Typography

**One family.** `Inter` carries the entire interface, and nothing else is
loaded. Audit 1.2 withdrew `Playfair Display` (design system amendment 0.0-B):
hierarchy comes from size, weight, spacing and layout, never from mixing
families.

It had already stopped being real before it was removed. `index.html` never
requested the font, so `font-display` resolved to an arbitrary system serif; and
it could not have been used honestly in any case, because Playfair has no Arabic
face — a role it carried would have been monolingual by construction in a
trilingual product. `Noto Sans Arabic` sits behind Inter in the stack to carry
Arabic; Latin text never reaches it.

Scale, defined in `tailwind.config.ts`:

| Token | Size | Used for |
|---|---|---|
| `text-h1` / `text-h1-lg` | 2rem / 2.5rem | one page title per screen |
| `text-name` | 1.25rem | sitter names, section headings, empty-state titles |
| `text-price` | 1.5rem | **one** quoted rate per context — the register's price axis, the profile's pinned bar |
| `text-lg` | 1.125rem | the lede paragraph under a title |
| `text-base` | 1rem | body |
| `text-sm` | 0.875rem | help, metadata, notices |
| `.eyebrow` | 0.75rem | the section eyebrow, defined once in `index.css` |

`.eyebrow` drops `uppercase` and letter-spacing under `[dir="rtl"]`: uppercase
is a no-op in Arabic and letter-spacing breaks cursive joining.

A price list on a profile stays at `text-base font-semibold tabular-nums`.
Three 24px numerals stacked is what makes a page look like a SaaS pricing table;
`text-price` is reserved for the single number that matters.

---

## 4. Space, shape and elevation

Spacing follows 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Sections separate at
`space-y-10 md:space-y-14`; field groups at `space-y-5` to `space-y-8`.

Radius: `sm` 8 · `md` 12 · `lg` 16 · `xl` 24. `rounded-2xl` and `rounded-3xl`
are not part of the scale. Fully round pills are only for things with pill
logic — chips and status badges.

**The order of preference is space → surface → border → shadow.** In practice
this means the app has almost no shadows and few cards:

- **Registers, not card grids.** `/search` results, the sitter's incoming
  requests and "Mes demandes" are lists separated by hairlines on the page
  ground. A bordered, elevated card spends four devices at once on a
  low-importance element.
- **Ruled notices, not filled panels.** `DemoNotice` is `border-y` — horizontal
  rules read as editorial apparatus, so the honesty layer keeps positional
  weight without competing chromatically with the primary action.
- Shadows appear only where something is genuinely floating: popovers, dialogs,
  the filter sheet.

---

## 5. Layout

Container gutters: 16 mobile · 24 tablet · 32 desktop.

Measures actually used:

| Context | Width |
|---|---|
| flow step (a form) | `max-w-[560px]` |
| flow step (a summary) | `max-w-[720px]` |
| browsable single column | `max-w-[640px]` / `max-w-[720px]` |
| results and profile | `max-w-[1120px]` |
| prose inside those | `max-w-[64ch]` |

Desktop earns its width by adding an **axis**, not by getting wider:

- `/search` at `xl` becomes `[264px_minmax(0,1fr)]` — a sticky brief rail
  against the results register. Below `xl` the same brief condenses into one
  sticky line above the list. Exactly one of the two is displayed.
- `/sitters/:id` at `xl` becomes `[minmax(0,1fr)_320px]` — content against a
  sticky rail carrying the quoted rate and the action. Below `xl` the rail's
  content moves inline and the action becomes a pinned bar.

In both cases the rule sits on the **inline-start edge of the trailing
element**, not the trailing edge of the leading one: a sticky rail is short, so
a rule on it would stop a third of the way down the page.

The complementary rail is rendered **after** the main column in the DOM and
pulled back with `xl:col-start-1`, so the page's `<h1>` precedes the rail's
`<h2>`.

---

## 6. Components with fixed meaning

| Component | File | Rule |
|---|---|---|
| `FlowScreen` | `components/shared/` | the shell every wizard step uses. Slim top bar, question, fields, one dominant action pinned at the bottom. Manages scroll and focus on every step change. |
| `Chip` / `ChipGroup` | `components/shared/Chip.tsx` | compact selection. `Chip` is multi-select (`role="checkbox"`), `ChipGroup` single (Radix radio). Reserved glyph slot so toggling never reflows the row under a finger. |
| `OptionGroup` | `components/shared/` | single choice as full-width rows, for a question that is the whole screen or carries descriptions. |
| `ProvenanceLabel` | `components/shared/trust.tsx` | the trust byline. Four categories exist in the vocabulary; only `declared` has a mechanism, and rendering another throws in dev. |
| `DemoNotice` / `DemoLine` | `components/shared/trust.tsx` | the honesty layer, at two densities. |
| `StatusBadge` | `components/shared/` | request status. Icon + colour, never colour alone. |
| `EmptyState` | `components/shared/` | says what is missing, what to do, and does not look like an error. No illustration, no icon-in-a-circle. |
| `SitterProfileView` | `components/sitter/` | **one** public profile, rendered by the owner's page and the sitter's own preview. Owns no layout chrome, so both callers supply their own. |
| `RequestSummary` | `components/request/` | one summary, rendered by the pre-send review, the success screen, the owner's detail and the sitter's inbox. |

---

## 7. Result rows and profiles

A result row answers "is this worth opening", not "who is this" (§19). It
carries: monogram, species eyebrow, name, commune, one-line headline, the
compatibility facts that **distinguish it from the other results**, a provenance
byline, one price on its own axis, and one action.

Reasons true of *every* result are hoisted into a single line above the list.
With hard-constraint matching they are true by construction, so repeating them
per row is three lines of tokens that discriminate nothing.

Absence-derived reasons ("has not declared these dates unavailable", "no cat
declared at home") are rendered as **plain text, one register down** from facts
a sitter actively declared. Both are equally true of someone who never answered
the question, and a tick would turn silence into a confirmation.

The profile is six sections in three registers — a lede (identity, why this
fits), narrative (about, how the animals are kept), and facts (in practice, what
I cannot accept, declared unavailability). The audit's nine-item content list as
nine headings would be the grey stack §20 warns against.

"Ce que je ne peux pas accepter" sits next to what the sitter *does* accept, is
full-strength text, and carries no warning colour: read as a pair, the second is
the completion of the first.

---

## 8. Actions

One visually dominant action per decision context. `size="lg"` for a step's or
a page's primary; `default` (h-11) elsewhere; `sm` never for a primary.

In `FlowScreen`'s action bar the DOM order is primary-then-secondary, reversed
visually on mobile so the dominant action is closest to the thumb, and the
action is full-width below `sm` and intrinsic above it — enforced by the shell,
not asked of each screen.

Labels describe the result: "Envoyer ma demande", "Voir les pet-sitters",
"Demander une garde". Never "Réserver" (nothing is reserved), never "Payer"
(there is no payment), never "OK".

Touch targets are ~44px minimum. `min-h-12` on chips, `h-11` on buttons and
inputs, `min-h-14` on nav tabs, `min-h-16` on option rows.

---

## 9. Navigation

One bottom bar below `md`, not one per role: a single person may have both uses
(§22). Destinations are Accueil, Recherche, Demandes, plus Reçues once a sitter
profile is **published**. The header carries the same destinations with the same
labels at `md`+ — crossing the breakpoint must not rename anything.

**Only destinations that exist appear.** Messages, Mes animaux, Disponibilités
and Compte are in the audit's lists and are not in the product, so they are not
in the navigation.

Back appears on secondary screens only, never on a root screen, and is
`inline-start` — top-right in Arabic. `useFlowBack` pops history only when this
app put something behind us, otherwise it walks to the step that logically
precedes; a deep-linked step's back control is never inert.

---

## 10. Motion

Micro-feedback 100–150ms · standard 160–220ms · dialog and sheet 200–300ms.
`prefers-reduced-motion` is honoured globally with `animation-duration: 0.01ms`
rather than `animation: none`, so Radix still receives `animationend` and exit
transitions do not strand elements in the DOM.

Nothing animates for decoration, and nothing delays an action. The entry
wordmark is an overlay with `pointer-events-none` over an introduction that is
already interactive.

---

## 11. Accessibility expectations

- Every field has a visible label. `FieldShell` returns its ARIA wiring to the
  caller, because only the control can point at the help and error text.
- Radix `combobox` triggers are named with `aria-labelledby`, never a second
  `<label for>`.
- Validation moves focus to the first offending control and announces the error
  with `role="alert"`. A pinned action bar means an unfocused error can be
  entirely off-screen.
- Visually hidden file inputs are `tabIndex={-1}`: the visible button is the
  control, and a second invisible stop for one action is a trap.
- Sticky layers reserve scroll padding through `has-*` hooks in `index.css`,
  each scoped to the breakpoint its layer actually exists at (WCAG 2.4.11).
- Landmarks are distinctly named. Exactly one navigation is displayed at any
  width.

---

## 12. RTL

Arabic sets `dir="rtl"` on `<html>`. The codebase uses **one** mechanism:
Tailwind's `rtl:` variant and `[dir="rtl"]` selectors, plus logical properties
(`ms-`, `pe-`, `border-s`).

Specifics that matter:

- Latin strings inside Arabic text are wrapped in `<bdi>` — without it
  "Youcef H." renders as ".Youcef H", the trailing period being neutral.
- Phone fields are `dir="ltr"`: a number is a left-to-right run, and the country
  prefix would otherwise be placed after the digits.
- Interpolated phone numbers carry bidi isolates for the same reason.
- Arabic uses its own comma in composed place names.
- Back arrows are mirrored with `rtl:-scale-x-100`.
- Plurals use i18next categories. Arabic has six; `{{count}} طلب` for every
  number is wrong.

---

## 13. What is deliberately absent

Recorded so nobody adds them back by reflex: dark mode (the `.dark` block in
`index.css` is stale legacy, never applied), gradients, decorative shadows,
hover zoom, glassmorphism, emoji as an icon system, badge cascades, match
percentages, star ratings, review counts, "verified" anything, availability
guarantees, payment, insurance, online status, and any count of users, stays or
sitters.
