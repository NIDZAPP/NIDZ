# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm i              # install dependencies (Node.js + npm required)
npm run dev        # start Vite dev server on http://localhost:8080
npm run build      # production build
npm run build:dev  # build in development mode
npm run preview    # preview the production build locally
npm run lint       # run ESLint over the repo
npm run typecheck  # tsc -b --force — see the warning below
npm run check:locales  # three-locale parity, plural completeness, key usage
npm run test:unit  # domain unit tests (node:test via Vite's loader) — tests/unit/
npm run test:e2e   # Playwright browser checks per Audit 1.3 lot — needs a dev server on :8080
node e2e/audit-layout.mjs [filter] [--langs=fr] [--widths=320,390]  # overflow / overlap / truncation sweep, every screen 320px→1440px × fr/en/ar
```

**`npx tsc --noEmit` type-checks NOTHING in this repo, and never has.** `tsconfig.json` is a solution file: `"files": []` plus project references. Without `-b`, `tsc` compiles the empty file list and exits 0 — so it reports success on a codebase with real type errors in it. Audit 1.2 found this the hard way: it was silently passing while `fields.tsx` referenced a `Select` component whose import had been removed, which would have crashed a live screen. Use **`npm run typecheck`** (`tsc -b --force`). `--force` matters too, because `tsc -b` caches and will skip a project it believes is unchanged.

There is **no test framework dependency**. Audit 1.3 added two harnesses that need none: `npm run test:unit` runs `tests/unit/*.test.ts` with Node's built-in `node:test`, loaded through Vite so the `@/` alias and TypeScript resolve; `npm run test:e2e` drives the real app with the pre-installed Playwright (`e2e/`, one file per lot; start `npx vite --host 127.0.0.1 --port 8080` first). There is still no `npm test`.

**Run `npm run check:locales` after touching any user-facing copy.** Nothing else in the toolchain can see inside `src/locales/*.json`, so a missing string reaches the browser as a raw key in whichever language nobody opened. It checks three-locale parity, that every `t()` literal resolves, and that plural families are complete for each locale — i18next does **not** fall back from a missing `_one` to `_other`, it prints the key. French needs `_many` as well as `_one`/`_other`; Arabic needs all six categories.

## Nidz 1.7 — design skill routing and autonomy (active)

For any UI design or refinement, use **Impeccable** as the primary design lead (visual direction, UX, layout, typography, components and final craft) and **emil-design-eng** as the primary interaction specialist (feedback, motion, gestures, timing and polish). Load both for substantial UI work; for a narrow task, use the relevant lead and consult the other only when its domain is affected. Neither is a fallback to narrower skills. The user's explicit brief determines whether to refine or redesign.

- **Authority:** follow the latest explicit user brief within scope. Product truth, accessibility, privacy, safety and i18n/RTL remain mandatory. Preserve existing functional journeys and the Nidz name/logo and teal/terracotta anchors unless the user explicitly authorizes a product or brand change within the mandatory safeguards. `PRODUCT.md` owns product truth; this routing and the active §0.2 amendment in the Nidz design system own design workflow. `DESIGN.md`, the existing CSS and older visual rules describe the baseline, not a veto on an authorized redesign.
- **Autonomy:** a request to implement or redesign authorizes scoped aesthetic decisions (layout, type, spacing, shapes, surfaces, artwork and purposeful motion) without a separate approval for every choice. Ask only for an unresolved product/brand-anchor change, expansion of scope, irreversible action, paid dependency, or when the user asks for approval before implementation. Honor supplied mockups and explicit constraints. For a comp-led Impeccable workflow, honor its real approval gates; use an appropriate code-led workflow for autonomous work rather than inventing approval. Do not claim a proposed choice was user-approved.
- **Secondary skills:** `animate`, `animation-performance`, `animation-vocabulary`, `choreograph`, `gestures`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `break-ui`, `learn-taste`, `ask-emil`, `pick-ui-library`, `prototype` and `mobile-native` are scoped support, not competing design authorities. Load only what the task needs. `apple-design` is optional inspiration when explicitly requested; `remove-animations` only for a requested motion reduction. `ask-sonner`, `animate-expo`, and `write-swift` are manual-only and out of scope for the current React/Vite app unless a matching migration or integration is explicitly requested. Do not introduce dependencies merely because a skill suggests them.
- **Reviews:** Impeccable's agents remain part of its workflow. Color guardian is a read-only reviewer of brand anchors, semantic color and measurable contrast; code reviewer checks technical correctness. They may flag evidenced violations but must not veto scoped aesthetic decisions merely for differing from the existing UI or personal preference. Resolve substantive findings before shipping; do not treat missing captures as successful reviews. Avoid duplicate reviews of the same concern.
- **Finish:** implement scoped changes, document deliberate design-system changes, check real rendered screens and interactions (mobile/desktop, relevant locales/RTL and reduced motion), and run the existing relevant quality gates. State missing evidence explicitly. No paid tools if a free equivalent suffices.

## Nidz design rules — v1.4 baseline

**Read `.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md` §0.2 and §0.1 first** and use the `nidz-design` skill for UI tasks. `PRODUCT.md` is authoritative for product truth.

**Preserve:** Nidz's logo/name, brand anchors **teal `#0F766E` + terracotta `#A84F32`**, real marketplace journeys, accessibility, privacy, safety, trust provenance, i18n (fr/en/ar) and RTL. Never imply an unimplemented feature (verification, payment, insurance, booking, availability, reviews or real messaging) is functional.

**Visual redesign is explicitly authorized:** old layouts, rigid radius scales, mandatory Inter, card prohibitions, the all-white visual composition and other historical aesthetic prescriptions are **not binding for Nidz 1.4**. The current styles in `src/index.css` and `DESIGN.md` describe what exists, not what must be preserved. The approved direction includes **pill-shaped action buttons** and an appealing, contemporary, warm, mobile-first experience. Use Impeccable / Emil skills and the HaHo Figma reference when genuinely accessible; do not copy template assets without rights.

**Process:** follow the 1.7 autonomy rules above; develop a coherent visual system, update tokens/components and screens in scoped, validated steps, and seek approval only at the stated boundaries. Preserve functional behavior and measure accessibility; do not claim visual tests without screenshots/testing. Consult `nidz-color-guardian` when changing brand color roles. New visual decisions should be documented rather than silently contradicting the old references.

## Audit 1.2 (branch `nidz-1.2`)

Work in progress on `nidz-1.2`, branched from `nidz-1.1` @ `5fefa94`. `main` and `nidz-1.1` are read-only for its duration, along with the existing safety stash.

- `docs/Audit 1.2.md` — the binding requirements, section-numbered against the brief.
- `docs/NIDZ-1.2-IMPLEMENTATION-PLAN.md` — verified git baseline, quality-gate and bundle numbers to regress against, repository/agent/skill inventory, the design decisions taken, and the group-by-group outcome table.
- `docs/NIDZ-1.2-REGRESSION-CHECKLIST.md` — every deception Audit 1.1 removed, with the mechanism that keeps it removed. Audit 1.2 may replace any 1.1 implementation; it may not reintroduce anything on that list.

Direction: one account with **owner and sitter workspaces** (capabilities plus an `activeWorkspace`, never a mutually exclusive `role`), multi-pet ownership across dog/cat/bird, verified Algerian geography, an explainable deterministic ranking, and a trust-provenance model (`declared` / `verified` / `community` / `platform`) carried in the data rather than only in labels.

## Audit 1.3 (branch `nidz-1.3`)

`docs/Audit 1.3.md` — eleven lots (P0: request context, entry screen, matching, navigation, sitter publication; P1: profile, clarification, forms, a11y/mobile, cleanup; QA). Key outcomes to respect:

- **The request URL is the source of truth** for a request in preparation: `/owner/request/:sitterId?care&from&to&zone&pet` (`src/data/request-draft.ts`). Detours (sign-in, account, add/edit an animal) carry it as `next` and return to the same sitter.
- **Dog size is a hard matching constraint**; an unknown size excludes nobody and is never a match. Default result order is the owner's commune then alphabetical; price order is an explicit option, only with a service chosen.
- **One account, two spaces** (superseded by 1.6 below for the bars and for Compte/Paramètres).
- **Publication** is `canPublish` (`src/data/sitter-sections.ts`): "Pour publier" vs "Enrichir mon profil", home required only for boarding.
- **Clarification** before a decision is a local thread on the request (`src/data/clarification.ts`) — never a delivered message.
- **All sitter/request/review reads go through `src/data/repository.ts`**; see `docs/NIDZ-1.3-BACKEND-HANDOFF.md` for the endpoint each becomes.

## Nidz 1.6 — navigation (branch `nidz-1.6`)

`docs/NIDZ-1.6-NAVIGATION.md` records the refactoring of the 1.5 navigation audit (NAV-01…05 fixed, e2e `lot15`). What to respect:

- **Bars**: owner Accueil · Demandes · Messages · Compte; sitter Demandes · Mon profil · Messages · Compte, drawn as soon as a sitter profile exists (draft included). One list for phone and desktop: `components/layout/workspace-nav.ts`; a tab's `owns` patterns keep it current on the screens under it (results and `/sitters/:id` under Accueil; `/owner/pets`, `/settings`, `/help`, `/policies` under Compte).
- **Compte is `/account`** (identity, Mes animaux on the owner side, the two spaces, public profile when visible, help and safety). **Paramètres is `/settings`** behind the gear at Compte's top-right and on every flow step (language, security and privacy, the reset, the separated test tools).
- **Every "where does this go?" decision is in `src/data/navigation.ts`** and nowhere else: `workspaceHome` (logo, `/`, the space switch — never a hard-coded sitter root), `sitterResumePath`, `sitterVisibility` (`none`/`draft`/`listed`/`hidden` — the search's own rule; never read `sitter.published` alone to say a profile is public), `navBadge`, `messagesPath` (the Messages view lives in `?tab=`), `requestSentPath` (the canonical confirmation address).
- Starting a sitter profile still does not change the active space; switching does (`useSwitchWorkspace`).



Both marketplace journeys are implemented end to end, entirely in the browser. There is still **no backend**, and that is load-bearing context for every change:

- No `fetch`/`axios`/Supabase/Firebase/REST client exists anywhere in `src/`. `QueryClientProvider` is mounted but no query or mutation is ever called.
- **All demo data lives in `src/data/`** — `demo-sitters.ts` is the only sitter fixture in the app, `types.ts` holds the domain model, `workspace.ts` the owner/sitter model. No component may hold data of its own, and no screen imports a fixture: they read through `repository.ts`.
- **Geography is reference data, not a fixture**: `src/data/algeria/` holds all 69 wilayas and all 1 541 communes (Audit 1.3.1), with `index.ts` as the only module the app talks to. **Read `algeria/metadata.ts` before trusting or extending it** — it records the sources (Journal Officiel lois 19-12 and 26-06 for membership, MIT-licensed dzcode-io/leblad for the other names), the territorial version (loi 26-06), the verification date, and `KNOWN_GAPS`: the eleven 2026 wilayas carry `officialCode: null` because published sources disagree about their numbers, and names outside the two laws are leblad's transliteration. **Commune ids never move** — a new commune whose slug is taken is prefixed with its wilaya id. Every location form applies `checkLocation`: the commune is optional for every wilaya; the wilaya is required for the sitter's area and the owner's need. Never turn this dataset into a claim of national marketplace coverage (§33).
- **State is one reducer behind a context** (`src/state/demo/`), persisted in `localStorage` under `nidz.demo` by `store.ts`. Storage is treated as untrusted input and validated per slice on read. The owner's request and the sitter's incoming request are the *same object* — there is no synchronisation to get wrong.
- **Saving is transactional (Audit 1.3.1 A-02 / A-19).** User data goes through `commit` (via `useSave`), never `dispatch`: the record is written, read back, and only then shown; a refused write returns `storage` and the screen must stay put with the input and a retry (`SaveFeedback`). Every write is rebased on the freshest stored record and other tabs' writes are picked up on `storage` events, so tabs never erase each other; a form that overwrites a record passes a `watch`, and a change made elsewhere since it opened comes back as `conflict`. `dispatch` is best effort and only for view state (workspace, intro seen, request bookmark). Build a patch from the base it is applied to (`commit((base) => …)`, `patchProfile`) rather than from what the tab rendered.
- **Unsaved forms are drafts in `localStorage`** (`nidz.draft.<scope>`, `useDraftField` / `useFormDraft`): they survive reloads, closing the app and moving between screens, are validated on read, never hold an object URL, and are cleared on save or by the reset. A restored draft is announced as not saved (`DraftNotice`).
- Routes that were `coming soon` stubs now serve `src/pages/NotAvailable.tsx` — a single honest screen. The routes stay registered so deep links and Back keep working. `/help` and `/policies` carry real content describing exactly what the prototype does and does not do.

### Honesty rules that the code enforces, not just documents

- `SitterProfile` has **no** `verified`, `rating`, `reviewCount`, `responseTime`, `completedStays` or `online` field, and none may be added without a real mechanism. `ProvenanceLabel` (`components/shared/trust.tsx`) throws in dev if a trust category with no mechanism is rendered.
- `RequestStatus` has no `completed`: nothing can observe that a stay happened.
- `declaredUnavailable` is a **statement by the sitter**, never a booking calendar. Not-declared-busy is never rendered as "available".
- Adding an identity document produces no verified state anywhere.
- `isDemoFixture` is what every surface reads to decide whether to mark an entry as an example — including the profile page, because those links are shareable.
- Simulated behaviour (the code step, sending a request, publishing) carries a `DemoNotice` at full weight, never a footnote.

**Product name**: the app is named **Nidz** throughout. The legacy name "PetLink DZ" was removed from the codebase, the PWA manifest (`vite.config.ts`), and all page `<Helmet>` titles in the Audit 1.1 rebrand; do not reintroduce it. The canonical string is the `common.appName` i18n key (`Nidz` in en/fr, `نيدز` in ar) — prefer `t("common.appName")` over a hardcoded literal in user-facing copy. Note the design system document styles the name as **NIDZ** in headings; the code uses **Nidz**.

## Architecture

Stack: **Vite 5 + React 18 + TypeScript** (SWC), **shadcn/ui** (Radix) components, **Tailwind CSS 3**, **react-router-dom 6**. Scaffolded via Lovable (`lovable-tagger` runs only in dev mode).

- **Entry**: `src/main.tsx` → wraps `<App/>` in `HelmetProvider` and imports `./i18n` (i18n must be initialized before render). `src/App.tsx` composes providers (react-query, tooltips, two toasters, `DemoProvider`).
- **Two route shapes.** Browsable screens sit inside the `Layout` route and get header, footer and the mobile bottom bar. **Flow screens** (entry, owner need, request, sitter onboarding) are registered *outside* it: they own the viewport, carry their own back control and their own action bar via `components/shared/FlowScreen.tsx`, and must never also show site chrome. Add browsable routes above the catch-all `path="*"`.
- **Namespacing**: public profiles are `/sitters/:id`; `/sitter/*` is the sitter's own area. Keeping them apart means no static sitter route can be shadowed by a profile id.
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig`). shadcn aliases live in `components.json`.

### Design tokens (Nidz 1.4, implemented)

`src/index.css` currently defines HSL CSS variables mapped to Tailwind classes in `tailwind.config.ts`. Preserve brand anchors and semantic meanings while evolving the visual system deliberately. Distinguish shadcn's UI `--accent` (highlight/hover) from Nidz's terracotta `--brand`; evaluate any changed role for contrast and hierarchy.

**The 1.4 system is implemented** (design system §0.1-A to 0.1-G, branch `nidz-1.4`): a mist ground `#EDF2F0` with white cards and ink-tinted shadows, teal as the only action colour on pill-shaped buttons, terracotta/sand/sky as non-interactive warmth on animals and people, **Readex Pro** (one self-hosted variable family for Latin and Arabic, via `@fontsource-variable/readex-pro` — no Google Fonts request), a radius scale up to `3xl`, Lucide plus custom icons in `src/components/icons/`, and flat animal artwork in `src/components/illustrations/animals.tsx`. The white canvas, Inter and the 24px radius cap are retired. `DESIGN.md` describes the system as built. Reduced-motion support and RTL remain mandatory; colour-role changes still go through `nidz-color-guardian`.

### Internationalization + RTL (critical for every UI change)
`src/i18n.ts` configures i18next for three locales — **`en`, `fr`, `ar`** (strings in `src/locales/*.json`), default `en`, detected from localStorage → querystring → navigator.

- Arabic triggers **RTL**: `updateDir()` sets `<html dir="rtl">` and toggles the `rtl` class. Tailwind uses the `tailwindcss-rtl` plugin, so prefer logical/RTL-aware utilities and test layouts in Arabic.
- All user-facing copy must go through `useTranslation()` / `t(...)` with keys added to **all three** locale files — do not hard-code display strings.
- Currency is always Algerian Dinar via `formatDZD(amount, locale)` in `src/utils/format.ts` (locale-aware `Intl.NumberFormat`); do not format money manually.

### Conventions
- The app is **mobile-first**; preserve responsive and accessible behavior (`src/hooks/use-mobile.tsx` exists for breakpoint logic).
- Toasts: ONE system is mounted — the shadcn/Radix `useToast` (`src/hooks/use-toast.ts`). Audit 1.3 unmounted `sonner` (never called; it followed `next-themes` and would have drawn dark toasts). Nothing calls a toast today.
- Each page sets its own `<title>`/meta via `react-helmet-async`.
- PWA is enabled via `vite-plugin-pwa` (`registerType: 'autoUpdate'`) in `vite.config.ts`.
