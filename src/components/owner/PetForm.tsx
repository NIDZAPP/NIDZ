import { useTranslation } from "react-i18next";

import { ChipGroup } from "@/components/shared/Chip";
import OptionGroup from "@/components/shared/OptionGroup";
import { SPECIES_ICON } from "@/components/shared/species";
import { FieldShell, PhotoField } from "@/components/shared/fields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  withSpecies,
  type BirdDetails,
  type CatDetails,
  type Declared,
  type DogDetails,
  type Pet,
  type PetSex,
} from "@/data/pets";
import { DOG_SIZES, SPECIES, type Species } from "@/data/types";

const DECLARED: readonly Declared[] = ["yes", "no", "unknown"];
const SEXES: readonly PetSex[] = ["female", "male", "unknown"];

/** `ChipGroup` is a Radix RadioGroup and has no deselect, so the four fields
    modelled as `X | null` need an explicit way back to unanswered — otherwise
    one mis-tap becomes a permanent declaration about someone else's animal,
    and the module's own "a skipped question stays skipped" rule has no UI. */
const UNSET = "";

type DeclaredRenderer = (
  labelKey: string,
  value: Declared,
  apply: (next: Declared) => void,
) => React.ReactNode;

/**
 * One pet, described.
 *
 * Three sections, in the order an owner can actually answer them:
 *
 *   BASICS   — species, name, age, sex, photo. Enough to search with (§19).
 *   DETAILS  — species-specific, and ONLY the questions that species has. A
 *              bird is never asked how many walks it takes. This is the whole
 *              reason `Pet` is a discriminated union rather than one flat
 *              record with conditionally-hidden fields: a hidden field still
 *              holds a value, and a value nobody was asked for is a fabricated
 *              declaration waiting to be rendered.
 *   CARE     — feeding, medication, vet, emergency contact. Private (§83), and
 *              said to be private beside the fields rather than in a policy.
 *
 * Every yes/no question is a THREE-way choice. "I don't know" is a real answer
 * and a common one — an owner who has never seen their cat near a dog cannot
 * honestly say "no", and a sitter reading "no" would decline for a reason that
 * does not exist. `unknown` is also the default, so a skipped question stays
 * skipped instead of silently becoming a claim.
 */
