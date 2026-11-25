import { Bird, Cat, Dog, Fish, PawPrint, Rabbit, Rat, Turtle, Worm } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PetCategory } from "@/data/types";

/**
 * One small icon per category, defined once — for chips and dense rows where
 * the catalogue illustration would be too large. A `Record` keyed on the
 * union fails to compile when a category is added, rather than rendering a
 * dog beside the word « lapin ». Categories Lucide has no drawing for use the
 * paw; the name is always written beside it.
 */
export const SPECIES_ICON: Record<PetCategory, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  parrot: Bird,
  rabbit: Rabbit,
  guineaPig: PawPrint,
  hamster: PawPrint,
  mouse: Rat,
  ferret: PawPrint,
  fish: Fish,
  turtle: Turtle,
  snake: Worm,
  chameleon: PawPrint,
  other: PawPrint,
};
