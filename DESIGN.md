---
name: Nidz
description: Pet-sitting marketplace for Algeria, mobile-first, in French, Arabic and English. The animal is the unit of every screen.
colors:
  mist: "#EDF2F0"
  ink: "#18211F"
  card: "#FFFFFF"
  primary: "#0F766E"
  primary-foreground: "#FFFFFF"
  primary-hover: "#115E59"
  primary-soft: "#DFF1EE"
  primary-deep: "#0B4B46"
  primary-on-deep: "#CDE4E0"
  secondary: "#E4ECE9"
  secondary-hover: "#D6E0DC"
  muted: "#F3F7F5"
  muted-foreground: "#54635F"
  track: "#B6C2BE"
  brand: "#A84F32"
  brand-soft: "#F7EAE4"
  sand: "#F5E7D6"
  sky: "#E2EFF8"
  success: "#166534"
  warning: "#9A5700"
  destructive: "#B91C1C"
  info: "#1D4ED8"
  border: "#DCE5E1"
  input: "#7C8B86"
  shadow-ink: "#0F2420"
typography:
  display:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  display-lg:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.025em"
  headline-lg:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  price:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  name:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Readex Pro Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  2xl: "28px"
  3xl: "36px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  gutter-lg: "32px"
  card-pad: "16px"
  card-pad-lg: "20px"
  stack: "10px"
  grid: "12px"
  section: "32px"
  touch-min: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-surface-hover:
    backgroundColor: "{colors.secondary}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-lg:
    rounded: "{rounded.full}"
    padding: "10px 24px"
    height: "52px"
  button-sm:
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-pad}"
  hero:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.card}"
    rounded: "{rounded.3xl}"
  brief-capsule:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "6px"
  tab-bar:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.full}"
    padding: "6px"
  tab-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  status-pending:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "28px"
  status-declined:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    height: "28px"
  message-mine:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "10px 16px"
  message-theirs:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "10px 16px"
---

# Design System: Nidz

This documents the 1.4 system that **exists in the code**, not an aspiration.
Every token and pattern below has call sites; nothing here is proposed. The
technical source is `src/index.css` (the `:root` block and the component layer)
and `tailwind.config.ts` (`theme.extend`).

Two documents sit above this one and win when they disagree with it:

- `.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md`, amendment §0.1 and its
  implemented decisions §0.1-A to §0.1-G: product, UX, trust and the 1.4 visual
  decisions.
- `PRODUCT.md`: what Nidz is and what it may claim.

**Product truth outranks every visual decision in this file.** This file
replaces the 1.3 description (white ground, Inter, hairline registers). That
world is retired; do not restore it from history.

## Overview

**Creative North Star: "The Brief Over the Terrain"**

The animal is the unit of everything. The owner's question (which animal, what
care, when, where) rides above every list as one floating white capsule, and
everything under it is an answer to what the capsule says. Each answer, each
decision, each fact is one soft white card on a mist ground: a cool green-grey
drawn from the brand teal, not the cream the 1.2 audit removed. Warmth comes
from the content, the animals and the people, never from a beige page.

Colour does exactly two jobs. Deep teal is the only thing you can press, and it
is always a pill. Terracotta, its soft tint, sand and sky belong to animals and
people: illustration tiles, monograms, the brand paw. The type is one family,
Readex Pro, drawn for Latin and Arabic together, set semibold with tight
tracking for display roles. Depth is one soft, ink-tinted shadow from a single
light source; only things that genuinely float (the capsule, the tab bar,
popovers, sheets) get the raised shadow.

**The rule that shapes everything else is honesty.** Nidz is a prototype with no
backend, and the interface may not imply a capability that does not exist.
Several visual choices exist only because of that: there are no trust badges,
star ratings, "verified" marks, response-time chips or online dots, because
`SitterProfile` carries no such field. Every claim about a sitter wears a
provenance byline (`ProvenanceLabel`, `src/components/shared/trust.tsx`), a
14px Lucide icon plus a 12px muted label, and only the "declared" category may
render; the others throw in development. Simulated behaviour carries a
`DemoNotice` card at the same weight as the content it qualifies, never a
footnote. Messages show when a note was written on this device and never
"sent", "delivered", "read" or "seen".

