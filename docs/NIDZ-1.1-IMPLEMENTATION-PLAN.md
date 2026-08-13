# NIDZ 1.1 Implementation Plan

Current branch: nidz-1.1

> **Rule:** Always resume from the first unchecked group. Do not start a later group before the current group has been implemented, reviewed, built, visually verified, committed, and pushed.

This plan consolidates the original 22-batch sequencing into 9 implementation groups. Source: `docs/Audit 1.1.md`, `CLAUDE.md`, and `.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md`.

---

## Progress

- [x] Group 1 — Nidz rebrand and public navigation cleanup
- [x] Group 2 — Global design system and interaction primitives
- [x] Group 3 — Demo foundations: honesty primitives, fixtures, state store, and routing shell
- [x] Group 4 — Entry flow and owner need-definition flow
- [ ] Group 5 — Search results and sitter profile
- [ ] Group 6 — Owner account, simulated OTP, request flow, and My Requests
- [ ] Group 7 — Sitter onboarding, profile builder, trust step, preview, and publish
- [ ] Group 8 — Sitter requests and role-specific navigation
- [ ] Group 9 — Final demo-path cleanup, required states, i18n, RTL, accessibility, lint and build verification

---

## Cross-cutting rules

These apply to every group and are not repeated per group:

- Gate per group: `npm run lint` → `npm run build` → manual pass in **en / fr / ar**, mobile + desktop viewport.
- Every string added goes into all three locale files. No hardcoded display copy. The audit's French labels are **source copy**, not the shipped string.
- Directional CSS uses logical properties / `tailwindcss-rtl`. The audit's "back button top-left" means **inline-start**, which is top-right in Arabic.
- Any simulated behavior (OTP, request send, geolocation, verification) renders with an explicit demo marker. No invented review counts, ratings, availability, distances, or "Identité vérifiée".
- No new npm dependencies — `input-otp`, `calendar`, `progress`, `sheet`, `radio-group`, and `form` are already installed.

---

## Group 1 — Nidz rebrand and public navigation cleanup

**Original batches:** 1 (plus the chrome items the ui-designer review split out separately)

**Goal:** Replace the legacy product name `PetLink DZ` with `Nidz`; hide Admin from public navigation without deleting the `/admin` route; fix the Footer (i18n + `Link` instead of raw `<a>`); add the missing `home.searchCta` key, which was called in `Header.tsx` and `Hero.tsx` but absent from all three locale files, so the header CTA rendered the raw key string.

**Dependencies:** None.

**Risk:** Low.

### Status: COMPLETE

- [x] Implementation completed
- [x] Code-reviewer completed — no Critical issues; Warning 1 (stale `CLAUDE.md` naming note) fixed; Warning 2 (do not describe Admin as protected) honored in reporting
- [x] Build passed — `npm run build`, 1762 modules, 464.80 kB JS / 148.08 kB gzip; `dist/manifest.webmanifest` verified as `"name":"Nidz"`
- [x] Visual verification passed
- [x] Lint — still only the pre-existing baseline issues: **4 errors, 7 warnings**, all in untouched files (`ui/command.tsx`, `ui/textarea.tsx`, `tailwind.config.ts`, plus react-refresh warnings in shadcn primitives). Zero issues in any file this group touched.
- [x] Committed: **f96cf3c**
- [x] Pushed to `origin/nidz-1.1`

