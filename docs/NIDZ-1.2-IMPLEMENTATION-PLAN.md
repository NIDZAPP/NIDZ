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
| 1 | Branch, baseline, documentation | **Completed** |
| 2 | Design foundation + natural app shell | **Completed** — see §6 |
| 3 | Language, routing, persistence foundation | **Completed** — see §6 |
| 4 | Algerian geography | **Partial** — wilayas complete and verified; commune coverage is 10 of 69 wilayas, with the gap documented rather than filled by unverified data. See §6 |
| 5 | Map + geolocation | **Deferred** — blocked on verifiable coordinate data, not on the map library. Evaluation and constraints recorded in `NIDZ-1.2-MAP-AND-LOCATION.md`. See §6 |
| 6 | Auth gateway + fast owner account | **Completed** — see §6 |
| 7 | Multi-pet system | **Completed** — see §6 |
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

---

## 6. Group outcomes

### Group 2 — design foundation and app shell

**Completed.** Reviewed by the project `ui-designer` before implementation; its
contrast arithmetic was re-derived independently before being acted on.

**Tokens.** Canvas to `#FFFFFF`, with `theme-color` and the PWA manifest tracking
it. `--secondary` and `--muted` retuned from the warm beige ramp (`#EFEDE8` /
`#F5F3EF`) into the cool green-grey family of `--border` (`#EAEFED` / `#F4F7F6`):
the warm neutrals were chosen to sit on cream, and on white they read as a
yellow cast. Everything else in the palette is unchanged, and every affected
contrast ratio was recomputed rather than assumed — `--input` 3.41 → 3.56:1,
`--border` 1.25 → 1.30:1, `--muted-foreground` 5.57 → 5.81:1, all improvements.

Three consequences of the ground change, each handled:

- `--muted` is 1.08:1 on white, too faint to carry an interaction. Application
  row hovers moved to `--secondary` (1.16:1), so Nidz has one hover surface with
  one meaning. `--muted` remains for shadcn primitives only.
- Six sticky planes were white-on-white separated by a 1.30:1 hairline. A sticky
  bar is the one genuinely elevated thing in the product, so `shadow-chrome-b` /
  `shadow-chrome-t` were added at the lightest weight and applied permanently —
  no scroll listener, because a plane that elevates only once you scroll is
  misdescribing its position the rest of the time.
- The identity monogram was a 1.16:1 tile. Moved to `bg-brand-soft text-brand`
  (4.66:1 letter): the one warm surface now sits on the *person*, which is also
  the only place in the product with no photograph to carry them.

Removing the cream ground *and* the warm neutrals left `--brand` / `--brand-soft`
carrying the entire warm half of the brand, so their placement stopped being
decoration. Allocated to exactly three things and documented in `src/index.css`.

The stale `.dark` block was deleted rather than carried forward. It was never
applied, and it defined none of the tokens added since — anything that had
switched it on would have inherited light values for a third of the system.

**Typography.** Playfair withdrawn; the `display` key is gone. It was already
dead: `index.html` never requested the font, so `font-display` resolved to an
arbitrary system serif.

**Workspace model.** `src/data/workspace.ts` — capabilities plus an active
workspace, deliberately no `role`. `workspaceForPath` matches the first path
segment exactly, because `/sitters/amina-b` starts with `/sitter` and a
`startsWith` check would file a public profile an owner is browsing under the
sitter's own workspace.

**Navigation.** `BottomNav` replaced by `WorkspaceNav` over a single
`workspace-nav.ts` destination list shared with the header, so a place cannot be
renamed by crossing 768px. The 1.1 bar appended a sitter tab the moment a
profile was published; the bar is now drawn from the active workspace instead.
A bar with fewer than two destinations is not drawn at all, which is why the
sitter side currently has none — it has one browsable screen, and one tab is not
a bar. The target four-tab shape fills in at Groups 11, 13 and 15; each pending
destination is commented in place with the group that brings it. **No tab points
at `NotAvailable`.**

**Back control.** `useFlowBack` → `useBack`; new shared `BackButton` with `bare`
and `labelled` variants. `FlowScreen`'s API moved from `onBack: () => void` to
`backTo: string`, removing 13 identical `useBack(parent)` lines; all 14
fallbacks were cross-checked against their originals. Browsable screens that had
no back affordance at all now have one, placed as the first element of the
content column rather than in the header — only the page knows its parent, which
is why the fallback is a required argument.

