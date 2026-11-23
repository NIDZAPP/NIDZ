import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus } from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import { AnimalCategoryRadio } from "@/components/shared/AnimalCategories";
import FlowScreen from "@/components/shared/FlowScreen";
import KindPicker from "@/components/shared/KindPicker";
import OptionGroup from "@/components/shared/OptionGroup";
import { ChipField, FieldShell } from "@/components/shared/fields";
import { DemoNotice } from "@/components/shared/trust";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyPet, kindLabel, type Pet } from "@/data/pets";
import { DOG_SIZES, SPECIES, type DogSize, type Species } from "@/data/types";
import { useDraftField, useFormDraft } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { useSave } from "@/hooks/use-save";
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
  const lng = useAppLocale();
  const navigate = useNavigate();
  const { state } = useDemo();
  /* « Mon animal n'est pas dans la liste », at the category level: an honest
     answer in place, never a fourth category (design system §0.1 — extending
     what Nidz matches is a product decision). */
  const [otherAnimal, setOtherAnimal] = useState(false);
  /* A new animal always gets a new id, so there is nothing another tab could
     have changed under this form: no conflict check, only a confirmed save. */
  const save = useSave({ scope: "need-pet" });

  const pets = state.pets;
  /* Pre-selects the animal the brief already names, so returning to this step
     does not silently change which one the request is about. Kept with the
     draft, and only while it still names an animal that exists. */
  const [storedChoice, setChoice] = useDraftField<string>("need-pet", "choice", () =>
    state.need.petId && pets.some((p) => p.id === state.need.petId) ? state.need.petId : NEW_PET,
  );
  const choice = storedChoice === NEW_PET || pets.some((p) => p.id === storedChoice) ? storedChoice : NEW_PET;

  /* The dog's size is asked here, for a dog only, because it is a hard
     matching constraint (Audit 1.3 LOT 03); "not sure" is an answer. It starts
     unanswered, always: seeding it from the brief handed a NEW dog the size of
     whichever dog was chosen last — saved silently, then used as a filter. */
  const [draft, setDraft, clearDraft] = useFormDraft("need-pet", () => ({
    species: state.need.species as Species | null,
    dogSize: null as DogSize | null,
    kindId: null as string | null,
    kindOther: "",
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
  const kindId = typeof draft.kindId === "string" ? draft.kindId : null;
  const kindOther = typeof draft.kindOther === "string" ? draft.kindOther : "";
  /* A breed belongs to the species it was chosen for. */
  const setSpecies = (value: Species | null) =>
    setDraft((d) => (d.species === value ? d : { ...d, species: value, kindId: null, kindOther: "" }));
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
      const saved = save.save({
        type: "setNeed",
        patch: {
          species: chosen.species,
          petId: chosen.id,
          dogSize: chosen.species === "dog" ? chosen.details.size : null,
        },
      });
      if (saved) navigate("/owner/need/location");
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
      kindId,
      kindOther: kindId ? "" : kindOther.trim(),
      name: name.trim(),
      age: age.trim(),
      notes: notes.trim(),
    };
    const size = pet.species === "dog" ? pet.details.size : null;
    /* One write: the animal and the brief that names it are kept together or
       not at all (A-02). Only then does the step move on. */
    const saved = save.save([
      { type: "savePet", pet },
      { type: "setNeed", patch: { species: pet.species, petId: pet.id, dogSize: size } },
    ]);
    if (!saved) return;
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
        headerExtra={<DraftNotice save={save} />}
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
              <p id="pet-choice-label" className="mb-3 text-[0.9375rem] font-medium text-foreground">
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
                    description: [t(`species.${pet.species}`), kindLabel(pet, lng)].filter(Boolean).join(" · "),
                    art: <AnimalPortrait species={pet.species} className="size-11" />,
                  })),
                  { value: NEW_PET, label: t("need.pet.another"), icon: Plus },
                ]}
              />
            </div>
          )}

          {addingNew && (
            <>
              <div>
                <p id="pet-species-label" className="mb-3 text-[0.9375rem] font-medium text-foreground">
                  {t("need.pet.speciesLabel")}
                </p>
                {/* The three categories as illustrated cards — the same cards
                    a sitter ticks to say what they accept. */}
                <AnimalCategoryRadio
                  labelledBy="pet-species-label"
                  describedBy={errors.species ? "pet-species-error" : undefined}
                  invalid={Boolean(errors.species)}
                  groupRef={speciesRef}
                  value={species}
                  onChange={(value) => {
                    setSpecies(value);
                    setOtherAnimal(false);
                    setErrors((e) => ({ ...e, species: undefined }));
                  }}
                />
                {errors.species && (
                  <p id="pet-species-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {errors.species}
                  </p>
                )}
                <button
                  type="button"
                  aria-expanded={otherAnimal}
                  aria-controls="pet-other-animal"
                  onClick={() => setOtherAnimal((open) => !open)}
                  className="-ms-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-primary hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("need.pet.otherAnimal.toggle")}
                  <ChevronDown
                    className={cn("size-4 transition-transform duration-200 ease-out", otherAnimal && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>
                <div id="pet-other-animal" hidden={!otherAnimal}>
                  {otherAnimal && (
                    <DemoNotice
                      className="mt-2 animate-fade-in"
                      title={t("need.pet.otherAnimal.title")}
                      body={t("need.pet.otherAnimal.body")}
                    />
                  )}
                </div>
              </div>

              {species && (
                <div className="space-y-7 animate-fade-in">
                  <KindPicker
                    key={species}
                    species={species}
                    kindId={kindId}
                    kindOther={kindOther}
                    onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
                  />

                  <FieldShell label={t("need.pet.nameLabel")} error={errors.name}>
                    {/* `id` comes from the shell — overriding it would break the
                        `label[for]` pairing. Focus is moved with a ref instead. */}
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
                    <ChipField
                      label={t("need.pet.sizeLabel")}
                      info={t("need.pet.sizeHelp")}
                      value={dogSize ?? ""}
                      onChange={(v) => setDogSize(v ? (v as DogSize) : null)}
                      options={[
                        ...DOG_SIZES.map((size) => ({ value: size as string, label: t(`dogSize.${size}`) })),
                        { value: "", label: t("pets.notSure") },
                      ]}
                    />
                  )}

                  <FieldShell label={t("need.pet.ageLabel")}>
                    {({ id, describedBy }) => (
                      <Input
                        id={id}
                        value={age}
                        placeholder={t("need.pet.agePlaceholder")}
                        aria-describedby={describedBy}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    )}
                  </FieldShell>

                  <FieldShell label={t("need.pet.notesLabel")} info={t("need.pet.notesInfo")}>
                    {({ id, describedBy }) => (
                      <Textarea
                        id={id}
                        rows={3}
                        value={notes}
                        placeholder={t("need.pet.notesPlaceholder")}
                        aria-describedby={describedBy}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    )}
                  </FieldShell>

                  {pets.length > 0 && (
                    <p className="text-sm text-muted-foreground">{t("need.pet.editElsewhere")}</p>
                  )}
                </div>
              )}
            </>
          )}
          <SaveFeedback save={save} onRetry={submit} />
        </form>
      </FlowScreen>
    </>
  );
}
