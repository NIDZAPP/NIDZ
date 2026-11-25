/* ---------------------------------------------------------------------------
   THE ANIMAL BEING DESCRIBED (Nidz 1.7 §6–§10) — one draft for four steps.

   « Votre animal » → « Race » → « Nom, âge, photo » → « Besoins et
   contraintes » are four screens about ONE animal that does not exist yet.
   Their answers are one unsaved draft in this browser (`nidz.draft.need-animal`,
   like every form since Audit 1.3.1): going Back, reloading, closing the app
   or leaving to change the language keeps every answer, and nothing becomes
   an animal until the last step saves it.

   The journey can be entered three ways, carried in the address so a reload
   keeps them:

     (none)          « Trouver une garde » — the animal, then where and when;
     ?then=pets      « Ajouter un animal » from Mes animaux — save and return
                     there, nothing about care is asked;
     ?next=<path>    a detour from a request to one sitter — save and go back
                     to that request with the new animal selected.
   ------------------------------------------------------------------------ */

import { useLocation } from "react-router-dom";

import { classificationOf, validOtherCategory } from "@/data/animal-catalogue";
import { getKind } from "@/data/animal-kinds";
import { clampAge, emptyPet, restorePhoto, type Pet, type PetAge } from "@/data/pets";
import { isPetCategory, type PetCategory } from "@/data/types";
import { useFormDraft } from "@/hooks/use-form-draft";
import { sameOriginPath } from "@/utils/safe-path";

export const ANIMAL_DRAFT_SCOPE = "need-animal";

export type AnimalDraft = {
  category: string;
  otherCategory: string;
  /** "" not answered · "listed" · "other" (own words) · "unknown" (Je ne sais pas) */
  kindMode: string;
  kindId: string;
  kindOther: string;
  name: string;
  /** "" not answered · "known" · "estimated" · "unknown" */
  ageMode: string;
  ageYears: number;
  ageMonths: number;
  photo: string;
  notes: string;
  /** "" not answered · "nothing" (Rien à signaler) · "declared" */
  needs: string;
};

export const EMPTY_ANIMAL_DRAFT: AnimalDraft = {
  category: "",
  otherCategory: "",
  kindMode: "",
  kindId: "",
  kindOther: "",
  name: "",
  ageMode: "",
  ageYears: 0,
  ageMonths: 0,
  photo: "",
  notes: "",
  needs: "",
};

export function useAnimalDraft() {
  return useFormDraft<AnimalDraft>(ANIMAL_DRAFT_SCOPE, () => ({ ...EMPTY_ANIMAL_DRAFT }));
}

export function draftCategory(draft: AnimalDraft): PetCategory | null {
  return isPetCategory(draft.category) ? draft.category : null;
}

/** The animal step is answered: a category, and « Autre » named. */
export function categoryAnswered(draft: AnimalDraft): boolean {
  const category = draftCategory(draft);
  if (!category) return false;
  return category !== "other" || validOtherCategory(draft.otherCategory);
}

/** Whether this animal gets a breed / species step at all. */
export function hasKindStep(draft: AnimalDraft): boolean {
  return classificationOf(draftCategory(draft)) !== null;
}

export function draftAge(draft: AnimalDraft): PetAge | null {
  if (draft.ageMode === "unknown") return { status: "unknown" };
  if (draft.ageMode !== "known" && draft.ageMode !== "estimated") return null;
  const age = clampAge({ status: draft.ageMode, years: draft.ageYears, months: draft.ageMonths });
  return age.status !== "unknown" && age.years === 0 && age.months === 0 ? null : age;
}

/** The finished draft as a new animal — always a NEW id, so nothing saved can
    be overwritten from here. */
export function petFromDraft(draft: AnimalDraft, id: string): Pet | null {
  const category = draftCategory(draft);
  if (!category || !categoryAnswered(draft) || !draft.name.trim()) return null;
  const base = emptyPet(id, category);
  const listed = draft.kindMode === "listed" ? getKind(draft.kindId, category) : null;
  const photo = restorePhoto(draft.photo);
  return {
    ...base,
    name: draft.name.trim().slice(0, 40),
    otherCategory: category === "other" ? draft.otherCategory.trim() : "",
    kindId: listed?.id ?? null,
    kindOther: draft.kindMode === "other" ? draft.kindOther.trim().slice(0, 40) : "",
    ageInfo: draftAge(draft),
    notes: draft.needs === "declared" ? draft.notes.trim() : "",
    needsStatus: draft.needs === "nothing" ? "nothing" : null,
    ...(photo ? { photoUrl: photo } : {}),
  };
}

/* ------------------------------------------------------------ the journey */

export type NeedFlow = {
  /** `pets`: adding an animal only, from Mes animaux. */
  then: "pets" | null;
  /** A request to one sitter this detour returns to. */
  next: string | null;
  /** An existing animal the care journey is for (Mes animaux › « Trouver un
      pet-sitter » / « Publier une demande »). */
  petId: string | null;
  /** The method chosen from that card, to put first. */
  intent: "search" | "publish" | null;
  /** The query string to carry from step to step. */
  search: string;
};

export function useNeedFlow(): NeedFlow {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const intent = params.get("intent");
  return {
    then: params.get("then") === "pets" ? "pets" : null,
    next: sameOriginPath(params.get("next")),
    petId: params.get("pet"),
    intent: intent === "search" || intent === "publish" ? intent : null,
    search,
  };
}

/** A step of the journey, carrying its query. */
export function stepPath(step: string, search: string): string {
  return `/owner/need/${step}${search}`;
}
