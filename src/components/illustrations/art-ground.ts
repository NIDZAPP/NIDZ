import { PET_CATEGORIES, type PetCategory } from "@/data/types";

/** The ground the artwork is painted on (its sampled midpoint — the renders
    range from #D9C288 to #F5E5AD), for « Autre » and while an image loads. */
export const ART_GROUND = "bg-[#EADA9E]";

/** One warm ground for every category now that the artwork carries its own. */
export const SPECIES_TILE: Record<PetCategory, string> = Object.fromEntries(
  PET_CATEGORIES.map((category) => [category, ART_GROUND]),
) as Record<PetCategory, string>;

