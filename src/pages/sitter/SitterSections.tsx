import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { Chip } from "@/components/shared/Chip";
import DeclaredField from "@/components/shared/DeclaredField";
import FlowScreen from "@/components/shared/FlowScreen";
import { useReturnToDashboard } from "@/hooks/use-return-to-dashboard";
import OptionGroup from "@/components/shared/OptionGroup";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTAINMENT_USES,
  DAYTIME_PRESENCE,
  FEEDING_PLANS,
  MOVEMENT_SCOPES,
  SLEEPING_PLACES,
  TRANSPORT_MODES,
  emptyCareConditions,
  restoreCareConditions,
  speciesBlocksFor,
  type TransportMode,
} from "@/data/care-conditions";
import { DECLARED_OPTIONS, type Declared } from "@/data/pets";
import {
  PROFESSION_KINDS,
  asLocalized,
  localized,
  type ProfessionalBackground,
  type SitterExperience,
} from "@/data/types";
import { answersKeyedBy, listOf, oneOf } from "@/hooks/draft-validators";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave, type SaveController } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { patchProfile, watchProfile } from "@/state/demo/profile-commit";

const DASHBOARD = "/sitter/profile";

/**
 * The shell for a profile SECTION.
 *
 * Different from `BuilderStep` in one way that matters: it returns to the
 * dashboard rather than chaining to a next step, and it carries no progress
 * bar. There is no "next" any more — §51 replaced the wizard with sections
 * that can be answered in any order — so a control implying a fixed sequence
 * would be describing a flow that no longer exists.
 */
function Section({
  title,
  intro,
  children,
  onSave,
  save,
  error,
  footNote,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  /** Returns false to stay on the section. A section that refuses to save
      focuses its own offending control first: the action bar is pinned to the
      bottom, so an error rendered above the fold is invisible on a phone. A
      save the browser refused, or one another tab overtook, returns false
      too (Audit 1.3.1 A-02 / A-19) and `SaveFeedback` says which. */
  onSave: (options: { force: boolean }) => unknown;
  save: SaveController;
  error?: string;
  footNote?: ReactNode;
}) {
  const { t } = useTranslation();
  const returnToDashboard = useReturnToDashboard();
  const { state } = useDemo();
  const formId = "sitter-section";

  if (!state.sitter) return <Navigate to="/sitter/start" replace />;

  const run = (force = false) => {
    if (onSave({ force })) returnToDashboard();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FlowScreen
        backTo={DASHBOARD}
        title={title}
        intro={intro}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="submit" form={formId} size="lg">
            {t("sitterSections.save")}
          </Button>
        }
        footNote={footNote}
      >
        <form
          id={formId}
          noValidate
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          {children}
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <SaveFeedback save={save} onRetry={() => run()} onKeepMine={() => run(true)} />
        </form>
      </FlowScreen>
    </>
  );
}

/* ------------------------------------------------------------- experience */

const CAPABILITIES = [
  "puppiesKittens",
  "seniors",
  "specialNeeds",
  "oralMedication",
  "multipleAnimals",
  "reactiveAnimals",
  "paidBefore",
  "volunteered",
] as const;

/**
 * What the sitter has actually done (§54).
 *
 * Concrete questions rather than a number. "Six years" says much less about
 * whether someone can give a cat a tablet than "can you give oral medication"
 * does, and §54 is explicit that years alone must never be a proxy for safety.
 *
 * Every answer is optional and every one defaults to unanswered. A sitter who
 * says "I don't know" to reactive dogs has told an owner something true; a
 * sitter forced into "no" would have been filtered out of work they can do.
 */
