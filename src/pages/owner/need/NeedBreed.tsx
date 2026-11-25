import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";

import FlowScreen from "@/components/shared/FlowScreen";
import KindList from "@/components/shared/KindList";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classificationOf } from "@/data/animal-catalogue";
import { getKind } from "@/data/animal-kinds";
import { useSave } from "@/hooks/use-save";
import { cn } from "@/lib/utils";

import { ANIMAL_DRAFT_SCOPE, categoryAnswered, draftCategory, stepPath, useAnimalDraft, useNeedFlow } from "./animal-draft";

const KIND_OTHER_MAX = 40;

/**
 * « Race » / « Espèce » (Nidz 1.7 §7) — its own step, after the animal.
 *
 * The catalogue's list for this animal, with a search field and the actions
 * pinned under it:
 *
 *   Autre          a breed the list does not carry, in the owner's words;
 *   Je ne sais pas skips the question — a complete answer, never penalised;
 *   Continuer      once a breed is chosen or typed.
 *
 * The title adapts: a dog, cat, rabbit or guinea pig has a breed; a bird,
 * parrot, hamster, fish or reptile has a species. An animal with no useful
 * classification (ferret, mouse, « Autre ») never reaches this screen.
 *
 * What a breed does and does not do is said once, behind the « ! »: it can
 * decide whether a sitter who accepts only some breeds can be asked, and it
 * predicts nothing about behaviour.
 */
export default function NeedBreed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const [draft, setDraft] = useAnimalDraft();
  const save = useSave({ scope: ANIMAL_DRAFT_SCOPE });
  const category = draftCategory(draft);
  const classification = classificationOf(category);
  const [otherError, setOtherError] = useState<string | undefined>();
  const otherRef = useRef<HTMLInputElement>(null);
  const [focusOther, setFocusOther] = useState(false);

  useEffect(() => {
    if (focusOther && draft.kindMode === "other") {
      otherRef.current?.focus();
      setFocusOther(false);
    }
  }, [focusOther, draft.kindMode]);

  /* Reached directly, or after the animal changed to one without a list. */
  if (!categoryAnswered(draft) || !category || category === "other") return <Navigate to={stepPath("pet", flow.search)} replace />;
  if (!classification) return <Navigate to={stepPath("about", flow.search)} replace />;

  const listed = draft.kindMode === "listed" ? getKind(draft.kindId, category) : null;
  const otherOpen = draft.kindMode === "other";
  const ready = Boolean(listed) || (otherOpen && draft.kindOther.trim().length >= 2);

  const next = () => navigate(stepPath("about", flow.search));

  const submit = () => {
    if (otherOpen && draft.kindOther.trim().length < 2) {
      setOtherError(t("needFlow.breed.otherRequired"));
      otherRef.current?.focus();
      return;
    }
    if (ready) next();
  };

  const unknown = () => {
    setDraft((d) => ({ ...d, kindMode: "unknown", kindId: "", kindOther: "" }));
    next();
  };

  const toggleOther = () => {
    setOtherError(undefined);
    if (otherOpen) {
      setDraft((d) => ({ ...d, kindMode: "", kindOther: "" }));
    } else {
      setDraft((d) => ({ ...d, kindMode: "other", kindId: "" }));
      setFocusOther(true);
    }
  };

  const title = t(`needFlow.breed.title.${classification}`);

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
      </Helmet>
      <FlowScreen
        backTo={stepPath("pet", flow.search)}
        title={title}
        intro={t(`needFlow.breed.question.${classification}`)}
        introId="need-breed-question"
        titleAdornment={undefined}
        headerExtra={<DraftNotice save={save} />}
        action={
          <div className="grid w-full gap-2.5 sm:w-full">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="surface"
                size="lg"
                aria-pressed={otherOpen}
                aria-controls="need-breed-other"
                onClick={toggleOther}
                className={cn(otherOpen && "shadow-[inset_0_0_0_2px_hsl(var(--primary))]")}
              >
                {t("needFlow.breed.other")}
              </Button>
              <Button type="button" variant="surface" size="lg" onClick={unknown}>
                {t("needFlow.breed.unknown")}
              </Button>
            </div>
            <Button type="button" size="lg" disabled={!ready && !otherOpen} onClick={submit}>
              {t("common.continue")}
            </Button>
          </div>
        }
      >
        <div id="need-breed-other" hidden={!otherOpen}>
          {otherOpen && (
            <div className="mb-6 animate-fade-in">
              <FieldShell label={t(`needFlow.breed.otherLabel.${classification}`)} error={otherError}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={otherRef}
                    value={draft.kindOther}
                    maxLength={KIND_OTHER_MAX}
                    autoComplete="off"
                    placeholder={t(`needFlow.breed.otherPlaceholder.${classification}`)}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) => ({ ...d, kindMode: "other", kindOther: value }));
                      setOtherError(undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submit();
                      }
                    }}
                  />
                )}
              </FieldShell>
            </div>
          )}
        </div>

        <KindList
          mode="single"
          species={category}
          labelledBy="need-breed-question"
          value={listed?.id ?? null}
          onChange={(id) => {
            setOtherError(undefined);
            setDraft((d) => ({ ...d, kindMode: "listed", kindId: id, kindOther: "" }));
          }}
        />
        <p className="mt-4 px-1 text-sm text-muted-foreground">{t("needFlow.breed.note")}</p>
      </FlowScreen>
    </>
  );
}
