import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, PencilLine, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { findSitter } from "@/data/repository";
import { requestPath } from "@/data/request-draft";
import { clearDraft, hasDraft } from "@/hooks/use-form-draft";
import { useDemo } from "@/state/demo/context";
import { isolate } from "@/utils/format";
import {
  ANIMAL_DRAFT_SCOPE,
  categoryAnswered,
  draftCategory,
  hasKindStep,
  useAnimalDraft,
} from "@/pages/owner/need/animal-draft";

/* ---------------------------------------------------------------------------
   « Brouillon » (Nidz 1.7 §20.3) — unfinished care requests, under the three
   section controls of Demandes, shown ONLY when one exists.

   Two kinds, both kept on this device across a refresh, a closed app and a
   detour:

     the care journey   an animal being described, or an animal, a place
                        and a service not yet sent or published — resumed at
                        the step it reached;
     a direct request   to one sitter, not sent yet (the 1.3 bookmark).

   Neither wears a status colour: nothing has been sent. Discarding asks
   first and forgets only the draft — never a saved animal.
   ------------------------------------------------------------------------ */

const NEED_SCOPES = [ANIMAL_DRAFT_SCOPE, "need-location", "need-care"];

export default function DraftCards() {
  const { t } = useTranslation();
  const { state, dispatch } = useDemo();
  const [animal] = useAnimalDraft();

  const need = state.need;
  const pet = need.petId ? state.pets.find((p) => p.id === need.petId) : null;
  /* The journey after the animal was saved. */
  const careJourney = Boolean(need.step && pet);
  /* The animal steps, before anything was saved. */
  const describing = !careJourney && hasDraft(ANIMAL_DRAFT_SCOPE) && Boolean(draftCategory(animal));

  const resumeCare = () => {
    const q = pet ? `?pet=${encodeURIComponent(pet.id)}` : "";
    if (need.step === "care" && need.wilayaCode) return `/owner/need/care${q}`;
    return `/owner/need/location${q}`;
  };
  const resumeAnimal = () => {
    if (animal.name.trim()) return "/owner/need/needs";
    if (categoryAnswered(animal)) return hasKindStep(animal) ? "/owner/need/breed" : "/owner/need/about";
    return "/owner/need/pet";
  };

  const draft = state.requestDraft;
  const draftSitter = draft ? findSitter(state, draft.sitterId).sitter : null;

  if (!careJourney && !describing && !(draft && draftSitter)) return null;

  const discardJourney = () => {
    for (const scope of NEED_SCOPES) clearDraft(scope);
    dispatch({ type: "clearNeed" });
  };

  const animalName = careJourney ? pet!.name : animal.name.trim();
  const category = careJourney ? pet!.species : draftCategory(animal);

  return (
    <section aria-labelledby="drafts-title" className="mt-5">
      <h2 id="drafts-title" className="sr-only">
        {t("drafts.title")}
      </h2>
      <ul role="list" className="grid gap-3">
        {(careJourney || describing) && (
          <DraftRow
            to={careJourney ? resumeCare() : resumeAnimal()}
            title={
              animalName
                ? t("drafts.journeyFor", { name: isolate(animalName) })
                : t("drafts.journeyAnimal", { animal: category && category !== "other" ? t(`species.${category}`) : t("catalogue.other") })
            }
            body={t(careJourney ? `drafts.step.${need.step}` : "drafts.step.pet")}
            discardLabel={t("drafts.discard")}
            onDiscard={discardJourney}
          />
        )}
        {draft && draftSitter && (
          <DraftRow
            to={requestPath(draft.sitterId, draft.search)}
            title={t("request.review.titleFor", { sitter: isolate(draftSitter.publicName) })}
            body={t("home.draft.body")}
            discardLabel={t("home.draft.discard", { sitter: isolate(draftSitter.publicName) })}
            onDiscard={() => dispatch({ type: "discardRequestDraft" })}
          />
        )}
      </ul>
    </section>
  );
}

function DraftRow({
  to,
  title,
  body,
  discardLabel,
  onDiscard,
}: {
  to: string;
  title: string;
  body: string;
  discardLabel: string;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="surface flex items-center gap-1 p-1.5">
      <Link
        to={to}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg p-2.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Neutral, never a status colour: nothing has been sent. */}
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <PencilLine className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-foreground">{title}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {t("drafts.badge")} · {body}
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">{discardLabel}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("drafts.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("drafts.discardBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onDiscard}>{t("drafts.discardConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
