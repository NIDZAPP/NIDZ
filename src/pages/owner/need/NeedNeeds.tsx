import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import FlowScreen from "@/components/shared/FlowScreen";
import InfoTip from "@/components/shared/InfoTip";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Pet } from "@/data/pets";
import { sitterIdFromRequestPath, withPet } from "@/data/request-draft";
import type { DemoAction } from "@/state/demo/reducer";
import { useDemo } from "@/state/demo/context";
import { useSave } from "@/hooks/use-save";
import { clearDraft } from "@/hooks/use-form-draft";

import {
  ANIMAL_DRAFT_SCOPE,
  categoryAnswered,
  petFromDraft,
  stepPath,
  useAnimalDraft,
  useNeedFlow,
} from "./animal-draft";

const NOTES_MAX = 1000;

/**
 * « Besoins et contraintes importantes » (Nidz 1.7 §10).
 *
 * One open field, with examples that stay placeholders — allergies, daily
 * medication, anxiety, reactivity, diet, other animals — and two ways on:
 *
 *   Continuer         keeps what was written (empty is « not answered »);
 *   Rien à signaler   the explicit answer « nothing to report », which a
 *                     sitter reads as such — different from a skipped
 *                     question, which they read as « non renseigné ».
 *
 * This is the step that SAVES the animal (all four steps' answers, in one
 * confirmed write), then continues to where and when — or back to Mes
 * animaux when the owner was only adding an animal.
 *
 * Arrived at with `?pet=<id>` from an animal card whose needs were never
 * answered, it updates that animal and continues the care journey.
 *
 * Who sees it: the sitters a request or a published request is shown to,
 * before they accept. Never a public profile — the line under the field says
 * so, and asks for no address or phone number.
 */
export default function NeedNeeds() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const { state } = useDemo();
  const [draft, setDraft] = useAnimalDraft();
  const save = useSave({ scope: ANIMAL_DRAFT_SCOPE });
  const existing = flow.petId ? (state.pets.find((p) => p.id === flow.petId) ?? null) : null;
  const [existingNotes, setExistingNotes] = useState(existing?.notes ?? "");

  if (!existing && !categoryAnswered(draft)) return <Navigate to={stepPath("pet", flow.search)} replace />;
  if (!existing && !draft.name.trim()) return <Navigate to={stepPath("about", flow.search)} replace />;

  const notes = existing ? existingNotes : draft.notes;
  const setNotes = (value: string) => (existing ? setExistingNotes(value) : setDraft((d) => ({ ...d, notes: value })));

  const finish = (answer: "declared" | "nothing") => {
    const text = answer === "nothing" ? "" : notes.trim();
    let pet: Pet | null;
    if (existing) {
      pet = { ...existing, notes: text, needsStatus: answer === "nothing" ? "nothing" : existing.needsStatus };
    } else {
      pet = petFromDraft({ ...draft, notes: text, needs: answer === "nothing" ? "nothing" : text ? "declared" : "" }, `pet-${Date.now().toString(36)}`);
    }
    if (!pet) return;
    const careJourney = flow.then !== "pets" && !flow.next;
    const actions: DemoAction[] = [{ type: "savePet", pet }];
    if (careJourney) {
      actions.push({
        type: "setNeed",
        patch: { species: pet.species, kindId: pet.kindId, petId: pet.id, step: "location" },
      });
    }
    const saved = save.save(actions);
    if (!saved) return;
    if (!existing) clearDraft(ANIMAL_DRAFT_SCOPE);

    if (flow.then === "pets") {
      navigate("/", { replace: true });
      return;
    }
    if (flow.next && sitterIdFromRequestPath(flow.next)) {
      navigate(withPet(flow.next, pet.id), { replace: true });
      return;
    }
    const carry = new URLSearchParams(flow.search);
    carry.set("pet", pet.id);
    navigate(stepPath("location", `?${carry.toString()}`));
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("needFlow.needs.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={existing ? "/" : stepPath("about", flow.search)}
        title={t("needFlow.needs.title")}
        intro={existing ? t("needFlow.needs.questionFor", { name: existing.name }) : t("needFlow.needs.question")}
        introId="needs-question"
        titleAdornment={<InfoTip topic={t("needFlow.needs.title")}>{t("needFlow.needs.info")}</InfoTip>}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="button" size="lg" onClick={() => finish("declared")}>
            {t("common.continue")}
          </Button>
        }
        secondaryAction={
          <Button type="button" size="lg" variant="surface" onClick={() => finish("nothing")}>
            {t("needFlow.needs.nothing")}
          </Button>
        }
      >
        <Textarea
          aria-labelledby="needs-question"
          aria-describedby="needs-privacy"
          rows={6}
          maxLength={NOTES_MAX}
          value={notes}
          placeholder={t("needFlow.needs.placeholder")}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p id="needs-privacy" className="mt-2 px-1 text-sm text-muted-foreground">
          {t("needFlow.needs.privacy")}
        </p>
        <SaveFeedback save={save} onRetry={() => finish("declared")} />
      </FlowScreen>
    </>
  );
}