**Files changed (19, +601/−24):** `vite.config.ts`, 11 files in `src/pages/`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/locales/{en,fr,ar}.json`, `CLAUDE.md`, and `docs/Audit 1.1.md` (new file).

### Open items carried forward

- **`Nidz` vs `NIDZ` casing** — the code uses `Nidz` (matching `common.appName` and `index.html`); the audit writes `NIDZ`. Switching is a 4-line change across 3 locale files and the manifest.
- **`/admin` is still publicly reachable by direct URL** with no authentication gate. It was removed from navigation only. Route gating belongs to Group 9.
- **`vite.config.ts` `theme_color: '#4f46e5'`** is still the stale indigo, confirmed present in the built manifest. Deferred to Group 2 as a palette value.

---

## Group 2 — Global design system and interaction primitives

**Original batches:** 2, 3, 4

**Goal:** Teal palette (HEX→HSL) mapped onto the **existing** shadcn token names, plus the missing tokens (`surface`, `primary-hover`, `primary-soft`, `accent-soft`, `control-border`, `success`, `warning`, `info`, pending); radii 8/12/16/24; delete gradients, `shadow-elegant`, `hover-scale`, and the `hero` button variant; ≥44px touch targets across Button **and** input/select/checkbox/radio/tabs; motion capped to 160–220ms plus `prefers-reduced-motion`; restrict `font-display`; decide the fate of `.dark`; delete or repurpose the orphaned `Hero.tsx` / `FeaturedSitters.tsx` (neither is rendered — `Index.tsx` imports only `RoleSelection`, and `FeaturedSitters` carries hard-coded ratings that would otherwise resurface as fake reputation).

**Main files:** `src/index.css`, `tailwind.config.ts`, `ui/button.tsx`, `ui/input.tsx`, `ui/select.tsx`, `ui/textarea.tsx`, `components/home/*`, `pages/Search.tsx`.

**Dependencies:** Group 1.

**Risk:** Medium–High.

**Constraints identified during review:**
- **Do not repurpose `secondary` to terracotta.** The `secondary` Button variant is a live equal-weight CTA (`RoleSelection.tsx:53`), so terracotta there creates competing warm CTAs. Keep `secondary` neutral; put terracotta on `accent`, never on a button.
- **Verify `#7C8B86` against the ≥3:1 non-text contrast target** before adopting it for control borders.
- Tailwind does not error on removed utility classes, so the gradient/shadow/hover-zoom sweep must be grep-driven, not compile-driven.

### Status: COMPLETE

- [x] Terracotta placed on a separate `--brand` token, never on a control; CSS `--accent` kept as shadcn's neutral hover/selection surface. Both documented at the top of `src/index.css`.
- [x] `#7C8B86` adopted as `--input` (control boundary) at 3.41:1 on `--background` / 3.56:1 on `--card`; `--border` stays decorative-only.
- [x] Radius scale 8/12/16/24; `rounded-2xl` / `rounded-3xl` removed from the scale.
- [x] ≥44px targets across Button, input, select, checkbox, switch, tabs; Search's two Sliders replaced by worded chips (a 20px thumb missed the floor and the axis reversed meaning in RTL).
- [x] Motion capped to §24 durations, `prefers-reduced-motion` honored globally via `animation-duration: 0.01ms` (not `none`, so Radix still receives `animationend`).
- [x] `/search` rebuilt as need-definition → results, with the brief rail, the ruled honesty notice and the hairline register.
- [x] Build passed; lint unchanged at the pre-existing baseline (4 errors, 7 warnings, all in untouched files).
- [x] Browser-verified: need state, results state, 390×844 (no horizontal overflow), Arabic RTL (`dir="rtl"`, full AR copy, DZD via `formatDZD`). 0 console errors.
- [x] Committed **e13f4fb**, pushed to `origin/nidz-1.1`.

---

## Group 3 — Demo foundations: honesty primitives, fixtures, state store, and routing shell

**Original batches:** 5, 6, 7, 8

**Goal:** Build `BackButton` (RTL-safe, inline-start), `ScreenHeader`, `DemoNotice`, `ProvenanceLabel`, `EmptyState`, `ErrorState`, skeleton, `StatusBadge`, `Chip`, `ProgressIndicator`, `UploadField`, and `SitterCard`; extract fixtures to `src/data/demo-*.ts`; define the **shared request type**; add the demo state store (context + `sessionStorage`); add a `Layout` opt-out for full-screen routes.

**Main files:** new `components/shared/*`, `data/demo-*`, `state/demo/*`; `App.tsx`, `Layout.tsx`, `Search.tsx`.

**Dependencies:** Group 2.

**Risk:** Medium. Not user-visible on its own; the routing change touches every route. The request model alone blocks five later screens (récapitulatif, succès, Mes demandes, demandes reçues, après acceptation).

### Status: COMPLETE

**Data boundary** — `src/data/types.ts` (domain model), `src/data/locations.ts` (wilaya → commune, a deliberately partial launch subset with no count ever rendered), `src/data/demo-sitters.ts` (the only sitter fixture in the app; declared unavailability authored as day offsets so it never drifts into the past).

**State** — `src/state/demo/{reducer,context,DemoProvider}.tsx`: one `useReducer` behind a context, mirrored into `localStorage` under `nidz.demo.v1`. No store library: the platform already provides what a dozen actions need. Object-URL photo previews are stripped before persisting, because a persisted object URL points at nothing after a reload.

**Primitives** — `components/shared/`: `Chip` (extracted from Search), `OptionGroup` (Radix radio rows, so arrow keys work), `FlowScreen` (the shell every wizard step uses), `trust.tsx` (`ProvenanceLabel` — throws in dev if a category with no mechanism is rendered — plus `DemoNotice` / `DemoLine`), `StatusBadge`, `EmptyState`, `fields.tsx` (`FieldShell`, `SelectField`, `PhotoField`, `DocumentField`).

**Routing** — `Layout` became a layout route rendering `<Outlet/>`, so flow screens can sit outside the chrome. Public profiles moved to `/sitters/:id`; `/sitter/*` is now unambiguously the sitter's own area, with `/sitter/:id` kept as a redirect so old links still resolve.

**Consolidation** — `Search.tsx` migrated onto the fixtures (design untouched); `communes.*` and `sitters.*` locale keys retired in favour of the data module; `species` / `speciesPlural` / `accepts` / `care` / `care.unit` promoted to top-level namespaces shared by every group; orphaned `FeaturedSitters.tsx` deleted (it carried a second, contradictory sitter fixture).

**Code review** — one Critical, fixed and browser-verified: `rateFor` fell back to the globally cheapest rate whenever two or more services were requested, so a "boarding or home visits" search headlined a sitter at her 700 DZD *walk* price — and because `/search` filters on that same amount, she also passed a budget her real prices exceeded. It became reachable only in this group, when the fixture gained sitters offering three services. Fixed by pooling over the requested services; `offeredServices()` is now the single answer to "what does this person do" (`services` declares, `rates` prices).

Also from the review: `loadState` validates each slice instead of asserting `as Partial<DemoState>` (localStorage is user-writable, and a hand-edited key must not white-screen the app); `DemoProvider` no longer writes storage on first paint; `ProvenanceLabel` throws only in dev; `FieldShell` hands the ARIA wiring to the control so help/error text is actually announced; `SelectField` no longer double-labels; `PhotoField` revokes object URLs on unmount and re-fires on the same file; legacy commune codes normalise instead of silently resolving to "all areas"; the profile stub no longer advertises "reviews"; `min-h-dvh` throughout; the legacy `/sitter/:id` redirect preserves query and hash; one RTL mechanism (`[dir="rtl"]`); bottom scroll padding scoped to the flow shell.

- [x] Build passed; lint unchanged at baseline; `tsc --noEmit` clean; en/fr/ar structurally identical with every referenced key resolving.
- [x] Browser-verified `/search` renders from the fixtures, links resolve to `/sitters/:slug`, 0 console errors.
- [x] Committed and pushed to `origin/nidz-1.1`.

---

## Group 4 — Entry flow and owner need-definition flow

**Original batches:** 9, 10

**Goal:** Splash (first-visit only, sub-400ms, skipped on reload and under reduced-motion, never blocking a deep link) → intro → intent, replacing `RoleSelection` on `/`. Then the owner need wizard: espèce (chien/chat only) → animal → lieu with privacy note → dates → type de garde.

**Main files:** new `pages/onboarding/*`, `pages/owner/need/*`; `App.tsx`. Wilaya/commune must be an updatable data module, never a hardcoded count.

**Dependencies:** Group 3.

**Risk:** Medium. Largest new surface so far — split per step if it grows.

### Status: COMPLETE

**Routes** (all chrome-free, outside the layout route): `/welcome` → `/start` → `/owner/need/pet` → `/owner/need/location` → `/owner/need/care` → `/search?…`. `/` is now the returning-visitor home and redirects to `/welcome` until the introduction has been seen.

**The contract** — `src/data/criteria.ts`. The pre-implementation design review found the plan's worst structural flaw: the dates step asked a question `/search` could not answer, and `OwnerNeed` was single-valued while the search criteria were arrays, so the two could not round-trip. Both are now one single-valued model. The URL stays canonical for results (linkable, Back works); the demo state carries the animal, which is not a shareable query. `matchSitters()` holds the hard-constraint filter and returns concrete compatibility reasons — never a score (§8.2, §8.3).

**Three steps, not four** — the animal, the place, then care-and-dates together. Care type and dates depend on each other: a walk is one day, boarding is a run of nights, home care is a period of visits. Splitting them would mean going back a step to change the answer, and asking for a range before knowing the service asks a question the product cannot use.

**Deliberate deviations from the audit, all for honesty:**
- **"J'ai déjà un compte" is not shipped.** There is no sign-in, no session and no server. An authentication affordance on the first screen anyone sees would promise something Nidz cannot do, and a disabled one advertises the capability *and* blocks it. The slot goes to "Voir les pet-sitters", which exists.
- **No "utiliser ma position".** Geolocation returns coordinates and nothing here can turn coordinates into a commune, so the control could only pretend to work.
- **The `/search` need panel was deleted.** Defining a need is the flow; `/search` is results plus the edit sheet. Two differently-shaped forms for one job could disagree with each other (§5.2).
- **Availability is stated as declared, never as confirmed.** A sitter who has not declared a period busy is not "disponible", and both the care step and the results say so.

**Deleted:** `RoleSelection.tsx` (two equal-weight CTAs, the competing-primaries pattern §4.2 forbids, superseded by the intent screen) and the orphaned `Hero.tsx`.

**Browser-verified in Chromium:** the whole journey from a cleared browser through to results at 390×844; Arabic RTL at 320×640 with no horizontal overflow and state preserved; desktop 1440×900. 0 console errors. Two defects were found this way and fixed — the animal-name field had lost its accessible name to an overridden `id`, and the visually-hidden file inputs were phantom tab stops.

- [x] Build passed; lint unchanged at baseline; `tsc --noEmit` clean; 145 keys × 3 locales in sync.
- [x] Committed and pushed to `origin/nidz-1.1`.

---

## Group 5 — Search results and sitter profile

**Original batches:** 11, 12

**Goal:** Extract `SitterCard` first, then rework results: retitle to "Pet-sitters adaptés à votre recherche" **only once filtering actually works**, move filters into a `Sheet`, single CTA, all six states. Then build **one** profile-view component — the audit requires the sitter's own preview to be "exactement le même profil", which makes this the strongest ordering constraint in the document.

**Main files:** `pages/Search.tsx` (extend — keep route, Helmet, `search.*` keys, slider state, grid breakpoints, `max-w-6xl`, leading-icon input), `pages/SitterProfile.tsx`, new `components/sitter/*`.

**Dependencies:** Group 4.

**Risk:** Medium–High. `Search.tsx` is the only substantial working screen; do not rewrite it wholesale.

**Honesty constraints:** drop `4,9 · 18 avis`, `Disponible du 12 au 16 août`, `1,2 km`, `Identité vérifiée`, and the availability filter — all invented data with no source. Use commune/zone instead of distance, and §7 cold-start signals instead of ratings.

---

## Group 6 — Owner account, simulated OTP, request flow, and My Requests

**Original batches:** 13, 14, 15

**Goal:** Deferred account creation (nom → téléphone → OTP) → récapitulatif → "Envoyer ma demande" → succès → Mes demandes with détail and empty state. Never "Réserver" or "Payer".

**Main files:** new `pages/owner/account/*`, `pages/owner/request/*`; `pages/OwnerBookings.tsx`; `ui/input-otp.tsx`.

**Dependencies:** Group 5. Mes demandes must ship **with** the confirmation flow — a request list with no way to create a request is a static fake.

**Risk:** Medium. Highest honesty risk: the OTP demo notice must be persistent and visible, not a footnote. "Grande animation de validation" reads as 200–300ms honoring `prefers-reduced-motion`.

---

## Group 7 — Sitter onboarding, profile builder, trust step, preview, and publish

**Original batches:** 16, 17, 18

**Goal:** Intro → identité (reusing Group 6's OTP) → localisation → 8-step profile builder with a discreet progress indicator → pièce d'identité showing **"Vérification en attente"**, never auto-promoting to a verified badge → aperçu reusing the Group 5 profile component → publié.

**Main files:** `pages/SitterRegister.tsx` (keep `max-w-2xl`, the already-correct visible `Label`+`Input` pairing, avatar upload, dashed drop-zone → `UploadField`; replace the two `flex-1` equal-weight buttons and the verification copy that promises verification), new `pages/sitter/*`.

**Dependencies:** Groups 5, 6.

**Risk:** High. By far the largest surface in the audit — recommend 2–3 sub-batches. Also the most important honesty boundary.

---

## Group 8 — Sitter requests and role-specific navigation

**Original batches:** 19, 20

**Goal:** Demandes reçues with détail and accepter/refuser, après acceptation, status reflected on the owner side, and bottom navigation.

**Main files:** `pages/SitterDashboard.tsx`, new `layout/BottomNav.tsx`, `Layout.tsx`, `use-mobile.tsx`.

**Dependencies:** Groups 6, 7. Navigation can only list destinations that exist — Messages stays out while `Chat.tsx` is a stub.

**Risk:** Medium.

**Constraints identified during review:**
- **Two fully separate bottom navs contradict design system §22** and the audit's own "ce choix ne crée pas deux comptes différents". Prefer one nav with a visible context switch.
- **"Refuser" is a normal outcome, not destructive** — do not colour it red.

---

## Group 9 — Final demo-path cleanup, required states, i18n, RTL, accessibility, lint and build verification

**Original batches:** 21, 22

**Goal:** Remove stubs from navigable paths; verify every data screen has loading / empty / error / pending / accepted / no-requests states; confirm locale files are complete and in sync across en/fr/ar; RTL layout pass; contrast, focus order, keyboard, and touch targets; all money through `formatDZD`; final `npm run lint` and `npm run build`.

**Main files:** `App.tsx`, remaining stubs, `locales/*`, spot fixes.

**Dependencies:** Group 8.

**Risk:** Low–Medium.

**Constraint identified during review:** **do not delete routes** — deleting breaks deep links and browser back. Hide from navigation and serve a clear "non disponible dans cette démonstration" screen rather than a 404. This is also where `/admin` route gating is handled.