The public sitter profile's back link was previously conditional on the URL
carrying search criteria, so a profile opened from a shared link — the most
likely way a stranger arrives — had no way back inside an installed PWA. It is
now unconditional.

**Entry.** `Welcome` and `Intent` merged. The first screen disclosed nothing and
stood in front of the real decision. `/start` survives as a redirect because it
is the `useBack` fallback of several steps.

The audit asks each choice to carry a visual preview of its workflow, and
suggests sitter photography. Nidz has none, and has no results, counts or
reviews before a brief exists, so any rendered mock would depict data that does
not exist. Instead each panel shows that world's own first control, live: the
owner panel asks the actual first question (and answering it carries into the
flow, removing a later tap), the sitter panel names the actual sections that
will be asked for. The two differ in kind — lateral versus vertical — rather
than in colour.

**Review round.** The project `code-reviewer` found three real defects that the
toolchain could not:

- Hiding the footer below `md` made `/help` and `/policies` — and with them the
  demo reset — **unreachable on a phone**, because Audit 1.2 had just removed
  Help from the header and Settings does not arrive until Group 15. The footer
  links are back at every width; only the copyright line is dropped on mobile.
- The entry's species choice set `need.species` but left `need.petId` pointing
  at a previously saved animal, and `NeedPet` resolves the saved pet *before*
  the declared species. Saving a dog, returning to the entry and tapping Cat
  opened a form pre-filled with the dog — and submitting would have overwritten
  it under its own id. Fixed by clearing `petId`, and verified in the browser.
- A second back control was left stacked above the first on the owner request
  detail.

Also corrected from the same review: the header listed Home beside a wordmark
that already linked there; `BackButton`'s labelled variant could read "Back to
results" while going elsewhere, so it now names a destination only when the URL
actually carries one; the availability predicate was duplicated across header
and bar *and* had silently reversed a documented 1.1 decision (a sitter
destination requires a **published** profile), now one function in
`workspace-nav.ts`; `has-bottom-nav` reserved scroll padding for a bar that is
often absent; the sitter's "view my profile" link had been pointed at the
builder's preview step, which shows a finished sitter an 8-of-8 progress bar and
a primary action that returns to the screen they came from; and the merged entry
had lost `FlowScreen`'s scroll-and-focus reset.

One pre-existing bug surfaced and fixed: `search.context.editLabelCount` carried
only `_one`/`_other` in Arabic, so 2–5 active criteria fell through to English
inside the Arabic UI. It now has all six CLDR categories.

One item is a **known carry-forward to Group 3**, commented in place:
`Index.tsx` still forks on `Boolean(state.sitter)` to decide which "side" the
visitor belongs to — the mutually exclusive shape `workspace.ts` exists to
retire. It becomes a workspace *switch* once Group 3 gives it a persisted
`activeWorkspace` to write to.

**Verified in a browser** at 320×640, 390×844 and 1440×900, in French and in
Arabic RTL: 0 console errors (2 pre-existing React Router v7 future-flag
warnings), no horizontal overflow on any browsable route at 320px, `<html
dir="rtl" lang="ar">` correct with panels and the inline-start rule mirrored,
the species choice confirmed to reach `nidz.demo.v1` and to clear the stale pet,
footer links reachable on mobile, and exactly one `/` link in the desktop
header.

**Deferred to later groups by design:** the sitter desktop rail (no consumer
until the sitter workspace has a bar), the `/search` brief band's warm surface
(Group 8), and moving the language switcher out of the chrome into Settings
(Group 3, §89).

---

### Group 3 — language, routing and persistence

**Completed.** Reviewed by the project `code-reviewer`; two of its findings were
genuine data-loss or dead-control bugs and are described below.

**Language (§89).** i18next's detector was caching whatever it *detected* under
`i18nextLng`, which collapsed two different facts — a language Nidz guessed and
a language the person chose — into one indistinguishable value. Detection is now
cacheless; `setLocale` is the only writer, under `nidz.lang`; and Settings says
which of the two is happening rather than implying a decision nobody made. The
1.1 key is adopted once and deleted.

`querystring` was removed from the detection order. It was a third source that
Settings could not honestly describe: someone arriving on a shared `?lng=ar`
link would have been told Nidz was "following your device's language" while it
was doing nothing of the kind. Two sources, one statable rule.

