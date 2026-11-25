import { PawPrint } from "lucide-react";
import type { ImgHTMLAttributes } from "react";

import type { PetCategory, Species } from "@/data/types";
import { ART_GROUND } from "./art-ground";
import { cn } from "@/lib/utils";

import chameleon192 from "@/assets/illustrations/animals/chameleon-192.webp";
import chameleon384 from "@/assets/illustrations/animals/chameleon-384.webp";
import cat192 from "@/assets/illustrations/animals/cat-192.webp";
import cat384 from "@/assets/illustrations/animals/cat-384.webp";
import bird192 from "@/assets/illustrations/animals/bird-192.webp";
import bird384 from "@/assets/illustrations/animals/bird-384.webp";
import dog192 from "@/assets/illustrations/animals/dog-192.webp";
import dog384 from "@/assets/illustrations/animals/dog-384.webp";
import ferret192 from "@/assets/illustrations/animals/ferret-192.webp";
import ferret384 from "@/assets/illustrations/animals/ferret-384.webp";
import fish192 from "@/assets/illustrations/animals/fish-192.webp";
import fish384 from "@/assets/illustrations/animals/fish-384.webp";
import guineaPig192 from "@/assets/illustrations/animals/guinea-pig-192.webp";
import guineaPig384 from "@/assets/illustrations/animals/guinea-pig-384.webp";
import hamster192 from "@/assets/illustrations/animals/hamster-192.webp";
import hamster384 from "@/assets/illustrations/animals/hamster-384.webp";
import mouse192 from "@/assets/illustrations/animals/mouse-192.webp";
import mouse384 from "@/assets/illustrations/animals/mouse-384.webp";
import parrot192 from "@/assets/illustrations/animals/parrot-192.webp";
import parrot384 from "@/assets/illustrations/animals/parrot-384.webp";
import rabbit192 from "@/assets/illustrations/animals/rabbit-192.webp";
import rabbit384 from "@/assets/illustrations/animals/rabbit-384.webp";
import snake192 from "@/assets/illustrations/animals/snake-192.webp";
import snake384 from "@/assets/illustrations/animals/snake-384.webp";
import turtle192 from "@/assets/illustrations/animals/turtle-192.webp";
import turtle384 from "@/assets/illustrations/animals/turtle-384.webp";
import welcome480 from "@/assets/illustrations/welcome-480.webp";
import welcome800 from "@/assets/illustrations/welcome-800.webp";
import welcome1024 from "@/assets/illustrations/welcome-1024.webp";

/* ---------------------------------------------------------------------------
   NIDZ ANIMAL ILLUSTRATIONS (Nidz 1.7).

   The supplied catalogue artwork (`Images.zip`, delivered with the 1.7
   brief): one rendered figure per category on a warm sand ground, plus the
   welcome scene. They replace the 1.4 flat SVG animals. Converted to WebP at
   two sizes (192 and 384 px, 2–8 KB each) so a phone downloads the size it
   draws; the originals are 1 024–1 254 px JPEG/PNG of 300–600 KB.

   These are ILLUSTRATIONS OF A CATEGORY, never a person's animal: an owner's
   own photograph is a separate field (`pet.photoUrl`) and always wins where
   it exists. Decorative here — the category is always named in text beside
   the picture — so every image has an empty alt.

   The sand of the artwork is the « living things » warmth of the system:
   never a control colour. Selection on a card is the teal ring and check.
   ------------------------------------------------------------------------ */

const ART: Record<Species, { small: string; large: string }> = {
  dog: { small: dog192, large: dog384 },
  cat: { small: cat192, large: cat384 },
  bird: { small: bird192, large: bird384 },
  parrot: { small: parrot192, large: parrot384 },
  rabbit: { small: rabbit192, large: rabbit384 },
  guineaPig: { small: guineaPig192, large: guineaPig384 },
  hamster: { small: hamster192, large: hamster384 },
  mouse: { small: mouse192, large: mouse384 },
  ferret: { small: ferret192, large: ferret384 },
  fish: { small: fish192, large: fish384 },
  turtle: { small: turtle192, large: turtle384 },
  snake: { small: snake192, large: snake384 },
  chameleon: { small: chameleon192, large: chameleon384 },
};

/**
 * One category's illustration. `sizes` tells the browser how wide it is
 * drawn so it picks 192 or 384; the default suits a card three to a row on a
 * phone. « Autre » has no artwork: a paw on the same ground.
 */
export function AnimalPortrait({
  species,
  className,
  tile = true,
  sizes = "(min-width: 768px) 160px, 33vw",
  eager = false,
  ...rest
}: {
  species: PetCategory;
  tile?: boolean;
  sizes?: string;
  /** For the first screen's images; everything else loads lazily. */
  eager?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "alt">) {
  if (species === "other") {
    return (
      <span aria-hidden="true" className={cn("flex items-center justify-center", ART_GROUND, "text-[#8A6A3A]", className)}>
        <PawPrint className="size-[38%]" strokeWidth={1.6} />
      </span>
    );
  }
  const art = ART[species];
  return (
    <img
      src={art.small}
      srcSet={`${art.small} 192w, ${art.large} 384w`}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      width={192}
      height={192}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("block object-cover", tile && ART_GROUND, className)}
      {...rest}
    />
  );
}

/** The welcome scene (« Photo d'accueil »): a person with two dogs and a cat. */
export function WelcomeArt({ className, sizes = "(min-width: 768px) 520px, 92vw" }: { className?: string; sizes?: string }) {
  return (
    <img
      src={welcome800}
      srcSet={`${welcome480} 480w, ${welcome800} 800w, ${welcome1024} 1024w`}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      width={1024}
      height={1024}
      decoding="async"
      /* React 18 does not know the camelCase prop; the attribute is lowercase. */
      {...{ fetchpriority: "high" }}
      draggable={false}
      className={cn("block object-cover", className)}
    />
  );
}
