import { Building2, DoorClosed, Fence, Footprints, House, Trees } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CareType, HousingType, OutdoorSpace } from "@/data/types";

import { Balcony, HomeHeart, HomeKey } from "./nidz-icons";

/* One picture per domain value, defined once — the same rule as
   `SPECIES_ICON`: a `Record` keyed on the union fails to compile when a value
   is added, instead of rendering the wrong picture beside a new word. */

export const CARE_ICON: Record<CareType, LucideIcon> = {
  boarding: HomeHeart,
  atOwner: HomeKey,
  /* Lucide has the picture, so Lucide it is: a custom lead drawn at 16px
     read as a telephone handset beside a price (finish review). */
  walk: Footprints,
};

export const HOUSING_ICON: Record<HousingType, LucideIcon> = {
  apartment: Building2,
  house: House,
};

export const OUTDOOR_ICON: Record<OutdoorSpace, LucideIcon> = {
  none: DoorClosed,
  balcony: Balcony,
  yard: Fence,
  garden: Trees,
};
