import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChipGroup } from "@/components/shared/Chip";
import BackButton from "@/components/shared/BackButton";
import NativeSelect from "@/components/shared/NativeSelect";
import BriefCapsule from "@/components/search/BriefCapsule";
import SitterCard from "@/components/sitter/SitterCard";
import { useReasonLabel } from "@/components/sitter/use-reason-label";
import EmptyState from "@/components/shared/EmptyState";
import { SPECIES_ICON } from "@/components/shared/species";
import { DateRangeField, LocationFields, SelectField } from "@/components/shared/fields";
import { DemoNotice } from "@/components/shared/trust";
import {
  EMPTY_CRITERIA,
  PRICE_STEPS,
  activeCriteriaCount,
  criteriaToParams,
  matchSitters,
  needPatchFromCriteria,
  normalizeCriteria,
  parseCriteria,
  partitionReasons,
  splitByDistance,
  type SearchCriteria,
  type SortOrder,
} from "@/data/criteria";
import { publicSitters } from "@/data/repository";
import { communeName, getWilaya } from "@/data/algeria";
import {
  CARE_TYPES,
  CARE_UNIT_KEY,
  SPECIES,
  localized,
  type CareType,
  type PetCategory,
} from "@/data/types";
import { classificationOf, servicesFor } from "@/data/animal-catalogue";
import { getKind, kindsOf } from "@/data/animal-kinds";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";
import { formatDZD } from "@/utils/format";
import { formatDateRange } from "@/utils/dates";

/* Sitters, communes, matching and the URL contract all live in src/data — this
   screen holds no data and no matching rules of its own. See
   src/data/demo-sitters.ts for why there is no rating, review, availability
   guarantee or verification anywhere in it.

   There is no need-definition form here any more. Defining a need is the flow
   at /owner/need/*; this screen shows results and lets them be adjusted. Two
   differently-shaped forms for one job was a duplicate that could disagree
   with itself (§5.2). */

const ANY = "any";

