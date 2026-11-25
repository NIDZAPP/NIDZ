import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { Cat, Dog, Plus, X } from "lucide-react";
import type { ReactNode } from "react";

import { AnimalGridMulti } from "@/components/shared/AnimalCategories";
import { AnimalPortrait } from "@/components/illustrations/animals";
import KindList from "@/components/shared/KindList";
import { classificationOf, servicesForAccepted } from "@/data/animal-catalogue";
import { acceptanceComplete, normalizeAcceptance } from "@/data/compatibility";
import Chip from "@/components/shared/Chip";
import FlowScreen from "@/components/shared/FlowScreen";
import { useReturnToDashboard } from "@/hooks/use-return-to-dashboard";
import OptionGroup from "@/components/shared/OptionGroup";
import { DateRangeField, FieldShell, PhotoField } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CARE_TYPES,
  CARE_UNIT_KEY,
  SPECIES,
  asLocalized,
  localized,
  type CareType,
  type DateRange,
  type HousingType,
  type KindAcceptance,
  type OutdoorSpace,
  type SitterProfile,
  type Species,
} from "@/data/types";
import { dateRangeOrNull, dateRanges, listOf, oneOf, stringsKeyedBy } from "@/hooks/draft-validators";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave, type SaveController } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { patchProfile, watchProfile } from "@/state/demo/profile-commit";
import { formatDateRange } from "@/utils/dates";
import { formatDZD } from "@/utils/format";
import { CARE_ICON, HOUSING_ICON, OUTDOOR_ICON } from "@/components/icons/domain-icons";

/* ---------------------------------------------------------------------------
   Profile SECTIONS.

   Audit 1.1 made these six steps of a wizard, each one blocking the next.
   §51 replaced that with a dashboard: every section is reachable in any order,
   saves on its own, and returns to the list. There is no progress bar and no
   step number, because there is no fixed sequence left to number — the
   dashboard shows what has been answered.

   Grouping is unchanged and still deliberate: photo and self-description are
   one question about the person, services and prices depend on each other,
   housing and how the animals are kept describe one environment. §4.5 warns
   against splitting a task into ten artificial screens as loudly as it warns
   against one endless form.

   Everything collected here is a declaration. Nothing in these sections can
   produce a verification, a rating, a review or a real availability calendar,
   and none of them pretends otherwise.
   ------------------------------------------------------------------------ */

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Where every section returns to. §51 replaced the wizard with a dashboard,
    so there is no "next step" to chain to any more. */
const DASHBOARD = "/sitter/profile";