export default function PetForm({
  pet,
  onChange,
  nameError,
  nameRef,
  speciesRef,
  speciesLocked = false,
}: {
  pet: Pet;
  onChange: (pet: Pet) => void;
  nameError?: string;
  nameRef?: React.Ref<HTMLInputElement>;
  speciesRef?: React.Ref<HTMLDivElement>;
  /** Editing an existing animal keeps its species fixed: changing it discards
      every species-specific answer, which is right while creating and hostile
      afterwards. */
  speciesLocked?: boolean;
}) {
  const { t } = useTranslation();

  /* Deliberately NOT `Partial<Pet>`: that distributes over the union, so
     `set({ species: "bird" })` would type-check and produce a bird carrying
     DogDetails, with the cast silencing it. Species changes go through
     `withSpecies`, which rebuilds the detail record. */
  const set = (patch: Partial<Omit<Pet, "species" | "details">>) =>
    onChange({ ...pet, ...patch } as Pet);
  /* Keyed to THIS pet's detail shape rather than `Record<string, unknown>`,
     which let a typo — `walksPerday` — compile and inject a junk key that then
     inflated the answered-question total until the next reload dropped it. */
  const setDetail = (patch: Partial<Pet["details"]>) =>
    onChange({ ...pet, details: { ...pet.details, ...patch } } as Pet);
  const setCare = (patch: Partial<Pet["care"]>) => onChange({ ...pet, care: { ...pet.care, ...patch } });

  /** A yes / no / not-answered question, rendered the same way everywhere. */
  const declaredField: DeclaredRenderer = (labelKey, value, apply) => {
    const id = `pet-${labelKey.replace(/\W+/g, "-")}`;
    return (
      <div key={labelKey}>
        <p id={id} className="text-sm font-medium text-foreground">
          {t(labelKey)}
        </p>
        <ChipGroup
          className="mt-2"
          labelledBy={id}
          value={value}
          onChange={apply}
          options={DECLARED.map((option) => ({ value: option, label: t(`pets.declared.${option}`) }))}
        />
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="pet-basics" className="space-y-6">
        <h2 id="pet-basics" className="text-name font-semibold text-foreground">
          {t("pets.sections.basics")}
        </h2>

        {!speciesLocked && (
          <div>
            <p id="pet-species" className="mb-3 text-sm font-medium text-foreground">
              {t("need.pet.speciesLabel")}
            </p>
            <OptionGroup
              labelledBy="pet-species"
              groupRef={speciesRef}
              value={pet.species}
              /* `withSpecies` rebuilds the detail record rather than carrying
                 answers across. "Good with dogs" answered about a dog is not an
                 answer about the bird it was mistakenly filed as. */
              onChange={(next) => onChange(withSpecies(pet, next as Species))}
              options={SPECIES.map((value) => ({
                value,
                label: t(`species.${value}`),
                icon: SPECIES_ICON[value],
              }))}
            />
          </div>
        )}

        <FieldShell label={t("need.pet.nameLabel")} error={nameError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              ref={nameRef}
              value={pet.name}
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => set({ name: e.target.value })}
            />
          )}
        </FieldShell>

        <FieldShell label={t("need.pet.ageLabel")} help={t("need.pet.ageHelp")}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              value={pet.age}
              aria-describedby={describedBy}
              onChange={(e) => set({ age: e.target.value })}
            />
          )}
        </FieldShell>

        <div>
          <p id="pet-sex" className="text-sm font-medium text-foreground">
            {t("pets.sexLabel")}
          </p>
          <ChipGroup
            className="mt-2"
            labelledBy="pet-sex"
            value={pet.sex}
            onChange={(next) => set({ sex: next })}
            options={SEXES.map((value) => ({ value, label: t(`pets.sex.${value}`) }))}
          />
        </div>

        <PhotoField
          label={t("need.pet.photoLabel")}
          value={pet.photoUrl}
          onChange={(photoUrl) => set({ photoUrl })}
        />
      </section>

      <section aria-labelledby="pet-details" className="space-y-6 border-t border-border pt-8">
        <div>
          <h2 id="pet-details" className="text-name font-semibold text-foreground">
            {t("pets.sections.details")}
          </h2>
          {/* Says what more detail buys, and what it does not. A fuller profile
              helps a sitter judge whether they can take this animal; it does
              not make the animal better, and §118's rule applies here too. */}
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
            {t("pets.sections.detailsHelp")}
          </p>
        </div>

        {pet.species === "dog" && (
          <DogFields details={pet.details} setDetail={setDetail} declaredField={declaredField} />
        )}
        {pet.species === "cat" && (
          <CatFields details={pet.details} setDetail={setDetail} declaredField={declaredField} />
        )}
        {pet.species === "bird" && (
          <BirdFields details={pet.details} setDetail={setDetail} declaredField={declaredField} />
        )}
      </section>

      <section aria-labelledby="pet-care" className="space-y-6 border-t border-border pt-8">
        <div>
          <h2 id="pet-care" className="text-name font-semibold text-foreground">
            {t("pets.sections.care")}
          </h2>
          <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">{t("pets.sections.careHelp")}</p>
        </div>

        <FieldShell label={t("pets.care.feeding")}>
          {({ id }) => (
            <Textarea
              id={id}
              rows={3}
              value={pet.care.feeding}
              onChange={(e) => setCare({ feeding: e.target.value })}
            />
          )}
        </FieldShell>

        <FieldShell label={t("pets.care.medication")}>
          {({ id }) => (
            <Textarea
              id={id}
              rows={3}
              value={pet.care.medication}
              onChange={(e) => setCare({ medication: e.target.value })}
            />
          )}
        </FieldShell>

        <FieldShell label={t("pets.care.vet")}>
          {({ id }) => <Input id={id} value={pet.care.vet} onChange={(e) => setCare({ vet: e.target.value })} />}
        </FieldShell>

        <FieldShell label={t("pets.care.emergency")}>
          {({ id }) => (
            <Input
              id={id}
              value={pet.care.emergencyContact}
              onChange={(e) => setCare({ emergencyContact: e.target.value })}
            />
          )}
        </FieldShell>
      </section>
    </div>
  );
}

/* --------------------------------------------------------- species fields */

function DogFields({
  details,
  setDetail,
  declaredField,
}: {
  details: DogDetails;
  setDetail: (patch: Record<string, unknown>) => void;
  declaredField: DeclaredRenderer;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <p id="pet-dog-size" className="text-sm font-medium text-foreground">
          {t("pets.dog.size")}
        </p>
        <ChipGroup
          className="mt-2"
          labelledBy="pet-dog-size"
          value={details.size ?? ""}
          onChange={(next) => setDetail({ size: next || null })}
          options={[
            ...DOG_SIZES.map((value) => ({ value: value as string, label: t(`dogSize.${value}`) })),
            { value: UNSET, label: t("pets.notSure") },
          ]}
        />
      </div>

      {declaredField("pets.dog.neutered", details.neutered, (v) => setDetail({ neutered: v }))}
      {declaredField("pets.dog.goodWithDogs", details.goodWithDogs, (v) => setDetail({ goodWithDogs: v }))}
      {declaredField("pets.dog.goodWithCats", details.goodWithCats, (v) => setDetail({ goodWithCats: v }))}
      {declaredField("pets.dog.goodWithChildren", details.goodWithChildren, (v) =>
        setDetail({ goodWithChildren: v }),
      )}

      <FieldShell label={t("pets.dog.walksPerDay")} help={t("pets.dog.walksPerDayHelp")}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="number"
            min={0}
            max={12}
            inputMode="numeric"
            value={details.walksPerDay ?? ""}
            aria-describedby={describedBy}
            /* Empty stays null rather than becoming 0: "not answered" and
               "never walked" are very different facts about a dog. Anything
               that is not a plausible whole count — a typed minus sign, a
               pasted "1e9", the NaN an empty parse produces — is treated as
               not answered, because the form is `noValidate` so the min/max
               attributes never run. */
            onChange={(e) => {
              const n = Number(e.target.value);
              const valid = e.target.value !== "" && Number.isInteger(n) && n >= 0 && n <= 24;
              setDetail({ walksPerDay: valid ? n : null });
            }}
          />
        )}
      </FieldShell>

      <FieldShell label={t("pets.dog.leashNotes")} help={t("pets.dog.leashNotesHelp")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={details.leashNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ leashNotes: e.target.value })}
          />
        )}
      </FieldShell>
    </>
  );
}