export default function Search() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state, dispatch } = useDemo();

  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = searchParams.toString();

  const criteria = useMemo(() => parseCriteria(new URLSearchParams(paramKey)), [paramKey]);
  const [draft, setDraft] = useState<SearchCriteria>(criteria);
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /* Arriving from the capsule on a profile ("Modifier") opens the brief
     editor straight away. The flag is consumed so Back/refresh do not
     reopen it. */
  useEffect(() => {
    if ((location.state as { editBrief?: boolean } | null)?.editBrief) {
      setSheetOpen(true);
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }
  }, [location, navigate]);

  /* Keep the editable copy in step with the URL — including when the change
     came from the Back button rather than from a control on this page. */
  useEffect(() => {
    setDraft(parseCriteria(new URLSearchParams(paramKey)));
  }, [paramKey]);

  /* Dismissing the sheet without applying must discard the edit, not keep it
     staged: reopening to find "Chat" selected while the results are still dogs
     is the sheet disagreeing with the page behind it. */
  const openSheet = (open: boolean) => {
    if (open) setDraft(criteria);
    setSheetOpen(open);
  };

  const careLabel = (c: CareType) => t(`care.${c}`);
  /* A budget is a price per unit of the service, so it is never shown without
     the unit (Audit 1.3 LOT 03). With no service chosen the unit is "per
     service", which is what the filter actually compares. */
  const budgetLabel = (price: number, care: CareType | null) =>
    t("search.filters.upToUnit", {
      price: formatDZD(price, lng),
      unit: care ? t(CARE_UNIT_KEY[care]) : t("search.filters.perService"),
    });
  const zoneLabel = (code: string) => communeName(code, lng) ?? code;

  /** The URL is canonical for results; the brief is mirrored back into demo
      state so the request summary later quotes what the owner actually last
      asked for, not a stale earlier answer. */
  const apply = (raw: SearchCriteria, options?: { replace?: boolean }) => {
    /* Normalised on the way out, so the sheet cannot commit a combination the
       need flow would have refused — a walk carrying a six-day range, for
       instance, whose end date the user can no longer see or clear. */
    const next = normalizeCriteria(raw);
    /* The order is a reading preference, not a place: it replaces the entry,
       so Back leaves the page instead of toggling the order. */
    setSearchParams(criteriaToParams(next), options);
    dispatch({ type: "setNeed", patch: needPatchFromCriteria(next) });
  };

  /* The fixtures plus the visitor's own profile while it is published and
     publishable — the rule lives in the repository (`publicSitters`), the one
     place a server query will replace. */
  const pool = useMemo(() => publicSitters(state), [state]);
  /* The owner's own commune breaks ties, so a wilaya-wide search puts the
     people nearest them first. It never filters: someone arranging care in a
     commune they are travelling to is a normal case. */
  const homeWilaya = state.account?.wilayaId ?? null;
  const homeCommune = state.account?.communeId ?? null;
  const results = useMemo(
    () => matchSitters(pool, criteria, homeWilaya || homeCommune ? { wilayaCode: homeWilaya, communeCode: homeCommune } : null, lng),
    [pool, criteria, homeWilaya, homeCommune, lng],
  );
  const groups = useMemo(() => splitByDistance(results), [results]);
  /* The order is an option the owner picks, applied straight away: it filters
     nothing, so there is nothing to stage in the sheet. */
  const setSort = (sort: SortOrder) => apply({ ...criteria, sort }, { replace: true });
  /* A price order only means something in one unit, so it is offered only
     once a service is chosen (see `matchSitters`). */
  const canSortByPrice = criteria.care !== null;
  const priceOrder = criteria.sort === "price" && canSortByPrice;
  /* Some results are « à confirmer » because the breed was not given and
     the sitter takes only some breeds (Nidz 1.7): said once, with the way
     to say the breed. */
  const someUnknown = results.some((r) => r.compat.level === "unknown" && r.compat.reason === "kindNotGiven");
  /* What the order was measured from, so the sentence above the list is true. */
  const orderFrom = criteria.commune || criteria.wilaya ? "zone" : homeWilaya || homeCommune ? "home" : null;
  /* Every criteria-derived reason is true of every survivor by construction,
     so repeating it on each row is three lines of noise per entry that
     discriminates nothing. Shared reasons are stated once, above. */
  const { universal, perResult } = useMemo(() => partitionReasons(results), [results]);
  const reasonLabel = useReasonLabel();
  const activeFilters = activeCriteriaCount(criteria);
  const hasCriteria = activeFilters > 0;

  /* « Sloughi » says both facts at once; « Chien » alone when the breed was
     not given. */
  function speciesValue(species: PetCategory | null, kindId: string | null): string {
    if (!species) return t("search.brief.anySpecies");
    if (species === "other") return t("catalogue.other");
    const kind = getKind(kindId, species);
    return kind ? kind.name[lng] : t(`species.${species}`);
  }

  const zoneText = criteria.commune
    ? zoneLabel(criteria.commune)
    : criteria.wilaya
      ? localized(getWilaya(criteria.wilaya)?.name ?? { en: "", fr: "", ar: "" }, lng)
      : null;

  /* Only the criteria actually chosen, for the condensed mobile line. */
  const chosenParts = [
    ...(criteria.care ? [careLabel(criteria.care)] : []),
    ...(criteria.dates ? [formatDateRange(criteria.dates, lng)] : []),
    ...(zoneText ? [zoneText] : []),
    ...(criteria.maxPrice !== null ? [budgetLabel(criteria.maxPrice, criteria.care)] : []),
  ];

  const speciesText = criteria.species ? speciesValue(criteria.species, criteria.kind) : null;

  /* The order, said as what it is. Never "best match": Nidz has no basis for
     that claim. */
  const orderText = priceOrder
    ? orderFrom
      ? t("search.results.orderPriceNearest")
      : t("search.results.orderPrice")
    : orderFrom === "zone"
      ? t("search.results.orderNearZone")
      : orderFrom === "home"
        ? t("search.results.orderNearHome")
        : t("search.results.orderDefault");

  const clearAll = () => {
    /* Clears what FILTERS the list. The order is a preference about reading
       it, so it survives. */
    const cleared = { ...EMPTY_CRITERIA, sort: criteria.sort };
    setDraft(cleared);
    apply(cleared);
  };

  return (
    <div>
      <Helmet>
        <title>
          {t("common.appName")} — {t("nav.search")}
        </title>
        <meta name="description" content={t("search.demo.body")} />
      </Helmet>

      {/* Results are a screen under Accueil since 1.6 (no Search tab):
          Back returns to the step or the home it came from, and to Accueil
          from a shared link. */}
      <BackButton fallback="/" />

      {/* THE BRIEF CAPSULE (1.4 signature): the owner's question, floating
          above every answer at every width — the animal, what is asked, and
          the way to change it, in one control. */}
      <div className="sticky top-14 z-30 md:top-[4.5rem]">
        <div className="container py-2">
          <BriefCapsule
            className="mx-auto max-w-[720px]"
            species={criteria.species}
            title={speciesText ?? t("search.brief.anySpecies")}
            parts={chosenParts}
            emptyText={t("search.context.refine")}
            actionText={t("search.context.edit")}
            actionLabel={
              activeFilters > 0
                ? t("search.context.editLabelCount", { count: activeFilters })
                : t("search.context.editLabel")
            }
            count={activeFilters}
            onClick={() => openSheet(true)}
          />
        </div>
      </div>

      {/* Reserve both sticky layers, so a keyboard-focused card is never
          scrolled underneath them (WCAG 2.2 AA — 2.4.11). */}
      <section className="container scroll-pt-[8.5rem] pb-10 pt-4 md:pb-16 md:pt-8">
        <div className="mx-auto max-w-[1120px]">
          {/* The count below carries aria-live, so a criteria change is
              announced without moving focus — moving it would drag a keyboard
              user out of the sheet they just applied. */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-[24ch] text-h1 font-semibold text-foreground md:text-h1-lg">
                {hasCriteria ? t("search.results.title") : t("search.results.titleAll")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                {t("search.results.countLabel", { count: results.length })}
                {/* No ordering claim when there is nothing to order. ONE
                    claim, naming the tier that actually dominates first. */}
                {results.length > 1 && ` · ${orderText}`}
              </p>
            </div>

            {/* The order is the owner's choice, not a verdict. Price is never
                the silent default. */}
            {results.length > 1 && canSortByPrice && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span id="search-sort" className="text-sm text-muted-foreground">
                  {t("search.sort.label")}
                </span>
                <ChipGroup
                  labelledBy="search-sort"
                  value={criteria.sort}
                  onChange={(v) => setSort(v === "price" ? "price" : "default")}
                  options={[
                    { value: "default", label: t("search.sort.default") },
                    { value: "price", label: t("search.sort.price") },
                  ]}
                />
              </div>
            )}
          </div>

          {/* A dog search without a size cannot rule anyone out on size — an
              absent answer is not a match. Said once, here; each card states
              the sitter's own limit. The action is underlined: it sits inside
              a sentence, where teal alone is under 3:1 against the text. */}
          {criteria.species && !criteria.kind && someUnknown && (
            <p className="mt-4 max-w-[70ch] text-sm text-foreground">
              {t("search.results.kindHint")}{" "}
              <button
                type="button"
                onClick={() => openSheet(true)}
                className="-my-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(`search.results.kindHintAction.${classificationOf(criteria.species) ?? "breed"}`)}
              </button>
            </p>
          )}

          {/* What every result has in common, said once — repeating it on each
              card would be identical chips that discriminate nothing (§5.2). */}
          {universal.length > 0 && (
            <p className="mt-3 flex max-w-[70ch] flex-wrap items-center gap-1.5 text-sm text-foreground">
              <span>{t("search.results.allOfThem")}</span>
              {universal.map((reason, i) => (
                /* Each fact isolated: a commune name is Latin text inside an
                   Arabic sentence. Labels verbatim: lowercasing would damage
                   proper nouns. */
                <bdi key={i} className="rounded-full bg-card px-2.5 py-1 text-[0.8125rem] font-medium shadow-pill">
                  {reasonLabel(reason)}
                </bdi>
              ))}
            </p>
          )}

          {/* Scoped to the fixtures. Once the visitor publishes their own
              profile it appears in this list, and a blanket "these profiles
              are fictional" would call their real profile invented. */}
          {results.some((r) => r.sitter.isDemoFixture) && (
            <DemoNotice className="mt-6" title={t("search.demo.title")} body={t("search.demo.body")} />
          )}

          <div className="mt-6">
            {results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={t("search.results.emptyTitle")}
                body={t("search.results.emptyBody")}
                /* Editing comes first — a cat owner should not be shown dog
                   sitters — and clearing every criterion beside it, as the
                   honest way to see the whole (example) directory. */
                action={
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <Button type="button" onClick={() => openSheet(true)}>
                      {t("search.context.editLabel")}
                    </Button>
                    {hasCriteria && (
                      <Button type="button" variant="ghost" className="text-muted-foreground" onClick={clearAll}>
                        {t("search.filters.clear")}
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              /* One card per sitter, two across from md. */
              <>
                <ul role="list" className="grid gap-3 md:gap-4">
                  {groups.near.map(({ sitter, rate, compat }) => (
                    <SitterCard
                      key={sitter.id}
                      sitter={sitter}
                      rate={rate}
                      reasons={perResult.get(sitter.id) ?? []}
                      askedSpecies={criteria.species}
                      compat={compat}
                      askedCare={criteria.care}
                      search={paramKey}
                      /* Redundant once the species is a criterion: it is then
                         true of every result and the capsule says so. */
                      showSpeciesEyebrow={criteria.species === null}
                    />
                  ))}
                </ul>
                {groups.near.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("search.results.noneNear")}</p>
                )}
                {/* Nidz 1.7 §11: the zone ORDERS, it does not hide. Other
                    wilayas follow, nearest first — an estimate between
                    chefs-lieux, never a distance. */}
                {groups.farther.length > 0 && (
                  <section aria-labelledby="search-farther" className="mt-8">
                    <h2 id="search-farther" className="text-title font-semibold text-foreground">
                      {t("explore.fartherTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("explore.fartherNote")}</p>
                    <ul role="list" className="mt-3 grid gap-3 md:gap-4">
                      {groups.farther.map(({ sitter, rate, compat }) => (
                        <SitterCard
                          key={sitter.id}
                          sitter={sitter}
                          rate={rate}
                          reasons={perResult.get(sitter.id) ?? []}
                          askedSpecies={criteria.species}
                          compat={compat}
                          askedCare={criteria.care}
                          search={paramKey}
                          showSpeciesEyebrow={criteria.species === null}
                        />
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* One sheet edits the whole search, so "Modifier" and the filters are
          the same surface: one code path, one mental model. Flex column rather
          than a sticky footer, which would overlay the last field while
          scrolling. */}
      <Sheet open={sheetOpen} onOpenChange={openSheet}>
        <SheetContent
          side="bottom"
          closeLabel={t("search.filters.close")}
          className="flex max-h-[88vh] flex-col gap-0 p-0"
        >
          {/* The grabber says "this is a sheet" at a glance; the close button
              and Escape do the closing. */}
          <span aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-track/70" />
          <SheetHeader className="shrink-0 px-4 pb-3 pt-3 text-start md:px-6">
            <div className="mx-auto w-full max-w-[720px]">
              <SheetTitle>{t("search.context.editLabel")}</SheetTitle>
              <SheetDescription className="sr-only">{t("search.filters.description")}</SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <div className="mx-auto max-w-[720px] space-y-8">
              <fieldset>
                <legend id="f-species" className="mb-3 text-[0.9375rem] font-medium text-foreground">
                  {t("need.pet.speciesLabel")}
                </legend>
                {/* Named by the visible legend rather than a duplicate
                    aria-label, so the group is announced once. */}
                {/* All three species. The bird was missing here, so the sheet
                    could not express a search the need flow could. */}
                <ChipGroup
                  labelledBy="f-species"
                  value={draft.species ?? ANY}
                  onChange={(v) =>
                    setDraft(
                      normalizeCriteria({
                        ...draft,
                        species: v === ANY ? null : (v as PetCategory),
                        kind: null,
                      }),
                    )
                  }
                  options={[
                    { value: ANY, label: t("search.brief.anySpecies") },
                    ...SPECIES.map((sp) => ({ value: sp, label: t(`species.${sp}`), icon: SPECIES_ICON[sp] })),
                  ]}
                />
              </fieldset>

              {draft.species && draft.species !== "other" && classificationOf(draft.species) && (
                <div>
                  <label htmlFor="f-kind" className="mb-3 block text-[0.9375rem] font-medium text-foreground">
                    {t(`catalogue.label.${classificationOf(draft.species)}`)}
                  </label>
                  <NativeSelect
                    id="f-kind"
                    value={draft.kind ?? ""}
                    onChange={(e) => setDraft({ ...draft, kind: e.target.value || null })}
                  >
                    <option value="">{t(`search.filters.anyKind.${classificationOf(draft.species)}`)}</option>
                    {kindsOf(draft.species).map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name[lng]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}

              <fieldset>
                <legend id="f-care" className="mb-3 text-[0.9375rem] font-medium text-foreground">
                  {t("need.care.careLabel")}
                </legend>
                <ChipGroup
                  labelledBy="f-care"
                  value={draft.care ?? ANY}
                  onChange={(v) => setDraft({ ...draft, care: v === ANY ? null : (v as CareType) })}
                  options={[
                    { value: ANY, label: t("search.brief.anyCare") },
                    ...CARE_TYPES.filter((c) => servicesFor(draft.species).includes(c)).map((c) => ({ value: c, label: t(`care.${c}`) })),
                  ]}
                />
              </fieldset>

              <LocationFields
                locale={lng}
                wilayaCode={draft.wilaya}
                communeCode={draft.commune}
                onChange={(next) => setDraft({ ...draft, wilaya: next.wilayaCode, commune: next.communeCode })}
                wilayaLabel={t("need.location.wilayaLabel")}
                communeLabel={t("need.location.communeLabel")}
                anyWilayaLabel={t("search.brief.anyZone")}
                anyCommuneLabel={t("need.location.anyCommune")}
              />

              <div>
                <DateRangeField
                  singleDay={draft.care === "walk"}
                  value={draft.dates}
                  onChange={(dates) => setDraft({ ...draft, dates })}
                  singleLabel={t("need.care.dateLabel")}
                  startLabel={t("need.care.startLabel")}
                  endLabel={t("need.care.endLabel")}
                  help={t("search.filters.datesHelp")}
                />
                {draft.dates && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ms-3 mt-2 h-11 text-muted-foreground"
                    onClick={() => setDraft({ ...draft, dates: null })}
                  >
                    {t("search.filters.clearDates")}
                  </Button>
                )}
              </div>

              <SelectField
                label={t("search.filters.maxPrice")}
                value={draft.maxPrice === null ? ANY : String(draft.maxPrice)}
                onChange={(v) => setDraft({ ...draft, maxPrice: v === ANY ? null : Number(v) })}
                options={[
                  { value: ANY, label: t("search.filters.anyPrice") },
                  ...PRICE_STEPS.map((p) => ({
                    value: String(p),
                    label: budgetLabel(p, draft.care),
                  })),
                ]}
              />
            </div>
          </div>

          <div className="shrink-0 px-4 py-3 shadow-chrome-t md:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto flex max-w-[720px] flex-col items-center gap-1">
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => {
                  apply(draft);
                  setSheetOpen(false);
                }}
              >
                {t("search.filters.apply")}
              </Button>
              {/* Applies immediately, so the label describes a real result
                  rather than silently resetting a form the user cannot see. */}
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  clearAll();
                  setSheetOpen(false);
                }}
              >
                {t("search.filters.clear")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