function BuilderStep({
  title,
  intro,
  onSubmit,
  save,
  error,
  children,
  footNote,
}: {
  title: string;
  intro?: string;
  /** Returns false to stay on the step. Each step focuses its own offending
      control before returning — the action bar is pinned to the bottom, so an
      error rendered above the fold is invisible on a phone. Returns false too
      when the save itself did not happen (Audit 1.3.1 A-02): the step stays,
      with what was typed, and `SaveFeedback` says why. `force` is the
      visitor's explicit choice to overwrite another tab's change. */
  onSubmit: (options: { force: boolean }) => unknown;
  save: SaveController;
  error?: string;
  children: ReactNode;
  footNote?: ReactNode;
}) {
  const { t } = useTranslation();
  const returnToDashboard = useReturnToDashboard();
  const { state } = useDemo();
  const formId = "builder-section";

  /* Entering mid-way, by deep link or a stale tab, means there is no profile
     to write into. */
  if (!state.sitter) return <Navigate to="/sitter/start" replace />;

  const run = (force = false) => {
    if (onSubmit({ force })) returnToDashboard();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {title}
        </title>
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

function useProfile(): SitterProfile | null {
  return useDemo().state.sitter?.profile ?? null;
}

/* ------------------------------------------------------------------ 1. you */

export function StepAbout() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const profile = useProfile();
  const scope = "sitter-about";
  const save = useSave({
    scope,
    watch: (s) => {
      const p = s.sitter?.profile;
      return p && { headline: p.headline, about: p.about, years: p.experience.years, species: p.experience.species };
    },
  });

  /* The photo is an object URL: kept while moving between screens, never
     across a reload, where it would point at nothing. */
  const [photoUrl, setPhotoUrl] = useDraftField<string | undefined>(scope, "photoUrl", () => profile?.photoUrl, {
    transient: true,
  });
  const [headline, setHeadline] = useDraftField(scope, "headline", () => (profile ? localized(profile.headline, lng) : ""));
  const [about, setAbout] = useDraftField(scope, "about", () => (profile ? localized(profile.about, lng) : ""));
  const [years, setYears] = useDraftField(scope, "years", () =>
    profile?.experience.years ? String(profile.experience.years) : "",
  );
  const [species, setSpecies] = useDraftField<Species[]>(scope, "species", () => profile?.experience.species ?? [], {
    validate: listOf(SPECIES),
  });
  const [error, setError] = useState<string>();
  const headlineRef = useRef<HTMLInputElement>(null);

  return (
    <BuilderStep
      title={t("sitterFlow.about.title")}
      intro={t("sitterFlow.about.intro")}
      error={error}
      save={save}
      footNote={<DemoLine>{t("sitterFlow.about.demoNote")}</DemoLine>}
      onSubmit={({ force }) => {
        if (!headline.trim()) {
          setError(t("sitterFlow.about.headlineRequired"));
          headlineRef.current?.focus();
          return false;
        }
        return save.save(
          patchProfile((current) => ({
            photoUrl,
            /* One typed string in every locale slot: this is the sitter's own
               words, and Nidz does not translate what people write. */
            headline: asLocalized(headline.trim()),
            about: asLocalized(about.trim()),
            /* Spread the existing record: this step owns only the years and
               the species, and rebuilding the object from those two would
               silently reset the eight capability answers the experience
               section collects. */
            experience: {
              ...current.experience,
              years: Number(years) || 0,
              species,
            },
          })),
          { force },
        );
      }}
    >
      <PhotoField label={t("sitterFlow.about.photoLabel")} value={photoUrl} onChange={setPhotoUrl} />

      <FieldShell
        label={t("sitterFlow.about.headlineLabel")}
        error={error}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            ref={headlineRef}
            value={headline}
            placeholder={t("sitterFlow.about.headlinePlaceholder")}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setHeadline(e.target.value);
              setError(undefined);
            }}
          />
        )}
      </FieldShell>

      <FieldShell label={t("sitterFlow.about.aboutLabel")} info={t("sitterFlow.about.aboutHelp")}>
        {({ id, describedBy }) => (
          <Textarea id={id} rows={5} value={about} aria-describedby={describedBy} onChange={(e) => setAbout(e.target.value)} />
        )}
      </FieldShell>

      <FieldShell label={t("sitterFlow.about.yearsLabel")}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            className="max-w-[8rem]"
            value={years}
            aria-describedby={describedBy}
            onChange={(e) => setYears(e.target.value)}
          />
        )}
      </FieldShell>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foreground">{t("sitterFlow.about.speciesLabel")}</legend>
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => (
            <Chip
              key={s}
              icon={s === "dog" ? Dog : Cat}
              selected={species.includes(s)}
              onClick={() => setSpecies(toggle(species, s))}
            >
              {t(`speciesPlural.${s}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* The professional declaration moved to its own section at Audit 1.2.
          It was a free-text box here, which made "veterinarian" one of forty
          spellings and put a qualification claim in the middle of a paragraph
          about oneself. §40 wants it structured, and §68 wants it visibly
          separate from any verification. */}
    </BuilderStep>
  );
}

/* -------------------------------------------------------- 2. services */

export function StepServices() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const profile = useProfile();
  const scope = "sitter-services";
  const save = useSave({ scope, watch: watchProfile(["services", "rates"]) });

  const [services, setServices] = useDraftField<CareType[]>(scope, "services", () => profile?.services ?? [], {
    validate: listOf(CARE_TYPES),
  });
  const [rates, setRates] = useDraftField<Partial<Record<CareType, string>>>(
    scope,
    "rates",
    () =>
      Object.fromEntries(
        (Object.entries(profile?.rates ?? {}) as [CareType, number][]).map(([k, v]) => [k, String(v)]),
      ),
    { validate: stringsKeyedBy(CARE_TYPES) },
  );
  const [error, setError] = useState<string>();
  const servicesRef = useRef<HTMLFieldSetElement>(null);
  const rateRefs = useRef<Partial<Record<CareType, HTMLInputElement | null>>>({});

  return (
    <BuilderStep
      title={t("sitterFlow.services.title")}
      intro={t("sitterFlow.services.intro")}
      error={error}
      save={save}
      onSubmit={({ force }) => {
        if (services.length === 0) {
          setError(t("sitterFlow.services.required"));
          servicesRef.current?.focus();
          return false;
        }
        /* `!Number(x)` accepted "-500" as truthy and rejected a genuine "0".
           A negative rate would also sort the sitter to the top of every
           result list, since results are ordered by the displayed price. */
        const invalid = services.find((s) => {
          const n = Number(rates[s]);
          return !Number.isFinite(n) || n <= 0;
        });
        if (invalid) {
          setError(t("sitterFlow.services.priceRequired", { service: t(`care.${invalid}`) }));
          rateRefs.current[invalid]?.focus();
          return false;
        }
        return save.save(
          patchProfile(() => ({
            services,
            rates: Object.fromEntries(
              services.map((s): [CareType, number] => [s, Number(rates[s])]),
            ),
          })),
          { force },
        );
      }}
    >
      <fieldset ref={servicesRef} tabIndex={-1} className="focus:outline-none">
        <legend className="mb-3 text-[0.9375rem] font-medium text-foreground">{t("sitterFlow.services.label")}</legend>
        <div className="flex flex-wrap gap-2">
          {/* Only the services the accepted animals can have (Nidz 1.7): a
              walk is a dog's, an aquarium is looked after at home. A service
              already declared stays visible so it can be removed. */}
          {CARE_TYPES.filter((c) => servicesForAccepted(profile?.acceptedSpecies ?? []).includes(c) || services.includes(c)).map((c) => (
            <Chip
              key={c}
              icon={CARE_ICON[c]}
              selected={services.includes(c)}
              onClick={() => {
                setServices(toggle(services, c));
                setError(undefined);
              }}
            >
              {t(`care.${c}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Prices appear only for services actually offered — the unit belongs
          to the service, so there is no such thing as a rate without one. */}
      {services.length > 0 && (
        <div className="space-y-5">
          {CARE_TYPES.filter((c) => services.includes(c)).map((service) => (
            <FieldShell key={service} label={t(`care.${service}`)} help={t(CARE_UNIT_KEY[service])}>
              {({ id, describedBy }) => (
                <div className="flex items-center gap-2">
                  <Input
                    id={id}
                    ref={(node) => {
                      rateRefs.current[service] = node;
                    }}
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    className="max-w-[10rem] tabular-nums"
                    value={rates[service] ?? ""}
                    aria-describedby={describedBy}
                    onChange={(e) => {
                      setRates((r) => ({ ...r, [service]: e.target.value }));
                      setError(undefined);
                    }}
                  />
                  {/* The same currency the profile and the cards render, so a
                      sitter does not type one unit and read another. */}
                  <span className="text-base text-muted-foreground">
                    {formatDZD(0, lng).replace(/[\d\s\u00a0\u202f.,]/g, "")}
                  </span>
                </div>
              )}
            </FieldShell>
          ))}
        </div>
      )}
    </BuilderStep>
  );
}

