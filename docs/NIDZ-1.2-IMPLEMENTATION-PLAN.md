# Nidz 1.2 — baseline, inventory and implementation plan

**Branch:** `nidz-1.2`
**Created from:** `origin/nidz-1.1` @ `5fefa949b0aeb90a33c94eebd5266a5d9d31766d` ("chore: finalize Nidz 1.1 demo")
**Opened:** 13 August 2026
**Status of this file:** living plan. Group outcomes are recorded as they land, including partial and deferred ones.

Nothing in Audit 1.2 is merged into `main` or `nidz-1.1`. Both are read-only for
the duration of this work, and the pre-existing safety stash
(`stash@{0}: On nidz-1.1: Nidz 1.1 - Group 2 before Impeccable and Playwright setup`)
is left untouched.

---

## 1. Verified Git baseline

Established before any file was edited, not assumed:

| Ref | SHA | Note |
|---|---|---|
| `main` / `origin/main` | `b89ffa0` | protected baseline, in sync, untouched |
| `nidz-1.1` / `origin/nidz-1.1` | `5fefa94` | completed Audit 1.1, in sync, untouched |
| `nidz-1.2` / `origin/nidz-1.2` | created at `5fefa94` | all Audit 1.2 work |

`nidz-1.2` initially inherited `origin/nidz-1.1` as its upstream (git's default
when branching from a remote-tracking ref). That was corrected immediately with
`git branch --unset-upstream` followed by `git push -u origin nidz-1.2`, because
a bare `git push` under the inherited tracking would have pushed Audit 1.2
commits onto the protected `nidz-1.1`.

### Baseline quality gates (measured at `5fefa94`, before any change)

| Check | Result |
|---|---|
| `npm run build` | pass — 13.86 s |
| `npx tsc --noEmit` | pass — 0 errors |
| `npm run lint` | pass — 0 errors, **7 pre-existing warnings** |
| `git diff --check` | clean |

Bundle at baseline, for regression comparison at Group 16/18:

| Artefact | Raw | Gzip |
|---|---:|---:|
| `assets/index-*.js` | 630.33 kB | 197.04 kB |
| `assets/index-*.css` | 66.88 kB | 12.20 kB |
| PWA precache | 694.69 KiB (6 entries) | — |

Vite already warns that the single JS chunk exceeds 500 kB. Audit 1.2 adds
substantially more surface, so route-level code splitting is a Group 16
requirement, not an optional polish.

**The 7 lint warnings are pre-existing and none are in application code.** All
are `react-refresh/only-export-components` in vendored shadcn primitives:
`ui/badge.tsx:36`, `ui/button.tsx:59`, `ui/form.tsx:168`,
`ui/navigation-menu.tsx:119`, `ui/sidebar.tsx:760`, `ui/sonner.tsx:29`,
`ui/toggle.tsx:43`. They are a consequence of shadcn's own file layout (a
component and its `cva` variants in one file) and are recorded here so that a
later "0 new warnings" claim is checkable. Audit 1.2 must not add an eighth.

Also observed at baseline and **not** an application fault: `caniuse-lite` is 14
months stale, so the build prints a Browserslist advisory.

---

## 2. Repository architecture inventory

Read from the repository at `5fefa94`. This is implementation reality, not
recollection from earlier conversations.

### 2.1 Stack

Vite 5.4 + React 18.3 + TypeScript 5.8 (SWC plugin), shadcn/ui on Radix,
Tailwind CSS 3.4 with `tailwindcss-rtl` and `tailwindcss-animate`,
react-router-dom 6.30, i18next 23 + react-i18next 15, lucide-react,
react-helmet-async, `vite-plugin-pwa` (`autoUpdate`), zod (present, lightly
used), `@tanstack/react-query` (provider mounted, **never queried**).
57 runtime dependencies, 17 dev dependencies. `lovable-tagger` runs in dev only.

Alias `@/` → `src/`, declared in both `vite.config.ts` and the tsconfigs.

