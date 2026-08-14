import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Cat, Dog } from "lucide-react";

import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { FieldShell, PhotoField } from "@/components/shared/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SPECIES, type Pet, type Species } from "@/data/types";
import { useDemo } from "@/state/demo/context";

const FORM_ID = "need-pet";

/**
 * Step 1 of 3 — the animal.
 *
 * Species first because it frames everything after it, then the few things a
 * sitter genuinely needs in order to decide: what it is called, roughly how
 * old, and anything that matters about looking after it. Nothing else is
 * asked; §4.5 warns against turning a simple task into an administrative file.
 */
export default function NeedPet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useDemo();

  const existing = state.pets.find((p) => p.id === state.need.petId) ?? null;
  const [species, setSpecies] = useState<Species | null>(existing?.species ?? state.need.species);
  const [name, setName] = useState(existing?.name ?? "");
  const [age, setAge] = useState(existing?.age ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(existing?.photoUrl);
  const [errors, setErrors] = useState<{ species?: string; name?: string }>({});
  const speciesRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = () => {
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

    const pet: Pet = {
      id: existing?.id ?? `pet-${Date.now().toString(36)}`,
      name: name.trim(),
      species: species as Species,
      age: age.trim(),
      /* Size is collected on the sitter side, not here: an owner should not
         have to classify their own dog to get results. */
      size: existing?.size ?? null,
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
                icon: s === "dog" ? Dog : Cat,
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
                `label[for]` pairing and leave the field unnamed. Focus is moved
                with a ref instead. */}
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
              <Input id={id} value={age} aria-describedby={describedBy} onChange={(e) => setAge(e.target.value)} />
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
        </form>
      </FlowScreen>
    </>
  );
}
