import { Bird, Cat, Dog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Species } from "@/data/types";

/**
 * One icon per species, defined once.
 *
 * It was written out four times as `s === "dog" ? Dog : Cat`, which is exactly
 * the shape that silently drops a species when a third one is added — a
 * ternary has no third branch and the compiler cannot see the gap. A `Record`
 * keyed on `Species` does: adding a fourth animal fails to compile here rather
 * than rendering a dog icon beside the word "rabbit".
 */
export const SPECIES_ICON: Record<Species, LucideIcon> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
};
