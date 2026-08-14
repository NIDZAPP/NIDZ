import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Cat, Dog, Plus, X } from "lucide-react";
import type { ReactNode } from "react";

import Chip from "@/components/shared/Chip";
import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { DateRangeField, FieldShell, PhotoField } from "@/components/shared/fields";
import { DemoLine } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CARE_TYPES,
  CARE_UNIT_KEY,
  DOG_SIZES,
  SPECIES,
  asLocalized,
  localized,
  type CareType,
  type DateRange,
  type DogSize,
  type HousingType,
  type OutdoorSpace,
  type SitterProfile,
  type Species,
} from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { formatDateRange } from "@/utils/dates";
import { formatDZD } from "@/utils/format";

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
  error,
  children,
  footNote,
}: {
  title: string;
  intro?: string;
  /** Returns false to stay on the step. Each step focuses its own offending
      control before returning — the action bar is pinned to the bottom, so an
      error rendered above the fold is invisible on a phone. */
  onSubmit: () => boolean;
  error?: string;
  children: ReactNode;
  footNote?: ReactNode;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useDemo();
  const formId = "builder-section";

  /* Entering mid-way, by deep link or a stale tab, means there is no profile
     to write into. */
  if (!state.sitter) return <Navigate to="/sitter/start" replace />;

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
            if (onSubmit()) navigate(DASHBOARD);
          }}
        >
          {children}
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </form>
      </FlowScreen>
    </>
  );
}

function useProfile(): [SitterProfile | null, (patch: Partial<SitterProfile>) => void] {
  const { state, dispatch } = useDemo();
  return [
    state.sitter?.profile ?? null,
    (patch) => dispatch({ type: "patchSitterProfile", patch }),
  ];
}

/* ------------------------------------------------------------------ 1. you */

