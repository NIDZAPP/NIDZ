import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { AnimalGridSingle } from "@/components/shared/AnimalCategories";
import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OTHER_CATEGORY_MAX, validOtherCategory } from "@/data/animal-catalogue";
import type { PetCategory } from "@/data/types";
import { useSave } from "@/hooks/use-save";

import {
  ANIMAL_DRAFT_SCOPE,
  categoryAnswered,
  draftCategory,
  hasKindStep,
  stepPath,
  useAnimalDraft,
  useNeedFlow,
} from "./animal-draft";

const FORM_ID = "need-pet";

/**
 * « Votre animal » (Nidz 1.7 §6) — the first question of the owner journey,
 * and of adding an animal from Mes animaux.
 *
 * The thirteen categories of the catalogue as illustrated cards, three to a
 * row, « Autre » last; the grid scrolls and « Continuer » stays pinned at the
 * bottom (FlowScreen's action bar). One animal at a time: choosing one brings
 * it forward and lets the others recede; tapping it again restores the grid.
 * Nothing moves on by itself — the owner confirms with « Continuer », which
 * is enabled only once the answer is complete (« Autre » needs a name).
 *
 * Gone from 1.6: the subtitle, the settings gear, « Mon animal n'est pas dans
 * la liste » and every breed field — the breed is the next screen's question.
 */
export default function NeedPet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const [draft, setDraft] = useAnimalDraft();
  /* Only for the draft notice: nothing is saved on this step. */
  const save = useSave({ scope: ANIMAL_DRAFT_SCOPE });
  const category = draftCategory(draft);
  const [otherError, setOtherError] = useState<string | undefined>();
  const otherRef = useRef<HTMLInputElement>(null);

  /* « Autre » chosen: the name field is the next thing to do. */
  const [focusOther, setFocusOther] = useState(false);
  useEffect(() => {
    if (focusOther && category === "other") {
      otherRef.current?.focus();
      setFocusOther(false);
    }
  }, [focusOther, category]);

  const choose = (next: PetCategory | null) => {
    setOtherError(undefined);
    setDraft((d) =>
      d.category === (next ?? "")
        ? d
        : /* A breed belongs to the category it was chosen for. */
          { ...d, category: next ?? "", kindMode: "", kindId: "", kindOther: "" },
    );
    if (next === "other") setFocusOther(true);
  };

  const ready = categoryAnswered(draft);

  const submit = () => {
    if (category === "other" && !validOtherCategory(draft.otherCategory)) {
      setOtherError(t("needFlow.pet.otherRequired"));
      otherRef.current?.focus();
      return;
    }
    if (!ready) return;
    navigate(stepPath(hasKindStep(draft) ? "breed" : "about", flow.search));
  };

  const title = flow.then === "pets" ? t("needFlow.pet.addTitle") : t("needFlow.pet.title");

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
      </Helmet>
      <FlowScreen
        backTo={flow.next ?? "/"}
        title={title}
        intro={flow.then === "pets" ? t("needFlow.pet.addQuestion") : t("needFlow.pet.question")}
        introId="need-pet-question"
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg" disabled={!ready && category !== "other"}>
            {t("common.continue")}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <AnimalGridSingle labelledBy="need-pet-question" value={category} onChange={choose} />

          {category === "other" && (
            <div className="mt-6 animate-fade-in">
              <FieldShell label={t("needFlow.pet.otherLabel")} help={t("needFlow.pet.otherHelp")} error={otherError}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={otherRef}
                    value={draft.otherCategory}
                    maxLength={OTHER_CATEGORY_MAX}
                    autoComplete="off"
                    placeholder={t("needFlow.pet.otherPlaceholder")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, otherCategory: value }));
                      setOtherError(undefined);
                    }}
                  />
                )}
              </FieldShell>
            </div>
          )}
        </form>
      </FlowScreen>
    </>
  );
}
