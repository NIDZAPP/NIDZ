import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { SPECIES_ICON } from "@/components/shared/species";
import { FieldShell, PhotoField } from "@/components/shared/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyPet, type Pet } from "@/data/pets";
import { SPECIES, type Species } from "@/data/types";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "need-pet";

/** The sentinel for "not one of my saved animals". */
const NEW_PET = "__new__";

/**
 * Step 1 of 3 — which animal.
 *
 * WHY THIS IS A PICKER NOW.
 *
 * Audit 1.1 assumed one animal, so this screen edited "the" pet in place: it
 * loaded whichever pet `need.petId` pointed at and saved back under that id.
 * With multi-pet (§17) that turned destructive — an owner with a dog saved,
 * arriving here to arrange care for their cat, would have overwritten the dog
 * under the dog's own id, taking its name, its species detail and its feeding
 * and medication notes with it. Silently, with no confirmation, and the dog
 * would simply disappear from My pets.
 *
 * So when there are saved animals, this asks which one. Choosing an existing
 * animal only RECORDS the choice — editing lives on the animal's own screen,
 * where there is room for the species-specific questions. Adding a new one
 * always mints a NEW id, so nothing can be overwritten from here at all.
 *
 * The form stays deliberately short (§4.5): a name, an age, anything important
 * and a photo.
 */
export default function NeedPet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useDemo();

  const pets = state.pets;
  /* Pre-selects the animal the brief already names, so returning to this step
     does not silently change which one the request is about. */
  const [choice, setChoice] = useState<string>(() =>
    state.need.petId && pets.some((p) => p.id === state.need.petId) ? state.need.petId : NEW_PET,
  );

  const [species, setSpecies] = useState<Species | null>(state.need.species);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ species?: string; name?: string }>({});
  const speciesRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const addingNew = choice === NEW_PET;

  const submit = () => {
    if (!addingNew) {
      const chosen = pets.find((p) => p.id === choice);
      if (!chosen) return;
      dispatch({ type: "setNeed", patch: { species: chosen.species, petId: chosen.id } });
      navigate("/owner/need/location");
      return;
    }

    /* Validate on submit and say what is missing, rather than disabling the
       button and leaving the person to guess (§17). Focus moves to the first
       thing that needs fixing — the action bar is pinned to the bottom, so
       without that the error can be off-screen entirely. */
    const next: typeof errors = {};
    if (!species) next.species = t("need.pet.speciesRequired");
    if (!name.trim()) next.name = t("need.pet.nameRequired");
    setErrors(next);
    if (next.species) return speciesRef.current?.focus();
    if (next.name) return nameRef.current?.focus();

    /* Always a new id. This branch cannot reach an existing animal, which is
       the whole point of separating it from the picker above. */
    const pet: Pet = {
      ...emptyPet(`pet-${Date.now().toString(36)}`, species as Species),
      name: name.trim(),
      age: age.trim(),
      notes: notes.trim(),
      photoUrl,
    };
    dispatch({ type: "savePet", pet });
    dispatch({ type: "setNeed", patch: { species: pet.species, petId: pet.id } });
    navigate("/owner/need/location");
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.pet.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo="/start"
        title={t("need.pet.title")}
        intro={t("need.pet.intro")}
        action={
          /* Submits the form rather than handling a click, so Enter and the
             mobile keyboard's Go key work on a screen shaped like a form. */
          <Button type="submit" form={FORM_ID} size="lg">
            {t("common.continue")}
          </Button>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {pets.length > 0 && (
            <div>
              <p id="pet-choice-label" className="mb-3 text-sm font-medium text-foreground">
                {t("need.pet.chooseLabel")}
              </p>
              <OptionGroup
                labelledBy="pet-choice-label"
                value={choice}
                onChange={setChoice}
                options={[
                  ...pets.map((pet) => ({
                    value: pet.id,
                    label: pet.name,
                    description: t(`species.${pet.species}`),
                    icon: SPECIES_ICON[pet.species],
                  })),
                  { value: NEW_PET, label: t("need.pet.another"), icon: Plus },
                ]}
              />
            </div>
          )}

          {addingNew && (
            <>
              <div>
                <p id="pet-species-label" className="mb-3 text-sm font-medium text-foreground">
                  {t("need.pet.speciesLabel")}
                </p>
                <OptionGroup
                  labelledBy="pet-species-label"
                  describedBy={errors.species ? "pet-species-error" : undefined}
                  invalid={Boolean(errors.species)}
                  groupRef={speciesRef}
                  value={species}
                  onChange={(value) => {
                    setSpecies(value);
                    setErrors((e) => ({ ...e, species: undefined }));
                  }}
                  options={SPECIES.map((s) => ({
                    value: s,
                    label: t(`species.${s}`),
                    icon: SPECIES_ICON[s],
                  }))}
                />
                {errors.species && (
                  <p id="pet-species-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {errors.species}
                  </p>
                )}
              </div>

              <FieldShell label={t("need.pet.nameLabel")} error={errors.name}>
                {/* `id` comes from the shell — overriding it would break the
                    `label[for]` pairing and leave the field unnamed. Focus is
                    moved with a ref instead. */}
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    ref={nameRef}
                    value={name}
                    autoComplete="off"
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((err) => ({ ...err, name: undefined }));
                    }}
                  />
                )}
              </FieldShell>

              <FieldShell label={t("need.pet.ageLabel")} help={t("need.pet.ageHelp")}>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    value={age}
                    aria-describedby={describedBy}
                    onChange={(e) => setAge(e.target.value)}
                  />
                )}
              </FieldShell>

              <FieldShell label={t("need.pet.notesLabel")} help={t("need.pet.notesHelp")}>
                {({ id, describedBy }) => (
                  <Textarea
                    id={id}
                    rows={4}
                    value={notes}
                    aria-describedby={describedBy}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                )}
              </FieldShell>

              <PhotoField label={t("need.pet.photoLabel")} value={photoUrl} onChange={setPhotoUrl} />

              {pets.length > 0 && (
                <p className="text-sm text-muted-foreground">{t("need.pet.editElsewhere")}</p>
              )}
            </>
          )}
        </form>
      </FlowScreen>
    </>
  );
}