export function StepAbout() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const [profile, patch] = useProfile();

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(profile?.photoUrl);
  const [headline, setHeadline] = useState(profile ? localized(profile.headline, lng) : "");
  const [about, setAbout] = useState(profile ? localized(profile.about, lng) : "");
  const [years, setYears] = useState(profile?.experience.years ? String(profile.experience.years) : "");
  const [species, setSpecies] = useState<Species[]>(profile?.experience.species ?? []);
  const [error, setError] = useState<string>();
  const headlineRef = useRef<HTMLInputElement>(null);

  return (
    <BuilderStep
      title={t("sitterFlow.about.title")}
      intro={t("sitterFlow.about.intro")}
      error={error}
      footNote={<DemoLine>{t("sitterFlow.about.demoNote")}</DemoLine>}
      onSubmit={() => {
        if (!headline.trim()) {
          setError(t("sitterFlow.about.headlineRequired"));
          headlineRef.current?.focus();
          return false;
        }
        patch({
          photoUrl,
          /* One typed string in every locale slot: this is the sitter's own
             words, and Nidz does not translate what people write. */
          headline: asLocalized(headline.trim()),
          about: asLocalized(about.trim()),
          /* Spread the existing record: this step owns only the years and the
             species, and rebuilding the object from those two would silently
             reset the eight capability answers the experience section collects. */
          experience: {
            ...profile!.experience,
            years: Number(years) || 0,
            species,
          },
        });
        return true;
      }}
    >
      <PhotoField label={t("sitterFlow.about.photoLabel")} value={photoUrl} onChange={setPhotoUrl} />

      <FieldShell
        label={t("sitterFlow.about.headlineLabel")}
        help={t("sitterFlow.about.headlineHelp")}
        error={error}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            ref={headlineRef}
            value={headline}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setHeadline(e.target.value);
              setError(undefined);
            }}
          />
        )}
      </FieldShell>

      <FieldShell label={t("sitterFlow.about.aboutLabel")} help={t("sitterFlow.about.aboutHelp")}>
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
  const [profile, patch] = useProfile();

  const [services, setServices] = useState<CareType[]>(profile?.services ?? []);
  const [rates, setRates] = useState<Partial<Record<CareType, string>>>(() =>
    Object.fromEntries(
      (Object.entries(profile?.rates ?? {}) as [CareType, number][]).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [error, setError] = useState<string>();
  const servicesRef = useRef<HTMLFieldSetElement>(null);
  const rateRefs = useRef<Partial<Record<CareType, HTMLInputElement | null>>>({});

  return (
    <BuilderStep
      title={t("sitterFlow.services.title")}
      intro={t("sitterFlow.services.intro")}
      error={error}
      onSubmit={() => {
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
        patch({
          services,
          rates: Object.fromEntries(
            services.map((s): [CareType, number] => [s, Number(rates[s])]),
          ),
        });
        return true;
      }}
    >
      <fieldset ref={servicesRef} tabIndex={-1} className="focus:outline-none">
        <legend className="mb-3 text-sm font-medium text-foreground">{t("sitterFlow.services.label")}</legend>
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map((c) => (
            <Chip
              key={c}
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
  const [profile, patch] = useProfile();

  const [accepted, setAccepted] = useState<Species[]>(profile?.acceptedSpecies ?? []);
  const [sizes, setSizes] = useState<DogSize[]>(profile?.acceptedDogSizes ?? []);
  const [max, setMax] = useState(String(profile?.maxAnimals ?? 1));
  const [error, setError] = useState<string>();
  const speciesRef = useRef<HTMLFieldSetElement>(null);
  const sizesRef = useRef<HTMLFieldSetElement>(null);

  return (
    <BuilderStep
      title={t("sitterFlow.animals.title")}
      error={error}
      onSubmit={() => {
        if (accepted.length === 0) {
          setError(t("sitterFlow.animals.required"));
          speciesRef.current?.focus();
          return false;
        }
        if (accepted.includes("dog") && sizes.length === 0) {
          setError(t("sitterFlow.animals.sizesRequired"));
          sizesRef.current?.focus();
          return false;
        }
        patch({
          acceptedSpecies: accepted,
          acceptedDogSizes: accepted.includes("dog") ? sizes : [],
          maxAnimals: Math.max(1, Number(max) || 1),
        });
        return true;
      }}
    >
      <fieldset ref={speciesRef} tabIndex={-1} className="focus:outline-none">
        <legend className="mb-3 text-sm font-medium text-foreground">{t("sitterFlow.animals.label")}</legend>
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => (
            <Chip
              key={s}
              icon={s === "dog" ? Dog : Cat}
              selected={accepted.includes(s)}
              onClick={() => {
                setAccepted(toggle(accepted, s));
                setError(undefined);
              }}
            >
              {t(`speciesPlural.${s}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {accepted.includes("dog") && (
        <fieldset ref={sizesRef} tabIndex={-1} className="focus:outline-none">
          <legend className="mb-3 text-sm font-medium text-foreground">{t("sitterFlow.animals.sizesLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {DOG_SIZES.map((s) => (
              <Chip
                key={s}
                selected={sizes.includes(s)}
                onClick={() => {
                  setSizes(toggle(sizes, s));
                  setError(undefined);
                }}
              >
                {t(`dogSize.${s}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <FieldShell label={t("sitterFlow.animals.maxLabel")} help={t("sitterFlow.animals.maxHelp")}>
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
    </BuilderStep>
  );
}

/* --------------------------------------------------------- 4. housing */

export function StepHousing() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const [profile, patch] = useProfile();

  /* Null until answered. Seeding "appartement / aucun espace extérieur" and
     letting Continue through would publish two declarations the sitter never
     made, under a line reading "informations fournies par le pet-sitter". */
  const [type, setType] = useState<HousingType | null>(profile?.housing.type ?? null);
  const [outdoor, setOutdoor] = useState<OutdoorSpace | null>(profile?.housing.outdoor ?? null);
  const [dogs, setDogs] = useState(String(profile?.housing.residentPets.find((p) => p.species === "dog")?.count ?? 0));
  const [cats, setCats] = useState(String(profile?.housing.residentPets.find((p) => p.species === "cat")?.count ?? 0));
  const [conditions, setConditions] = useState(
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
      onSubmit={() => {
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
        patch({
          housing: {
            ...profile!.housing,
            type,
            outdoor,
            residentPets,
            conditions: conditions.trim() ? asLocalized(conditions.trim()) : null,
          },
        });
        return true;
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

      <FieldShell label={t("sitterFlow.housing.conditionsLabel")} help={t("sitterFlow.housing.conditionsHelp")}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            rows={3}
            value={conditions}
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
  const [profile, patch] = useProfile();

  const [items, setItems] = useState<string[]>(profile?.limits.map((l) => localized(l, lng)) ?? []);
  const [draft, setDraft] = useState("");

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
      onSubmit={() => {
        /* Anything typed but not yet added would otherwise be silently lost. */
        const all = draft.trim() ? [...items, draft.trim()] : items;
        patch({ limits: all.map(asLocalized) });
        return true;
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

      <FieldShell label={t("sitterFlow.limits.addLabel")} help={t("sitterFlow.limits.addHelp")}>
        {({ id, describedBy }) => (
          <div className="flex items-start gap-2">
            <Textarea
              id={id}
              rows={2}
              value={draft}
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
  const [profile, patch] = useProfile();

  const [ranges, setRanges] = useState<DateRange[]>(profile?.declaredUnavailable ?? []);
  const [draft, setDraft] = useState<DateRange | null>(null);

  return (
    <BuilderStep
      title={t("sitterFlow.availability.title")}
      intro={t("sitterFlow.availability.intro")}
      footNote={<DemoLine>{t("sitterFlow.availability.demoNote")}</DemoLine>}
      onSubmit={() => {
        const all = draft ? [...ranges, draft] : ranges;
        /* Declaring nothing is a complete answer here, and an empty array is
           indistinguishable from an unopened section — so saving records that
           the question was actually answered. */
        patch({
          declaredUnavailable: all,
          confirmedSections: profile?.confirmedSections.includes("availability")
            ? profile.confirmedSections
            : [...(profile?.confirmedSections ?? []), "availability"],
        });
        return true;
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