function CatFields({
  details,
  setDetail,
  declaredField,
}: {
  details: CatDetails;
  setDetail: (patch: Record<string, unknown>) => void;
  declaredField: DeclaredRenderer;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <p id="pet-cat-living" className="text-sm font-medium text-foreground">
          {t("pets.cat.living")}
        </p>
        <ChipGroup
          className="mt-2"
          labelledBy="pet-cat-living"
          value={details.living ?? ""}
          onChange={(next) => setDetail({ living: next || null })}
          options={[
            ...(["indoor", "outdoor", "both"] as const).map((value) => ({
              value: value as string,
              label: t(`pets.cat.livingOption.${value}`),
            })),
            { value: UNSET, label: t("pets.notSure") },
          ]}
        />
      </div>

      {declaredField("pets.cat.neutered", details.neutered, (v) => setDetail({ neutered: v }))}
      {declaredField("pets.cat.goodWithCats", details.goodWithCats, (v) => setDetail({ goodWithCats: v }))}
      {declaredField("pets.cat.goodWithDogs", details.goodWithDogs, (v) => setDetail({ goodWithDogs: v }))}
      {declaredField("pets.cat.escapeRisk", details.escapeRisk, (v) => setDetail({ escapeRisk: v }))}

      <FieldShell label={t("pets.cat.litterNotes")} help={t("pets.cat.litterNotesHelp")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={details.litterNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ litterNotes: e.target.value })}
          />
        )}
      </FieldShell>
    </>
  );
}

function BirdFields({
  details,
  setDetail,
  declaredField,
}: {
  details: BirdDetails;
  setDetail: (patch: Record<string, unknown>) => void;
  declaredField: DeclaredRenderer;
}) {
  const { t } = useTranslation();
  return (
    <>
      <FieldShell label={t("pets.bird.kind")} help={t("pets.bird.kindHelp")}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            value={details.kind}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ kind: e.target.value })}
          />
        )}
      </FieldShell>

      <div>
        <p id="pet-bird-housing" className="text-sm font-medium text-foreground">
          {t("pets.bird.housing")}
        </p>
        <ChipGroup
          className="mt-2"
          labelledBy="pet-bird-housing"
          value={details.housing ?? ""}
          onChange={(next) => setDetail({ housing: next || null })}
          options={[
            ...(["cage", "aviary"] as const).map((value) => ({
              value: value as string,
              label: t(`pets.bird.housingOption.${value}`),
            })),
            { value: UNSET, label: t("pets.notSure") },
          ]}
        />
      </div>

      <div>
        <p id="pet-bird-handling" className="text-sm font-medium text-foreground">
          {t("pets.bird.handling")}
        </p>
        <ChipGroup
          className="mt-2"
          labelledBy="pet-bird-handling"
          value={details.handling ?? ""}
          onChange={(next) => setDetail({ handling: next || null })}
          options={[
            ...(["handleable", "limited", "none"] as const).map((value) => ({
              value: value as string,
              label: t(`pets.bird.handlingOption.${value}`),
            })),
            { value: UNSET, label: t("pets.notSure") },
          ]}
        />
      </div>

      {declaredField("pets.bird.escapeRisk", details.escapeRisk, (v) => setDetail({ escapeRisk: v }))}

      <FieldShell label={t("pets.bird.outOfCageNotes")} help={t("pets.bird.outOfCageNotesHelp")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={details.outOfCageNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ outOfCageNotes: e.target.value })}
          />
        )}
      </FieldShell>

      <FieldShell label={t("pets.bird.socialNotes")} help={t("pets.bird.socialNotesHelp")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={details.socialNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ socialNotes: e.target.value })}
          />
        )}
      </FieldShell>
    </>
  );
}
