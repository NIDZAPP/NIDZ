# Audit 1.2 — binding requirements

Structured record of the Audit 1.2 brief as received, kept on the branch so the
work can be checked against what was actually asked. Section numbers track the
brief. This file states **requirements**; `NIDZ-1.2-IMPLEMENTATION-PLAN.md`
records what was built and `NIDZ-1.2-REGRESSION-CHECKLIST.md` records what must
not regress.

Audit 1.2 evolves the validated `nidz-1.1` branch. Existing screens are not
preserved merely because they exist — but nothing is changed merely to be
different. Every significant change must improve comprehension, matching, trust,
speed, confidence, accessibility or marketplace usability.

---

## §0 Decision hierarchy

When requirements conflict:

1. Security, law, privacy, animal and user safety
2. Truth about what the software really does
3. Trust and comprehension
4. Marketplace usefulness and matching quality
5. Accessibility and usability
6. Algerian relevance
7. Nidz design-system consistency
8. Audit 1.2 product direction
9. Aesthetic preference
10. Decorative effects

A beautiful screen that misleads is a regression. A sophisticated feature Nidz
cannot truthfully support is a regression. A simpler implementation that clearly
demonstrates the marketplace beats a fake production system.

## §1 Git safety

All work on `nidz-1.2`, branched from the latest verified `origin/nidz-1.1`.
Never merge into or rewrite `main` or `nidz-1.1`; never force-push, delete
branches, drop the existing safety stash, alter history, deploy or publish.
Re-verify the active branch at every group boundary.

## §4 Regression guard

Audit 1.2 may replace 1.1 implementations. It may not reintroduce previously
fixed deception. See the regression checklist.

## §5–7 Intended feel

Nidz 1.2 should read as the beginning of a real consumer marketplace: immediate,
calm, warm, trustworthy, photographic, locally relevant, fluid, information-rich
without density, recognisably Nidz. Not a collection of shadcn cards, a
hackathon dashboard, an AI-generated SaaS landing page, a bank, a social
network, a pet shop or a vet clinic.

Actively remove machine-generated tells: a card around every section, excess
rounded rectangles and pills, pastel backgrounds, gradients, blobs,
glassmorphism, heavy shadows, meaningless metrics, fake analytics, repeated
icon+title+paragraph triplets, identical three-column grids, giant hero
sections, badge swarms, redundant CTAs, verbose microcopy, decorative animation
with no causality, arbitrary dividers, over-centred layouts, fake "premium" dark
sections.

Use instead: whitespace, photography, strong typography, real hierarchy,
alignment, predictable interaction, well-designed lists, thoughtful detail
screens, progressive disclosure, sticky controls only where useful, human and
concise writing.

## §8–9 Design system changes

- **Global background becomes `#FFFFFF`.** The previous cream canvas is
  withdrawn. White does not mean white-on-white cards: structure comes from
  hierarchy, spacing, typography, grouping, subtle borders and occasional
  semantic soft surfaces. Shadow only for genuine elevation.
- **Identity retained:** primary `#0F766E`, hover `#115E59`, primary-soft
  `#E7F3F1`, terracotta `#A84F32`, warm-soft `#F7EAE4`, foreground `#18211F`,
  muted-foreground `#5B6864`, border `#DCE3E0`, control border `#7C8B86`.
  Semantic status colours unchanged unless accessibility requires otherwise.
- **Inter only.** Playfair Display is not reintroduced. No new display face; a
  future one would be a separate multilingual brand decision.

## §10 Motion

Micro feedback 100–150 ms, common transitions 160–220 ms, sheets/dialogs
200–300 ms. Honour `prefers-reduced-motion`. No springy cartoon movement,
bouncing, parallax, navigation-blocking animation or fake loading delays.

## §11–12 One account, two worlds

Owner and sitter are **workspaces, not identities**. One account may carry both
capabilities plus an `activeWorkspace`. Avoid a mutually exclusive `role`.

Owner world feels exploratory, local, pet-centred, photographic, search- and
map-oriented. Sitter world feels professional, structured, profile/business and
calendar/reputation oriented. Differentiate through information architecture,
imagery, composition, task priority and navigation — **not** through unrelated
colour systems. Both remain Nidz.

## §13–15 Entry, authentication, low-friction owner

Entry offers two clearly different workflows with a small visual preview of
each, not two identical cards, and without becoming an advertising page.

Auth gateway offers Google, Microsoft and phone — but **never fakes OAuth or
OTP**. Absent infrastructure is represented honestly behind an `AuthProvider`
boundary with a demo provider and future provider seams. No external auth
dependency unless it can actually be configured correctly.

