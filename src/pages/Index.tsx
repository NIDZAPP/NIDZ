import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Megaphone, Plus, Search, SlidersHorizontal } from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import { ageText, categoryText } from "@/components/request/pet-facts";
import NativeSelect from "@/components/shared/NativeSelect";
import Segmented, { SegmentPanel } from "@/components/shared/Segmented";
import { LocationFields } from "@/components/shared/fields";
import SitterCard from "@/components/sitter/SitterCard";
import { Button } from "@/components/ui/button";
import { servicesFor } from "@/data/animal-catalogue";
import {
  EMPTY_CRITERIA,
  criteriaToParams,
  matchSitters,
  normalizeCriteria,
  partitionReasons,
  splitByDistance,
  type SearchCriteria,
} from "@/data/criteria";
import { HOME_VIEWS, WELCOME_PATH, hasSession, homeViewFrom, workspaceHome, type HomeView } from "@/data/navigation";
import { kindLabel, needsAnswered, type Pet } from "@/data/pets";
import { publicSitters } from "@/data/repository";
import { CARE_TYPES, SPECIES, isSpecies, type CareType } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";
import { cn } from "@/lib/utils";

/**
 * THE OWNER'S ACCUEIL (Nidz 1.7 §16) — two views of one tab, in the address:
 *
 *   Mes animaux             every animal the owner registered, each its own
 *                           card: tap the information to read, complete or
 *                           edit it; two actions start care FOR THAT ANIMAL —
 *                           « Trouver un pet-sitter » and « Publier une
 *                           demande » — reusing what is already known and
 *                           asking only what is missing (its needs if never
 *                           answered, then where and when). « Ajouter un
 *                           animal » saves and comes back here.
 *   Explorer les pet-sitters the sitters, without describing an animal
 *                           first: three plain filters (animal, service,
 *                           wilaya), nearest first, and the full search one
 *                           tap away.
 *
 * `/` belongs to whichever space is active, so an account on the sitter side
 * is sent to where that side begins.
 */
export default function Index() {
  const { t } = useTranslation();
  const { state } = useDemo();
  const [params, setParams] = useSearchParams();
  const view = homeViewFrom(params);

  if (!hasSession(state)) return <Navigate to={WELCOME_PATH} replace />;
  if (state.activeWorkspace === "sitter" && state.sitter) {
    return <Navigate to={workspaceHome(state, "sitter")} replace />;
  }

  const setView = (next: HomeView) =>
    setParams(next === "explore" ? { view: "explore" } : {}, { replace: true, preventScrollReset: true });

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("nav.home")}
        </title>
        <meta name="description" content={t("entry.subtitle")} />
      </Helmet>
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">
          {state.account ? t("home.hello", { name: state.account.firstName }) : t("nav.home")}
        </h1>
        <Segmented
          className="mt-4 w-full sm:w-auto"
          stretch
          equal={false}
          idPrefix="home"
          label={t("nav.home")}
          value={view}
          onChange={setView}
          items={HOME_VIEWS.map((key) => ({ key, label: t(`home.views.${key}`) }))}
        />
        <SegmentPanel idPrefix="home" activeKey={view} className="mt-6">
          {view === "animals" ? <MyAnimals pets={state.pets} /> : <Explore params={params} setParams={setParams} />}
        </SegmentPanel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Mes animaux */

function careStart(pet: Pet, intent: "search" | "publish"): string {
  const q = `?pet=${encodeURIComponent(pet.id)}&intent=${intent}`;
  return needsAnswered(pet) ? `/owner/need/location${q}` : `/owner/need/needs${q}`;
}