**No test framework is configured.** No test script, no runner, no test files.
Any claim of "tests pass" in this audit would be false; QA is build + typecheck
+ lint + browser verification.

### 2.2 There is still no backend

Confirmed by search, not assumption: no `fetch(`, `axios`, `supabase` or
`firebase` call site exists anywhere in `src/`. Every screen renders from
fixtures in `src/data/` and reducer state in `src/state/demo/`.

`PRODUCT.md` at baseline was stale on two points, corrected in this group: it
claimed Mapbox was installed (it was removed during Audit 1.1) and that most
routed pages were stubs (Audit 1.1 replaced them).

### 2.3 Source layout (145 tracked files, ~10 000 lines outside `components/ui/`)

```
src/
  App.tsx              router + provider composition (157 lines)
  main.tsx             HelmetProvider, imports ./i18n before render
  i18n.ts              i18next init, en/fr/ar, updateDir() owns <html dir>
  index.css            all design tokens as HSL CSS variables (243 lines)
  data/                types.ts · demo-sitters.ts · locations.ts · criteria.ts
  state/demo/          reducer.ts · context.ts · DemoProvider.tsx
  components/
    layout/            Layout · Header · Footer · BottomNav
    shared/            FlowScreen · fields · trust · Chip · OptionGroup ·
                       EmptyState · StatusBadge · ErrorBoundary · LanguageSwitcher
    sitter/            SitterCard · SitterProfileView · match · use-reason-label
    account/ request/  AccountSteps · RequestSummary
    ui/                49 vendored shadcn primitives
  pages/               Index · Search · SitterProfile · Help · Policies ·
                       NotAvailable · NotFound · onboarding/ · owner/ · sitter/
  hooks/  utils/  lib/  locales/
```

Largest files, as refactor candidates: `pages/sitter/SitterBuilder.tsx` (766),
`components/shared/fields.tsx` (496), `pages/Search.tsx` (462),
`components/account/AccountSteps.tsx` (371).

### 2.4 Routing (two shapes, deliberate)

`App.tsx` registers **flow screens outside** the `Layout` route — they own the
viewport, carry their own back control and their own action bar, and must never
also show site chrome — and **browsable screens inside** it, where they get
header, footer and the mobile bottom bar. Custom routes are registered above the
`path="*"` catch-all.

Namespacing is load-bearing: public profiles are `/sitters/:id`, the sitter's
own area is `/sitter/*`. Keeping them apart means no static sitter route can be
shadowed by a profile id. `/sitter/:id` survives as a redirect that preserves
query and hash.

Registered-but-unimplemented routes (`/auth`, `/pets`, `/book/:listingId`,
`/chat/:bookingId`, `/admin`) serve `NotAvailable` — one honest screen — rather
than a "coming soon" stub. The routes stay registered so deep links and Back
keep working.

### 2.5 State and persistence

One reducer behind a context (`src/state/demo/`), mirrored into `localStorage`
under `nidz.demo.v1` with `STORAGE_VERSION = 1`. Notable properties Audit 1.2
must preserve:

- **Storage is treated as untrusted input.** `restore()` validates each slice
  independently so one corrupt field costs only that field;
  `restoreSitter()` additionally checks every array and required string because a
  published profile flows straight into `/search`'s unguarded `.filter`.
- **Version mismatch discards rather than crashes.**
- **Transient fields are stripped on write.** Object URLs (`pet.photoUrl`,
  `profile.photoUrl`) point at nothing after a reload, so they are never
  persisted.
- **Reset removes the record** instead of writing empty values back.
- The owner's request and the sitter's incoming request are **the same object**.
  There is no synchronisation to get wrong.

### 2.6 Design tokens