Guests may browse: owner home, results, filters, sitter profiles, prices,
services. An account is required only for actions that persist or involve
another person — sending a request, messaging, favourites, feedback, managing
persistent animals.

## §16–19 Owner account and pets

Owner base account: first name, last name, date of birth (**private**), wilaya,
commune, species owned (multi-select: dog, cat, bird). No exact address at
signup. Full location is never public.

**Multi-pet is a core domain change**: an owner has 0..N pets, with list, add,
view, edit, delete-with-confirmation, and pet selection for a request. Species
support is dog, cat and bird, with **conditional forms per species** — a bird
never sees a walk-frequency field. Basic profiles are usable for discovery;
detailed profiles improve compatibility. More completed fields never imply a
better animal.

## §20–25 Owner home, personalisation, search, discovery

Owner home delivers immediate value: nearby and relevant sitters, pet context,
search, pending requests, useful shortcuts. Sections appear only when data
supports them. Not eight dashboard cards — an editorial flow that breathes.

Personalisation is explainable and never invented. **No "97% match", no "AI
recommended", no "Nidz Quality Score."** Only supporting facts that exist:
"Accepts cats", "Offers boarding", "Located in your commune", "No cats declared
at home".

Search collects pets, service, location, dates and relevant constraints without
demanding everything before showing anything. Services carry unambiguous units
(night / day / visit / walk). Filters include a mobile filter sheet, a desktop
rail where useful, and always "Clear all". Discovery supports list **and** map,
with list as the accessible, failure-safe path.

## §26–29 Map, tiles, geolocation

Evaluate current dependencies first; prefer MapLibre GL JS if it fits; do not
introduce a paid dependency where a free one lets the prototype advance.
Separate map engine, tile/style provider, geocoding provider and Nidz's own
location domain — but do not build five unused adapters.

Verify a tile provider's usage policy, attribution and limits before adopting
it; a demo provider is acceptable if its terms allow it, must be replaceable,
must be documented, and must not be described as production infrastructure. **No
public Nominatim autocomplete. No bulk geocoding.**

Never request geolocation on load. Offer an explicit "Use my location" with the
benefit stated first, and handle granted, denied, unavailable, timeout,
unsupported and insecure-context. Manual wilaya/commune selection is always
available.

## §29–33 Location privacy and Algerian geography

Never publish sitter or owner home coordinates. Use approximate or offset
markers, commune areas, approximate distance. Create no false precision.

Replace the partial geography fixture with a complete, current, **verified**
official administrative reference — documenting source, source date, territorial
version and verification date. **Do not fabricate geography.** If the
authoritative current dataset cannot be verified, implement the architecture and
report the data gap rather than inventing entries; do not machine-invent
official Arabic names.

Use a searchable, accessible combobox rather than thousands of `<option>`
elements, with wilaya-scoped commune lists and proper indexes.

**Administrative coverage is not marketplace coverage.** Having all wilayas
never licenses "available across all Algeria". Areas without demo supply show an
honest zero state.

## §34–49 Sitter card, profile, trust, reviews, portfolio

The result card answers "should I open this profile?" — photo, public identity,
approximate location/distance, primary service and rate, legitimate rating when
one exists, one or two compatibility reasons, availability context, one action.
No badge soup, no three CTAs, no fake scarcity, no fake online status.

The public profile is the central 1.2 experience: identity hero with main CTA
**"Send a care request"**; about and concrete experience; per-service rates with
units, accepted species and limits; care environment (home type, outdoor space,
other animals, separation, sleeping, crate use, supervision, time alone,
transport, emergency process); and the sitter's **own stated limits**, which are
positive marketplace information and must not be penalised in the UI.

Professional background is a structured declaration (veterinarian, vet student,
vet assistant, trainer, groomer, breeder, shelter worker, animal-care
professional, animal-health background, other, none) kept strictly separate from
a verified credential.

**Trust provenance** is modelled in data, not just in labels: `declared`,
`verified`, `community`, `platform`. Badges need identifier, label, reason,
evidence source, criteria definition, state, and issue/expiry policy where
applicable — no decorative badge, and **badges are not the ranking algorithm**.
New sitters must not be permanently invisible.

Reviews are marketplace evidence: summary, count, distribution, written reviews
with date and service, owner identity, sitter response, sorting when there is
enough volume. Reviews, external references and verification are three different
things and must not merge into one score. A sitter with no reviews shows "New on
Nidz", never `0.0` stars.

The Care Portfolio proves practical care experience — it is **not** a social
network. No followers, likes, stories, reposts, public comments, influencer
ranking or endless feed. Photos of an owner's animal carry consent state
(`private` / `consent_requested` / `consent_granted` / `public` /
`consent_withdrawn`); uploading or messaging a photo never implies marketing
consent, and backend-enforced consent is documented as absent.