/* --------------------------------------------------------- 3. animals */

export function StepAnimals() {
  const { t } = useTranslation();
  const profile = useProfile();
  const scope = "sitter-animals";
  const save = useSave({ scope, watch: watchProfile(["acceptedSpecies", "acceptedKinds", "maxAnimals"]) });

  const [accepted, setAccepted] = useDraftField<Species[]>(scope, "accepted", () => profile?.acceptedSpecies ?? [], {
    validate: listOf(SPECIES),
  });
  /* Per category: « toutes » or « certaines uniquement », with the chosen
     kinds and the sitter's own names (Nidz 1.7 §19). */
  const [kinds, setKinds] = useDraftField<Partial<Record<Species, KindAcceptance>>>(
    scope,
    "kinds",
    () => profile?.acceptedKinds ?? {},
    {
      validate: (raw) => {
        if (typeof raw !== "object" || raw === null) return null;
        const out: Partial<Record<Species, KindAcceptance>> = {};
        for (const species of SPECIES) {
          const entry = normalizeAcceptance(species, (raw as Record<string, unknown>)[species]);
          if (entry) out[species] = entry;
        }
        return out;
      },
    },
  );
  const [max, setMax] = useDraftField(scope, "max", () => String(profile?.maxAnimals ?? 1));
  const [error, setError] = useState<string>();
  const [kindErrors, setKindErrors] = useState<Species[]>([]);
  const speciesRef = useRef<HTMLDivElement>(null);

  const withKinds = accepted.filter((s) => classificationOf(s) !== null);
  const modeOf = (s: Species): "all" | "some" => (kinds[s]?.mode === "some" ? "some" : "all");
  const setAcceptance = (s: Species, next: KindAcceptance) => {
    setKinds((prev) => ({ ...prev, [s]: next }));
    setKindErrors((prev) => prev.filter((x) => x !== s));
  };

  return (
    <BuilderStep
      title={t("sitterFlow.animals.title")}
      error={error}
      save={save}
      onSubmit={({ force }) => {
        if (accepted.length === 0) {
          setError(t("sitterFlow.animals.required"));
          speciesRef.current?.focus();
          return false;
        }
        const incomplete = withKinds.filter((s) => !acceptanceComplete(kinds[s]));
        if (incomplete.length > 0) {
          setKindErrors(incomplete);
          setError(t("sitterFlow.animals.kindsRequired"));
          document.getElementById(`accept-${incomplete[0]}`)?.focus();
          return false;
        }
        const acceptedKinds: Partial<Record<Species, KindAcceptance>> = {};
        for (const s of withKinds) acceptedKinds[s] = modeOf(s) === "some" ? (kinds[s] as KindAcceptance) : { mode: "all" };
        return save.save(
          patchProfile(() => ({
            acceptedSpecies: accepted,
            acceptedKinds,
            maxAnimals: Math.max(1, Number(max) || 1),
          })),
          { force },
        );
      }}
    >
      {/* The same illustrated cards the owner picks from: one catalogue for
          both sides, so « lapins » means the same thing to the person asking
          and the person accepting. Several can be on. */}
      <div ref={speciesRef} tabIndex={-1} className="focus:outline-none">
        <p id="sitter-animals-label" className="mb-3 text-[0.9375rem] font-medium text-foreground">
          {t("sitterFlow.animals.label")}
        </p>
        <AnimalGridMulti
          labelledBy="sitter-animals-label"
          values={accepted}
          onToggle={(s) => {
            setAccepted(toggle(accepted, s));
            setError(undefined);
          }}
        />
        <p className="mt-3 px-1 text-sm text-muted-foreground">{t("sitterFlow.animals.birdParrot")}</p>
      </div>

      {withKinds.map((species) => {
        const classification = classificationOf(species) ?? "breed";
        const acceptance = kinds[species];
        const some = modeOf(species) === "some";
        const ids = acceptance?.mode === "some" ? acceptance.ids : [];
        const others = acceptance?.mode === "some" ? acceptance.others : [];
        const invalid = kindErrors.includes(species);
        return (
          <fieldset key={species} className="surface p-4 animate-fade-in" aria-invalid={invalid || undefined}>
            <legend className="sr-only">{t(`sitterFlow.animals.kindsFor.${classification}`, { animals: t(`speciesPlural.${species}`) })}</legend>
            <div className="flex items-center gap-3">
              <AnimalPortrait species={species} className="size-12 shrink-0 rounded-lg" sizes="48px" />
              <p className="text-[0.9375rem] font-semibold text-foreground">
                {t(`sitterFlow.animals.kindsFor.${classification}`, { animals: t(`speciesPlural.${species}`) })}
              </p>
            </div>
            <OptionGroup
              className="mt-3"
              label={t(`sitterFlow.animals.kindsFor.${classification}`, { animals: t(`speciesPlural.${species}`) })}
              groupRef={undefined}
              value={some ? "some" : "all"}
              onChange={(value) =>
                setAcceptance(species, value === "all" ? { mode: "all" } : { mode: "some", ids, others })
              }
              options={[
                { value: "all", label: t(`sitterFlow.animals.all.${classification}`) },
                { value: "some", label: t(`sitterFlow.animals.some.${classification}`) },
              ]}
            />
            {some && (
              <div className="mt-4 animate-fade-in" id={`accept-${species}`} tabIndex={-1}>
                <KindList
                  mode="multi"
                  species={species}
                  values={ids}
                  listClassName="max-h-72"
                  onToggle={(id) =>
                    setAcceptance(species, {
                      mode: "some",
                      ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
                      others,
                    })
                  }
                />
                <OtherKinds
                  values={others}
                  label={t(`sitterFlow.animals.otherLabel.${classification}`)}
                  onChange={(next) => setAcceptance(species, { mode: "some", ids, others: next })}
                />
                <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                  {t("sitterFlow.animals.chosenCount", { count: ids.length + others.length })}
                </p>
                {invalid && (
                  <p role="alert" className="mt-1 text-sm font-medium text-destructive">
                    {t("sitterFlow.animals.kindsRequired")}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        );
      })}

      <FieldShell label={t("sitterFlow.animals.maxLabel")} info={t("sitterFlow.animals.maxHelp")}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="number"
            min={1}
            max={10}
            inputMode="numeric"
            className="max-w-[8rem]"
            value={max}
            onBlur={() => setMax(String(Math.min(10, Math.max(1, Number(max) || 1))))}
            aria-describedby={describedBy}
            onChange={(e) => setMax(e.target.value)}
          />
        )}
      </FieldShell>
      <p className="text-sm text-muted-foreground">{t("sitterFlow.animals.limitsHint")}</p>
    </BuilderStep>
  );
}

/** « Autre » on the sitter side: names the list does not carry, added one by
    one and removable. Never matched automatically (§19.2). */
function OtherKinds({ values, label, onChange }: { values: string[]; label: string; onChange: (next: string[]) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim().slice(0, 40);
    if (value.length < 2 || values.some((v) => v.toLowerCase() === value.toLowerCase()) || values.length >= 10) return;
    onChange([...values, value]);
    setText("");
  };
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={`other-${label}`}>
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          id={`other-${label}`}
          value={text}
          maxLength={40}
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="surface" onClick={add}>
          {t("sitterFlow.animals.addOther")}
        </Button>
      </div>
      {values.length > 0 && (
        <ul role="list" className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <bdi>{value}</bdi>
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">{t("sitterFlow.animals.removeOther", { name: value })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{t("sitterFlow.animals.otherNote")}</p>
    </div>
  );
}

/* --------------------------------------------------------- 4. housing */

export function StepHousing() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const profile = useProfile();
  const scope = "sitter-housing";
  const save = useSave({
    scope,
    watch: (s) => {
      const h = s.sitter?.profile.housing;
      return h && { type: h.type, outdoor: h.outdoor, residentPets: h.residentPets, conditions: h.conditions };
    },
  });

  /* Null until answered. Seeding "appartement / aucun espace extérieur" and
     letting Continue through would publish two declarations the sitter never
     made, under a line reading "informations fournies par le pet-sitter". */
  const [type, setType] = useDraftField<HousingType | null>(scope, "type", () => profile?.housing.type ?? null, {
    validate: oneOf<HousingType>(["apartment", "house"]),
  });
  const [outdoor, setOutdoor] = useDraftField<OutdoorSpace | null>(
    scope,
    "outdoor",
    () => profile?.housing.outdoor ?? null,
    { validate: oneOf<OutdoorSpace>(["none", "balcony", "yard", "garden"]) },
  );
  const [dogs, setDogs] = useDraftField(scope, "dogs", () =>
    String(profile?.housing.residentPets.find((p) => p.species === "dog")?.count ?? 0),
  );
  const [cats, setCats] = useDraftField(scope, "cats", () =>
    String(profile?.housing.residentPets.find((p) => p.species === "cat")?.count ?? 0),
  );
  const [conditions, setConditions] = useDraftField(scope, "conditions", () =>
    profile?.housing.conditions ? localized(profile.housing.conditions, lng) : "",
  );
  const [error, setError] = useState<string>();
  const typeRef = useRef<HTMLDivElement>(null);
  const outdoorRef = useRef<HTMLDivElement>(null);

  return (
    <BuilderStep
      error={error}
      title={t("sitterFlow.housing.title")}
      intro={t("sitterFlow.housing.intro")}
      save={save}
      onSubmit={({ force }) => {
        if (!type) {
          setError(t("sitterFlow.housing.typeRequired"));
          typeRef.current?.focus();
          return false;
        }
        if (!outdoor) {
          setError(t("sitterFlow.housing.outdoorRequired"));
          outdoorRef.current?.focus();
          return false;
        }
        const residentPets = [
          ...(Number(dogs) > 0 ? [{ species: "dog" as Species, count: Number(dogs) }] : []),
          ...(Number(cats) > 0 ? [{ species: "cat" as Species, count: Number(cats) }] : []),
        ];
        return save.save(
          patchProfile((current) => ({
            housing: {
              ...current.housing,
              type,
              outdoor,
              residentPets,
              conditions: conditions.trim() ? asLocalized(conditions.trim()) : null,
            },
          })),
          { force },
        );
      }}
    >
      <div>
        <p id="housing-type-label" className="mb-3 text-sm font-medium text-foreground">
          {t("sitterFlow.housing.typeLabel")}
        </p>
        <OptionGroup
          labelledBy="housing-type-label"
          groupRef={typeRef}
          value={type}
          onChange={(v) => {
            setType(v as HousingType);
            setError(undefined);
          }}
          options={(["apartment", "house"] as HousingType[]).map((v) => ({
            value: v,
            label: t(`housing.type.${v}`),
            icon: HOUSING_ICON[v],
          }))}
        />
      </div>

      <div>
        <p id="housing-outdoor-label" className="mb-3 text-sm font-medium text-foreground">
          {t("sitterFlow.housing.outdoorLabel")}
        </p>
        <OptionGroup
          labelledBy="housing-outdoor-label"
          groupRef={outdoorRef}
          value={outdoor}
          onChange={(v) => {
            setOutdoor(v as OutdoorSpace);
            setError(undefined);
          }}
          options={(["none", "balcony", "yard", "garden"] as OutdoorSpace[]).map((v) => ({
            value: v,
            label: t(`housing.outdoor.${v}`),
            icon: OUTDOOR_ICON[v],
          }))}
        />
      </div>

      {/* Resident animals are a hard constraint for many owners, which is why
          "aucun chat déclaré" is a useful compatibility fact on the profile. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell label={t("sitterFlow.housing.dogsLabel")}>
          {({ id }) => (
            <Input id={id} type="number" min={0} max={10} inputMode="numeric" className="max-w-[8rem]" value={dogs} onChange={(e) => setDogs(e.target.value)} />
          )}
        </FieldShell>
        <FieldShell label={t("sitterFlow.housing.catsLabel")}>
          {({ id }) => (
            <Input id={id} type="number" min={0} max={10} inputMode="numeric" className="max-w-[8rem]" value={cats} onChange={(e) => setCats(e.target.value)} />
          )}
        </FieldShell>
      </div>

      <FieldShell label={t("sitterFlow.housing.conditionsLabel")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={conditions}
            placeholder={t("sitterFlow.housing.conditionsPlaceholder")}
            aria-describedby={describedBy}
            onChange={(e) => setConditions(e.target.value)}
          />
        )}
      </FieldShell>
    </BuilderStep>
  );
}

/* ---------------------------------------------------------- 5. limits */

export function StepLimits() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const profile = useProfile();
  const scope = "sitter-limits";
  const save = useSave({ scope, watch: watchProfile(["limits"]) });

  const [items, setItems] = useDraftField<string[]>(scope, "items", () => profile?.limits.map((l) => localized(l, lng)) ?? [], {
    validate: (raw) => (Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : null),
  });
  const [draft, setDraft] = useDraftField(scope, "draft", () => "");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    setItems((list) => [...list, value]);
    setDraft("");
  };

  return (
    <BuilderStep
      title={t("sitterFlow.limits.title")}
      intro={t("sitterFlow.limits.intro")}
      save={save}
      onSubmit={({ force }) => {
        /* Anything typed but not yet added would otherwise be silently lost. */
        const all = draft.trim() ? [...items, draft.trim()] : items;
        return save.save(patchProfile(() => ({ limits: all.map(asLocalized) })), { force });
      }}
    >
      {items.length > 0 && (
        <ul role="list" className="space-y-2">
          {items.map((item, i) => (
            <li key={`${i}-${item}`} className="flex items-start justify-between gap-3 border-b border-border pb-2">
              <span className="text-base leading-relaxed text-foreground">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setItems((list) => list.filter((_, index) => index !== i))}
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">{t("common.remove")}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FieldShell label={t("sitterFlow.limits.addLabel")}>
        {({ id, describedBy }) => (
          <div className="flex items-start gap-2">
            <Textarea
              id={id}
              rows={2}
              value={draft}
              placeholder={t("sitterFlow.limits.addPlaceholder")}
              aria-describedby={describedBy}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="button" variant="outline" size="icon" onClick={add} aria-label={t("sitterFlow.limits.add")}>
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </FieldShell>
    </BuilderStep>
  );
}

/* ---------------------------------------------------- 6. availability */

export function StepAvailability() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const profile = useProfile();
  const scope = "sitter-availability";
  const save = useSave({
    scope,
    watch: (s) => s.sitter?.profile.declaredUnavailable,
  });

  const [ranges, setRanges] = useDraftField<DateRange[]>(scope, "ranges", () => profile?.declaredUnavailable ?? [], {
    validate: dateRanges,
  });
  const [draft, setDraft] = useDraftField<DateRange | null>(scope, "draft", () => null, {
    validate: dateRangeOrNull,
  });

  return (
    <BuilderStep
      title={t("sitterFlow.availability.title")}
      intro={t("sitterFlow.availability.intro")}
      footNote={<DemoLine>{t("sitterFlow.availability.demoNote")}</DemoLine>}
      save={save}
      onSubmit={({ force }) => {
        const all = draft ? [...ranges, draft] : ranges;
        /* Declaring nothing is a complete answer here, and an empty array is
           indistinguishable from an unopened section — so saving records that
           the question was actually answered. */
        return save.save(
          patchProfile((current) => ({
            declaredUnavailable: all,
            confirmedSections: current.confirmedSections.includes("availability")
              ? current.confirmedSections
              : [...current.confirmedSections, "availability"],
          })),
          { force },
        );
      }}
    >
      {ranges.length > 0 && (
        <ul role="list" className="space-y-2">
          {ranges.map((range, i) => (
            <li
              key={`${range.start}-${range.end}-${i}`}
              className="flex items-center justify-between gap-3 border-b border-border pb-2"
            >
              <span className="text-base text-foreground">
                <bdi>{formatDateRange(range, lng)}</bdi>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setRanges((list) => list.filter((_, index) => index !== i))}
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">{t("common.remove")}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">{t("sitterFlow.availability.addLabel")}</p>
        <DateRangeField
          singleDay={false}
          value={draft}
          onChange={setDraft}
          singleLabel={t("need.care.dateLabel")}
          startLabel={t("need.care.startLabel")}
          endLabel={t("need.care.endLabel")}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={!draft}
          onClick={() => {
            if (!draft) return;
            /* Deduped: an identical range added twice produces duplicate React
               keys on the public profile, which renders it. */
            setRanges((list) =>
              list.some((r) => r.start === draft.start && r.end === draft.end) ? list : [...list, draft],
            );
            setDraft(null);
          }}
        >
          {t("sitterFlow.availability.add")}
        </Button>
      </div>
    </BuilderStep>
  );
}
