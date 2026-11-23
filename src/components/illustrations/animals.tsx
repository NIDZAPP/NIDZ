import type { SVGProps } from "react";

import type { Species } from "@/data/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   NIDZ ANIMAL ILLUSTRATIONS (1.4)

   Authored artwork, not icons: flat shapes, no outline, two fur tones plus ink
   details, drawn on a 160 × 160 grid. Each animal is a `<g>` so a scene can
   compose them; `AnimalPortrait` wraps one on its tile.

   The colours below are ARTWORK colours, kept in this one file on purpose.
   Interface colours stay tokens (src/index.css); fur, beak and feathers are
   not interface roles, and turning each into a token would put "goldfinch
   wing" in the design system. Where a token exists (ink, the teal collar) the
   artwork uses it, so the illustrations follow the palette.

   The bird is a goldfinch — the chardonneret most Algerian bird keepers know —
   rather than a generic bird. Decorative only: every use is `aria-hidden`, and
   the species is always named in text next to it.
   ------------------------------------------------------------------------ */

const INK = "hsl(var(--foreground))";
const TEAL = "hsl(var(--primary))";
const ART = {
  dogFur: "#E2B48A",
  dogEar: "#A8603F",
  dogPatch: "#C98F62",
  cream: "#F7EBDD",
  tongue: "#E07A64",
  tag: "#F1C232",
  catFur: "#D9874E",
  catStripe: "#B5622F",
  catInnerEar: "#F2B9A4",
  catNose: "#D9786A",
  birdBody: "#EAD7BC",
  birdMask: "#C8432F",
  birdWing: "#2A302E",
  birdBar: "#F1C232",
  birdBeak: "#E9D8BE",
  branch: "#8C5A3C",
} as const;

export function DogArt({ collar = TEAL }: { collar?: string }) {
  return (
    <g>
      <path d="M30 160 C30 128 52 112 80 112 C108 112 130 128 130 160 Z" fill={ART.dogFur} />
      <path d="M62 112 Q80 124 98 112 L98 160 L62 160 Z" fill={ART.cream} />
      <rect x="56" y="108" width="48" height="9" rx="4.5" fill={collar} />
      <circle cx="80" cy="124" r="6" fill={ART.tag} />
      <ellipse cx="80" cy="76" rx="37" ry="35" fill={ART.dogFur} />
      <path d="M47 52 C36 52 28 66 30 86 C31 98 38 104 44 101 C50 98 52 84 54 70 C55 60 54 52 47 52 Z" fill={ART.dogEar} />
      <path d="M113 52 C124 52 132 66 130 86 C129 98 122 104 116 101 C110 98 108 84 106 70 C105 60 106 52 113 52 Z" fill={ART.dogEar} />
      <ellipse cx="95" cy="70" rx="11" ry="10" fill={ART.dogPatch} />
      <ellipse cx="80" cy="92" rx="20" ry="15" fill={ART.cream} />
      <circle cx="66" cy="70" r="4.2" fill={INK} />
      <circle cx="94" cy="70" r="4.2" fill={INK} />
      <circle cx="67.4" cy="68.6" r="1.3" fill="#fff" />
      <circle cx="95.4" cy="68.6" r="1.3" fill="#fff" />
      <ellipse cx="80" cy="84" rx="7" ry="5" fill={INK} />
      <path d="M80 89 V94 M73 96 Q80 101 87 96" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M77 98 Q80 107 83 98 Z" fill={ART.tongue} />
    </g>
  );
}

export function CatArt() {
  return (
    <g>
      <path d="M34 160 C34 130 54 116 80 116 C106 116 126 130 126 160 Z" fill={ART.catFur} />
      <path d="M64 116 Q80 130 96 116 L96 160 L64 160 Z" fill={ART.cream} />
      <path d="M44 62 L46 26 Q47 22 51 24 L76 46 Z" fill={ART.catFur} />
      <path d="M116 62 L114 26 Q113 22 109 24 L84 46 Z" fill={ART.catFur} />
      <path d="M50 52 L51 33 L66 46 Z" fill={ART.catInnerEar} />
      <path d="M110 52 L109 33 L94 46 Z" fill={ART.catInnerEar} />
      <ellipse cx="80" cy="80" rx="42" ry="37" fill={ART.catFur} />
      <path d="M70 46 Q72 56 70 62 M80 44 V60 M90 46 Q88 56 90 62" stroke={ART.catStripe} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M38 80 Q46 78 50 82 M122 80 Q114 78 110 82" stroke={ART.catStripe} strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="80" cy="96" rx="22" ry="15" fill={ART.cream} />
      <ellipse cx="64" cy="78" rx="4.5" ry="5.5" fill={INK} />
      <ellipse cx="96" cy="78" rx="4.5" ry="5.5" fill={INK} />
      <circle cx="65.4" cy="76.4" r="1.4" fill="#fff" />
      <circle cx="97.4" cy="76.4" r="1.4" fill="#fff" />
      <path d="M75 89 L85 89 L80 95 Z" fill={ART.catNose} stroke={ART.catNose} strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 95 V98 M80 98 Q75 103 71 99 M80 98 Q85 103 89 99" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M58 94 L30 90 M58 99 L32 102 M102 94 L130 90 M102 99 L128 102" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
    </g>
  );
}

