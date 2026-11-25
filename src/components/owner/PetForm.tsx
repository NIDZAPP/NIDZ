import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import AgeField from "@/components/shared/AgeField";
import { AnimalGridSingle } from "@/components/shared/AnimalCategories";
import { Chip } from "@/components/shared/Chip";
import InfoTip from "@/components/shared/InfoTip";
import KindPicker from "@/components/shared/KindPicker";
import PhotoField from "@/components/shared/PhotoField";
import { Button } from "@/components/ui/button";
import { ChipField, FieldShell } from "@/components/shared/fields";
import { OTHER_CATEGORY_MAX, classificationOf } from "@/data/animal-catalogue";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  withSpecies,
  type BirdDetails,
  type CatDetails,
  type Declared,
  type DogDetails,
  type HabitatDetails,
  type Pet,
  type PetAge,
  type PetSex,
} from "@/data/pets";

/* Same three chips and the same rule as `DeclaredField`, which the sitter side
   uses: `unknown` is what an untouched question already stores, so it draws no
   selection, and the third chip is the way back out of a mis-tap rather than an
   answer of its own. */
const DECLARED: readonly Declared[] = ["yes", "no", "unknown"];
const SEXES: readonly PetSex[] = ["female", "male", "unknown"];

/** `ChipGroup` is a Radix RadioGroup and has no deselect, so the fields
    modelled as `X | null` need an explicit way back to unanswered. */
const UNSET = "";

const ageValue = (age: PetAge | null) =>
  !age ? { mode: "", years: 0, months: 0 } : age.status === "unknown" ? { mode: "unknown", years: 0, months: 0 } : { mode: age.status, years: age.years, months: age.months };