export function SectionExperience() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const profile = state.sitter?.profile;
  const scope = "sitter-experience";
  const saver = useSave({
    scope,
    watch: (s) => {
      const e = s.sitter?.profile.experience;
      return e && Object.fromEntries(CAPABILITIES.map((key) => [key, e[key]]));
    },
  });

  const [answers, setAnswers] = useDraftField<Record<(typeof CAPABILITIES)[number], Declared>>(
    scope,
    "answers",
    () =>
      Object.fromEntries(CAPABILITIES.map((key) => [key, profile?.experience[key] ?? "unknown"])) as Record<
        (typeof CAPABILITIES)[number],
        Declared
      >,
    { validate: answersKeyedBy(CAPABILITIES, DECLARED_OPTIONS) },
  );

  const save = ({ force }: { force: boolean }) => {
    if (!profile) return false;
    return saver.save(
      patchProfile((current) => ({
        /* Spread first: this section owns the capability answers and nothing
           else, and rebuilding the record would reset the years and species
           the "about" section collects. */
        experience: { ...current.experience, ...(answers as Partial<SitterExperience>) },
      })),
      { force },
    );
  };

  return (
    <Section
      title={t("sitterSections.experience.label")}
      intro={t("sitterExperience.intro")}
      onSave={save}
      save={saver}
      footNote={<DemoLine>{t("sitterExperience.demoNote")}</DemoLine>}
    >
      {CAPABILITIES.map((key) => (
        <DeclaredField
          key={key}
          label={t(`sitterExperience.${key}.label`)}
          value={answers[key]}
          onChange={(next) => setAnswers((prev) => ({ ...prev, [key]: next }))}
        />
      ))}
    </Section>
  );
}

/* ----------------------------------------------------------- professional */

/**
 * Professional background (§40, §55), declared and nothing more.
 *
 * A closed list rather than a free-text box, so "veterinarian" means the same
 * thing on every profile instead of being one of forty spellings. "No
 * professional background" is one of the options, because it is a real answer
 * and a different fact from having skipped the question.
 *
 * NOTHING HERE VERIFIES ANYTHING, and the screen says so twice — once beside
 * the question about documents, once under the action. §68 requires declared
 * profession, submitted document, pending verification and verified credential
 * to stay four separate states; Nidz has only the first, so choosing
 * "Veterinarian" produces no badge, no ranking change and no mark on the
 * public profile beyond the sentence the sitter typed.
 */
export function SectionProfessional() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const profile = state.sitter?.profile;
  const scope = "sitter-professional";
  const saver = useSave({ scope, watch: watchProfile(["professional"]) });

  const [kind, setKind] = useDraftField<ProfessionalBackground["kind"]>(
    scope,
    "kind",
    () => profile?.professional.kind ?? null,
    { validate: oneOf<NonNullable<ProfessionalBackground["kind"]>>([...PROFESSION_KINDS, "none"]) },
  );
  const [detail, setDetail] = useDraftField(scope, "detail", () =>
    profile ? localized(profile.professional.detail, lng) : "",
  );
  const [years, setYears] = useDraftField(scope, "years", () =>
    profile?.professional.years === null || profile?.professional.years === undefined
      ? ""
      : String(profile.professional.years),
  );
  const [canEvidence, setCanEvidence] = useDraftField<Declared>(
    scope,
    "canEvidence",
    () => profile?.professional.canEvidence ?? "unknown",
    { validate: oneOf(DECLARED_OPTIONS) },
  );

  /* The follow-up questions only exist once there is something to follow up.
     Asking a sitter with no animal background how many years they have had it
     is the kind of dead field §50 warns about. */
  const hasBackground = kind !== null && kind !== "none";

  const save = ({ force }: { force: boolean }) => {
    const parsed = Number(years);
    return saver.save(
      patchProfile(() => ({
        professional: {
          kind,
          detail: asLocalized(hasBackground ? detail.trim() : ""),
          years:
            hasBackground && years !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 70
              ? parsed
              : null,
          canEvidence: hasBackground ? canEvidence : "unknown",
        },
      })),
      { force },
    );
  };

  return (
    <Section
      title={t("sitterSections.professional.label")}
      intro={t("sitterProfessional.intro")}
      onSave={save}
      save={saver}
      footNote={<DemoLine>{t("sitterProfessional.demoNote")}</DemoLine>}
    >
      <div>
        <p id="prof-kind" className="mb-3 text-sm font-medium text-foreground">
          {t("sitterProfessional.kindLabel")}
        </p>
        <OptionGroup
          labelledBy="prof-kind"
          value={kind}
          onChange={(next) => setKind(next as ProfessionalBackground["kind"])}
          options={[
            ...PROFESSION_KINDS.map((value) => ({
              value: value as string,
              label: t(`profession.${value}`),
            })),
            /* Last, and phrased as an answer rather than an opt-out. */
            { value: "none", label: t("profession.none") },
          ]}
        />
      </div>

      {hasBackground && (
        <>
          <FieldShell label={t("sitterProfessional.detailLabel")} help={t("sitterProfessional.detailHelp")}>
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                rows={4}
                value={detail}
                aria-describedby={describedBy}
                onChange={(e) => setDetail(e.target.value)}
              />
            )}
          </FieldShell>

          <FieldShell label={t("sitterProfessional.yearsLabel")}>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={70}
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            )}
          </FieldShell>

          <DeclaredField
            label={t("sitterProfessional.evidenceLabel")}
            help={t("sitterProfessional.evidenceHelp")}
            value={canEvidence}
            onChange={setCanEvidence}
          />
        </>
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------- care */

