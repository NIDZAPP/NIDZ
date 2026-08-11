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
```

There is **no test framework configured** — there are no test scripts, no test runner in `package.json`, and no test files. Do not assume `npm test` works; if tests are needed, the harness must be added first.

## Design system is the source of truth

This is the **Nidz** product (a pet-care marketplace for Algeria). Before creating, modifying, reviewing, or refactoring any user-facing screen or component, read the design system:

`.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md`

It is the authoritative spec for UX, UI, colors, typography, spacing, trust signals, and product behavior. When it conflicts with generic design advice, shadcn/Tailwind examples, or existing legacy UI, **the Nidz design system wins**. The `/nidz-design` skill (`.claude/skills/nidz-design/SKILL.md`) enforces this. Key product rule: **never make a simulated/demo feature look genuinely functional**, and never invent verification, reviews, availability, payment protection, booking confirmation, insurance, or trust metrics that don't exist.

## Current state: demo front-end, no backend

The app is a **UI prototype with no backend integration**. This is important context for any change:

- No `fetch`/`axios`/Supabase/Firebase/REST client exists anywhere in `src/`.
- `@tanstack/react-query`'s `QueryClientProvider` is mounted in `src/App.tsx`, but **no `useQuery`/`useMutation` is ever called** — there is no data layer behind it yet.
- Displayed data is hard-coded mock arrays, e.g. `src/pages/Search.tsx` (`// Mock data for pet sitters`) and `src/components/home/FeaturedSitters.tsx`.
- Most routed pages are `coming soon` stubs (~14 lines each). Only `Index`, `Search`, `SitterRegister`, and `NotFound` have real content.
- `localStorage` is used only for the i18n language cache and the Mapbox token placeholder (`src/components/map/MapPreview.tsx`); Mapbox is installed but not yet wired to a real map.

**Product name**: the app is named **Nidz** throughout. The legacy name "PetLink DZ" was removed from the codebase, the PWA manifest (`vite.config.ts`), and all page `<Helmet>` titles in the Audit 1.1 rebrand; do not reintroduce it. The canonical string is the `common.appName` i18n key (`Nidz` in en/fr, `نيدز` in ar) — prefer `t("common.appName")` over a hardcoded literal in user-facing copy. Note the design system document styles the name as **NIDZ** in headings; the code uses **Nidz**.

## Architecture

Stack: **Vite 5 + React 18 + TypeScript** (SWC), **shadcn/ui** (Radix) components, **Tailwind CSS 3**, **react-router-dom 6**. Scaffolded via Lovable (`lovable-tagger` runs only in dev mode).

- **Entry**: `src/main.tsx` → wraps `<App/>` in `HelmetProvider` and imports `./i18n` (i18n must be initialized before render). `src/App.tsx` composes providers (react-query, tooltips, two toasters) and defines **all routes flat** inside a single `<Layout>`. Add new routes above the catch-all `path="*"`.
- **Layout**: `src/components/layout/Layout.tsx` = `Header` + `main` + `Footer`, applied globally to every route.
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig`). shadcn aliases live in `components.json`.

### Design tokens
All colors, gradients, and shadows are **HSL CSS variables** defined in `src/index.css` (`:root` + `.dark`), and mapped to Tailwind semantic classes in `tailwind.config.ts`. Brand palette is **mint-green primary** + **soft-orange secondary**. Use the semantic tokens (`bg-primary`, `text-muted-foreground`, `shadow-elegant`, `bg-gradient-primary`, etc.) — do not hard-code hex/HSL values in components. Fonts: `Inter` (sans/default), `Playfair Display` (`font-display`). Icons: **lucide-react**.

### Internationalization + RTL (critical for every UI change)
`src/i18n.ts` configures i18next for three locales — **`en`, `fr`, `ar`** (strings in `src/locales/*.json`), default `en`, detected from localStorage → querystring → navigator.

- Arabic triggers **RTL**: `updateDir()` sets `<html dir="rtl">` and toggles the `rtl` class. Tailwind uses the `tailwindcss-rtl` plugin, so prefer logical/RTL-aware utilities and test layouts in Arabic.
- All user-facing copy must go through `useTranslation()` / `t(...)` with keys added to **all three** locale files — do not hard-code display strings.
- Currency is always Algerian Dinar via `formatDZD(amount, locale)` in `src/utils/format.ts` (locale-aware `Intl.NumberFormat`); do not format money manually.

### Conventions
- The app is **mobile-first**; preserve responsive and accessible behavior (`src/hooks/use-mobile.tsx` exists for breakpoint logic).
- Toasts: two systems are mounted — shadcn `useToast` (`src/hooks/use-toast.ts`) and `sonner`. Follow whatever a given area already uses.
- Each page sets its own `<title>`/meta via `react-helmet-async`.
- PWA is enabled via `vite-plugin-pwa` (`registerType: 'autoUpdate'`) in `vite.config.ts`.
