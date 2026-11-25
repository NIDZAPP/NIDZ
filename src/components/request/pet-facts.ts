import type { TFunction } from "i18next";

import { classificationOf } from "@/data/animal-catalogue";
import { kindLabel, type PetAge, type SharedPet } from "@/data/pets";
import type { AppLocale } from "@/i18n";

/** « 2 ans et 3 mois », « environ 12 ans », « âge inconnu » — or the pre-1.7
    free text, or null when the owner said nothing. */
export function ageText(pet: Pick<SharedPet, "age" | "ageInfo">, t: TFunction): string | null {
  const info: PetAge | null = pet.ageInfo ?? null;
  if (info?.status === "unknown") return t("age.unknownShort");
  if (info) {
    const parts = [
      info.years > 0 ? t("age.yearsCount", { count: info.years }) : null,
      info.months > 0 ? t("age.monthsCount", { count: info.months }) : null,
    ].filter(Boolean) as string[];
    const value = parts.join(t("age.and"));
    return info.status === "estimated" ? t("age.about", { value }) : value;
  }
  return pet.age.trim() || null;
}

/** The animal's category in words: the catalogue name, or the owner's own
    words for « Autre ». */
export function categoryText(pet: Pick<SharedPet, "species" | "otherCategory">, t: TFunction): string {
  return pet.species === "other" ? pet.otherCategory.trim() || t("catalogue.other") : t(`species.${pet.species}`);
}

/**
 * The species-specific facts an owner actually answered, as label/value pairs.
 *
 * WHY THIS EXISTS. Group 7 collected a dog's size and compatibility, a cat's
 * escape risk, a bird's housing and handling — and then rendered none of it,
 * while the pet screens told the owner it was "everything a sitter needs to
 * judge whether they can take your animal". Answering all ten questions
 * changed nothing a sitter saw. That is the product asserting a benefit it does
 * not deliver, which is exactly the class of failure §117 rules out.
 *
 * TWO RULES.
 *
 * 1. UNANSWERED IS OMITTED, NOT RENDERED AS "unknown". A sitter reading a
 *    short list of facts learns something; a sitter reading nine rows of "I
 *    don't know" learns nothing and stops reading. The absence is itself
 *    honest — nothing here claims the list is complete.
 *
 * 2. THE CARE PLAN IS NOT HERE. `SharedPet` has no `care` field, so feeding,
 *    medication, vet and emergency contact cannot be added to this list even
 *    by accident. §83 keeps those for someone actually looking after the
 *    animal.
 */
export function petFacts(pet: SharedPet, t: TFunction, locale: AppLocale): { key: string; label: string; value: string }[] {
  const facts: { key: string; label: string; value: string }[] = [];

  const add = (key: string, labelKey: string, value: string | null) => {
    if (value) facts.push({ key, label: t(labelKey), value });
  };

  /** A yes/no answer, or nothing at all when it was never given. */
  const declared = (key: string, labelKey: string, value: "yes" | "no" | "unknown") => {
    if (value === "unknown") return;
    add(key, labelKey, t(`pets.declared.${value}`));
  };

  /* Breed or species first: it is what a sitter pictures before anything. */
  add("kind", `catalogue.label.${classificationOf(pet.species) ?? "breed"}`, kindLabel(pet, locale));
  add("age", "needFlow.about.ageTitle", ageText(pet, t));
  if (pet.sex !== "unknown") add("sex", "pets.sexLabel", t(`pets.sex.${pet.sex}`));

  switch (pet.species) {
    case "dog": {
      const d = pet.details;
      /* Retired question; an earlier answer is still what the owner said. */
      add("size", "pets.dog.sizeLegacy", d.size ? t(`dogSize.${d.size}`) : null);
      declared("neutered", "pets.dog.neutered", d.neutered);
      declared("withDogs", "pets.dog.goodWithDogs", d.goodWithDogs);
      declared("withCats", "pets.dog.goodWithCats", d.goodWithCats);
      declared("withChildren", "pets.dog.goodWithChildren", d.goodWithChildren);
      add("walks", "pets.dog.walksPerDay", d.walksPerDay === null ? null : String(d.walksPerDay));
      add("leash", "pets.dog.leashNotes", d.leashNotes.trim() || null);
      break;
    }
    case "cat": {
      const d = pet.details;
      add("living", "pets.cat.living", d.living ? t(`pets.cat.livingOption.${d.living}`) : null);
      declared("neutered", "pets.cat.neutered", d.neutered);
      declared("withCats", "pets.cat.goodWithCats", d.goodWithCats);
      declared("withDogs", "pets.cat.goodWithDogs", d.goodWithDogs);
      declared("escape", "pets.cat.escapeRisk", d.escapeRisk);
      add("litter", "pets.cat.litterNotes", d.litterNotes.trim() || null);
      break;
    }
    case "bird": {
      const d = pet.details;
      add("housing", "pets.bird.housing", d.housing ? t(`pets.bird.housingOption.${d.housing}`) : null);
      add(
        "handling",
        "pets.bird.handling",
        d.handling ? t(`pets.bird.handlingOption.${d.handling}`) : null,
      );
      declared("escape", "pets.bird.escapeRisk", d.escapeRisk);
      add("outOfCage", "pets.bird.outOfCageNotes", d.outOfCageNotes.trim() || null);
      add("social", "pets.bird.socialNotes", d.socialNotes.trim() || null);
      break;
    }
    default:
      add("habitat", "pets.habitat.label", pet.details.habitat.trim() || null);
  }

  return facts;
}