export function BirdArt({ perch = true }: { perch?: boolean }) {
  return (
    <g>
      {perch && <path d="M20 128 Q80 120 160 128" stroke={ART.branch} strokeWidth="6" fill="none" strokeLinecap="round" />}
      <path d="M120 96 L150 118 L140 122 L112 104 Z" fill={ART.birdWing} />
      <path d="M52 86 C52 58 70 44 88 44 C108 44 122 60 122 82 C122 106 104 124 82 124 C64 124 52 108 52 86 Z" fill={ART.birdBody} />
      <path d="M60 96 C70 120 98 124 112 108 C100 112 76 110 60 96 Z" fill={ART.cream} />
      <path d="M86 70 C104 66 124 78 124 96 C124 104 118 108 110 106 C96 102 86 90 86 70 Z" fill={ART.birdWing} />
      <path d="M92 84 C102 82 114 88 118 96" stroke={ART.birdBar} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M78 54 C84 60 86 68 82 76 C76 80 70 78 68 74 C74 68 76 62 78 54 Z" fill="#fff" opacity=".85" />
      <path d="M58 70 C58 56 70 46 82 46 C78 52 76 60 78 70 C72 76 64 76 58 70 Z" fill={ART.birdMask} />
      <path d="M82 46 C92 44 100 48 104 54 C96 54 88 58 84 64 Z" fill={ART.birdWing} />
      <circle cx="72" cy="62" r="3.8" fill={INK} />
      <circle cx="73.2" cy="60.8" r="1.1" fill="#fff" />
      <path d="M58 62 L44 66 L58 70 Z" fill={ART.birdBeak} stroke="#C9B08C" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M78 124 L74 132 M90 123 L92 132" stroke={ART.branch} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/** The tile colour each species sits on. Sand, terracotta tint, sky: warm,
    warm, cool — so the three read as a family and not as a traffic light. */
export const SPECIES_TILE: Record<Species, string> = {
  dog: "bg-sand",
  cat: "bg-brand-soft",
  bird: "bg-sky",
};

const ART_OF: Record<Species, () => JSX.Element> = {
  dog: () => <DogArt />,
  cat: () => <CatArt />,
  bird: () => <BirdArt />,
};

/**
 * One animal on its tile. Decorative — the species is always named in text
 * beside it, so this is hidden from assistive technology.
 */
export function AnimalPortrait({
  species,
  className,
  tile = true,
  ...rest
}: { species: Species; tile?: boolean } & SVGProps<SVGSVGElement>) {
  const Art = ART_OF[species];
  return (
    <svg
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
      className={cn(tile && SPECIES_TILE[species], "block", className)}
      {...rest}
    >
      <Art />
    </svg>
  );
}

/**
 * The home visual: a dog and a cat in front of a low sun, a goldfinch on a
 * branch above them. Drawn for the deep-teal hero panel.
 */
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 358 230" aria-hidden="true" focusable="false" className={cn("block", className)}>
      <circle cx="190" cy="250" r="150" fill="hsl(var(--primary))" />
      <circle cx="252" cy="70" r="34" fill={ART.tag} opacity="0.92" />
      <path d="M0 230 Q90 196 180 206 Q270 216 358 190 L358 230 Z" fill="hsl(var(--primary-hover))" />
      <g transform="translate(60 52) scale(1.12)">
        <DogArt collar={ART.dogEar} />
      </g>
      <g transform="translate(176 72) scale(0.98)">
        <CatArt />
      </g>
      <g transform="translate(236 6) scale(0.62) scale(-1 1) translate(-160 0)">
        <BirdArt />
      </g>
      <path d="M232 85 Q300 78 358 84" stroke={ART.branch} strokeWidth="3.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
