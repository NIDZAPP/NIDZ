/* ---------------------------------------------------------------------------
   DEMONSTRATION REVIEWS — written for fictional sitters, about stays that
   never happened.

   These are part of the same fiction as `demo-sitters.ts`, and they carry
   `isDemoFixture: true` for the same reason the sitters do: every surface that
   renders one reads that flag and says what it is looking at.

   TWO RULES SHAPED THE CONTENT.

   1. NOT EVERY SITTER HAS REVIEWS. `youcef-h` has none, deliberately — §46's
      cold start is not an edge case to handle, it is the state most real
      sitters will be in on their first day, and a demo where everyone is
      already reviewed hides the one screen that matters most for a new joiner.

   2. NOT EVERY REVIEW IS FIVE STARS. A wall of fives is what fabricated
      reviews look like; real ones disagree with each other. The threes and
      fours here criticise things that are consistent with what that sitter
      actually declares — a sitter who says they take one animal at a time gets
      a review noting that they would not take a second.

   Dates are day offsets from today so a fixture written once never drifts into
   claiming a review was left three years ago.
   ------------------------------------------------------------------------ */

import type { Review } from "./reviews";
import { addDays, toISODate, today } from "@/utils/dates";

type ReviewSeed = Omit<Review, "createdAt" | "isDemoFixture"> & { daysAgo: number };

const SEEDS: ReviewSeed[] = [
  /* ------------------------------------------------------------- amina-b */
  {
    id: "r-amina-1",
    sitterId: "amina-b",
    authorName: "Lyes M.",
    rating: 5,
    careType: "boarding",
    body: "Amina sent a photo every evening without me having to ask. The yard is exactly as described and my dog came back tired and calm.",
    reply: {
      body: "Thank you Lyes. He got on well with my own dog from the first afternoon, which made the week easy.",
      createdAt: "",
    },
    daysAgo: 24,
  },
  {
    id: "r-amina-2",
    sitterId: "amina-b",
    authorName: "Sofia B.",
    rating: 4,
    careType: "walk",
    body: "Reliable and always on time. The walks are earlier in the morning than I would choose, but she told me that before I booked.",
    reply: null,
    daysAgo: 51,
  },
  {
    id: "r-amina-3",
    sitterId: "amina-b",
    authorName: "Karim T.",
    rating: 5,
    careType: "boarding",
    body: "Second stay. She asked about his medication before I thought to mention it.",
    reply: null,
    daysAgo: 88,
  },

  /* ------------------------------------------------------------- karim-b */
  {
    id: "r-karim-1",
    sitterId: "karim-b",
    authorName: "Nawel H.",
    rating: 5,
    careType: "walk",
    body: "Three walks a day as agreed, and he messages if anything changes. My dog now waits by the door at the right time.",
    reply: null,
    daysAgo: 12,
  },
  {
    id: "r-karim-2",
    sitterId: "karim-b",
    authorName: "Mehdi A.",
    rating: 3,
    careType: "boarding",
    body: "Kind and careful with my dog. The flat is genuinely small though — fine for two nights, I would not do a fortnight there.",
    reply: {
      body: "That is fair, and it is why I only take one dog at a time and say so on my profile. Thank you for being direct.",
      createdAt: "",
    },
    daysAgo: 40,
  },

  /* ------------------------------------------------------------- sarah-m */
  {
    id: "r-sarah-1",
    sitterId: "sarah-m",
    authorName: "Imene K.",
    rating: 5,
    careType: "atOwner",
    body: "My cat hides from everyone. By the third visit Sarah had photos of her out from under the bed.",
    reply: null,
    daysAgo: 9,
  },
  {
    id: "r-sarah-2",
    sitterId: "sarah-m",
    authorName: "Rachid B.",
    rating: 5,
    careType: "atOwner",
    body: "Gave the tablets twice a day for ten days without any trouble, and left the flat exactly as she found it.",
    reply: {
      body: "Thank you. He was much easier about the tablets than you warned me he would be.",
      createdAt: "",
    },
    daysAgo: 33,
  },
  {
    id: "r-sarah-3",
    sitterId: "sarah-m",
    authorName: "Yasmina D.",
    rating: 4,
    careType: "atOwner",
    body: "Very good with the cats. The evening visit sometimes ran late, which mattered to us because of feeding times.",
    reply: null,
    daysAgo: 70,
  },

  /* ------------------------------------------------------------- nadia-l */
  {
    id: "r-nadia-1",
    sitterId: "nadia-l",
    authorName: "Amine S.",
    rating: 5,
    careType: "boarding",
    body: "She insisted on meeting first, which I found reassuring rather than annoying. The garden is properly fenced.",
    reply: null,
    daysAgo: 6,
  },
  {
    id: "r-nadia-2",
    sitterId: "nadia-l",
    authorName: "Fella M.",
    rating: 5,
    careType: "boarding",
    body: "Our cat is nervous around dogs and Nadia kept them in separate parts of the house the whole week, exactly as she said she would.",
    reply: {
      body: "She settled quickly once she had the upstairs to herself. Happy to have her again.",
      createdAt: "",
    },
    daysAgo: 28,
  },
  {
    id: "r-nadia-3",
    sitterId: "nadia-l",
    authorName: "Bilal R.",
    rating: 4,
    careType: "walk",
    body: "Good walks and clear messages. Booking around her family's schedule took a few tries.",
    reply: null,
    daysAgo: 62,
  },
  {
    id: "r-nadia-4",
    sitterId: "nadia-l",
    authorName: "Selma O.",
    rating: 5,
    careType: "atOwner",
    body: "Came to us twice a day for two weeks. Left a note each time saying what he had eaten.",
    reply: null,
    daysAgo: 105,
  },

  /* ----------------------------------------------------------- yasmine-t */
  {
    id: "r-yasmine-1",
    sitterId: "yasmine-t",
    authorName: "Hakim L.",
    rating: 4,
    careType: "walk",
    body: "Punctual and friendly. She is a student so the times are early or late, which suited me but might not suit everyone.",
    reply: null,
    daysAgo: 17,
  },

  /* youcef-h has none. That is the point — see the note at the top. */
];

export const DEMO_REVIEWS: Review[] = SEEDS.map(({ daysAgo, reply, ...seed }) => {
  const createdAt = toISODate(addDays(today(), -daysAgo));
  return {
    ...seed,
    createdAt,
    /* A reply cannot predate the review it answers. Anchored a couple of days
       after, rather than left blank or given "now", which would put every
       reply in the future of its own review. */
    reply: reply ? { body: reply.body, createdAt: toISODate(addDays(today(), -daysAgo + 2)) } : null,
    isDemoFixture: true,
  };
});
