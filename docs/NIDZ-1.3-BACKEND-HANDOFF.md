# Nidz 1.3 — Front-end → backend handoff

**Purpose.** What the next audit (Backend & Lancement) has to replace, and the
rules the server must enforce. Written at the end of Audit 1.3 LOT 10 against
branch `nidz-1.3`. Nothing here is implemented: there is no server, no
Supabase, no authentication and no network call in `src/`.

**Launch status: NO-GO for a public marketplace** until real accounts,
cross-user requests, security, privacy, moderation/support and real profiles
exist and are validated (Audit 1.3 §5).

---

## 1. The seam

Every read of sitters, requests, reviews and care moments goes through
**`src/data/repository.ts`**. No screen imports a fixture file; the only
importers of `demo-sitters.ts`, `demo-reviews.ts` and `demo-portfolio.ts` are
the repository (and unit tests). Writes go through the demo reducer
(`src/state/demo/reducer.ts`), one action per domain event.

Business rules that must stay identical on the server are pure functions:

| Rule | Module |
|---|---|
| Matching (hard constraints incl. dog size), reasons, order | `src/data/criteria.ts` |
| Pet ↔ sitter fit (species, size, unknown size) | `petFit` in `criteria.ts` |
| What a sitter offers, rate per service, declared unavailability | `src/data/offer.ts` |
| Publication minimum (`canPublish`) | `src/data/sitter-sections.ts` |
| Clarification thread (who may add, when) | `src/data/clarification.ts` |
| Request in preparation (URL contract) | `src/data/request-draft.ts` |

The server must **re-check** these rules; the client copies are for display.

## 2. Repository functions → endpoints

| Today (`repository.ts` / reducer) | Becomes | Who may call | Server must check |
|---|---|---|---|
| `publicSitters(state)` | `GET /sitters?species&size&care&wilaya|commune&from&to&max&sort` | anyone | only published **and** `canPublish` profiles; hard constraints server-side; never a distance |
| `findSitter(state, id)` | `GET /sitters/:id` · `GET /me/sitter-profile` | anyone · owner of profile | unpublished profiles only to their owner |
| `sitterReviews(id)` | `GET /sitters/:id/reviews` | anyone | only reviews of **completed** stays (a `completed` status does not exist yet — see §5) |
| `sitterPortfolio(id)` | `GET /sitters/:id/portfolio` | anyone | public items only; animal photos need the owner's consent |
| `requestsSent(state)` | `GET /me/requests?role=owner` | authenticated owner | own requests only |
| `requestsReceived(state)` | `GET /me/requests?role=sitter` | authenticated sitter | requests addressed to their profile only |
| `findRequest(state, id)` | `GET /requests/:id` | its owner or its sitter | 404 for anyone else |
| reducer `addRequest` | `POST /requests` | authenticated owner | sitter exists & is published; pet belongs to caller; `petFit` true; service offered; dates in future and not declared unavailable; duplicate pending request → return existing |
| reducer `respondToRequest` | `POST /requests/:id/decision {accepted|declined}` | the request's sitter | only from `pending` |
| reducer `addClarification` | `POST /requests/:id/messages {text}` | owner or sitter of the request | only while `pending`; `author` from the session, never from the body; length ≤ 500 |
| reducer `savePet` / `removePet` | `PUT/DELETE /me/pets/:id` | owner | private care plan never exposed elsewhere |
| reducer `patchSitterProfile` / `publishSitterProfile` | `PATCH /me/sitter-profile` · `POST /me/sitter-profile/publish` | sitter | `canPublish` server-side; commune only, never an address |
| reducer `setAccount` | `PATCH /me` | authenticated user | name required; phone private |

Synchronous today, these become asynchronous. Screens that will need real
**loading and error states** when they do: Search, SitterProfile, Index
(suggestions), RequestReview (send), OwnerRequests, OwnerRequestDetail,
SitterRequests (accept/decline/question), SitterPreview (publish), PetEdit,
OwnerAccount. Route-level code loading already has an honest loading state
(`RouteLoading`); data loading does not exist yet.

## 3. Data that crosses users, and what never does

- **Request → sitter:** a *copy* of the animal **without** the private care
  plan (`SharedPet`, `forSharing`). Feeding, medication, vet and emergency
  contact are for someone actually caring for the animal (§83).
- **Public profile:** first name + initial, commune (never an address),
  declared facts. Phone and date of birth are never public.
- **Clarification thread:** visible to the request's two parties only.
- **Owner's area on a request:** commune when the search named one; absent
  otherwise.

## 4. Identity and authentication (not built)

- `src/auth/providers.ts` lists Google, Microsoft and phone as **planned, not
  connected**; the gateway (`/auth`) renders them disabled and says why.
- Today an "account" is a name in this browser (`DemoAccount`). There is no
  session, token, password or OTP, and no screen may suggest otherwise.
- When OTP exists, the retired `/sitter/join/verify` and
  `/owner/request/:id/verify` routes are where a real verification would go.

## 5. Trust mechanisms required before any label changes

Provenance vocabulary (`src/components/shared/trust.tsx`): `declared`
(implemented), `verified`, `community`, `observed` (no mechanism — rendering
them throws in dev). Before any of them appears:

| Label | Needs |
|---|---|
| Identity verified | a real document check, an operator, a revocation process |
| Reviews | a `completed` request status that only a real stay can produce, and moderation |
| Response time / completed stays | server-observed events |
| "Disponible" | a booking calendar — today only *declared unavailability* exists |
| Meeting before the stay | a real channel; today a question about meeting is just a question |

## 6. What is demo-only and must be replaced or removed

| Item | Where | At launch |
|---|---|---|
| Example sitters, reviews, care moments | `src/data/demo-*.ts` (`isDemoFixture: true`) | remove; never migrate as real |
| Example notices | `DemoNotice` / `DemoLine` on Search, profile, request sent, sitter inbox, dashboard, preview, auth | keep each until the function it qualifies is real, then remove (§0 of the audit) |
| "Outils de test" (address a request to your own profile) | Compte (`/settings`) | remove once two real users exist |
| Local "publication" into this browser's search | `publishSitterProfile`, `publicSitters` | becomes the server publish |
| Demo reset | Compte | becomes account deletion (GDPR-style) |
| Browser storage | `nidz.demo` (state), `nidz.lang` (explicit language), `nidz.draft.*` (sessionStorage, unsaved forms) | `nidz.demo` replaced by the server; the other two may stay local |

## 7. Front-end things a backend does **not** need to replace

- `QueryClientProvider` (`src/App.tsx`) stays mounted on purpose: no query
  runs today, and it is where the repository's server queries will plug in
  (cache, retries, loading/error states). Removing it now only to re-add it
  with the backend was judged churn, not cleanup.

- The request URL contract and `requestDraft` bookmark (a client concern).
- `useFormDraft` (unsaved form drafts, this tab only).
- Geography reference data (`src/data/algeria/`) — but read
  `algeria/metadata.ts` `KNOWN_GAPS` before treating it as complete.

## 8. Tests that protect the contract

- `npm run test:unit` — `node:test` via Vite's loader, no extra dependency:
  matching and size constraints, request draft, publication minimum, request
  transitions, storage validation (`tests/unit/`).
- `npm run test:e2e` — Playwright browser checks per lot against a running
  dev server (`e2e/`).
