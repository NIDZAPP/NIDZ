import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import PetForm from "@/components/owner/PetForm";
import FlowScreen from "@/components/shared/FlowScreen";
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
import { emptyPet, type Pet } from "@/data/pets";
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
  const existing = id ? (state.pets.find((p) => p.id === id) ?? null) : null;

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
  const [pet, setPet] = useState<Pet>(
    () =>
      existing ??
      emptyPet(
        `pet-${Date.now().toString(36)}`,
        (SPECIES as readonly string[]).includes(startSpecies ?? "") ? (startSpecies as Species) : "dog",
      ),
  );
  const [nameError, setNameError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  /* A pet id that names nothing — a stale bookmark, a deleted animal, a
     hand-edited URL — goes back to the list rather than rendering an empty
     form that would silently create a second animal on save. */
  if (id && !existing) return <Navigate to={next ?? "/owner/pets"} replace />;

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

  const submit = () => {
    if (!pet.name.trim()) {
      setNameError(t("need.pet.nameRequired"));
      nameRef.current?.focus();
      return;
    }
    dispatch({ type: "savePet", pet: { ...pet, name: pet.name.trim() } });
    leave(pet.id);
  };

  const remove = () => {
    if (!existing) return;
    dispatch({ type: "removePet", id: existing.id });
    leave(null);
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
        </form>
      </FlowScreen>
    </>
  );
}
