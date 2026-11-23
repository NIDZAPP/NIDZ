import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { ChipGroup } from "@/components/shared/Chip";
import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { SPECIES_ICON } from "@/components/shared/species";
import { FieldShell } from "@/components/shared/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyPet, type Pet } from "@/data/pets";
import { DOG_SIZES, SPECIES, type DogSize, type Species } from "@/data/types";
import { useFormDraft } from "@/hooks/use-form-draft";
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
 * The form stays deliberately short (§4.5): a name, a dog's size, an age and
 * anything important.
 *
 * NO PHOTO HERE (Audit 1.3 LOT 08). This step comes BEFORE the owner has seen
 * a single sitter; a photo field here looked expected and helped no match. It
 * stays optional on the animal's own screen in My pets. The answers are an
 * unsaved draft for this tab, so leaving for Compte (to change the language)
 * or reloading keeps them.
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

  /* The dog's size is asked here, for a dog only, because it is a hard
     matching constraint (Audit 1.3 LOT 03); "not sure" is an answer. It starts
     unanswered, always: seeding it from the brief handed a NEW dog the size of
     whichever dog was chosen last — saved silently, then used as a filter. */
  const [draft, setDraft, clearDraft] = useFormDraft("need-pet", () => ({
    species: state.need.species as Species | null,
    dogSize: null as DogSize | null,
    name: "",
    age: "",
    notes: "",
  }));
  /* Narrowed: the draft can come out of storage. */
  const species =
    draft.species && (SPECIES as readonly string[]).includes(draft.species) ? draft.species : null;
  const dogSize =
    draft.dogSize && (DOG_SIZES as readonly string[]).includes(draft.dogSize) ? draft.dogSize : null;
  const { name, age, notes } = draft;
  const setSpecies = (value: Species | null) => setDraft((d) => ({ ...d, species: value }));
  const setDogSize = (value: DogSize | null) => setDraft((d) => ({ ...d, dogSize: value }));
  const setName = (value: string) => setDraft((d) => ({ ...d, name: value }));
  const setAge = (value: string) => setDraft((d) => ({ ...d, age: value }));
  const setNotes = (value: string) => setDraft((d) => ({ ...d, notes: value }));
  const [errors, setErrors] = useState<{ species?: string; name?: string }>({});
  const speciesRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const addingNew = choice === NEW_PET;

  const submit = () => {
    if (!addingNew) {
      const chosen = pets.find((p) => p.id === choice);
      if (!chosen) return;
      dispatch({
        type: "setNeed",
        patch: {
          species: chosen.species,
          petId: chosen.id,
          dogSize: chosen.species === "dog" ? chosen.details.size : null,
        },
      });
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
    const base = emptyPet(`pet-${Date.now().toString(36)}`, species as Species);
    const pet: Pet = {
      ...(base.species === "dog" ? { ...base, details: { ...base.details, size: dogSize } } : base),
      name: name.trim(),
      age: age.trim(),
      notes: notes.trim(),
    };
    const size = pet.species === "dog" ? pet.details.size : null;
    dispatch({ type: "savePet", pet });
    dispatch({ type: "setNeed", patch: { species: pet.species, petId: pet.id, dogSize: size } });
    clearDraft();
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

              {species === "dog" && (
                <div>
                  <p id="pet-size-label" className="mb-3 text-sm font-medium text-foreground">
                    {t("need.pet.sizeLabel")}
                  </p>
                  <ChipGroup
                    labelledBy="pet-size-label"
                    describedBy="pet-size-help"
                    value={dogSize ?? ""}
                    onChange={(v) => setDogSize(v ? (v as DogSize) : null)}
                    options={[
                      ...DOG_SIZES.map((size) => ({ value: size as string, label: t(`dogSize.${size}`) })),
                      { value: "", label: t("pets.notSure") },
                    ]}
                  />
                  <p id="pet-size-help" className="mt-2 text-sm text-muted-foreground">
                    {t("need.pet.sizeHelp")}
                  </p>
                </div>
              )}

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
