# Nidz 1.2 — regression guard carried over from Audit 1.1

Audit 1.2 may **replace** any implementation from 1.1. It may not **reintroduce
deception that 1.1 removed**.

Each item below is a correction that Audit 1.1 made. Every group boundary
re-checks this list against the diff. An item marked `enforced by` names the
mechanism that makes the regression fail loudly rather than silently — where
such a mechanism exists, Audit 1.2 keeps it and extends it to new code rather
than replacing it with a comment.

---

## A. Declared vs verified

| # | Rule | Enforced by |
|---|---|---|
| A1 | No sitter field asserts verification, rating, review count, response time, completed stays or online status unless a real mechanism produces it. | The `SitterProfile` type has no such fields. Adding one is a deliberate act, visible in review. |
| A2 | A trust claim with no mechanism behind it cannot be rendered. | `ProvenanceLabel` in `components/shared/trust.tsx` throws in development for a category with no mechanism. Audit 1.2 keeps this behaviour as the provenance model grows to `declared / verified / community / platform`. |
| A3 | Adding an identity document produces **no** verified state anywhere. Selecting `identity-card.jpg` may never yield "Identity verified". | `setIdDocument` records only `{ fileName, addedAt }`; no flag exists to set. |
| A4 | Typing a profession never creates a credential badge. Declared profession and verified credential stay separate concepts. | Group 10/11 must model them as separate fields with separate states. |
| A5 | Profile completeness is an administrative fact. It may never be labelled quality, trust, safety or potential. | Naming discipline; checked in Group 17's language sweep. |

## B. Unknown stays unknown

| # | Rule | Enforced by |
|---|---|---|
| B1 | Sitter declarations are never prepopulated in a way that later reads as user-provided. | `SitterHousing.type` and `.outdoor` are `null` until answered; `emptySitterProfile()` seeds nothing. The type carries the distinction so the compiler does too. |
| B2 | Persisted state is untrusted input, validated per slice on read; one bad field costs only that field. | `restore()` / `restoreSitter()` in `state/demo/reducer.ts`. Audit 1.2 extends this to every new slice. |
| B3 | Migration never invents a sitter claim. An absent 1.1 field becomes unknown, not a default that reads as a declaration. | `migrateFromV1` derives the two new fields from data that is present (an account, a sitter workspace) and consults `emptySitterProfile` for nothing. A field a 1.1 visitor left unanswered stays unanswered. |
| B5 | Migration never destroys the old record before the new one is on disk. | `saveState` reports whether the write succeeded, and the v1 key is removed only then. Ordering alone was not enough: `saveState` swallows its exception, so on a full quota it returned normally having written nothing, while `removeItem` succeeded. |
| B6 | A capability cannot outlive the data that supports it. | `restore` clamps `capabilities` against the account and sitter workspace that survived validation. Per-slice validation means a malformed profile can be discarded while a stored flag still claims it exists. |
| B4 | A corrupt or old storage record must not crash the app. | Version mismatch discards; parse failure returns `INITIAL_STATE`; the app-level `ErrorBoundary` stays mounted. |

## C. Availability, booking and money

| # | Rule | Enforced by |
|---|---|---|
| C1 | `declaredUnavailable` is a statement by the sitter, not a calendar. "Not declared busy" is never rendered as "available". | `overlapsDeclaredUnavailable()` returns *has declared unavailable*; every call site says so. |
| C2 | Nothing observes that a stay happened, so no lifecycle may claim one. If Audit 1.2 adds a `completed` request state, it must be reached by a deliberate, visibly simulated demo mechanism — never inferred from a date passing. | `RequestStatus` at 1.1 is `pending / accepted / declined`. Any extension is a Group 12/14 decision that must ship with its mechanism. |
| C3 | `accepted` never means "paid booking confirmed". | No payment exists. No primary "Pay" CTA in a normal flow. |
| C4 | No escrow, wallet, split payment, payout, refund, insurance or payment-protection claim. | Group 15 defines a payment *boundary* only, documented as inactive. |
| C5 | The primary profile CTA is "Send a care request", never "Book", "Pay" or "Instant booking". | Copy review, Group 17. |

## D. Identity of demo content

