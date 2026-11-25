# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Pet owners** — people in Algeria who own dogs, cats or birds and need someone to care for their animal while they are away or unavailable. An owner may have several animals, and they will not all have the same needs. Their situation is one of uncertainty rather than scarcity: the hard question is not "where do I find someone?" but **"is this the right person for my animal, and do I have enough information to trust them?"** They arrive anxious about handing over a family member to a stranger.

**Pet-sitters** — individuals offering pet-care services in their own home or at the owner's. Their job is to present how they actually care for animals, receive requests that genuinely fit their limits and environment, build a reputation, and win further opportunities.

Both sides are Algerian, mobile-first, and read **French, Arabic, or English** (`fr`, `ar`, `en`; Arabic is RTL).

## Product Purpose

Nidz is an **Algerian pet-sitting marketplace** connecting dog, cat and bird owners with pet-sitters nearby. It must not behave as a plain classifieds catalogue. "Nearby" is a matching input, not a claim of national coverage: administrative geography data covering the whole country never licenses a promise of supply everywhere.

Owner-side value chain: **find → understand → trust → hand over the animal with peace of mind.**

Success is a hand-over the owner felt calm and informed about, and a sitter who received requests they were genuinely suited to.

## Positioning

**Trust is a product function, not a marketing layer.** Nidz's differentiator is that every trust signal has a stated, visible provenance — what the user declared, what Nidz verified, what the community generated, and what the platform observed are kept distinct and never blurred into one flattering score. Matching separates hard constraints (animal, dates, care type, location, the sitter's stated limits and environment) from soft preferences, and explains itself instead of being a decorative black box.

## Operating Context

- Algeria; currency is always **Algerian Dinar**, formatted via `formatDZD(amount, locale)` in `src/utils/format.ts`.
- Trilingual `en` / `fr` / `ar` with full RTL for Arabic. All user-facing copy passes through i18n keys present in all three locale files.
- Mobile-first usage; PWA installable (`vite-plugin-pwa`, `registerType: 'autoUpdate'`).
- Two primary journeys documented in the design system: owner (discovery → need definition → results → sitter profile → request → after the stay) and sitter (intro → identity → location → profile creation → services, animals accepted, housing).

## Capabilities and Constraints

**Stage: pre-launch startup.** Intended to become a real marketplace with real Algerian sitters and owners; design and code should be judged against production readiness and trust that survives real users — not against demo polish.

**Currently a front-end prototype with no backend.** No `fetch`/REST/Supabase/Firebase client exists in `src/`. `QueryClientProvider` is mounted but no query or mutation is ever called. Displayed data comes from centralised fixtures in `src/data/` and from browser-local reducer state in `src/state/demo/`, mirrored into `localStorage` alongside the i18n language cache. Audit 1.1 removed the unused Mapbox dependency and its token placeholder, and replaced the earlier stub pages: both marketplace journeys now run end to end in the browser, and routes that are genuinely not implemented serve one honest `NotAvailable` screen rather than a "coming soon" promise.

**Stack (existing):** Vite 5 + React 18 + TypeScript (SWC), shadcn/ui on Radix, Tailwind CSS 3, react-router-dom 6, lucide-react. Scaffolded via Lovable. No test framework is configured.

**Honesty constraint (absolute):** never make a simulated or demo feature look genuinely functional. Never invent verification, reviews, availability, payment protection, booking confirmation, insurance, guarantees, real users, or trust metrics that do not exist. A prettier interface must never become less honest, less accessible, or more ambiguous.

**Explicitly undecided product facts:** payment, booking, verification, insurance, commission, and ranking mechanisms are all unvalidated. The current prototype is not product truth. These must not be designed as though settled without the user's decision.

## Brand Commitments

- **Name: Nidz.** Canonical string is the `common.appName` i18n key (`Nidz` in en/fr, `نيدز` in ar); prefer `t("common.appName")` over a literal. The legacy name "PetLink DZ" was removed in the Audit 1.1 rebrand and must not reappear.
- **A real logo / brand asset set exists or is being produced** and future work should use it rather than inventing a mark.
- **Brand feel (confirmed in the design system):** calm, human, reliable, warm, clean, contemporary, accessible.
- **The current visual system is a baseline, not a ceiling.** The user explicitly authorized substantially redesigning the visual system, layouts, components, typography, color usage, navigation, spacing, and overall art direction where a stronger result is achievable. No visual decision is to be preserved merely because it already exists. This license covers appearance only — product truth, trust and safety rules, privacy, accessibility, core marketplace logic, and honest representation of functionality are preserved regardless.
- `.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md` remains authoritative for **product, UX and trust rules**; its visual layer is open to replacement per the license above. Audit 1.2's white canvas and Inter-only typography are historical. The implemented 1.4 baseline uses a mist canvas `#EDF2F0`, white cards and Readex Pro for Latin and Arabic. The latest design workflow is §0.2 of the Nidz design system and the 1.7 routing in `CLAUDE.md`; these permit scoped aesthetic autonomy while retaining product truth and brand anchors.

## Evidence on Hand

- **Real:** the product/UX specification (`.claude/skills/nidz-design/NIDZ_DESIGN_SYSTEM.md`), the screen-by-screen audit and plan (`docs/Audit 1.1.md`, `docs/NIDZ-1.1-IMPLEMENTATION-PLAN.md`), and the brand name and logo assets.
- **Not real:** every sitter, listing, rating, price, availability, and booking currently displayed is placeholder. There are no real reviews, no verified sitters, and no confirmed onboarded users.
- Whether genuine sitter photography or real onboarded sitters will be available was **not confirmed** in the interview — until it is, treat all displayed people and content as placeholder and label it as such.

## Product Principles

1. **Trust is engineered, not decorated.** Every claim shown to an owner carries a visible provenance; unverified is stated as unverified.
2. **Relevance over inventory.** Show the sitters who actually fit the animal, dates, care type, location, and the sitter's own stated limits — before showing more.
3. **Serenity through predictability.** At each step the user knows what is asked, why Nidz asks it, what happens next, what is confirmed, and what is not yet.
4. **Honesty outranks beauty.** When an aesthetic improvement would imply a capability that does not exist, the capability wins and the aesthetic yields.
5. **Algerian and trilingual by construction.** DZD, and en/fr/ar with RTL, are design inputs from the first sketch — never a retrofit.

## Accessibility & Inclusion

Accessibility ranks above design-system consistency and aesthetic preference in the product's own priority order. Concretely: mobile-first responsive behavior must be preserved, Arabic RTL layouts must be tested rather than assumed, color must meet contrast requirements and never be the sole carrier of meaning, and touch targets must meet the Nidz minimum defined in the design system.