## §50–70 Sitter onboarding

Substantially more demanding than owner signup, but modular rather than a
40-minute form: sections, save/resume, clear progress, required vs optional,
context for why each fact is needed and what becomes public, conditional
questions, local autosave.

Sections: identity (adult only; DOB private), photos (validated locally, object
URLs cleaned up, never described as securely uploaded), experience,
professional background, the sitter's own animals, services and rates, pet
preferences, home environment, **how animals are actually cared for**
(free movement, restricted rooms, crate/cage use and why, separation, hours
alone, walks, enrichment, outdoor access, feeding, sleeping, supervision,
transport, emergencies — worded per species), care limits and safety,
availability and capacity, verification states, preview, publish.

Verification states are `not_started / submitted / pending / verified / rejected
/ expired`, and none may be claimed until a process exists. Documents are
local-only, never uploaded, never auto-badging. No "Nidz Certified" from a quiz.

Preview uses the **same public-profile component** as the owner-facing view — no
second renderer. Publishing changes local demo state and says so.

## §71–83 Requests, meet & greet, messaging, safety

Request carries sitter, pet(s), service, dates, approximate location,
instructions, displayed price context and care notes, with a confirmation
summary before submission. States: `draft / sent / pending / accepted / declined
/ cancelled / completed` — `completed` only if a deliberate demo mechanism moves
care through completion. `accepted` never equals a paid confirmed booking.

The sitter sees enough to decide safely: owner, pets and their profiles, dates,
service, approximate location, care needs, compatibility constraints, price
context. Actions are accept, decline, ask a question — without pressure.

An optional pre-care meeting concept (suggest a meeting / plan a call) models
the workflow without pretending Nidz has calendar or video infrastructure.

Messaging is a marketplace inbox with pet/dates/service/status context preserved
in the thread, not a Slack clone. Attachments and voice notes may be represented
locally with honest persistence claims. Audio/video calls are either hidden or
clearly labelled unavailable — **no decorative dead buttons**.

**Phone numbers are private by default** — this intentionally corrects the raw
brief. Sharing requires explicit consent (`not_shared / owner_consented /
sitter_consented / mutually_shared`). Report and block exist as honest local
representations, not a fake moderation department.

Care-critical information (feeding, medication, routines, emergency and vet
contacts, handoff, behaviour notes) is private and never on a public pet
profile.

## §79–81 Two-sided feedback

Owner → sitter: rating, written review, optional structured categories.
Sitter → pet: temperament, behaviour, care complexity, instruction accuracy,
compatibility. Sitter → owner: communication, instruction clarity, punctuality —
**not** a public one-number owner score, which invites retaliation and bias.

Double-blind window states (`feedback_window_open`, `owner_submitted`,
`sitter_submitted`, `both_submitted`, `window_closed`, `revealed`) may be a
deterministic local simulation, documented as requiring a backend clock for real
enforcement.

## §84–90 Navigation, profile, settings, language, RTL

Owner tabs: Home, Search, Messages, Profile. Sitter tabs: Requests, Calendar,
Messages, Profile. Icon **and** label. Secondary entities live inside Home and
Profile rather than in the tab bar.

A reusable, history-aware back affordance appears on every non-home screen, with
a deterministic parent fallback for deep links, correct RTL direction, an
accessible label and a comfortable target — and never on Home, never duplicated
inside a sheet.

Settings is a real architecture (personal information, account, photo, location,
language, notifications, privacy, security, help, policies, demo reset) with no
dead rows added for visual completeness.

The language selector leaves the rest of the product: detect device language on
first launch, fall back to the product default, and put manual selection in
Settings → Language, where an explicit choice persists and overrides future
detection.

Arabic must be genuinely RTL across direction, typography, back arrow, bottom
nav, icons, cards, sheets, forms, inline spacing, date and map controls, message
bubbles and avatar order — preferring logical properties, and never mirroring
icons whose direction is semantic.

## §91–94 Auth, OTP and payments

Google, Microsoft and phone remain architecture boundaries. No credentials, no
secrets, no `.env` with real provider secrets. If OAuth cannot run end to end it
stays demo-only. If no OTP provider exists, never claim an SMS was sent.

Payments prepare Algerian methods (CIB, Edahabia) as a future boundary only. No
fake checkout, no split payment, escrow, wallet, payout, guarantee or automatic
refund. No primary "Pay" CTA. Document that payment is inactive in Audit 1.2.

## §95–99 Privacy and demo data