/** A whole-number field. Eight of them on the care section alone, and every
    one means "not answered" when empty rather than zero. */
function CountField({
  label,
  help,
  max,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  max: number;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <FieldShell label={label} help={help}>
      {({ id, describedBy }) => (
        <Input
          id={id}
          type="number"
          min={0}
          max={max}
          inputMode="numeric"
          className="max-w-[8rem]"
          value={value}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  );
}

/** A single-choice row list under its own visible question. */
function ChoiceField<T extends string>({
  id,
  label,
  values,
  labelFor,
  value,
  onChange,
}: {
  id: string;
  label: string;
  values: readonly T[];
  labelFor: (value: T) => string;
  value: T | null;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <p id={id} className="mb-3 text-sm font-medium text-foreground">
        {label}
      </p>
      <OptionGroup
        labelledBy={id}
        value={value}
        onChange={onChange}
        options={values.map((v) => ({ value: v, label: labelFor(v) }))}
      />
    </div>
  );
}

/** Group heading inside the care section. */
function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-6 border-t border-border pt-8 first:border-0 first:pt-0">
      <h2 id={id} className="text-name font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Empty means unanswered; a real number means a real answer, zero included. */
const toCount = (raw: string, max: number): number | null => {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
};
const fromCount = (value: number | null) => (value === null ? "" : String(value));

/**
 * How animals are actually cared for (§57).
 *
 * The longest section in the product, and the one that earns its length: it is
 * the part of a sitter that an owner cannot infer from a photograph, a price or
 * a commune. Two sitters can be equally good and run completely different
 * homes, and the mismatch only surfaces on collection day unless somebody asks
 * these questions first.
 *
 * Everything here is optional and nothing is scored. The single exception is
 * the reason for containment: a sitter who says they crate or cage an animal
 * must say why, because that fact is the one most likely to be misread in both
 * directions — a crate for twenty minutes and a crate all night are different
 * declarations, and an owner can only tell them apart if the sitter had
 * somewhere to say which.
 *
 * The per-species blocks appear only for species the sitter accepts. Asking a
 * cat sitter for a walk count is the dead field §50 warns about.
 */
export function SectionCare() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const profile = state.sitter?.profile;
  const care = profile?.care ?? emptyCareConditions();
  const scope = "sitter-care";
  const saver = useSave({ scope, watch: watchProfile(["care"]) });
  /* Each species block is checked by the same reader that checks a stored
     profile, so a draft can never carry an answer the profile could not. */
  const dogCare = (raw: unknown) => restoreCareConditions({ dog: raw }, null).dog;
  const catCare = (raw: unknown) => restoreCareConditions({ cat: raw }, null).cat;
  const birdCare = (raw: unknown) => restoreCareConditions({ bird: raw }, null).bird;

  const [movement, setMovement] = useDraftField(scope, "movement", () => care.movement, {
    validate: oneOf(MOVEMENT_SCOPES),
  });
  const [restrictedRooms, setRestrictedRooms] = useDraftField(scope, "restrictedRooms", () =>
    localized(care.restrictedRooms, lng),
  );
  const [containmentUse, setContainmentUse] = useDraftField(scope, "containmentUse", () => care.containment.use, {
    validate: oneOf(CONTAINMENT_USES),
  });
  const [containmentReason, setContainmentReason] = useDraftField(scope, "containmentReason", () =>
    localized(care.containment.reason, lng),
  );
  const [maxHoursAlone, setMaxHoursAlone] = useDraftField(scope, "maxHoursAlone", () => fromCount(care.maxHoursAlone));
  const [presence, setPresence] = useDraftField(scope, "presence", () => care.presence, {
    validate: oneOf(DAYTIME_PRESENCE),
  });
  const [sleeping, setSleeping] = useDraftField(scope, "sleeping", () => care.sleeping, {
    validate: oneOf(SLEEPING_PLACES),
  });
  const [feeding, setFeeding] = useDraftField(scope, "feeding", () => care.feeding, {
    validate: oneOf(FEEDING_PLANS),
  });
  const [enrichment, setEnrichment] = useDraftField(scope, "enrichment", () => localized(care.enrichment, lng));
  const [transport, setTransport] = useDraftField<TransportMode[]>(scope, "transport", () => care.transport, {
    validate: listOf(TRANSPORT_MODES),
  });
  const [canReachVet, setCanReachVet] = useDraftField<Declared>(scope, "canReachVet", () => care.emergency.canReachVet, {
    validate: oneOf(DECLARED_OPTIONS),
  });
  const [emergencyPlan, setEmergencyPlan] = useDraftField(scope, "emergencyPlan", () =>
    localized(care.emergency.plan, lng),
  );

  const [dog, setDog] = useDraftField(scope, "dog", () => care.dog, { validate: dogCare });
  const [cat, setCat] = useDraftField(scope, "cat", () => care.cat, { validate: catCare });
  const [bird, setBird] = useDraftField(scope, "bird", () => care.bird, { validate: birdCare });
  const [dogWalks, setDogWalks] = useDraftField(scope, "dogWalks", () => fromCount(care.dog.walksPerDay));
  const [dogMinutes, setDogMinutes] = useDraftField(scope, "dogMinutes", () => fromCount(care.dog.walkMinutes));
  const [litterBoxes, setLitterBoxes] = useDraftField(scope, "litterBoxes", () => fromCount(care.cat.litterBoxes));
  const [outOfCage, setOutOfCage] = useDraftField(scope, "outOfCage", () => fromCount(care.bird.outOfCageHours));

  const [error, setError] = useState<string>();
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const blocks = speciesBlocksFor(profile?.acceptedSpecies ?? []);
  /* The reason only exists once containment does. */
  const contains = containmentUse !== null && containmentUse !== "never";

  const save = ({ force }: { force: boolean }) => {
    if (contains && containmentReason.trim() === "") {
      setError(t("sitterCare.containmentReasonRequired"));
      reasonRef.current?.focus();
      return false;
    }
    return saver.save(
      patchProfile(() => ({
        care: {
          movement,
          restrictedRooms: asLocalized(restrictedRooms.trim()),
          containment: {
            use: containmentUse,
            /* Dropped with the fact it explained, so a sitter who switches to
               "never" does not leave a stale reason behind on their profile. */
            reason: asLocalized(contains ? containmentReason.trim() : ""),
          },
          maxHoursAlone: toCount(maxHoursAlone, 24),
          presence,
          sleeping,
          feeding,
          enrichment: asLocalized(enrichment.trim()),
          transport,
          emergency: { canReachVet, plan: asLocalized(emergencyPlan.trim()) },
          dog: {
            ...dog,
            walksPerDay: toCount(dogWalks, 12),
            walkMinutes: toCount(dogMinutes, 300),
          },
          cat: { ...cat, litterBoxes: toCount(litterBoxes, 10) },
          bird: { ...bird, outOfCageHours: toCount(outOfCage, 24) },
        },
      })),
      { force },
    );
  };

  return (
    <Section
      title={t("sitterSections.care.label")}
      intro={t("sitterCare.intro")}
      onSave={save}
      save={saver}
      error={error}
      footNote={<DemoLine>{t("sitterCare.demoNote")}</DemoLine>}
    >
      <Block id="care-home" title={t("sitterCare.blocks.inTheHome")}>
        <ChoiceField
          id="care-movement"
          label={t("sitterCare.movementLabel")}
          values={MOVEMENT_SCOPES}
          labelFor={(v) => t(`sitterCare.movement.${v}`)}
          value={movement}
          /* An arrow rather than `onChange={setMovement}`: passing the setter
             directly hands TypeScript an inference candidate for `T` from a
             contravariant position, which widens it to `string` and breaks
             every other prop on the field. Same at the three below. */
          onChange={(next) => setMovement(next)}
        />
        <FieldShell
          label={t("sitterCare.restrictedRoomsLabel")}
          help={t("sitterCare.restrictedRoomsHelp")}
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              rows={2}
              value={restrictedRooms}
              aria-describedby={describedBy}
              onChange={(e) => setRestrictedRooms(e.target.value)}
            />
          )}
        </FieldShell>
        <ChoiceField
          id="care-sleeping"
          label={t("sitterCare.sleepingLabel")}
          values={SLEEPING_PLACES}
          labelFor={(v) => t(`sitterCare.sleeping.${v}`)}
          value={sleeping}
          onChange={(next) => setSleeping(next)}
        />
      </Block>

      <Block id="care-containment" title={t("sitterCare.blocks.containment")}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("sitterCare.containmentIntro")}
        </p>
        <ChoiceField
          id="care-containment-use"
          label={t("sitterCare.containmentLabel")}
          values={CONTAINMENT_USES}
          labelFor={(v) => t(`sitterCare.containment.${v}`)}
          value={containmentUse}
          onChange={(next) => {
            setContainmentUse(next);
            setError(undefined);
          }}
        />
        {contains && (
          <FieldShell
            label={t("sitterCare.containmentReasonLabel")}
            help={t("sitterCare.containmentReasonHelp")}
          >
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                ref={reasonRef}
                rows={3}
                value={containmentReason}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                onChange={(e) => {
                  setContainmentReason(e.target.value);
                  setError(undefined);
                }}
              />
            )}
          </FieldShell>
        )}
      </Block>

      <Block id="care-day" title={t("sitterCare.blocks.theDay")}>
        <ChoiceField
          id="care-presence"
          label={t("sitterCare.presenceLabel")}
          values={DAYTIME_PRESENCE}
          labelFor={(v) => t(`sitterCare.presence.${v}`)}
          value={presence}
          onChange={(next) => setPresence(next)}
        />
        <CountField
          label={t("sitterCare.maxHoursAloneLabel")}
          help={t("sitterCare.maxHoursAloneHelp")}
          max={24}
          value={maxHoursAlone}
          onChange={setMaxHoursAlone}
        />
        <ChoiceField
          id="care-feeding"
          label={t("sitterCare.feedingLabel")}
          values={FEEDING_PLANS}
          labelFor={(v) => t(`sitterCare.feeding.${v}`)}
          value={feeding}
          onChange={(next) => setFeeding(next)}
        />
        <FieldShell label={t("sitterCare.enrichmentLabel")} help={t("sitterCare.enrichmentHelp")}>
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              rows={3}
              value={enrichment}
              aria-describedby={describedBy}
              onChange={(e) => setEnrichment(e.target.value)}
            />
          )}
        </FieldShell>
      </Block>

      {blocks.includes("dog") && (
        <Block id="care-dog" title={t("sitterCare.blocks.dogs")}>
          <CountField
            label={t("sitterCare.dog.walksLabel")}
            help={t("sitterCare.dog.walksHelp")}
            max={12}
            value={dogWalks}
            onChange={setDogWalks}
          />
          <CountField
            label={t("sitterCare.dog.minutesLabel")}
            max={300}
            value={dogMinutes}
            onChange={setDogMinutes}
          />
          <DeclaredField
            label={t("sitterCare.dog.offLeashLabel")}
            help={t("sitterCare.dog.offLeashHelp")}
            value={dog.offLeash}
            onChange={(v) => setDog((d) => ({ ...d, offLeash: v }))}
          />
          <DeclaredField
            label={t("sitterCare.dog.gardenLabel")}
            value={dog.gardenAccess}
            onChange={(v) => setDog((d) => ({ ...d, gardenAccess: v }))}
          />
        </Block>
      )}

      {blocks.includes("cat") && (
        <Block id="care-cat" title={t("sitterCare.blocks.cats")}>
          <CountField
            label={t("sitterCare.cat.litterLabel")}
            max={10}
            value={litterBoxes}
            onChange={setLitterBoxes}
          />
          <DeclaredField
            label={t("sitterCare.cat.indoorLabel")}
            value={cat.indoorOnly}
            onChange={(v) => setCat((c) => ({ ...c, indoorOnly: v }))}
          />
          <DeclaredField
            label={t("sitterCare.cat.hidingLabel")}
            help={t("sitterCare.cat.hidingHelp")}
            value={cat.hidingSpaces}
            onChange={(v) => setCat((c) => ({ ...c, hidingSpaces: v }))}
          />
        </Block>
      )}

      {blocks.includes("bird") && (
        <Block id="care-bird" title={t("sitterCare.blocks.birds")}>
          <CountField
            label={t("sitterCare.bird.outOfCageLabel")}
            max={24}
            value={outOfCage}
            onChange={setOutOfCage}
          />
          <DeclaredField
            label={t("sitterCare.bird.flightSafeLabel")}
            help={t("sitterCare.bird.flightSafeHelp")}
            value={bird.flightSafeRoom}
            onChange={(v) => setBird((b) => ({ ...b, flightSafeRoom: v }))}
          />
          <DeclaredField
            label={t("sitterCare.bird.coversLabel")}
            value={bird.coversAtNight}
            onChange={(v) => setBird((b) => ({ ...b, coversAtNight: v }))}
          />
        </Block>
      )}

      <Block id="care-outside" title={t("sitterCare.blocks.outsideAndEmergencies")}>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">
            {t("sitterCare.transportLabel")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_MODES.map((mode) => (
              <Chip
                key={mode}
                selected={transport.includes(mode)}
                onClick={() =>
                  setTransport((list) =>
                    list.includes(mode) ? list.filter((m) => m !== mode) : [...list, mode],
                  )
                }
              >
                {t(`sitterCare.transport.${mode}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <DeclaredField
          label={t("sitterCare.canReachVetLabel")}
          help={t("sitterCare.canReachVetHelp")}
          value={canReachVet}
          onChange={setCanReachVet}
        />
        <FieldShell label={t("sitterCare.emergencyPlanLabel")} help={t("sitterCare.emergencyPlanHelp")}>
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              rows={3}
              value={emergencyPlan}
              aria-describedby={describedBy}
              onChange={(e) => setEmergencyPlan(e.target.value)}
            />
          )}
        </FieldShell>
      </Block>
    </Section>
  );
}
