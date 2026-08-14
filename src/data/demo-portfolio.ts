/* ---------------------------------------------------------------------------
   DEMONSTRATION CARE PORTFOLIO.

   WHY THERE ARE NO PHOTOGRAPHS HERE.

   A care portfolio is a photographic feature, and Nidz has no consented
   photography. Filling it with stock images of other people's dogs would be
   the anti-pattern §21 and §40 name — and it would be worse here than
   anywhere else in the product, because the entire purpose of the portfolio is
   to be *evidence*. A fabricated proof is not a weaker proof; it is the
   opposite of one.

   So each fixture item carries what a real one would carry MINUS the image:
   the activity, the species, the sitter's own caption, the date and the
   consent state. The screen renders that and says plainly that the photographs
   are the part this demonstration does not have. When real consented images
   exist, they drop into `imageUrl` and nothing else changes.

   CONSENT STATES ARE EXERCISED ON PURPOSE. Two of these are not `public`, so
   the filtering in `publicItemsFor` is doing visible work rather than being
   dead code that happens to compile. A withdrawn item is kept as a record
   rather than deleted, because "they changed their mind" and "it was never
   asked" are different facts.
   ------------------------------------------------------------------------ */

import type { PortfolioItem } from "./portfolio";
import { addDays, toISODate, today } from "@/utils/dates";

type PortfolioSeed = Omit<PortfolioItem, "createdAt" | "isDemoFixture"> & { daysAgo: number };

const SEEDS: PortfolioSeed[] = [
  {
    id: "p-amina-1",
    sitterId: "amina-b",
    species: "dog",
    activity: "homeStay",
    caption: "Sleeping spot in the hallway, away from the front door so nobody is disturbed coming in.",
    consent: "public",
    daysAgo: 20,
  },
  {
    id: "p-amina-2",
    sitterId: "amina-b",
    species: "dog",
    activity: "walk",
    caption: "The morning route along the quiet side of the neighbourhood, about forty minutes.",
    consent: "public",
    daysAgo: 46,
  },
  {
    id: "p-amina-3",
    sitterId: "amina-b",
    species: "dog",
    activity: "play",
    caption: "In the yard with my own dog. Not shown publicly — the owner has not been asked.",
    consent: "consent_requested",
    daysAgo: 8,
  },

  {
    id: "p-sarah-1",
    sitterId: "sarah-m",
    species: "cat",
    activity: "careSetup",
    caption: "How I leave things after an evening visit: fresh water, litter done, curtain left open.",
    consent: "public",
    daysAgo: 15,
  },
  {
    id: "p-sarah-2",
    sitterId: "sarah-m",
    species: "cat",
    activity: "enrichment",
    caption: "Ten minutes of play at the end of each visit, so the flat is not only about food.",
    consent: "public",
    daysAgo: 37,
  },
  {
    id: "p-sarah-3",
    sitterId: "sarah-m",
    species: "cat",
    activity: "feeding",
    caption: "An owner asked me to take this down after their stay ended.",
    consent: "consent_withdrawn",
    daysAgo: 90,
  },

  {
    id: "p-nadia-1",
    sitterId: "nadia-l",
    species: "cat",
    activity: "homeStay",
    caption: "The upstairs room I use when a cat needs to be kept away from the dogs.",
    consent: "public",
    daysAgo: 11,
  },
  {
    id: "p-nadia-2",
    sitterId: "nadia-l",
    species: "dog",
    activity: "careSetup",
    caption: "The garden gate and the latch, so owners can see how it closes before they leave.",
    consent: "public",
    daysAgo: 30,
  },

  {
    id: "p-karim-1",
    sitterId: "karim-b",
    species: "dog",
    activity: "walk",
    caption: "Late afternoon walk. Three a day, always the same times.",
    consent: "public",
    daysAgo: 5,
  },
];

export const DEMO_PORTFOLIO: PortfolioItem[] = SEEDS.map(({ daysAgo, ...seed }) => ({
  ...seed,
  createdAt: toISODate(addDays(today(), -daysAgo)),
  isDemoFixture: true,
}));
