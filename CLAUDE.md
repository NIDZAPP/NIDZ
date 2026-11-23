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
```

**`npx tsc --noEmit` type-checks NOTHING in this repo, and never has.** `tsconfig.json` is a solution file: `"files": []` plus project references. Without `-b`, `tsc` compiles the empty file list and exits 0 — so it reports success on a codebase with real type errors in it. Audit 1.2 found this the hard way: it was silently passing while `fields.tsx` referenced a `Select` component whose import had been removed, which would have crashed a live screen. Use **`npm run typecheck`** (`tsc -b --force`). `--force` matters too, because `tsc -b` caches and will skip a project it believes is unchanged.

There is **no test framework dependency**. Audit 1.3 added two harnesses that need none: `npm run test:unit` runs `tests/unit/*.test.ts` with Node's built-in `node:test`, loaded through Vite so the `@/` alias and TypeScript resolve; `npm run test:e2e` drives the real app with the pre-installed Playwright (`e2e/`, one file per lot; start `npx vite --host 127.0.0.1 --port 8080` first). There is still no `npm test`.

**Run `npm run check:locales` after touching any user-facing copy.** Nothing else in the toolchain can see inside `src/locales/*.json`, so a missing string reaches the browser as a raw key in whichever language nobody opened. It checks three-locale parity, that every `t()` literal resolves, and that plural families are complete for each locale — i18next does **not** fall back from a missing `_one` to `_other`, it prints the key. French needs `_many` as well as `_one`/`_other`; Arabic needs all six categories.

## Design system is the source of truth

This is the **Nidz** product (a pet-care marketplace for Algeria). Before creating, modifying, reviewing, or refactoring any user-facing screen or component, read the design system:

`.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md`

It is the authoritative spec for UX, UI, colors, typography, spacing, trust signals, and product behavior. When it conflicts with generic design advice, shadcn/Tailwind examples, or existing legacy UI, **the Nidz design system wins**. The `/nidz-design` skill (`.claude/skills/nidz-design/SKILL.md`) enforces this. Key product rule: **never make a simulated/demo feature look genuinely functional**, and never invent verification, reviews, availability, payment protection, booking confirmation, insurance, or trust metrics that don't exist.

**Read the `## 0.0 Amendements actifs` block at the top of that document first.** Audit 1.2 deliberately superseded two of its Level-2 visual decisions (§42 ranks its own decisions; Level 2 is "may evolve consciously"). Where the body of the document still contradicts that block, the block wins. No Level-1 principle — product truth, trust provenance, accessibility, privacy — was touched.

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
- **One account, two spaces**: owner bar Accueil · Recherche · Demandes · Animaux · Compte; sitter bar Reçues · Mon profil · Compte. `/settings` is "Compte" and holds the space switch and the separated test tools.
- **Publication** is `canPublish` (`src/data/sitter-sections.ts`): "Pour publier" vs "Enrichir mon profil", home required only for boarding.
- **Clarification** before a decision is a local thread on the request (`src/data/clarification.ts`) — never a delivered message.
- **All sitter/request/review reads go through `src/data/repository.ts`**; see `docs/NIDZ-1.3-BACKEND-HANDOFF.md` for the endpoint each becomes.

## Current state: complete demo front-end, no backend

Both marketplace journeys are implemented end to end, entirely in the browser. There is still **no backend**, and that is load-bearing context for every change:

- No `fetch`/`axios`/Supabase/Firebase/REST client exists anywhere in `src/`. `QueryClientProvider` is mounted but no query or mutation is ever called.
- **All demo data lives in `src/data/`** — `demo-sitters.ts` is the only sitter fixture in the app, `types.ts` holds the domain model, `workspace.ts` the owner/sitter model. No component may hold data of its own, and no screen imports a fixture: they read through `repository.ts`.
- **Geography is reference data, not a fixture**: `src/data/algeria/` holds all 69 wilayas and 371 communes, with `index.ts` as the only module the app talks to. **Read `algeria/metadata.ts` before trusting or extending it** — it records the source, the territorial version (loi 26-06), the verification date, and `KNOWN_GAPS`: the eleven 2026 wilayas carry `officialCode: null` because published sources disagree about their numbers, and commune coverage is ten wilayas out of 69 for documented licensing and verification reasons. Never turn this dataset into a claim of national marketplace coverage (§33).
- **State is one reducer behind a context** (`src/state/demo/`), mirrored into `localStorage` under `nidz.demo.v1`. Storage is treated as untrusted input and validated per slice on read. The owner's request and the sitter's incoming request are the *same object* — there is no synchronisation to get wrong.
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

### Design tokens
All colors are **HSL CSS variables** defined in `src/index.css` (`:root`), mapped to Tailwind semantic classes in `tailwind.config.ts`. Brand palette is **deep-teal primary** (`#0F766E`) on a **white** background (`#FFFFFF` — Audit 1.2 replaced the warm off-white canvas). Use the semantic tokens (`bg-primary`, `text-muted-foreground`, `border-input`, …) — never hard-code hex/HSL in components.

**On white, `bg-card` no longer groups anything** — it is the same colour as the ground. It now means only "an opaque surface that has to cover something": a dialog or popover, or a control sitting on a soft semantic surface. Page structure comes from spacing → typography → a `border-border` hairline → a soft semantic surface → real elevation, in that order of preference. **No white card on a white ground.** Row hovers use `bg-secondary`, which is the single hover surface; `--muted` is 1.08:1 on white and is a shadcn-primitive-only token. The warm terracotta pair (`--brand` / `--brand-soft`) is now the entire warm half of the system, so its placement is deliberate and rare — read the token comments in `src/index.css` before spending it.

**Two different things are called "accent" — read the comment block at the top of `src/index.css` before touching colors.** CSS `--accent` is shadcn's *hover / keyboard-highlight / selection surface* (44 usages across 13 primitives); it is a neutral UI role. The design system's warm terracotta accent (`#A84F32`) lives on a separate `--brand` token and is reserved for **non-interactive** brand surfaces — never a button, link, hover, or selected state. `--secondary` is likewise a neutral surface (it backs the Slider and Progress tracks), not a brand color.

Radius scale is sm 8 / md 12 / lg 16 / xl 24; `rounded-2xl` and `rounded-3xl` are not part of it. Motion durations follow design system §24 and `prefers-reduced-motion` is honored globally. Dark mode is **not** part of V1: there is deliberately no `.dark` block in `index.css` (Audit 1.2 removed the stale one).

Fonts: **`Inter` only** (`Noto Sans Arabic` sits behind it in the stack to carry Arabic; Latin never reaches it). Audit 1.2 withdrew `Playfair Display` and there is no `font-display` key — hierarchy comes from size, weight, spacing and layout, never from mixing families. Do not reintroduce a display face; that would be a deliberate multilingual brand decision, not a UI tweak. Icons: **lucide-react** only, never emoji.

`DESIGN.md` documents the visual system as actually built. Read it before adding a screen.

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