All colours are HSL triplets on CSS variables in `src/index.css`, mapped to
semantic Tailwind classes. Components never carry a hex value. Two distinct
things are called "accent" and the distinction is documented in a comment block
at the top of `index.css`: CSS `--accent` is shadcn's neutral hover/highlight/
selection surface used by 13 primitives, while the design system's warm
terracotta lives on `--brand` and is reserved for non-interactive brand
surfaces. Radius scale is sm 8 / md 12 / lg 16 / xl 24. `prefers-reduced-motion`
is honoured globally via `animation-duration: 0.01ms` (not `animation: none`,
so Radix still receives `animationend`).

Dark mode is not part of V1; the `.dark` block is stale Lovable-era colour and
is never applied.

### 2.7 i18n and RTL

Three locales, `en` (fallback) / `fr` / `ar`, detected localStorage →
querystring → navigator. `updateDir()` sets `<html lang>` and `<html dir>`;
`dir="rtl"` is the single mechanism the styles key on, because Tailwind's `rtl:`
variant compiles to `[dir="rtl"]` and `index.css` uses the same selector.
`App.tsx` additionally feeds Radix's `DirectionProvider`, without which roving
focus in every radio group has reversed arrow keys in Arabic.

Key parity verified at baseline: en 365, fr 365, ar 397. The Arabic surplus is
**correct** — it is CLDR plural categories (`_zero/_two/_few/_many`) that
English and French do not have. No key is missing from any locale.

Currency always goes through `formatDZD(amount, locale)`.

### 2.8 Honesty rules the code enforces

These are compiler- and runtime-enforced, not merely documented:

- `SitterProfile` has no `verified`, `rating`, `reviewCount`, `responseTime`,
  `completedStays` or `online` field.
- `ProvenanceLabel` (`components/shared/trust.tsx`) throws in development if a
  trust category with no mechanism behind it is rendered.
- `RequestStatus` has no `completed` — nothing can observe that a stay happened.
- `declaredUnavailable` is a statement by the sitter, never a booking calendar.
  Not-declared-busy is never rendered as "available".
- Adding an identity document produces no verified state anywhere.
- `SitterHousing.type` / `.outdoor` are `null` until answered, because a
  non-null seed is indistinguishable from a user's choice and would be published
  as a declaration nobody made.
- `isDemoFixture` is what every surface reads to decide whether to mark an entry
  as an example — including the public profile page, because those links are
  shareable.

---

## 3. Agents, skills and hooks actually installed

Discovered in the repository; nothing below is invented.

### Project agents (`.claude/agents/`)

| Name | Purpose | Tools |
|---|---|---|
| `ui-designer` (`ui-designer-nidz.md`) | Nidz UI/UX review: hierarchy, interaction, responsive, a11y, trust-signal classification. Returns PASS / NEEDS CHANGES with P0/P1/P2. Read-only by design. | Read, Glob, Grep |
| `code-reviewer` (`code-reviewer-nidz.md`) | Nidz code review: correctness, types, state, a11y, privacy, i18n, mobile, demo truthfulness. Critical / Warning / Suggestion. Reports, does not edit unless asked. | all |

Both explicitly rank product truth above aesthetic preference, and both forbid
claiming that testing occurred when it did not.

### Project skills (`.claude/skills/`)

| Skill | Role in Audit 1.2 |
|---|---|
| `nidz-design` | **Authority.** Points at `NIDZ_DESIGN_SYSTEM.md` (1737 lines, French) and states that Nidz rules beat Impeccable, ui-designer, shadcn, Tailwind and existing legacy UI on conflict. |
| `impeccable` | Secondary design expertise only. Never overrides Nidz product/design rules. |
| `playwright-cli` | Browser automation for the Group 18 QA pass. |

Also available from the host (not project-scoped): `code-review`, `simplify`,
`dataviz`, `artifact-*`, document skills.

### Hooks

`.claude/settings.local.json` exists and is **not** tracked in git. No project
hook is configured. Audit 1.2 does not add one: the deterministic checks that
matter here (build, typecheck, lint, diff-check) are already run at every group
boundary, and global Claude configuration is out of scope.

---

## 4. Design decisions taken by Audit 1.2