**Settings exists from Group 3, not Group 15.** Taking the language chooser out
of the header without giving it a home would have made a trilingual product's
language unchangeable. It holds Language, Help, Policies and the demo reset —
which moved out of `/help`, so that a destructive action has one trigger rather
than two. It is deliberately small: §88 lists account, notifications, privacy
and security sections, and each arrives with the feature behind it instead of as
a row that leads nowhere.

The chooser now appears on the entry screen only — the one place detection is
most likely to have guessed wrong, and the only screen a first-time visitor sees
before they could know Settings exists. Everywhere else there is a Settings
link: in the header on browsable screens, and in the top bar on flow screens.
That last one was a review finding: flow routes are registered outside `Layout`,
so removing the chooser from `FlowScreen` had left someone mid-way through the
sitter builder needing six Back presses to reach a language control.

**Persisted state v2.** `capabilities` and `activeWorkspace` are added, the
record moves from `nidz.demo.v1` to `nidz.demo` with the version inside it, and
`migrateFromV1` derives the two new fields **from data that is present** — an
account means the owner capability, a sitter workspace means the sitter one.
That is reading a fact, not inventing one. Nothing consults
`emptySitterProfile`, so a 1.1 profile that left a field unanswered still has it
unanswered, and `activeWorkspace` takes the initial value because v1 recorded
nothing about it.

Two safety corrections from review:

- The migration deleted the v1 record after writing the v2 one, with a comment
  claiming ordering made that safe. It did not: `saveState` swallowed its own
  exception, so on a full quota or in Safari private mode it returned normally
  having written nothing — and `removeItem` succeeds in exactly those cases.
  That combination would have silently destroyed the visitor's account, pets,
  requests and sitter profile. `saveState` now reports success and the delete is
  gated on it.
- `restore` trusted stored capabilities in isolation while `restoreSitter` could
  legitimately discard a malformed profile in the same call, producing
  `capabilities.sitter === true` with `sitter === null` — which sent `/` to an
  inbox for a profile that no longer existed. Capabilities are now clamped
  against the data that survived validation.

**The error boundary's recovery button had stopped recovering.** It removed the
literal `"nidz.demo.v1"`, so after the key move it cleared nothing, reloaded,
re-read the same poisoned record and crashed again — while its copy promised
otherwise. It now calls `clearStoredState()`, and both storage keys come from
the modules that own them. `SPLASH_KEY` moved to `src/state/splash.ts` so the
boundary that wraps the whole app no longer imports a page module to reach one
string.

**Workspace switching.** `useSwitchWorkspace` records the move and navigates
together — doing either alone leaves the chrome and the content disagreeing.
`/` belongs to whichever workspace is active, and the header wordmark points at
`WORKSPACE_ROOT[workspace]`; hard-wiring it to `/` made "Home" a control that
visibly did nothing on the sitter side and accumulated duplicate history
entries.

`startSitterProfile` grants the sitter capability but deliberately does **not**
move the active workspace. It fires from the first tap on the sitter
introduction, before any field is filled, so moving the workspace there would
permanently relocate `/` to an empty inbox for anyone who tapped once and
changed their mind. Publishing moves it, because publishing is when that side
becomes somewhere with content.

**Verified in a browser**: a seeded 1.1 record migrates with account, pets and
sitter intact, `capabilities: {owner: true, sitter: true}` derived, unanswered
housing fields still `null`, and both legacy keys removed; `i18nextLng: "ar"`
becomes `nidz.lang: "ar"` with `dir="rtl"`; the workspace switch persists in
both directions and `/` follows it; choosing a language in Settings writes an
explicit preference and flips the status line; the flow-screen Settings link and
the corrected Policies copy both render.

**One trap worth recording for whoever hits it next.** `lovable-tagger`, the
dev-only Vite plugin, injects its `data-lov-*` attributes *between* a component
name and an explicit JSX type argument, so `<OptionGroup<AppLocale> …>` is a
syntax error in dev while `tsc` and `npm run build` both pass. The symptom is a
500 for one module from the dev server only. Both sites that could hit it now
carry a comment.

**Carried forward:** the `entry.switchToOwner` key was retired with the fork it
served; `help.reset.*` became `settings.reset.*` where the action now lives.

---

### Group 4 — Algerian geography

**Partial, deliberately.** The architecture is complete; the wilaya layer is
complete and verified; the commune layer covers ten wilayas and the reason it
covers no more is recorded in code rather than glossed over.