const ageFrom = (v: { mode: string; years: number; months: number }): PetAge | null =>
  v.mode === "unknown"
    ? { status: "unknown" }
    : v.mode === "known" || v.mode === "estimated"
      ? v.years === 0 && v.months === 0
        ? null
        : { status: v.mode, years: v.years, months: v.months }
      : null;

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
  const declaredField: DeclaredRenderer = (labelKey, value, apply) => (
    <ChipField
      key={labelKey}
      label={t(labelKey)}
      value={value === "unknown" ? null : value}
      onChange={apply}
      options={DECLARED.map((option) => ({ value: option, label: t(`pets.declared.${option}`) }))}
    />
  );

  /* Three cards, one idea each (1.4): what the animal is, what a sitter
     needs to judge, and what stays private. */
  const card = "surface space-y-6 p-5 md:p-6";

  return (
    <div className="space-y-4">
      <section aria-labelledby="pet-basics" className={card}>
        <h2 id="pet-basics" className="text-title font-semibold text-foreground">
          {t("pets.sections.basics")}
        </h2>

        {!speciesLocked && (
          <div>
            <p id="pet-species" className="mb-3 text-[0.9375rem] font-medium text-foreground">
              {t("needFlow.pet.question")}
            </p>
            {/* `withSpecies` rebuilds the detail record rather than carrying
                answers across. "Good with dogs" answered about a dog is not an
                answer about the bird it was mistakenly filed as. */}
            <AnimalGridSingle
              labelledBy="pet-species"
              groupRef={speciesRef}
              value={pet.species}
              onChange={(next) => next && onChange(withSpecies(pet, next))}
            />
          </div>
        )}

        {pet.species === "other" && (
          <FieldShell label={t("needFlow.pet.otherLabel")} help={t("needFlow.pet.otherHelp")}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                value={pet.otherCategory}
                maxLength={OTHER_CATEGORY_MAX}
                aria-describedby={describedBy}
                onChange={(e) => set({ otherCategory: e.target.value })}
              />
            )}
          </FieldShell>
        )}

        {classificationOf(pet.species) && pet.species !== "other" && (
          <KindPicker
            key={pet.species}
            species={pet.species}
            kindId={pet.kindId}
            kindOther={pet.kindOther}
            onChange={(next) => set(next)}
          />
        )}

        <FieldShell label={t("needFlow.about.nameQuestion")} error={nameError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              ref={nameRef}
              value={pet.name}
              maxLength={40}
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => set({ name: e.target.value })}
            />
          )}
        </FieldShell>

        <AgeField
          label={t("needFlow.about.ageQuestion")}
          value={ageValue(pet.ageInfo)}
          onChange={(next) => set({ ageInfo: ageFrom(next) })}
        />
        {!pet.ageInfo && pet.age.trim() && (
          <p className="-mt-3 text-sm text-muted-foreground">{t("pets.ageLegacy", { age: pet.age })}</p>
        )}

        <ChipField
          label={t("pets.sexLabel")}
          value={pet.sex}
          onChange={(next) => set({ sex: next })}
          options={SEXES.map((value) => ({ value, label: t(`pets.sex.${value}`) }))}
        />

        <PhotoField
          label={t("needFlow.about.photoLabel")}
          value={pet.photoUrl ?? null}
          onChange={(photoUrl) => set({ photoUrl: photoUrl ?? undefined })}
          placeholder={<AnimalPortrait species={pet.species} className="size-full opacity-70 grayscale-[30%]" />}
        />
      </section>

      <section aria-labelledby="pet-needs" className={card}>
        <div className="flex items-center gap-1.5">
          <h2 id="pet-needs" className="text-title font-semibold text-foreground">
            {t("needFlow.needs.title")}
          </h2>
          <InfoTip topic={t("needFlow.needs.title")}>{t("needFlow.needs.info")}</InfoTip>
        </div>
        <Textarea
          aria-labelledby="pet-needs"
          aria-describedby="pet-needs-privacy"
          rows={4}
          maxLength={1000}
          value={pet.notes}
          disabled={pet.needsStatus === "nothing" && !pet.notes}
          placeholder={t("needFlow.needs.placeholder")}
          onChange={(e) => set({ notes: e.target.value, needsStatus: null })}
        />
        <div className="-mt-3 flex flex-wrap gap-2">
          <Chip
            selected={pet.needsStatus === "nothing" && !pet.notes.trim()}
            onClick={() =>
              set(pet.needsStatus === "nothing" ? { needsStatus: null } : { needsStatus: "nothing", notes: "" })
            }
          >
            {t("needFlow.needs.nothing")}
          </Chip>
        </div>
        <p id="pet-needs-privacy" className="-mt-3 text-sm text-muted-foreground">
          {t("needFlow.needs.privacy")}
        </p>
      </section>

      <section aria-labelledby="pet-details" className={card}>
        {/* What more detail buys, and what it does not, behind the "!": a
            fuller profile helps a sitter judge; it does not make the animal
            better (§118). */}
        <div className="flex items-center gap-1.5">
          <h2 id="pet-details" className="text-title font-semibold text-foreground">
            {t("pets.sections.details")}
          </h2>
          <InfoTip topic={t("pets.sections.details")}>{t("pets.sections.detailsHelp")}</InfoTip>
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
        {pet.species !== "dog" && pet.species !== "cat" && pet.species !== "bird" && (
          <HabitatFields details={pet.details as HabitatDetails} setDetail={setDetail} />
        )}
      </section>

      <section aria-labelledby="pet-care" className={card}>
        <div>
          <h2 id="pet-care" className="text-title font-semibold text-foreground">
            {t("pets.sections.care")}
          </h2>
          {/* Visible, not behind a "!": who sees an answer is part of the
              decision to give it. */}
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            {t("pets.sections.carePrivate")}
          </p>
        </div>

        <FieldShell label={t("pets.care.feeding")}>
          {({ id }) => (
            <Textarea
              id={id}
              rows={2}
              value={pet.care.feeding}
              onChange={(e) => setCare({ feeding: e.target.value })}
            />
          )}
        </FieldShell>

        <FieldShell label={t("pets.care.medication")}>
          {({ id }) => (
            <Textarea
              id={id}
              rows={2}
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
      {/* Nidz 1.7: the size is no longer asked and no longer filters. An
          answer given before is the owner's and is not deleted behind their
          back: it is shown, and they can remove it. */}
      {details.size && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
          <span className="text-foreground">{t("pets.dog.sizeLegacyLine", { size: t(`dogSize.${details.size}`) })}</span>
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setDetail({ size: null })}>
            {t("pets.dog.sizeLegacyRemove")}
          </Button>
        </div>
      )}

      {declaredField("pets.dog.neutered", details.neutered, (v) => setDetail({ neutered: v }))}
      {declaredField("pets.dog.goodWithDogs", details.goodWithDogs, (v) => setDetail({ goodWithDogs: v }))}
      {declaredField("pets.dog.goodWithCats", details.goodWithCats, (v) => setDetail({ goodWithCats: v }))}
      {declaredField("pets.dog.goodWithChildren", details.goodWithChildren, (v) =>
        setDetail({ goodWithChildren: v }),
      )}

      <FieldShell label={t("pets.dog.walksPerDay")} info={t("pets.dog.walksPerDayHelp")}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="number"
            min={0}
            max={12}
            inputMode="numeric"
            placeholder={t("pets.placeholder.walks")}
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

      <FieldShell label={t("pets.dog.leashNotes")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={2}
            placeholder={t("pets.placeholder.leash")}
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
      <ChipField
        label={t("pets.cat.living")}
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

      {declaredField("pets.cat.neutered", details.neutered, (v) => setDetail({ neutered: v }))}
      {declaredField("pets.cat.goodWithCats", details.goodWithCats, (v) => setDetail({ goodWithCats: v }))}
      {declaredField("pets.cat.goodWithDogs", details.goodWithDogs, (v) => setDetail({ goodWithDogs: v }))}
      {declaredField("pets.cat.escapeRisk", details.escapeRisk, (v) => setDetail({ escapeRisk: v }))}

      <FieldShell label={t("pets.cat.litterNotes")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={2}
            placeholder={t("pets.placeholder.litter")}
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
      <ChipField
        label={t("pets.bird.housing")}
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

      <ChipField
        label={t("pets.bird.handling")}
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

      {declaredField("pets.bird.escapeRisk", details.escapeRisk, (v) => setDetail({ escapeRisk: v }))}

      <FieldShell label={t("pets.bird.outOfCageNotes")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={2}
            placeholder={t("pets.placeholder.outOfCage")}
            value={details.outOfCageNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ outOfCageNotes: e.target.value })}
          />
        )}
      </FieldShell>

      <FieldShell label={t("pets.bird.socialNotes")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={2}
            placeholder={t("pets.placeholder.social")}
            value={details.socialNotes}
            aria-describedby={describedBy}
            onChange={(e) => setDetail({ socialNotes: e.target.value })}
          />
        )}
      </FieldShell>
    </>
  );
}

function HabitatFields({ details, setDetail }: { details: HabitatDetails; setDetail: (patch: Record<string, unknown>) => void }) {
  const { t } = useTranslation();
  return (
    <FieldShell label={t("pets.habitat.label")} help={t("pets.habitat.help")}>
      {({ id, describedBy }) => (
        <Textarea
          id={id}
          rows={3}
          value={details.habitat}
          placeholder={t("pets.habitat.placeholder")}
          aria-describedby={describedBy}
          onChange={(e) => setDetail({ habitat: e.target.value })}
        />
      )}
    </FieldShell>
  );
}