**Key Characteristics:**
- Mist ground, white cards (22px radius) under one soft ink-tinted shadow; never a card inside a card.
- Teal `#0F766E` is the only action colour and every action is a pill.
- Terracotta, sand and sky are non-interactive: animals and people only.
- Readex Pro Variable for Latin and Arabic, self-hosted, semibold display with negative tracking.
- The brief capsule floats above results, the sitter profile and the request review.
- Lucide 2px icons first; a handful of custom icons in Lucide's grammar; flat authored animal illustrations.
- Provenance bylines instead of badges; demo notices at full weight; no read receipts.

## Colors

A cool, quiet ground with one saturated action colour and warm tints reserved
for living things. All values are HSL triplets in `src/index.css`; hex values
here are the ones recorded in its comments. Contrasts below are the measured
values recorded there and in §0.1-A.

### Primary
- **Signature Teal** (`primary`): the one action colour. Filled pills, the
  radio and check fills, the active-tab label, focus rings (`--ring`), the
  caret, the unread badge. 5.5:1 on white, 4.9:1 on mist.
- **Pressed Teal** (`primary-hover`): hover and pressed state of the teal pill.
- **Selected Tint** (`primary-soft`): the selected state (chosen chip, active
  tab capsule, segmented-nav current item, menu highlight via `--accent`), my
  message bubble, and the round icon tile at the start of an interface row
  (`ROW_ICON`). Teal text on it 4.7:1.
- **Deep Teal Field** (`primary-deep`) with **On-Deep Text** (`primary-on-deep`):
  the home hero panel only. Non-interactive: teal on it is 1.8:1, so nothing
  pressable sits on it. White on it 10:1; on-deep secondary text 7.5:1.

### Secondary (warmth, non-interactive)
- **Warm Terracotta** (`brand`): the brand paw and the monogram letter of a
  person. 4.6:1 on its soft tint.
- **Terracotta Tint** (`brand-soft`): monogram tiles (sitter card, profile,
  message lists) and the cat tile.
- **Sand** (`sand`): the dog tile, and the "en attente" (pending) request
  status, always with the clock icon.
- **Sky** (`sky`): the bird tile, kept visibly apart from the selected tint.
  On all three tiles text is at least 13.5:1 and the teal selection ring at
  least 4.6:1.

### Neutral
- **Mist** (`mist`, `--background`): the ground of every screen, the header and
  the pinned action bars. Ink 14.5:1, secondary text 5.6:1, teal 4.9:1.
- **Ink** (`ink`, `--foreground`): dark green slate for all primary text and
  the line work in the illustrations.
- **Card White** (`card`, also `--popover`): the default container.
- **Quiet Fill** (`secondary` / `secondary-hover`): secondary pills, the one
  neutral hover surface, demo-notice icon tiles, the declined status.
- **Muted** (`muted`): an inset tile inside a card (the request's animal
  facts) and the other person's message bubble.
- **Secondary Text** (`muted-foreground`): 6.3:1 on white, 5.6:1 on mist.
- **Hairline** (`border`): decorative separation inside a card (grouped-list
  dividers, the price rule on a sitter card). Never the only edge of a control.
- **Control Edge** (`input`): the functional boundary of inputs, unselected
  chips and empty radios. 3.5:1 on white, 3.1:1 on mist (WCAG 1.4.11).
- **Track** (`track`): progress, slider and switch-off tracks. 1.8:1 on white,
  3:1 against the teal fill.
- **Shadow Ink** (`shadow-ink`, `--shadow`): the tint of every shadow. Shadows
  are the ink at low alpha, never black.

### Status
`success`, `warning`, `destructive` and `info` each pair with white text at
5.6:1 or better. Destructive red is for danger, error and destruction only; a
declined request is a normal outcome and uses the neutral fill.

### Named Rules
**The One Action Colour Rule.** Teal is the only colour that means "press
this", and it is always a pill. `primary-deep` shares the hue but is never
pressable.