**Algeria has 69 wilayas, not 58.** This is the finding that shaped the group.
The division went 48 (1984) → 58 (loi 19-12, 11 December 2019) → **69 (loi
26-06, published in the Journal Officiel on 4 April 2026**, announced in the
Council of Ministers on 16 November 2025). Most published datasets — including
the most popular ones — still say 58, and Audit 1.1's own code comment described
the 69-wilaya reform as "in transition". It is now in force, with the transfer
of competences to the new wilayas running to 31 December 2026.

**Three things could not be verified, and are recorded as gaps rather than
guessed:**

1. **The codes of the eleven new wilayas.** The eleven *names* are concordant
   across every source consulted. The *numbers* are not: two otherwise-reliable
   sources give completely different assignments for the same eleven names (one
   has 60 Barika / 68 Bou Saâda, another 63 Barika / 64 Bou Saâda). One is
   wrong and nothing available decides which. So `officialCode` is `null` for
   those eleven — which is exactly what the design system asks for, a stable
   internal id always and an official code only where verified. Nothing in Nidz
   depends on the number.

2. **The complete 1 541-commune list.** A consistent list exists in more than
   one community dataset and the counts spot-checked here match published
   figures, but none was usable as committed reference data: the best-sourced
   one (othmanus/algeria-cities, 58 wilayas, cites the Ministry of the
   Interior) **declares no licence** and so cannot be redistributed inside this
   repository; another claims all 69 wilayas but states no source, no method
   and no date, and invites contributors to correct it; a third is MIT licensed
   but still on the 48-wilaya division abolished in 2019. None reflects the
   commune-level consequences of loi 26-06 either.

3. **Arabic names for the eleven new wilayas** were written from the standard
   spellings of towns that already exist, not lifted from an official list.

So Nidz carries **all 69 wilayas** and **371 communes covering ten of them** —
Alger, Oran, Blida, Constantine, Annaba, Sétif, Tizi Ouzou, Béjaïa, Boumerdès,
Tipaza — the wilayas where a launch would plausibly begin. The commune count for
each was checked against independently published figures and matched in every
case. The unlicensed dataset was used only as a cross-check for those ten, not
redistributed.

Completing this is a data edit: add rows to `communes.ts` and flip
`communeCoverage` on the wilaya. **The audit's instruction for exactly this
situation was to implement the architecture and report the gap rather than
fabricate, and that is what happened.**

**Honest UI for partial coverage.** A wilaya with no commune list shows a
sentence saying so, not an empty picker — an empty commune list would read as
"this wilaya has no communes", which is false everywhere.

**Searchable combobox (§32).** 69 wilayas and 67 communes in Tizi Ouzou alone
make a native option list a scroll hunt. The new `Combobox` (Radix Popover +
cmdk) searches on a **folded** form: someone hunting "Béjaïa" types "bejaia";
someone typing Arabic may leave out the harakat, and alef has several forms.
Verified in the browser — typing `bejaia` finds Béjaïa, and typing `وهران` finds
Oran **while the interface is in French**, because every row is findable by its
name in all three languages.

