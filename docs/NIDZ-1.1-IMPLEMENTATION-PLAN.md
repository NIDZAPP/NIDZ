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
- [x] Group 5 — Search results and sitter profile
- [x] Group 6 — Owner account, simulated OTP, request flow, and My Requests
- [x] Group 7 — Sitter onboarding, profile builder, trust step, preview, and publish
- [x] Group 8 — Sitter requests and role-specific navigation
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

### Status: COMPLETE

**One profile component.** `components/sitter/SitterProfileView.tsx` owns no layout chrome — no container, no measure, no sticky bar, no `<Helmet>` — because the audit requires the sitter's own preview to be "exactement le même profil" and the preview will embed it inside `FlowScreen`, which supplies its own. `headingLevel` exists for the same reason.

**Six sections, not ten.** The audit's list is a content inventory; as headings it would have been the grey stack §20 and §40 warn against. Collapsed into three registers: a lede (identity, why this fits), narrative (about with experience folded in, how the animals are kept), and facts (in practice, what I cannot accept, declared unavailability). Care methods are first-person sentences rather than four chips — §20's question is whether an owner can picture the stay concretely, and tokens cannot answer it.

**What the profile refuses to do.** No photograph (a stock portrait presented as a sitter is §21/§40's named anti-pattern; the monogram stays at card scale, and the name carries the identity). No red on "ce que je ne peux pas accepter" — a sitter declining an animal their home does not suit is the matching working, not a danger. Prices are a menu at body scale, not a pricing grid, and carry "Nidz ne gère aucun paiement" because §28 says the payment model is unvalidated. Declared unavailability is labelled with the same sentence the need flow uses: not-declared-busy is not a reservation.

**Mismatches are volunteered.** When the visitor's criteria are not all satisfied, the profile says so — muted, with a minus, never red. A marketplace that tells an owner "this sitter takes only dogs" has been useful.

**`reasonsFor` verifies, it does not echo.** `matchSitters` can get away with echoing criteria back because it filters first; a profile cannot — `/sitters/karim-b?species=cat` is a URL anyone can type. Every reason is checked against the sitter's own data before it is emitted.

**Reason density.** `partitionReasons` hoists the reasons true of every result into one line above the register, leaving only what actually distinguishes one sitter from another on the row. Two bugs were found doing this and fixed: all `zone` reasons collapsed to a single key, so a wilaya-wide search asserted one sitter's commune was true of all of them; and a wilaya match reported the sitter's commune rather than the wilaya, duplicating the location already printed under the name.

**Code review** — three Critical, all product-truth, all fixed:
1. **The profile never marked a fictional sitter as an example.** `isDemoFixture` was read on exactly one surface (the result card), while the profile was explicitly designed as shareable — so a visitor opening a shared `/sitters/amina-b` saw a complete, plausible profile of a person who does not exist, under a line reading "Informations fournies par le pet-sitter". The demo notice now renders on the profile too.
2. **"Pourquoi ce pet-sitter correspond" was printed over content that was nothing but a mismatch** — and with a pet in state, "Bien adapté à Mimi" directly above the reason it is not. The heading now names what is actually underneath it.
3. **The pet's name was asserted against criteria that may describe another animal.** It is now used only when the criteria still describe that pet's species.

Also fixed: the mismatch list covers location and budget, not just species/care/dates; the quoted rate is suppressed rather than silently switched to another service; `hasCriteria` is computed once and passed down (a wilaya-only search had been losing its only explanation); `reasonKey` is exhaustive so the next value-carrying reason cannot re-create the universal-zone bug; single-result sets keep their reasons on the row; `noCat` joins `dates` in the absence register, because both are equally true of a sitter who never answered; the profile survives an empty profile (Group 7 embeds it); `housing.conditions` is no longer dropped when no care method is selected; unpublished drafts 404 on the public route; `has-pinned-action` is media-scoped, since `:has()` matches the document tree and `xl:hidden` does not stop it.

- [x] Build passed; lint unchanged at baseline; `tsc --noEmit` clean; 202 base keys × 3 locales in sync, with real Arabic plural categories.
- [x] Browser-verified: profile at 1440×900 and 390×844, Arabic RTL with no horizontal overflow, unknown-id not-found state, empty results, the legacy `/sitter/:id` redirect preserving its query string, 0 console errors.
- [x] Committed and pushed to `origin/nidz-1.1`.

**Carried into Group 6:** the profile CTA leads to `/owner/request/:sitterId` (name), whose "Continuer" targets the phone step that Group 6 adds.

---

## Group 6 — Owner account, simulated OTP, request flow, and My Requests

**Original batches:** 13, 14, 15

**Goal:** Deferred account creation (nom → téléphone → OTP) → récapitulatif → "Envoyer ma demande" → succès → Mes demandes with détail and empty state. Never "Réserver" or "Payer".

**Main files:** new `pages/owner/account/*`, `pages/owner/request/*`; `pages/OwnerBookings.tsx`; `ui/input-otp.tsx`.

**Dependencies:** Group 5. Mes demandes must ship **with** the confirmation flow — a request list with no way to create a request is a static fake.

**Risk:** Medium. Highest honesty risk: the OTP demo notice must be persistent and visible, not a footnote. "Grande animation de validation" reads as 200–300ms honoring `prefers-reduced-motion`.

### Status: COMPLETE — committed **040068a**

The code step is simulated and says so in a full-weight `DemoNotice` above the field: no SMS, no provider, any six digits, and completing it does not mean the number was verified. `phoneConfirmed` records only that the step was taken.

**Deviation:** `+213` is a fixed prefix, not the country selector the audit asks for. Nothing in this demonstration does anything with a phone number, and a selector that changes nothing is worse than an honest constant.

The record is built once and the summary renders that object — building it twice let a service the sitter did not offer show no price on the summary and then acquire one, for a different service, on the screen after it. Missing care type or dates redirects to the step that collects them rather than substituting a default. `Mes demandes` and the request detail carry the demo marker, because they are the screens an owner returns to and they are deep-linkable.

---

## Group 7 — Sitter onboarding, profile builder, trust step, preview, and publish

**Original batches:** 16, 17, 18

**Goal:** Intro → identité (reusing Group 6's OTP) → localisation → 8-step profile builder with a discreet progress indicator → pièce d'identité showing **"Vérification en attente"**, never auto-promoting to a verified badge → aperçu reusing the Group 5 profile component → publié.

**Main files:** `pages/SitterRegister.tsx` (keep `max-w-2xl`, the already-correct visible `Label`+`Input` pairing, avatar upload, dashed drop-zone → `UploadField`; replace the two `flex-1` equal-weight buttons and the verification copy that promises verification), new `pages/sitter/*`.

**Dependencies:** Groups 5, 6.

**Risk:** High. By far the largest surface in the audit — recommend 2–3 sub-batches. Also the most important honesty boundary.

### Status: COMPLETE — committed **98fbbf7**

Six builder steps rather than the audit's nine sections: photo and experience are one question about the person, services and prices depend on each other, housing and care method describe one environment. §4.5 warns against ten artificial screens, and an exhausting builder is the most reliable way to lose a sitter halfway through.

**The trust boundary holds.** Adding a document produces no verified state — there is no `verified` field in the model to set — and the screen states that a document does not make an identity verified, because Nidz has no verification process. The status line says "document ajouté, aucune vérification n'a lieu" rather than "vérification en attente": nothing is waiting.

**One implementation, twice.** The three identity screens moved into `components/account/AccountSteps.tsx` and both sides render them. The preview renders the same `SitterProfileView` the owner's `/sitters/:id` renders, at `headingLevel="h2"`.

**Found by browser testing:** the published screen claimed the profile now appears in search results, and it did not — `/search` only ever read the fixtures. Publishing now adds the profile to the pool, and the `/search` demo notice is scoped to fixtures so a real published profile is not called fictional.

Housing type and outdoor space start unanswered and are required: a default pressed through would have been published as a declaration nobody made, under a line reading "informations fournies par le pet-sitter". The legacy `SitterRegister` page, which promised verification, was deleted.

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

### Status: COMPLETE

One bottom bar below `md`, not two. §22 is explicit that one person may progressively have both uses and that Nidz must not become two applications, so the sitter's inbox is an additional destination on the same bar rather than a separate bar behind a mode switch. It appears only once a sitter profile exists.

**Every destination is a screen that exists.** The audit's lists mention Messages, Mes animaux, Disponibilités and Compte; none of those exist as real screens, so none appear. The header lost "Mes animaux" and "Tableau de bord" (both stubs) and its duplicate "Trouver un pet-sitter" CTA, which competed with the nav link beside it.

"Refuser" is a secondary outline button, not red. Accepting states plainly that it is not a booking and that Nidz handles no reservation, payment or insurance.

**Two Criticals found by review, both fixed:**

1. **The bottom bar covered the sitter profile's primary action.** Both bars pinned to `bottom: 0` in the root stacking context, so the nav (z-40) sat over the CTA (z-30) and a tap at the centre of "Demander une garde" navigated to `/owner/requests` instead. Measured: CTA 584–632, nav 601–659. The profile bar now offsets above the nav below `md`. Re-measured after the fix: CTA 529–577, nav 602–659, centre tap hits the button.

2. **"Demandes reçues" was structurally unreachable.** Group 7's fix for "your own profile should not invite you to request care from yourself" removed the only interface path that could address a request to your own profile — so the tab could never hold anything, while its own copy described content it could not have. The profile now carries an explicitly-labelled demonstration control ("Tester le côté pet-sitter — cette démonstration n'a pas d'autres utilisateurs"), which is honest about what it is and makes the loop reachable.

**Correction to an earlier claim in this document:** the Group 7 entry said the loop was browser-verified. It was — but the request was created by navigating directly to `/owner/request/my-profile`, not through the interface, which is exactly why the unreachability above went unnoticed. The loop has since been walked end to end using only on-screen controls: profile → "M'envoyer une demande de test" → name → phone → simulated code → summary → send → Demandes reçues → Accepter → the owner's row reads *Acceptée*.

Also fixed from the review: the fourth tab now keys on `published` rather than on the sitter flow having been opened once; header and bar use the same labels for the same destinations (crossing 768px renamed every tab); the active tab carries a top rule and a heavier label, not colour alone; each pinned layer has its own scroll-padding hook at the breakpoint it exists at (one class carrying two breakpoint meanings had reserved 96px of dead gap on every screen that pinned nothing); a published sitter has a route back to their own profile.

**Browser-verified:** Arabic RTL at 390×844 and 320×640 with no horizontal overflow; 0 console errors.

---

## Group 9 — Final demo-path cleanup, required states, i18n, RTL, accessibility, lint and build verification

**Original batches:** 21, 22

**Goal:** Remove stubs from navigable paths; verify every data screen has loading / empty / error / pending / accepted / no-requests states; confirm locale files are complete and in sync across en/fr/ar; RTL layout pass; contrast, focus order, keyboard, and touch targets; all money through `formatDZD`; final `npm run lint` and `npm run build`.

**Main files:** `App.tsx`, remaining stubs, `locales/*`, spot fixes.

**Dependencies:** Group 8.

**Risk:** Low–Medium.

**Constraint identified during review:** **do not delete routes** — deleting breaks deep links and browser back. Hide from navigation and serve a clear "non disponible dans cette démonstration" screen rather than a 404. This is also where `/admin` route gating is handled.