**The Living Things Rule.** Terracotta, `brand-soft`, sand and sky carry
animals and people. They never carry a state (hover, focus, selection, error)
and never fill an action button. Two exceptions, both recorded in §0.1-A: the
**resting** fill of an illustrated animal-category card, whose selection is
carried by the 2.5px teal ring and the check badge; and sand on the pending
status, always beside its clock.

**The Teal Tile Rule.** An interface icon tile (housing, rates, limits, account
rows, empty states) is `primary-soft` with a teal glyph, or `secondary` with an
ink glyph. Never terracotta.

**The Two Accents Rule.** CSS `--accent` is shadcn's neutral highlight surface
(aliased to `primary-soft`); the warm brand colour lives on `--brand`. Never put
terracotta in `--accent`.

**The Unsent Is Uncoloured Rule.** A request in preparation never wears a status
colour. Nothing has a status until a request exists.

**The Art Constants Rule.** Fur, beak and feather colours are artwork
constants in `src/components/illustrations/animals.tsx`, not tokens. Where a
token exists (ink, the teal collar) the artwork uses it.

## Typography

**Display Font:** Readex Pro Variable (with `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Readex Pro Variable, the same family

**Character:** One wide, friendly geometric face drawn for Latin and Arabic
together, so both scripts share weight, x-height and rhythm. Self-hosted through
`@fontsource-variable/readex-pro` (imported in `src/main.tsx`, axis 160 to 700,
OFL): no request to a third-party font host, and the PWA has it offline. It
replaces Inter plus a Noto Sans Arabic fallback. Sizes sit a step below where
Inter's were because the face is wide.

### Hierarchy
- **Display** (600, 34px, 1.08, -0.03em; `display-lg` 52px, 1.04, -0.035em from
  md): the home hero title. On phones the hero clamps between 28px and 34px.
- **Headline** (600, 28px, 1.14, -0.025em; `h1-lg` 36px from md): the one `h1`
  of a screen, including every flow step.
- **Title** (600, 20px, 1.25, -0.015em): section headings and empty-state titles.
- **Price** (600, 22px, 1.2, -0.02em, tabular figures): the rate on a sitter
  card and the pinned profile bar, always with its unit underneath.
- **Name** (600, 18px, 1.3, -0.01em): a person's or an animal's name.
- **Body** (400, 16px, 1.625): descriptions and profile prose, held to 56 to 70ch.
- **Label** (600 when selected or primary, 400 to 500 otherwise, 15px): the
  workhorse size for chip labels, option rows, capsule titles, message text and
  request facts.
- **Caption** (400, 12px): provenance bylines, units, fact labels. 11px only for
  tab-bar labels and count badges.
- Placeholders are light (300) and muted.

### Named Rules
**The One Family Rule.** Readex Pro for everything, both scripts. No display
serif, no system display face, no Google Fonts request.

**The Script-Safe Rule.** No uppercase and no letter-spacing on running labels:
uppercase is a no-op in Arabic and tracking breaks cursive joining. Negative
tracking is a display-role property only.

**The Figures Rule.** Readex Pro's figures are proportional; prices and dates in
lists ask for `tabular-nums` at the call site.

## Layout

Mobile-first, a single column at 390px, with content measures rather than a
grid system.

- **Gutters** (the Tailwind `container`): 16px, 24px from `sm`, 32px from `lg`,
  capped at 1400px.
- **Measures:** flow steps 560px (720px when `wide`); forms, the brief capsule,
  results lists, the sitter profile's reading column and pinned bar 720px;
  message threads and their composer 640px; home 1080px; results and profile
  frames 1120px.
- **Rhythm:** 10px between stacked cards and option rows, 12px in card grids,
  32 to 40px between home sections, 16 to 20px inside a card (28px on the
  profile from md).
- **Top bar:** sticky, 56px tall (72px from md), on the opaque mist ground —
  one geometry (`TOP_BAR` / `TOP_BAR_ROW`, `src/components/shared/top-bar.ts`)
  shared by the browsable header, every flow step and a conversation, so the
  back button sits at the same point on all of them. No rule, no fill: the
  first card below it is the first object on the page. Opaque rather than the
  former 85% + blur, because scrolled cards showing through read as text
  colliding with the back button.
- **Pinned layers:** flow action bars and the message composer sit on mist
  with the upward `chrome-t` shadow. The sitter profile's price-and-action bar
  is a white raised pill below xl, sitting above the tab bar. Every pinned
  layer reserves scroll padding on `<html>` (`has-pinned-action`,
  `has-bottom-nav`, `has-pinned-action-sm`) so focused controls are never
  hidden (WCAG 2.4.11).
- **Home first viewport:** the deep-teal hero card, then two stacked full-width
  large pills, "Trouver une garde" (teal) and "Devenir pet-sitter" (white
  surface), both above the fold at 390×844. Under 640px of height the
  illustration steps aside so both pills stay in the first screen.

## Elevation & Depth

Layered and soft. One light source, above and slightly in front: every shadow
has a y offset and a wide blur, tinted from the ink. Resting containers carry
`card`; white controls on the ground carry `pill`; only what genuinely floats
carries `raised`. Structure is reached in this order: spacing and grouping,
typography, a white card on the mist ground, a soft tile inside a card, real
elevation.

### Shadow Vocabulary
- **Card** (`0 1px 2px hsl(var(--shadow) / 0.05), 0 8px 24px -6px hsl(var(--shadow) / 0.08)`): every resting `.surface` and the hero.
- **Pill** (`0 1px 2px hsl(var(--shadow) / 0.06), 0 4px 12px -3px hsl(var(--shadow) / 0.10)`): white and teal pills on the ground, header icon buttons, the segmented nav.
- **Raised** (`0 2px 6px hsl(var(--shadow) / 0.06), 0 18px 40px -10px hsl(var(--shadow) / 0.22)`): the brief capsule, the tab bar, the pinned profile bar, popovers, menus, selects, sheets; and a pressable card on hover with a fine pointer.
- **Chrome top** (`0 -10px 24px -14px hsl(var(--shadow) / 0.18)`): the top edge of a pinned bottom bar.
- **Chrome bottom** (`0 1px 0 0 hsl(var(--border))`): a hairline under chrome where needed.

### Named Rules
**The One Idea Per Card Rule.** One card holds one idea, thumb-sized. Never a
card inside a card; inside a card, use a `muted` or tinted tile instead.

**The Floating Means Raised Rule.** `raised` is reserved for things that float
over content. A resting card earns it only as hover feedback.

**The Forced-Colours Edge Rule.** Pills and chips carry a transparent 1px
border so that forced-colours mode, which drops shadows, still draws an edge.

## Shapes

Soft and generous. The radius scale is built on `--radius` (14px): `sm` 10px,
`md` 14px (inputs, selects, menu items), `lg` 18px (popovers, menus, inset
tiles), `xl` 22px (every card and option row), `2xl` 28px (message bubbles),
`3xl` 36px (the home hero, the bottom sheet's top corners, the message
composer), and `full` for every button, chip, badge, tab, capsule, avatar and
icon tile.

Message bubbles cut one corner to `md` on the writer's side (inline end for
mine, inline start for theirs), using logical corners so the cut follows the
reading direction. The request summary is shaped as a pass: a dashed 2px rule
across the card with two round notches cut into its edges in the ground
colour.

**The Pill Rule.** Every action is a capsule, the shape of an iOS notification.
One shape for everything pressable means the eye learns it once.

**The Round Tile Rule.** Icons and portraits sit in circles: 40px in list rows,
44px in option rows and the capsule, 48px in sitter cards, 64px in empty states.

## Components

### Buttons
- **Shape:** full pill (`rounded-full`) for every variant; semibold label;
  optional leading 18px icon (`src/components/ui/button.tsx`).
- **Primary** (`default`): teal fill, white label, `pill` shadow; hover
  `primary-hover`. The one dominant action of a context.
- **Surface:** white pill with `pill` shadow on the mist ground; hover `secondary`.
  The resting secondary action (the home's "Devenir pet-sitter").
- **Outline:** white pill with a 1px inset `input` ring, used inside a white
  card where a shadow would not read (suggested sitters under a page that
  already has a primary).
- **Secondary / Ghost:** `secondary` fill, or transparent with a `secondary` hover.
- **Destructive:** red fill, only for destruction.
- **Sizes:** default 44px tall (20px side padding, 15px label); `sm` 36px for
  dense secondary controls, never a page's primary; `lg` at least 52px, 24px
  padding, 16px label, allowed to wrap to two balanced lines inside the capsule
  rather than overflow a 320px screen; `icon` 44×44.
- **Press:** `scale(0.97)` over 150ms with the strong ease-out. Focus: 2px teal
  ring with a 2px offset. Disabled: 50% opacity, no pointer events.

### Text actions
Defined once in `src/components/shared/link-styles.ts`.
- **ACTION_LINK:** a standalone text action on its own line ("Voir toute la
  liste", "Modifier Rex"): teal, semibold, 14px, 44px tall, a white pill
  appears on hover. No underline; position and weight say "action".
- **INLINE_LINK:** a link inside a sentence. Teal against body text is only
  2.97:1, so it is underlined at rest (WCAG 1.4.1), thicker on hover.

### Chips
- **Style:** white pill, 44px tall, 16px side padding, 15px label, 1px inset
  `input` ring plus a hairline shadow (`src/components/shared/Chip.tsx`).
- **Selected:** `primary-soft` fill, teal semibold label, 1.5px inset teal ring
  and a check glyph that pops in. Never colour alone.
- **No reflow:** both label states are stacked in one grid cell, so choosing
  never changes the chip's width under the finger.
- `Chip` is a checkbox (multi-select); `ChipGroup` is a Radix radio group
  (single value, arrow keys, one tab stop). `null` renders nothing selected:
  no pre-selected choice the person never made.

### Option rows
`src/components/shared/OptionGroup.tsx`: full-width white cards, at least 68px
tall, `xl` radius, `card` shadow, a 44px round icon tile (or an animal
portrait), label, one optional line of description, and a 24px radio at the
inline end. Selected: 2px inset teal ring, the icon tile turns teal, the radio
fills teal with a check. Disabled options stay visible with a dashed outline on
the ground and must say why, never a faded copy.

### Cards / Containers
- **Corner Style:** `xl` (22px).
- **Background:** white `card` on the mist ground (`.surface` in `src/index.css`).
- **Shadow Strategy:** `card` at rest; a pressable card adds `.surface-press`
  (press `scale(0.98)`, `raised` on hover with a fine pointer).
- **Border:** none outside; hairlines only inside, as dividers.
- **Internal Padding:** 16px, 20px from md.
- **Sitter card** (`src/components/sitter/SitterCard.tsx`): monogram or photo,
  name, place, headline (3 lines max), match reasons, one provenance byline
  (with the demo tag for fixtures), then a hairline and the closing line of
  price plus one action. The whole card is one stretched link with one tab stop.
- **Profile folds** (`src/components/sitter/ProfileFold.tsx`): on the sitter
  profile (and the sitter's preview, which is the same component), "Comment
  j'accueille les animaux", "Ce que je ne peux pas accepter" and "À propos" are
  cards that open and close, **closed by default** (Radix Accordion, several
  may be open). The card head is the section heading (still an `h2`/`h3`)
  wrapping a full-width button: title, then a 36px `primary-soft` tile with a
  teal `ChevronDown` that turns half a turn when open (fills teal on hover with
  a fine pointer only). Closed, a **summary** under the title keeps the
  essentials in view: the home facts and how many animals at once; the first
  limit, whole, plus "+ n autres limites"; two clamped lines of the sitter's
  own words. Opening collapses the summary row (grid `1fr → 0fr`) on the same
  curve as the content grows (`accordion-down` 220ms / `accordion-up` 180ms,
  `ease-out`), so the card moves once. A tap on the summary also opens it.
- **Service and price rows** (profile glance, "Services et tarifs"): service
  and price share a line while they fit and the price wraps **under** the
  service when they do not (`flex-wrap`, the amount never broken, its unit
  allowed to wrap after it). A `shrink-0` price beside a squeezable name is
  what made "Promenade" run into "600 DA" at 360px.
- **Grouped list** (`LIST_GROUP` / `REGISTER_ROW` / `ROW_ICON`,
  `src/components/shared/register.ts`): navigable rows inside one card, divided
  by hairlines, 64px minimum, a `primary-soft` round icon tile at the start,
  `secondary` hover. A navigation row is never a card of its own; that
  silhouette belongs to choices and results.

### Inputs / Fields
- **Style:** 48px tall, `md` radius, white fill, 1px `input` border, 16px
  padding, 16px text; textareas 96px minimum (`input.tsx`, `textarea.tsx`,
  `select.tsx`).
- **Focus:** the border turns teal and doubles with an inset 1px teal shadow,
  plus a 4px teal halo at 15%.
- **Error:** `aria-invalid` turns the border red; the message below has an icon
  and words. **Disabled:** 50% opacity.
- **Labels:** always visible above the field; placeholders are light example
  text, never the label.

### InfoTip ("!")
`src/components/shared/InfoTip.tsx`: a grey 18px `InfoMark` inside a 44px round
button whose name is "Plus d'informations : topic", opening a Radix popover
(works for a thumb, closes with Escape). **May hide:** only the *why* behind a
question, how an answer is used. **May never hide:** an error, a constraint, a
format, a privacy fact about who sees the answer, an honesty statement or a
demo marker. Those stay visible.

### Animal categories
`src/components/shared/AnimalCategories.tsx`: dog, cat and bird as three
illustrated cards in a three-column grid, the **same** cards, order and words
on both sides of the marketplace (owner's need, sitter's accepted animals, the
home's quick start). Tiles: dog `sand`, cat `brand-soft`, bird `sky`
(`SPECIES_TILE`). Selected: a 2.5px inset teal ring plus a teal check badge at
the top end. Three honest roles: `pick` (buttons), `single` (radio group),
`multi` (checkboxes).

### Kind picker
`src/components/shared/KindPicker.tsx`: breed or species after the category,
with a search field, the six most common as chips, the rest on demand, and
"Mon animal n'est pas dans la liste". Optional, and it says so. It is detail
about one animal and is **never read by matching**; its "!" says so plainly.

### The brief capsule (signature)
`src/components/search/BriefCapsule.tsx`: one white pill with the `raised`
shadow and 6px padding. At the start, the animal's 44px portrait (a paw on the
terracotta tint when no animal is chosen); in the middle, the animal in words
over the parts of the brief (care, dates, zone, budget) separated by middots,
each part isolated in `<bdi>`; at the end, an inner 40px teal pill "Modifier"
with the filter icon and a white count badge. It is one control with one tab
stop: its accessible name is the action, the summary is its description. It
sticks under the header above search results and also heads the sitter profile
and the request review, so every card below reads as an answer to it.

### The request pass
`src/components/request/RequestSummary.tsx`: one component for the pre-send
summary, the success screen, the owner's request and the sitter's incoming
request. The animal's portrait and name, a dashed perforation with two notches,
then a two-column grid of labelled segments (care, dates, zone, rate) with 14px
icons over semibold values, an inset `muted` tile for the animal's facts and
needs, and a provenance byline. It never shows anything as "confirmed": the
price is what was displayed, not a charge. The status badge appears only on
a request that exists.

### Status badges
`src/components/shared/StatusBadge.tsx`: 28px pills, 12px semibold, always an
icon plus a word. Pending: `sand` with a clock. Accepted: success at 10% with
a check. Declined: `secondary` with muted text and a cross. Never red.

### Honesty components
- **ProvenanceLabel:** the byline described in the Overview. Not a badge.
- **DemoNotice:** a white card with a `secondary` round tile holding the info
  icon, a 15px semibold title and the explanation. Neutral, not teal and not
  sand: it informs and is not pressable. Same weight as what it qualifies.
- **DemoLine / DraftNotice:** one-line muted notes with an icon, for an
  unsaved draft or a simulated step inside a flow.
- **EmptyState:** a centred card with a 64px `primary-soft` icon tile or an
  illustration, a title, what to do, and an action. It must not look like an
  error.

### Navigation
- **Mobile tab bar** (`src/components/layout/WorkspaceNav.tsx`): a floating
  white pill inset 12px from the edges, `raised` shadow, max 448px, above the
  safe area. Tabs are at least 56px tall with a 22px icon over an 11px label.
  The current tab sits on a `primary-soft` capsule that **slides** between tabs
  (transform only, 250ms, ease-in-out, direction-multiplied by `--nav-dir`
  so it travels the other way in Arabic); its label is semibold teal, its icon
  stroke thickens to 2.25, and it carries `aria-current`. Owner: Accueil ·
  Recherche · Demandes · Animaux · Compte. Sitter: Reçues · Mon profil · Compte.
  Hidden from md.
- **Header** (`src/components/layout/Header.tsx`): the brand mark (terracotta
  paw on its soft tile plus the name from `common.appName`) at the start; from
  md, the same destinations in one white segmented pill with the `pill` shadow,
  44px items, the current one on a `primary-soft` capsule with a semibold teal
  label.
- **Messages button** (`MessagesButton.tsx`): a 44px white round pill in the
  header of both spaces, with a teal count badge ringed in the ground colour.
  The count is the conversations this space has not opened since the other
  side wrote, spoken in words in its accessible name.
- **Language** (`LanguageSwitcher.tsx`): a 44px white round pill with the
  Lucide `Languages` icon and no code. Its name says the current language. The
  menu lists each language in itself (Français, العربية, English), each item
  with its own `lang`. The icon sits in the header of the welcome screen and
  the home (`/`); Compte (`/settings`) offers the same choice in the page.
- **Flow screens** (`FlowScreen.tsx`): no site chrome; a sticky mist bar with
  back, a 6px teal progress pill on the track, and the account button; the
  action bar pinned at the bottom.
- **Back button** (`src/components/shared/BackButton.tsx`): ONE form on every
  secondary screen — a 44px white round pill (`card`, `pill` shadow) with a
  20px ink `ArrowLeft` at 2.25 stroke, mirrored in Arabic, at the inline start
  of the sticky top bar (x 16px, y 6px on a phone, in all three shells). On a
  browsable screen the page renders `<BackButton fallback=… />` and it portals
  into the header's back slot, before the brand mark, so it stays in view
  while the page scrolls and never sits over content. Its accessible name is
  the destination when the screen knows it ("Retour aux résultats"). Root
  screens (the tabs, Messages) have none. The former labelled pill in the
  page body is retired.

### Messages
`src/pages/Messages.tsx`, `src/pages/MessageThread.tsx`,
`src/components/messages/MessageBubble.tsx`. A local space: conversations
carry their care context (animal portrait, sitter or owner monogram). The list
is a grouped list; an unread conversation has a bold name, a darker preview and
a teal "n nouveaux" pill. The preview runs to two lines, and the pill drops
under it when the row is too narrow for both (the Arabic label is long). Unread is **per space and per device**, never a read
receipt. Bubbles: mine at the inline end on `primary-soft`, theirs at the
inline start on `muted`, `2xl` radius, author named in words above each one
with the time it was written on this device. The composer is a `3xl`-rounded
textarea, 48px at rest and growing to 160px, beside a 48px round teal send
button, pinned on mist with the `chrome-t` shadow. A
`DemoNotice` heads the space; an example profile says nobody will read.

### Iconography and illustration
- **Lucide first**, at 2px stroke (1.75 to 2.25 in the tab bar), sized 14px in
  bylines and facts, 16 to 18px in buttons and chips, 20 to 22px in rows and
  the bar.
- **Custom icons only where Lucide lacks the picture**
  (`src/components/icons/nidz-icons.ts`): `HomeHeart` (boarding), `HomeKey`
  (visit at the owner's), `BirdCage`, `Balcony`, `InfoMark`. Drawn in Lucide's
  grammar (24 grid, 2px round caps, no fills) with `createLucideIcon`. One
  picture per domain value is defined once in `domain-icons.ts`; walks use
  Lucide's `Footprints` because a custom lead read as a telephone at 16px.
- **Illustrations** (`src/components/illustrations/animals.tsx`): flat authored
  dog, cat and goldfinch (the chardonneret Algerian bird keepers know) on a
  160 grid, no outlines, two fur tones plus ink details, a teal collar. Always
  decorative (`aria-hidden`), always named in text beside them. Never a photo
  standing in for a real sitter; people without a photo get a monogram.

### Motion
- **Easing:** `ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for almost everything;
  `ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for something moving on
  screen (the tab capsule); `ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)` for
  sheets.
- **Press:** `scale(0.97)` for buttons, chips and round icon controls;
  `0.98` for pressable cards; `0.99` for the full-width brief capsule and
  option rows. The larger the surface, the less it moves.
- **Durations:** press 150ms; state changes 150 to 220ms; screen arrival
  (`page-in`, a 6px rise from opacity 0.01) 220ms; popovers `scale-in` 180ms
  from 0.96; checks and counts `pop` 180ms from 0.85; sheets 300ms in, 200 to
  250ms out.
- **Reduced motion:** the global rule in `src/index.css` collapses every
  animation and transition to 0.01ms (not `none`, so Radix still receives
  `animationend`). Motion never blocks an action.

### Accessibility and RTL
- Every target is at least 44px; tabs 56px. Focus is a 2px teal ring, never
  removed.
- Selection is never colour alone: ring, check, weight and `aria-current`.
- Arabic sets `<html dir="rtl">`; layout uses logical properties (`ms`, `me`,
  `start`, `end`, `rounded-ee`). Directional arrows flip with `rtl:-scale-x-100`.
- **User text is isolated:** names, places and brief parts in `<bdi>`;
  anything a person wrote (messages, notes, previews) carries `dir="auto"`.
- Radix's hidden bubble inputs are mirrored in RTL so Arabic forms never
  scroll sideways.
- Dark mode is not part of V1: there is deliberately no `.dark` palette.

## Do's and Don'ts

### Do:
- **Do** put every screen on the mist ground (`#EDF2F0`) and every idea in one white `xl` card with the `card` shadow.
- **Do** make every action a pill, and make teal the only filled action colour on a screen.
- **Do** use `surface` (white, `pill` shadow) for the second action on the ground and `outline` for a secondary action inside a white card.
- **Do** mark selection with the teal ring plus a check (chips 1.5px, option rows 2px, animal cards 2.5px).
- **Do** use the brief capsule above any list or decision that answers the owner's brief.
- **Do** give every claim about a sitter a `ProvenanceLabel`, and every simulated step a full-weight `DemoNotice`.
- **Do** keep errors, constraints, formats, privacy facts and honesty statements visible; only the *why* goes behind the "!".
- **Do** isolate user text with `<bdi>` or `dir="auto"` and test every screen in Arabic.
- **Do** reach for Lucide first, and draw a custom icon in its grammar only when Lucide lacks the picture.
- **Do** keep artwork colours in `animals.tsx` and interface colours in tokens.

### Don't:
- **Don't** use terracotta, `brand-soft`, sand or sky for a button, a link, a hover, a focus, a selection or an interface icon tile.
- **Don't** put anything pressable on the deep-teal hero field.
- **Don't** nest a card inside a card, or turn a navigation row into a card of its own.
- **Don't** render a badge, star rating, "verified" mark, response time, completed-stays count or online dot; there is no mechanism behind any of them.
- **Don't** show "sent", "delivered", "read" or "seen" in Messages, or present an unsent request with a status colour.
- **Don't** render "available" from a sitter who has not declared themselves busy.
- **Don't** use uppercase or letter-spacing on running labels, or a second typeface.
- **Don't** use destructive red for a declined request; it is a normal outcome.
- **Don't** rely on colour alone for any state, or on a hairline as the only edge of a control.
- **Don't** let an inline link stand on colour alone; underline it.

### Deliberately absent
No trust badges or certification marks, no ratings or reviews, no availability
calendar, no payment or price total, no read receipts or online presence, no
stock photography of people, no section eyebrows or kickers, no dark theme, no
emoji as icons.
