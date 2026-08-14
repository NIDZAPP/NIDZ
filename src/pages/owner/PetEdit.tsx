import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";

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
import { useDemo } from "@/state/demo/context";

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
 */
export default function PetEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { state, dispatch } = useDemo();

  const isNew = !id;
  const existing = id ? (state.pets.find((p) => p.id === id) ?? null) : null;

  /* Created once, in the initialiser, so a re-render never mints a new id
     mid-edit. Dog is the starting species only because the form has to show
     something; it is a live radio group, not a guess recorded anywhere. */
  const [pet, setPet] = useState<Pet>(
    () => existing ?? emptyPet(`pet-${Date.now().toString(36)}`, "dog"),
  );
  const [nameError, setNameError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);
  const speciesRef = useRef<HTMLDivElement>(null);

  /* A pet id that names nothing — a stale bookmark, a deleted animal, a
     hand-edited URL — goes back to the list rather than rendering an empty
     form that would silently create a second animal on save. */
  if (id && !existing) return <Navigate to="/owner/pets" replace />;

  const submit = () => {
    if (!pet.name.trim()) {
      setNameError(t("need.pet.nameRequired"));
      nameRef.current?.focus();
      return;
    }
    dispatch({ type: "savePet", pet: { ...pet, name: pet.name.trim() } });
    navigate("/owner/pets", { replace: true });
  };

  const remove = () => {
    if (!existing) return;
    dispatch({ type: "removePet", id: existing.id });
    navigate("/owner/pets", { replace: true });
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
        backTo="/owner/pets"
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
                  <AlertDialogTitle>{t("pets.deleteConfirmTitle", { name: pet.name })}</AlertDialogTitle>
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
            speciesRef={speciesRef}
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