The Nidz design system (§42) ranks its own decisions. Audit 1.2 changes two
**Level 2** items — "système actif … peut évoluer consciemment" — and no Level 1
principle. Both changes are recorded in an amendment block at the top of
`NIDZ_DESIGN_SYSTEM.md` so the source of truth cannot silently contradict the
code, and both must be applied globally rather than screen by screen.

### 4.1 Global background becomes `#FFFFFF`

Supersedes the warm off-white `#FBFAF7` as the application canvas
(design system §12.1).

Rationale, and the constraint it creates: on a cream ground, `--card` `#FFFFFF`
was itself a weak elevation cue, which is how the 1.1 UI ended up separating
almost everything with a card or a hairline. On white, that cue is gone —
so structure must come from hierarchy, spacing, typography, grouping, restrained
borders and occasional semantic soft surfaces, and shadow is reserved for
genuine elevation. **White ground is not a licence for white-on-white cards.**

The rest of the identity is unchanged: primary `#0F766E`, hover `#115E59`,
primary-soft `#E7F3F1`, terracotta `#A84F32`, warm-soft `#F7EAE4`, foreground
`#18211F`, muted-foreground `#5B6864`, border `#DCE3E0`, control border
`#7C8B86`. Semantic success/warning/destructive/info stay as they are unless
contrast on the new ground requires a correction — which must be measured, not
guessed, since several tokens were tuned against `#FBFAF7`.

### 4.2 Inter only; Playfair Display is withdrawn

Supersedes design system §13.2. Hierarchy comes from size, weight, spacing,
content and layout — not from mixing families.

This also removes a real defect rather than only a preference: Playfair has no
Arabic face, so any role it carried was mono-lingual by construction in a
trilingual product. No replacement display face is introduced; adopting one
would be a deliberate multilingual brand decision, not a side effect of a UI
audit.

### 4.3 Decisions deliberately *not* taken

- No dark mode. Out of scope, and the stale `.dark` block stays unapplied.
- No new brand mark, no new icon family (Lucide continues), no emoji as icons.
- No project-wide TypeScript strictness flag flip — it would produce hundreds of
  unrelated changes. New code is strongly typed on its own terms instead.
- No new test framework.

---

## 5. Group plan

Execution is group by group. Every group ends with: inspect the diff, run
`npm run build` / `npx tsc --noEmit` / `npm run lint` / `git diff --check`,
review (code-reviewer, plus ui-designer for UI groups), fix confirmed issues,
verify the active branch is `nidz-1.2`, commit, push.

| # | Group | Outcome |
|---|---|---|
| 1 | Branch, baseline, documentation | — |
| 2 | Design foundation + natural app shell | — |
| 3 | Language, routing, persistence foundation | — |
| 4 | Algerian geography | — |
| 5 | Map + geolocation | — |
| 6 | Auth gateway + fast owner account | — |
| 7 | Multi-pet system | — |
| 8 | Owner home + marketplace search | — |
| 9 | Public sitter profile + reviews + portfolio | — |
| 10 | Strict sitter onboarding, part 1 | — |
| 11 | Strict sitter onboarding, part 2 | — |
| 12 | Requests + meet & greet + care context | — |
| 13 | Messaging + contact privacy | — |
| 14 | Two-sided feedback + trust | — |
| 15 | Profile, settings, navigation, future business architecture | — |
| 16 | Design polish + performance + accessibility | — |
| 17 | Product truth and security hardening | — |
| 18 | Final QA | — |

Outcomes are filled in as each group lands, using the vocabulary the audit asks
for: **Completed**, **Partial**, **Deferred**, **Blocked** — with a reason.
Architecture-only work is never recorded as fully functional.

### Standing constraint on scope

Where a requirement cannot be met without infrastructure that does not exist
(OAuth, OTP, identity verification, payment, file storage, a moderation backend,
a server-side clock for double-blind review windows), the deliverable is
**truthful architecture plus appropriate UI**, never simulated functionality
dressed as real. That choice is recorded per feature in the final report's
truth table.
