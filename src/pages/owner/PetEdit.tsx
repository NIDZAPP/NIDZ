import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import PetForm from "@/components/owner/PetForm";
import FlowScreen from "@/components/shared/FlowScreen";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
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
import { emptyPet, restorePet, type Pet } from "@/data/pets";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { cameFromRequest, requestSearchOf, sitterIdFromRequestPath, withPet } from "@/data/request-draft";
import { SPECIES, type Species } from "@/data/types";
import { useDemo } from "@/state/demo/context";
import { sameOriginPath } from "@/utils/safe-path";

const FORM_ID = "pet-edit";

/**
 * Add or edit one animal.
 *
 * One screen for both, because they are the same form — the only differences
 * are the title, whether the species can still be changed, and whether there is
 * anything to delete. Two near-identical screens would drift.
 *
 * Draft state is local and only committed on submit, so abandoning half an edit
 * leaves the saved animal exactly as it was.
 *
 * FROM A REQUEST (Audit 1.3 LOT 01). Opened from "Votre demande à Amina", the
 * screen carries that request's URL as `next` and goes back to it — to the
 * same sitter, with the animal just saved selected — instead of to My pets.
 * When the entry behind this one IS that summary, saving pops history rather
 * than pushing a second copy, so Back from the summary still means "the
 * profile", not "the same request with nothing selected". The selection
 * travels as a one-shot hand-off in the demo state (`handoffPet`).
 *
 * Saving here can never touch another animal: a new animal always gets a new
 * id, and an existing one is only ever saved under its own.
 */
/**
 * Keyed by route, so `/owner/pets/:id` and `/owner/pets/new` never share one
 * instance. React Router reuses the element across those two routes, and with
 * it the draft held in `useState` — moving from Rex's screen to "add an
 * animal" opened a form pre-filled with Rex, whose save then overwrote him.
 */
export default function PetEdit() {
  const { id } = useParams();
  return <PetEditScreen key={id ?? "new"} />;
}

function PetEditScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const { state, dispatch } = useDemo();

  const isNew = !id;
  const current = id ? (state.pets.find((p) => p.id === id) ?? null) : null;
  /* The animal as it was when this screen opened. Another tab can delete or
     change it while this one is being edited (Audit 1.3.1 A-19); the form
     stays on what the visitor was editing, and saving then asks instead of
     silently resurrecting or overwriting it. */
  const [openedWith] = useState(current);
  const existing = current ?? openedWith;

  /* Where to return — honoured ONLY when it is a request summary, the one
     screen that links here with it. Any other `next` (a hand-made
     `?next=/owner/pets/new`, say) is ignored: this screen can save an animal,
     and must not be steerable into a flow where saving lands somewhere it
     was not built for. Parsed with the browser's own URL parser (see
     `sameOriginPath`). */
  const candidateNext = sameOriginPath(searchParams.get("next"));
  const requestSitter = sitterIdFromRequestPath(candidateNext);
  const next = requestSitter ? candidateNext : null;
  const startSpecies = searchParams.get("species");

  /* Created once, in the initialiser, so a re-render never mints a new id
     mid-edit. The starting species is the one the request asked for when
     there is one; otherwise dog, only because the form has to show something.
     Either way it is a live radio group, not a guess recorded anywhere. */
  /* An unsaved draft for this tab (Audit 1.3 LOT 08): leaving for Compte to
     change the language, or reloading, no longer empties the form. Keyed by
     the animal, and for a new one by the request it is for, so two drafts
     never mix. What comes back is validated through `restorePet` and must
     still be the same animal; the photo (an object URL) is never kept. */
  type Draft = Pet & Record<string, unknown>;
  const draftKey = id ? `pet-${id}` : `pet-new-${requestSitter ?? ""}`;
  const [pet, setPetDraft, clearDraft] = useFormDraft<Draft>(
    draftKey,
    () =>
      (existing ??
        emptyPet(
          `pet-${Date.now().toString(36)}`,
          (SPECIES as readonly string[]).includes(startSpecies ?? "") ? (startSpecies as Species) : "dog",
        )) as Draft,
    {
      restore: (raw, fallback) => {
        const restored = restorePet(raw);
        if (!restored) return null;
        if (existing && restored.id !== existing.id) return null;
        return { ...restored, photoUrl: fallback.photoUrl } as Draft;
      },
      transient: ["photoUrl"],
    },
  );
  const setPet = (next: Pet) => setPetDraft(next as Draft);
  /* What another tab could have changed under this form: this animal, as
     stored. Never the photo, which is not stored. */
  const save = useSave({
    scope: draftKey,
    watch: (s) => {
      const stored = s.pets.find((p) => p.id === pet.id);
      if (!stored) return null;
      const { photoUrl: _photo, ...rest } = stored;
      return rest;
    },
  });
  const lastAttempt = useRef<"save" | "remove">("save");
  const [nameError, setNameError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  /* A pet id that names nothing — a stale bookmark, a deleted animal, a
     hand-edited URL — goes back to the list rather than rendering an empty
     form that would silently create a second animal on save. */
  if (id && !openedWith) return <Navigate to={next ?? "/owner/pets"} replace />;

  /* Back to where this screen was opened from. */
  const leave = (selectPetId: string | null) => {
    if (next && requestSitter) {
      if (selectPetId) {
        dispatch({
          type: "handoffPet",
          sitterId: requestSitter,
          search: requestSearchOf(next),
          petId: selectPetId,
        });
      }
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
      if (cameFromRequest(location.state) && idx > 0) navigate(-1);
      else navigate(withPet(next, selectPetId), { replace: true });
      return;
    }
    navigate(next ?? "/owner/pets", { replace: true });
  };

  const submit = (force = false) => {
    lastAttempt.current = "save";
    if (!pet.name.trim()) {
      setNameError(t("need.pet.nameRequired"));
      nameRef.current?.focus();
      return;
    }
    /* Leaves ONLY once the animal is on disk (A-02); otherwise the form
       stays filled in, with the reason and a retry. */
    if (!save.save({ type: "savePet", pet: { ...pet, name: pet.name.trim() } }, { force })) return;
    clearDraft();
    leave(pet.id);
  };

  const remove = () => {
    lastAttempt.current = "remove";
    if (!existing) return;
    /* Confirmed by the dialog, so not checked against another tab's edit —
       but still only reported done once storage agrees. */
    if (!save.save({ type: "removePet", id: existing.id }, { force: true })) return;
    clearDraft();
    leave(null);
  };
  const retry = () => (lastAttempt.current === "remove" ? remove() : submit());
  /* "Use the saved version" of an animal another tab deleted: there is no
     saved version left to show, so it goes back to the list. */
  const takeSaved = () => {
    if (id && !current) {
      clearDraft();
      navigate(next ?? "/owner/pets", { replace: true });
    } else save.discard();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {isNew ? t("pets.addTitle") : pet.name || t("pets.editTitle")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo={next ?? "/owner/pets"}
        wide
        title={isNew ? t("pets.addTitle") : (pet.name || t("pets.editTitle"))}
        intro={isNew ? t("pets.addIntro") : undefined}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={FORM_ID} size="lg">
            {t("pets.save")}
          </Button>
        }
        secondaryAction={
          existing ? (
            /* Confirmed, because it removes the animal and cannot be undone —
               and because the row that opens it sits beside the save button. */
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  {t("pets.delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  {/* The SAVED name, not the draft. Renaming and then deleting
                      asked "Delete Mimi?" about a record stored as "Rex". */}
                  <AlertDialogTitle>
                    {t("pets.deleteConfirmTitle", { name: existing.name })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t("pets.deleteConfirmBody")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("pets.deleteCancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>{t("pets.deleteConfirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
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
          <PetForm
            pet={pet}
            onChange={(next) => {
              setPet(next);
              setNameError(undefined);
            }}
            nameError={nameError}
            nameRef={nameRef}
            /* Locked on an existing animal: changing species discards every
               species-specific answer, which is right while creating and
               destructive afterwards. */
            speciesLocked={Boolean(existing)}
          />
          <SaveFeedback
            className="mt-8"
            save={{ failure: save.failure, attempt: save.attempt, discard: takeSaved }}
            onRetry={retry}
            onKeepMine={() => submit(true)}
            /* A refused delete is not a refused save: it says what did not
               happen, about the animal as stored. */
            failedTitle={
              lastAttempt.current === "remove" && existing
                ? t("pets.deleteFailedTitle", { name: existing.name })
                : undefined
            }
            failedBody={lastAttempt.current === "remove" ? t("pets.deleteFailedBody") : undefined}
          />
        </form>
      </FlowScreen>
    </>
  );
}