| # | Rule | Enforced by |
|---|---|---|
| D1 | Fixture entries are marked as examples on every surface that shows them, including the public profile page, because those links are shareable. | `isDemoFixture` is read by each surface — not a comment in the data file. |
| D2 | Stock or generated people are never presented as registered Nidz members. Where imagery is used, it may not function as proof that a real person joined. | Group 9/16 imagery decisions. |
| D3 | Local demo publishing changes local demo state. It may not be described as going live on a platform. | `publishSitterProfile` copy, Group 11. |
| D4 | Reviews are never fabricated to make a screen look populated. A review implies a completed interaction the platform could establish. | Group 9/14. |

## E. Honest absence

| # | Rule | Enforced by |
|---|---|---|
| E1 | Unimplemented routes serve one honest screen (`NotAvailable`), not a "coming soon" stub. Routes stay registered so deep links and Back keep working. | `App.tsx`. Any route Audit 1.2 makes genuinely functional graduates off `NotAvailable`; the rest keep it. |
| E2 | No public admin dashboard is resurrected. An admin-looking screen with no authentication behind it is worse than an honest absence. | `/admin` → `NotAvailable`. |
| E3 | `/help` and `/policies` describe exactly what the prototype does and does not do. Audit 1.2 grows the product, so these must be **updated**, not left describing 1.1. | Group 15/17. |
| E4 | Simulated behaviour carries its notice at full weight, never as a footnote. | `DemoNotice` usage. |
| E5 | Demo state can always be reset, and reset leaves nothing behind. | `reset` action removes the storage record rather than rewriting empty values. Since Group 3 the control lives in **Settings** (one trigger, not two), and `clearStoredState` removes the 1.2 key **and** the 1.1 key, so a visitor whose migration had not yet run is not left with a record that returns on the next load. The error boundary's recovery calls the same function rather than repeating a key literal. |
| E6 | Every screen that states what the prototype cannot do stays reachable on a phone. | `/help` and `/policies` are in the footer at every width and in Settings; Settings itself is one tap from the header on browsable screens and from the top bar on flow screens. Hiding the footer below `md` once made all three unreachable on the primary device. |

## F. Privacy

| # | Rule | Enforced by |
|---|---|---|
| F1 | No exact home coordinates for sitter or owner are ever public. Public location is the commune, and distance is approximate. | `communeName()` / `communeWithWilaya()` are the only public location renderers at 1.1. Group 5 must keep map markers approximate. |
| F2 | Public identity is a first name plus an initial. No full legal name on a public profile. | `publicName` convention. |
| F3 | Date of birth is collected for eligibility and never displayed publicly. | Groups 6 and 10. |
| F4 | Phone numbers are not exchanged merely because a request was sent. Sharing requires explicit consent. | Group 13. This is stricter than the raw Audit 1.2 idea, deliberately. |
| F5 | Object URLs and locally selected files are never persisted to `localStorage`, and raw identity documents are never stored there at all. | `stripTransientFields()`; extended in Groups 7, 10, 11, 13. |

## G. Language and layout

| # | Rule | Enforced by |
|---|---|---|
| G1 | All user-facing copy goes through `t(...)` with keys present in **all three** locale files. | Group boundary check: `en`, `fr`, `ar` key sets must stay equal modulo CLDR plural categories. |
| G2 | Arabic is a real RTL experience, not a mirrored afterthought. `<html dir>` is the single mechanism; Radix gets `DirectionProvider`. | `i18n.ts` `updateDir()` + `App.tsx`. |
| G3 | Currency always goes through `formatDZD(amount, locale)`. | `utils/format.ts`. |
| G4 | The product is named **Nidz**. "PetLink DZ" must not reappear. Prefer `t("common.appName")` over a literal. | Group 17 sweep. |

## H. Build health

| # | Rule |
|---|---|
| H1 | `npm run build`, **`npm run typecheck`**, `npm run lint` and `git diff --check` all pass at every group boundary. **Not `npx tsc --noEmit`** — see H5. |
| H5 | The type-check must actually type-check. `tsconfig.json` is a solution file (`"files": []` + references), so `tsc --noEmit` compiles nothing and exits 0 on a broken codebase. Only `tsc -b --force` reads `tsconfig.app.json`. Note also that `"strict": false` in that config, so the checker is more permissive than it looks. |
| H2 | Lint warning count does not exceed the 7 pre-existing shadcn `react-refresh` warnings recorded in the implementation plan. |
| H3 | No new `any`. |
| H4 | `main`, `nidz-1.1` and `stash@{0}` are byte-identical at the end of the audit to what they were at the start. |
