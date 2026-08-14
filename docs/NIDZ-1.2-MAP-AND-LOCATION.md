# Nidz — map, geolocation and location privacy

**Status: no map ships in Audit 1.2, and no map dependency is installed.**
This document records the evaluation that led there, the rule any future map
must obey, and precisely what would unblock it.

Written at Group 5 of Audit 1.2. Read `src/data/algeria/metadata.ts` alongside
it — the blocker below is the same one that made commune coverage partial.

---

## 1. The blocker is not the map library. It is that Nidz has no coordinates.

A map of sitters needs a position per sitter. Nidz has none, and cannot get one
honestly today:

- **No sitter has coordinates.** `SitterProfile` carries a `communeCode` and
  nothing else. That is deliberate — §29 forbids ever publishing a sitter's
  home coordinates — but it means a marker needs a *commune* position, not a
  home position.
- **No commune has coordinates.** The reference dataset assembled in Group 4
  has none, and the community datasets that do carry them either state no
  source at all or declare no licence. See `KNOWN_GAPS` in
  `src/data/algeria/metadata.ts`.
- **They cannot be derived here.** Deriving centroids would mean bulk-querying
  a geocoding service, which §27 rules out by name.
- **They must not be invented.** A plausible-looking centroid for each commune
  is fabricated geography, and a wrong one is invisible — it renders as a
  perfectly convincing marker in the wrong place.

So a map shipped now could show either nothing, or something untrue. §131 is
explicit about which way that resolves: truthful architecture over fake
functionality.

The same gap blocks "Use my location". `navigator.geolocation` returns a
latitude and a longitude; turning those into a commune requires either
centroids to compare against or a reverse-geocoding call. Nidz has neither. A
button that asks for the browser's most sensitive permission and then cannot
act on the answer is worse than no button — it is a permission prompt spent on
nothing. Audit 1.1 reached the same conclusion (see the comment at the top of
`src/pages/owner/need/NeedLocation.tsx`); Group 4 established *why* the data is
missing rather than merely that it was.

---

## 2. What was evaluated

### Rendering engine — **MapLibre GL JS**, if and when a map ships

The audit's first preference, and the right one: BSD-licensed, no account, no
vendor lock, vector tiles, and the fork the ecosystem standardised on after
Mapbox GL JS changed licence. Mapbox is **not** installed — Audit 1.1 removed
the unused dependency and its token placeholder, and nothing here reintroduces
it.

Cost if adopted: roughly 200 kB gzipped for the library alone, against a bundle
that is already 219 kB gzipped and already over Vite's warning threshold. That
is a large price for a feature that currently has nothing true to draw, and it
is a second reason to wait rather than the main one.

### Tile / style provider — evaluated, none adopted

| Option | Why not, today |
|---|---|
| MapLibre `demotiles` | Country-level detail. Useless for distinguishing communes inside Algiers, which is the only thing a Nidz map would be for. |
| OpenStreetMap raster tiles | The OSMF tile usage policy is explicit that the tiles are not a free-for-all and that applications should use a commercial or self-hosted provider. Requires attribution and an identifying User-Agent. Acceptable for a developer's own testing, not as the tile layer of a product demo. |
| MapTiler / Stadia / similar free tiers | Require an API key. Keys must not be committed (§91), and a build-time key in a public repository is a committed secret with extra steps. |
| OpenFreeMap | No key, no registration, MapLibre-native — the most promising free option and the one to re-examine first. Still does not solve the coordinate problem. |
| Self-hosted PMTiles / Protomaps | Full control and no third-party terms, at the cost of hosting a large asset. Reasonable once there is a backend. |

**If a provider is adopted later it must be replaceable, documented here, and
attributed on screen — and it must never be described as production
infrastructure.**

### Geocoding — not adopted, and one option ruled out by name

Public Nominatim autocomplete is forbidden (§27), and so is bulk scraping. A
future forward/reverse geocoder is a keyed service and therefore a backend
concern.

---

## 3. What replaces a map in Audit 1.2

Nothing decorative. §25 already makes the list the accessibility and
failure-safe discovery experience, and it stays the whole experience:

- Discovery is the results register at `/search`.
- Location is chosen from the searchable wilaya/commune comboboxes built in
  Group 4 — which is also, in a country where administrative boundaries are how
  people describe where they live, a perfectly natural way to say where you are.
- **Proximity is expressed as shared administrative area, not as a distance.**
  "In your commune" and "in your wilaya" are facts Nidz can support without a
  single coordinate. A kilometre figure is not, and inventing one would be a
  precision claim with nothing behind it.

There is deliberately no greyed-out map placeholder, no "map coming soon" panel
and no disabled "Use my location" control. A dead affordance is the anti-pattern
§71–83 names.

---

## 4. The rules any future map must obey

These are not deferred with the feature; they constrain whatever ships later.

1. **Never publish a home position.** Not the sitter's, not the owner's.
2. **Markers are approximate by construction**, not by rounding a real position
   at render time — a client-side offset applied to an exact coordinate that was
   sent to the browser has published the exact coordinate.
3. **Commune area or centroid, never a house.** If a marker can be mistaken for
   an address, it is wrong.
4. **No false precision.** No distance in metres, no "1.2 km away" unless the
   number is derived from data that genuinely supports it.
5. **The list must work with the map switched off**, and a map failure must not
   break search (§112).
6. **Lazy-loaded.** The map bundle must not load on screens that never show a
   map — which today is every screen.
7. **Attribution on screen**, per whatever provider is adopted.

---

## 5. Geolocation, when it becomes possible

The permission flow is designed but not built, because it has nothing to act on.
When centroids or a geocoder exist:

- **Never requested on load.** An explicit control only, with the benefit stated
  before the prompt (§28).
- Handle all six outcomes: granted, denied, unavailable, timeout, unsupported,
  and insecure context (`navigator.geolocation` is absent on plain HTTP).
- **Manual wilaya/commune selection remains available at all times**, and the
  detected area is offered as a suggestion the user confirms or changes — Nidz
  does not have to determine the legally correct commune, and must not claim to.
- A denied permission is a normal outcome, not an error state to nag about.

---

## 6. What would unblock this

In order of how much it buys:

1. **A licensed, sourced set of commune positions** — centroids or
   representative points for the communes Nidz covers. This alone turns on the
   map, area-based markers and coarse proximity.
2. **A tile provider decision** — re-examine OpenFreeMap first; self-hosted
   PMTiles once there is somewhere to host them.
3. **A backend** for geocoding, which is what "Use my location" ultimately needs
   to name an administrative area from a position.

Item 1 is the one that matters. Until it exists, every other piece of this is
scaffolding around an empty middle.