function MyAnimals({ pets }: { pets: Pet[] }) {
  const { t } = useTranslation();
  const locale = useAppLocale();

  if (pets.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-4 p-6 text-center md:p-10">
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {(["dog", "cat", "bird"] as const).map((s) => (
            <AnimalPortrait key={s} species={s} className="size-16 rounded-xl" sizes="64px" eager />
          ))}
        </div>
        <div>
          <h2 className="text-title font-semibold text-foreground">{t("home.animals.emptyTitle")}</h2>
          <p className="mx-auto mt-1 max-w-[42ch] text-sm text-muted-foreground">{t("home.animals.emptyBody")}</p>
        </div>
        <Button asChild size="lg">
          <Link to="/owner/need/pet?then=pets">
            <Plus aria-hidden="true" />
            {t("home.animals.add")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <ul role="list" className="grid gap-3 md:grid-cols-2">
        {pets.map((pet) => {
          const kind = kindLabel(pet, locale);
          const age = ageText(pet, t);
          const missing = [!pet.ageInfo && !pet.age.trim(), !needsAnswered(pet), !pet.photoUrl].filter(Boolean).length;
          return (
            <li key={pet.id} className="surface flex flex-col p-3">
              <Link
                to={`/owner/pets/${encodeURIComponent(pet.id)}`}
                className="flex items-center gap-3.5 rounded-lg p-1.5 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt="" className="size-[4.5rem] shrink-0 rounded-xl object-cover" />
                ) : (
                  <AnimalPortrait species={pet.species} className="size-[4.5rem] shrink-0 rounded-xl" sizes="72px" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-name font-semibold text-foreground">
                    <bdi>{pet.name}</bdi>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {[categoryText(pet, t), kind, age].filter(Boolean).join(" · ")}
                  </span>
                  <span className={cn("mt-1 block text-sm", missing ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {missing ? t("home.animals.toComplete", { count: missing }) : t("home.animals.seeInfo")}
                  </span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
              </Link>
              <div className="mt-2 grid gap-2 border-t border-border pt-3 min-[480px]:grid-cols-2">
                <Button asChild variant="default" className="min-w-0 px-3">
                  <Link to={careStart(pet, "search")}>
                    <Search aria-hidden="true" />
                    <span className="truncate">{t("home.animals.find")}</span>
                  </Link>
                </Button>
                <Button asChild variant="surface" className="min-w-0 px-3">
                  <Link to={careStart(pet, "publish")}>
                    <Megaphone aria-hidden="true" />
                    <span className="truncate">{t("home.animals.publish")}</span>
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Button asChild variant="surface" size="lg" className="mt-4 w-full sm:w-auto">
        <Link to="/owner/need/pet?then=pets">
          <Plus aria-hidden="true" />
          {t("home.animals.add")}
        </Link>
      </Button>
    </>
  );
}

/* ----------------------------------------------------------------- Explore */

function Explore({ params, setParams }: { params: URLSearchParams; setParams: ReturnType<typeof useSearchParams>[1] }) {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { state } = useDemo();

  const speciesParam = params.get("species");
  const careParam = params.get("care");
  const criteria: SearchCriteria = normalizeCriteria({
    ...EMPTY_CRITERIA,
    species: isSpecies(speciesParam) ? speciesParam : null,
    care: (CARE_TYPES as readonly string[]).includes(careParam ?? "") ? (careParam as CareType) : null,
    wilaya: params.get("wilaya"),
  });

  const update = (patch: Partial<SearchCriteria>) => {
    const next = normalizeCriteria({ ...criteria, ...patch });
    const query: Record<string, string> = { view: "explore" };
    if (next.species) query.species = next.species;
    if (next.care) query.care = next.care;
    if (next.wilaya) query.wilaya = next.wilaya;
    setParams(query, { replace: true, preventScrollReset: true });
  };

  const home = state.account ? { wilayaCode: state.account.wilayaId, communeCode: state.account.communeId } : null;
  const results = useMemo(
    () => matchSitters(publicSitters(state, { excludeOwn: true }), criteria, home, locale),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, criteria.species, criteria.care, criteria.wilaya, locale],
  );
  const { perResult } = partitionReasons(results);
  const { near, farther, unplaced } = splitByDistance(results);
  const search = new URLSearchParams(criteriaToParams(criteria)).toString();
  const services = CARE_TYPES.filter((c) => servicesFor(criteria.species).includes(c));

  const card = (r: (typeof results)[number]) => (
    <SitterCard
      key={r.sitter.id}
      sitter={r.sitter}
      rate={r.rate}
      reasons={perResult.get(r.sitter.id) ?? []}
      askedSpecies={criteria.species}
      compat={r.compat}
      askedCare={criteria.care}
      search={search}
      layout="stack"
      showSpeciesEyebrow={!criteria.species}
    />
  );

  return (
    <div>
      <div className="surface grid gap-3 p-4 md:grid-cols-[1fr_1fr_1.4fr] md:items-end">
        <div>
          <label htmlFor="explore-animal" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("explore.animal")}
          </label>
          <NativeSelect
            id="explore-animal"
            value={criteria.species ?? ""}
            onChange={(e) => update({ species: isSpecies(e.target.value) ? e.target.value : null })}
          >
            <option value="">{t("explore.anyAnimal")}</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {t(`species.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="explore-care" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("explore.care")}
          </label>
          <NativeSelect
            id="explore-care"
            value={criteria.care ?? ""}
            onChange={(e) => update({ care: (CARE_TYPES as readonly string[]).includes(e.target.value) ? (e.target.value as CareType) : null })}
          >
            <option value="">{t("explore.anyCare")}</option>
            {services.map((c) => (
              <option key={c} value={c}>
                {t(`care.${c}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <LocationFields
          locale={locale}
          wilayaCode={criteria.wilaya}
          communeCode={null}
          onChange={(next) => update({ wilaya: next.wilayaCode, commune: null })}
          wilayaLabel={t("explore.near")}
          anyWilayaLabel={t("explore.anyWilaya")}
          anyCommuneLabel={t("need.location.anyCommune")}
          communeLabel=""
          wilayaOnly
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          {t("explore.count", { count: results.length })} ·{" "}
          {unplaced ? t("explore.orderAlpha") : t("explore.orderNear")}
        </p>
        <Link to={{ pathname: "/search", search }} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t("explore.detailed")}
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="surface mt-4 p-5">
          <p className="font-semibold text-foreground">{t("explore.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("explore.emptyBody")}</p>
        </div>
      ) : (
        <>
          <ul role="list" className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {near.map(card)}
          </ul>
          {farther.length > 0 && (
            <section aria-labelledby="explore-farther" className="mt-8">
              <h2 id="explore-farther" className="text-title font-semibold text-foreground">
                {t("explore.fartherTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("explore.fartherNote")}</p>
              <ul role="list" className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {farther.map(card)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
