import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";

import { AnimalPortrait } from "@/components/illustrations/animals";
import AgeField from "@/components/shared/AgeField";
import FlowScreen from "@/components/shared/FlowScreen";
import PhotoField from "@/components/shared/PhotoField";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const FORM_ID = "need-about";

/**
 * Nom · Âge · Photo (Nidz 1.7 §8) — one screen, one « Continuer ».
 *
 * The name is the one required answer: it is what makes an animal someone a
 * sitter can be asked about. The age takes years and months, an estimate or
 * « je ne sais pas ». The photo is the owner's own picture of this animal —
 * optional, kept on the device, and never confused with the catalogue
 * illustration, which is only what the empty frame shows.
 */
export default function NeedAbout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const [draft, setDraft] = useAnimalDraft();
  const save = useSave({ scope: ANIMAL_DRAFT_SCOPE });
  const category = draftCategory(draft);
  const [nameError, setNameError] = useState<string | undefined>();
  const nameRef = useRef<HTMLInputElement>(null);

  if (!categoryAnswered(draft) || !category) return <Navigate to={stepPath("pet", flow.search)} replace />;

  const submit = () => {
    if (!draft.name.trim()) {
      setNameError(t("needFlow.about.nameRequired"));
      nameRef.current?.focus();
      return;
    }
    navigate(stepPath("needs", flow.search));
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("needFlow.about.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={stepPath(hasKindStep(draft) ? "breed" : "pet", flow.search)}
        title={t("needFlow.about.title")}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-9"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <section aria-labelledby="about-name">
            <h2 id="about-name" className="text-title font-semibold text-foreground">
              {t("needFlow.about.nameTitle")}
            </h2>
            <div className="mt-3">
              <FieldShell label={t("needFlow.about.nameQuestion")} error={nameError}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={nameRef}
                    value={draft.name}
                    maxLength={40}
                    autoComplete="off"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, name: value }));
                      setNameError(undefined);
                    }}
                  />
                )}
              </FieldShell>
            </div>
          </section>

          <section aria-labelledby="about-age">
            <h2 id="about-age" className="text-title font-semibold text-foreground">
              {t("needFlow.about.ageTitle")}
            </h2>
            <div className="mt-3">
              <AgeField
                label={t("needFlow.about.ageQuestion")}
                value={{ mode: draft.ageMode, years: draft.ageYears, months: draft.ageMonths }}
                onChange={(next) => setDraft((d) => ({ ...d, ageMode: next.mode, ageYears: next.years, ageMonths: next.months }))}
              />
            </div>
          </section>

          <section aria-labelledby="about-photo">
            <h2 id="about-photo" className="text-title font-semibold text-foreground">
              {t("needFlow.about.photoTitle")}
            </h2>
            <div className="mt-3">
              <PhotoField
                label={t("needFlow.about.photoLabel")}
                value={draft.photo || null}
                onChange={(photo) => setDraft((d) => ({ ...d, photo: photo ?? "" }))}
                placeholder={<AnimalPortrait species={category} className="size-full opacity-70 grayscale-[30%]" />}
              />
            </div>
          </section>
        </form>
      </FlowScreen>
    </>
  );
}