Sensitive: legal names, DOB, phone, precise location, ID documents, credentials,
private messages, care plans, animal health, home details, photos. For each
field ask why Nidz needs it, when, who sees it, how long it lives. Public
profile data and private account data must be structurally distinguishable. Do
not store raw identity documents, sensitive attachments or secrets in long-lived
`localStorage`.

Fixtures stay centralised and internally consistent — one coherent record per
demo sitter. Demo data need not shout "FAKE" on every card, but help and policy
content must make clear that the prototype does not represent real marketplace
supply, and generated people are never presented as registered users.

## §100–114 Engineering

State: typed slices for account, capabilities, active workspace, owner profile,
pets, sitter profile, onboarding progress, availability, services, rates,
requests, conversations, messages, reviews, feedback, portfolio, consent,
language, location, favourites and demo metadata — **without** one 2000-line god
provider.

Persisted state is versioned with safe migration from 1.1; corrupt or old state
never crashes; unknown stays unknown; migration never fabricates a sitter claim.

Routing may be namespaced per workspace where it materially helps, avoiding
churn where the current structure is already coherent. Client-side route guards
are UX, never described as authorization.

Every important data screen has deliberate empty, loading and error states that
say what happened and what to do next. Forms have visible labels, explicit
required/optional state, inline errors, preserved values after a failed
validation — never placeholder-as-label, never a red border alone.

Accessibility targets WCAG 2.2 AA: keyboard, visible focus not obscured by
sticky UI, landmarks, headings, labelled fields and errors, dialog focus, image
alternatives, status not by colour alone, comfortable targets (~44×44 for
important mobile actions), reflow at 320 px, logical order, RTL, reduced motion.

Responsive means different, not smaller: bottom nav, sticky CTA, filter sheet
and full-screen controls on mobile; rails, split list/map, wider profile and
master/detail messaging on desktop — same information model. Test 320×640,
390×844, a tablet width and 1440×900, with no horizontal overflow and no CTA
hidden under the bottom bar.

Manage bundle growth deliberately: route lazy-loading, map lazy-loading, gallery
lazy-loading, efficient geography search. Map code must not load on screens that
never use a map, and map failure must not break search.

TypeScript: discriminated unions for statuses, exhaustive handling, reusable
domain types, nullability matching truth, no new `any`, no project-wide
strictness flip that would cascade unrelated changes.

Components: search before creating; no duplicate button or card primitives, no
1000-line pages — but no universal enterprise abstraction over two repeated
lines either.

## §115 Voice

Concise, calm, direct, human, respectful, non-technical. No hype, corporate
filler, fake reassurance, animal puns, childish language or "AI-powered"
framing. "Send request", not "Submit your personalized care booking inquiry".

## §116–121 Ranking, completeness and separation of systems

Ranking is deterministic and explainable: hard compatibility first (species,
service, stated limits, geography, dates where demo availability exists), then
ordering on real evidence (proximity, same commune, relevant experience,
suitable environment, profile completeness, legitimate reputation). No
pseudo-scientific weights. Every personalised claim must be fully supported or
not shown.

Completeness is administrative, never quality. Payment rate, credentials and
popularity are separate systems and none implies trust or safety.

`NIDZ_SCORING_AND_PRICING_FUTURE.md` documents possible future signals,
new-sitter fairness protections, the private price advisor and the anti-dumping
question — **without** implementing a score, a recommended price or a price
floor, and without inventing Algerian market data.

## §122–131 Threat model and restraint

Model fake or stolen identity, false profession, misleading photos, unsafe
environments, escape, bite, illness, emergency, damage, theft, cancellation,
harassment, off-platform bypass, review retaliation, fraudulent reviews, unsafe
owners and inaccurate pet descriptions. Audit 1.2 need not solve these — the UI
must not pretend they are solved.

Where a requirement needs backend infrastructure, deliver truthful architecture
with polished, appropriate UI rather than recreating a backend in `localStorage`
to tick a box.

## §132–145 Execution and definition of done

Work group by group; at every boundary inspect the diff, validate, review, fix,
`git diff --check`, confirm the branch, commit, push.

Final checks are the real project commands (`npm run build`, `npx tsc --noEmit`,
`npm run lint`, `git diff --check`) plus browser QA across the owner journey,
the sitter journey, the feedback lifecycle, three languages, four viewports and
the console. Report exact results; never claim tests passed when no test suite
exists.

The final report states, per feature, whether it is real frontend behaviour, a
local simulation, architecture only, backend-dependent or a future decision —
and confirms plainly whether authentication, OTP, ID verification, credential
verification, payment, booking, messaging, calls, file storage and moderation
exist for real. Limitations are not hidden. Debt is classified as **must fix
before merge**, **should fix soon**, or **future backend/product**.

Finish on `nidz-1.2`. Push. Do not merge. Do not deploy.