**Id stability.** `src/data/locations.ts` is gone; `src/data/algeria/index.ts`
is the app-facing API. Commune ids are the bare slug except where a name occurs
in more than one covered wilaya, where every member of that group is prefixed —
prefixing the whole group rather than the later ones means adding a wilaya can
never silently move an existing id. All nine Audit 1.1 commune codes still
resolve; `oran-centre` is kept as a legacy alias because it is not a real
commune (the wilaya's own commune is simply "Oran") and saved briefs would
otherwise be silently downgraded to "anywhere".

**Cost:** the bundle grew from 640 kB to 703 kB raw (200 → 219 kB gzip). That is
the geography data, and it is a Group 16 splitting item.

---

### Group 5 — map and geolocation

**Deferred, and the reason is data rather than tooling.** Full evaluation in
`docs/NIDZ-1.2-MAP-AND-LOCATION.md`.

MapLibre GL JS is the right engine and remains the choice for whenever a map
ships. It is not installed, because **Nidz has no coordinates for anything**:
no sitter has a position (deliberately — §29 forbids ever publishing one), no
commune has one, they cannot be derived without the bulk geocoding §27 rules
out, and inventing them is fabricated geography whose errors would be invisible.
A map drawn from invented centroids renders perfectly convincing markers in the
wrong places.

The same gap blocks "Use my location". `navigator.geolocation` returns a
latitude and longitude, and turning those into a commune needs either centroids
to compare against or a reverse geocoder. Asking for the browser's most
sensitive permission and then being unable to act on the answer is worse than
not asking.

Tile providers were evaluated too, and none adopted: MapLibre's demotiles are
country-level and cannot distinguish communes inside Algiers; the OSMF tile
policy says applications should not use their tiles; keyed free tiers require a
secret that must not be committed. OpenFreeMap is the most promising and is
named as the first thing to re-examine. None of that is the blocker, though —
the coordinates are.

**What ships instead:** nothing decorative. No greyed-out map panel, no "coming
soon", no disabled location button. The results register stays the whole
discovery experience, which §25 already makes the accessible, failure-safe path,
and **proximity is expressed as shared administrative area rather than as a
distance** — "in your commune" is a fact Nidz can support without a coordinate;
"2.1 km away" is not.

The document also fixes the rules a future map must obey — approximate by
construction rather than by rounding an exact position that was already sent to
the browser, commune area never a house, no false precision, list works with the
map off, lazy-loaded, attributed — and the six geolocation outcomes to handle
when it becomes possible.

**To unblock:** a licensed, sourced set of commune positions. That single item
turns on the map, area markers and coarse proximity. Everything else is
scaffolding around an empty middle until it exists.

---

### Group 6 — auth gateway and the fast owner account

**Partial.** The foundations landed; the two screens did not.

**THE MOST IMPORTANT THING THIS GROUP FOUND HAS NOTHING TO DO WITH AUTH.**

`npx tsc --noEmit` — the command in this audit's brief, in `CLAUDE.md`, and in
every "tsc: 0 errors" line reported in Groups 1 to 5 — **type-checks nothing in
this repository**. `tsconfig.json` is a solution file: `"files": []` plus
project references. Without `-b`, `tsc` compiles the empty file list and exits
0. It reports success on a codebase with real type errors in it.

It was hiding one. Group 4 removed the `Select` imports from
`components/shared/fields.tsx` while another field in the same file still used
them — `Cannot find name 'Select'`, a **value** that would be `undefined` at
runtime and crash that screen. `npm run build` did not catch it either, because
Vite strips types rather than checking them. The bug is fixed, and
`npm run typecheck` (`tsc -b --force`) now exists and is documented in
`CLAUDE.md` and the regression checklist. `--force` matters as well: `tsc -b`
caches and will skip a project it believes is unchanged.

Worth knowing alongside it: `tsconfig.app.json` sets `"strict": false`, so even
the real checker is more permissive than it looks.

**Delivered**

- `src/auth/providers.ts` — the sign-in boundary. Google, Microsoft and phone
  are declared with `available: false` and a stated reason, in one place, so
  marking one available without wiring it would be a deliberate act rather than
  drift. No OAuth client, no token, no session, no OTP sender, no verifiable
  code. The future phone-verification states are written down so nobody
  implements a subset and calls the result "verified".
- **`bird` is a real third species.** Not a dog with different copy: a bird has
  a cage rather than a garden, is let out rather than walked, and escapes
  differently. Adding it creates no supply — no demo sitter accepts birds, so a
  bird search finds nobody, which is the honest zero state §33 asks for.
- **Account model for §16**: date of birth (private, eligibility only, never
  rendered publicly), wilaya and commune, and owned species as a multi-select.
  Fields not yet asked for are `null` / `[]` — genuinely unknown rather than
  defaulted into something that would read as an answer.
- **The simulated phone verification is gone.** `phoneConfirmed` became
  `accountComplete`, which is what every guard in the app was actually asking.
  The old name described a fake code step; §92 forbids claiming an SMS was sent,
  and the cleanest way to stop claiming it is to stop having it.

**The two screens (second pass)**

`/auth` — the gateway. The three providers render from the descriptors as
`disabled` controls with the reason stated **once, in text**, and wired to each
button through `aria-describedby` so a screen-reader user hears *why* rather
than only *that*. They are not buttons that respond to a tap with an apology:
that is the decorative dead button §71–83 names. Which framing the screen uses
is decided by `hasWorkingProvider()`, so connecting a real provider changes this
screen by itself. A `DemoNotice` at full weight states that nothing here
verifies anyone — this is the single most tempting screen in the product on
which to imply an identity was proven. Underneath sit the two paths that do
work: create a local identity, or keep browsing. §15 makes the guest exit
first-class, not small print.

`/owner/account` — one screen, replacing 1.1's name → phone → **simulated code**
→ continue. Every field passes the §96 test in a comment beside it. Date of
birth is private and deliberately **not** used as an age gate: §52 sets an
adults-only rule for *sitters* and says nothing about owners, so enforcing one
here would invent a product rule nobody has decided. It is validated as a real
past date and nothing more. Phone is optional, unverified and private by
default (§78).

Both `next` parameters are restricted to same-origin paths — the gateway is
exactly where someone would try an absolute URL as an open redirect.

**Routing.** The request summary *is* the request flow now: `/owner/request/:id`
renders it, and the three retired addresses redirect there carrying their search
so the summary still knows which service and dates were asked for. The account
gate fires at the summary rather than at the door, because everything before it
— browsing, filtering, reading a profile — genuinely needs no identity.

**Verified end to end in the browser**: sitter profile → "Request care" →
`/auth?next=…` → create account → back to the summary → on to the pet step
(correctly, because no animal had been chosen yet). The account lands with all
fields set, `accountComplete: true` and `capabilities.owner: true`.

**One bug the browser caught that the toolchain could not**: adding `bird` to
the species enum left `species.bird`, `speciesPlural.bird` and `accepts.bird`
untranslated, so the chip rendered the raw key `species.bird`. Fixed, along with
the four strings that enumerated "dog or cat" in prose.

---

### Group 7 — the multi-pet system

**Completed.** The core domain change of Audit 1.2 (§17–19).

**A bird is not a dog with different copy.** `Pet` is a discriminated union over
species, not one flat record with conditionally-hidden fields. That distinction
is the whole point: a hidden field still holds a value, and a value nobody was
asked for is a fabricated declaration waiting to be rendered. A budgerigar has
no "walks per day" — not blank, not zero, not hidden. Verified in the browser:
switching the species swaps size / walks / lead for kind / housing / handling /
time-out-of-cage / noise, with no dog field anywhere.

**Unknown is an answer.** Almost nothing here is a boolean. "Is your dog good
with cats?" has three honest answers and one of them is "I don't know" — an
owner who has never seen it cannot say "no", and a sitter reading "no" would
decline for a reason that does not exist. `Declared` carries yes / no /
unknown, and `unknown` is the default, so a skipped question stays skipped
instead of quietly becoming a claim. Same rule as the sitter's `null` housing
type (regression checklist B1).

**Progressive (§19).** A name and a species make a usable pet; the need flow
still asks only that. Everything species-specific lives on the animal's own
screen. The list shows an answered-question count that is **administrative
only** — §118's rule applies to animals too, so it is never quality, health or
suitability, and the copy says it is there to help decide whether a sitter can
judge the animal properly.

**Care detail is private** (§83): feeding, medication, vet and emergency
contact sit in their own record, so "what a sitter sees" and "what is only
shared with someone actually caring for the animal" stay structurally
separable rather than separated by discipline.

**Storage v3, with no version branch for pets.** `restorePet` reads every shape
Nidz has shipped and is applied on all paths. Verified against a seeded Audit
1.1 record: a dog's `size: "large"` survives — the owner really did give that —
and every question the old shape never asked comes back `unknown`. Nothing is
inferred: a dog is not assumed good with cats because the field is missing.
Validation is per pet rather than per array, so one corrupt animal costs that
animal and not the list.

**Deleting an animal** is confirmed, clears a `need.petId` pointing at it, and
leaves already-sent requests untouched — a request keeps its own copy, so
deleting an animal never rewrites what a sitter was asked to look after.

**Two housekeeping fixes:** `SPECIES_ICON` was written out four times as
`s === "dog" ? Dog : Cat`, which is exactly the shape that silently drops a
species when a third is added — a ternary has no third branch and the compiler
cannot see the gap. It is now one `Record<Species, …>` that fails to compile
instead. And `tsc -b` writes `*.tsbuildinfo`, a local cache that had been
committed in Group 6; it is now ignored and untracked.

---

### Standing constraint on scope

Where a requirement cannot be met without infrastructure that does not exist
(OAuth, OTP, identity verification, payment, file storage, a moderation backend,
a server-side clock for double-blind review windows), the deliverable is
**truthful architecture plus appropriate UI**, never simulated functionality
dressed as real. That choice is recorded per feature in the final report's
truth table.
