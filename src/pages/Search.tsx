import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChipGroup } from "@/components/shared/Chip";
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
  usedHomeCommune,
  needPatchFromCriteria,
  normalizeCriteria,
  parseCriteria,
  partitionReasons,
  sizeLimitToState,
  type SearchCriteria,
  type SortOrder,
} from "@/data/criteria";
import { publicSitters } from "@/data/repository";
import { communeName, getWilaya } from "@/data/algeria";
import {
  CARE_UNIT_KEY,
  DOG_SIZES,
  SPECIES,
  localized,
  type CareType,
  type DogSize,
  type Species,
} from "@/data/types";
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
  const homeCommune = state.account?.communeId ?? null;
  const results = useMemo(
    () => matchSitters(pool, criteria, homeCommune, lng),
    [pool, criteria, homeCommune, lng],
  );
  /* The order is an option the owner picks, applied straight away: it filters
     nothing, so there is nothing to stage in the sheet. */
  const setSort = (sort: SortOrder) => apply({ ...criteria, sort }, { replace: true });
  /* A price order only means something in one unit, so it is offered only
     once a service is chosen (see `matchSitters`). */
  const canSortByPrice = criteria.care !== null;
  const priceOrder = criteria.sort === "price" && canSortByPrice;
  /* The size hint is only true when at least one listed sitter actually
     restricts sizes. */
  const someSizeLimit = results.some((r) => sizeLimitToState(r.sitter, criteria) !== null);
  /* Narrowed to a value rather than asserted at the call site: the invariant
     that makes `homeCommune!` safe lives in another module. Null when the
     tie-break did not actually change anything. */
  const near = useMemo(
    () => (usedHomeCommune(results, criteria, homeCommune) ? homeCommune : null),
    [results, criteria, homeCommune],
  );
  /* Every criteria-derived reason is true of every survivor by construction,
     so repeating it on each row is three lines of noise per entry that
     discriminates nothing. Shared reasons are stated once, above. */
  const { universal, perResult } = useMemo(() => partitionReasons(results), [results]);
  const reasonLabel = useReasonLabel();
  const activeFilters = activeCriteriaCount(criteria);
  const hasCriteria = activeFilters > 0;

  /* "Grands chiens" says both facts at once; "Chien" alone when the size was
     not given. */
  function speciesValue(species: Species | null, size: DogSize | null): string {
    if (!species) return t("search.brief.anySpecies");
    if (species === "dog" && size) return t(`dogSize.${size}`);
    return t(`species.${species}`);
  }

  const zoneText = criteria.commune
    ? zoneLabel(criteria.commune)
    : criteria.wilaya
      ? localized(getWilaya(criteria.wilaya)?.name ?? { en: "", fr: "", ar: "" }, lng)
      : null;

  /* The owner's brief. Rendered as a definition list in the desktop rail and
     condensed into one line in the mobile bar — same data, one source. It is
     not chrome: it is the question every row on the page is answering. */
  const brief = [
    {
      key: "species",
      label: t("search.brief.species"),
      value: speciesValue(criteria.species, criteria.size),
      brand: true,
    },
    {
      key: "care",
      label: t("search.brief.care"),
      value: criteria.care ? careLabel(criteria.care) : t("search.brief.anyCare"),
    },
    {
      key: "dates",
      label: t("search.brief.dates"),
      value: criteria.dates ? formatDateRange(criteria.dates, lng) : t("search.brief.anyDates"),
    },
    { key: "zone", label: t("search.brief.zone"), value: zoneText ?? t("search.brief.anyZone") },
    {
      key: "budget",
      label: t("search.brief.budget"),
      value:
        criteria.maxPrice !== null ? budgetLabel(criteria.maxPrice, criteria.care) : t("search.filters.anyPrice"),
    },
  ];

  /* Only the criteria actually chosen, for the condensed mobile line. */
  const chosenParts = [
    ...(criteria.care ? [careLabel(criteria.care)] : []),
    ...(criteria.dates ? [formatDateRange(criteria.dates, lng)] : []),
    ...(zoneText ? [zoneText] : []),
    ...(criteria.maxPrice !== null ? [budgetLabel(criteria.maxPrice, criteria.care)] : []),
  ];

  const speciesText = criteria.species ? speciesValue(criteria.species, criteria.size) : null;

  /* The order, said as what it is. Never "best match": Nidz has no basis for
     that claim. */
  const orderText =
    priceOrder
      ? near
        ? t("search.results.orderPriceNear", { commune: zoneLabel(near) })
        : t("search.results.orderPrice")
      : near
        ? t("search.results.orderDefaultNear", { commune: zoneLabel(near) })
        : t("search.results.orderDefault");

  const clearAll = () => {
    /* Clears what FILTERS the list. The order is a preference about reading
       it, so it survives. */
    const cleared = { ...EMPTY_CRITERIA, sort: criteria.sort };
    setDraft(cleared);
    apply(cleared);
  };

  const editButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => openSheet(true)}
      aria-label={
        activeFilters > 0
          ? t("search.context.editLabelCount", { count: activeFilters })
          : t("search.context.editLabel")
      }
      className="shrink-0"
    >
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      {t("search.context.edit")}
      {activeFilters > 0 && (
        <span aria-hidden="true" className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
          {activeFilters}
        </span>
      )}
    </Button>
  );

  return (
    <div>
      <Helmet>
        <title>
          {t("common.appName")} — {t("nav.search")}
        </title>
        <meta name="description" content={t("search.demo.body")} />
      </Helmet>

      {/* Below xl the brief is a sticky bar; at xl it becomes the rail
          (§15 endorses the sidebar <-> drawer transformation). Exactly one is
          displayed at any width, so only one is in the accessibility tree and
          there is never a duplicate control. */}
      <div className="sticky top-16 z-30 border-b border-border bg-background shadow-chrome-b xl:hidden">
        <div className="container flex h-14 items-center gap-3">
          <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
            {/* The species leads the line because it is the first thing every
                row answers to. It was terracotta here and plain everywhere else
                the same fact appears — a private convention for one screen. */}
            {/* Never wraps: "Grands chiens" broke onto two lines in the 56px
                bar (Audit 1.3 QA). The rest of the line truncates instead. */}
            {speciesText && <bdi className="shrink-0 whitespace-nowrap font-medium text-foreground">{speciesText}</bdi>}
            {/* Each part is isolated: a commune name may be Latin text inside
                an Arabic sentence, and the separators are neutral. */}
            <span className="truncate text-muted-foreground">
              {!speciesText && chosenParts.length === 0
                ? t("search.context.noCriteria")
                : chosenParts.map((part, i) => (
                    <span key={`${i}-${part}`}>
                      {(i > 0 || speciesText) && <span aria-hidden="true"> · </span>}
                      <bdi>{part}</bdi>
                    </span>
                  ))}
            </span>
          </p>
          {editButton}
        </div>
      </div>

      {/* Reserve both sticky layers, so a keyboard-focused card is never
          scrolled underneath them (WCAG 2.2 AA — 2.4.11). */}
      <section className="container scroll-pt-[7.5rem] py-10 md:py-14">
        {/* Asymmetric at xl: a brief rail against a register column, both hung
            off one leading axis. Symmetric margins on a 1440 canvas are what
            made the previous grid read as unfinished. */}
        <div className="mx-auto max-w-[1120px] xl:grid xl:grid-cols-[264px_minmax(0,1fr)] xl:items-start">
          <div className="min-w-0 xl:col-start-2 xl:row-start-1 xl:border-s xl:border-border xl:ps-12">
            {/* The count below carries aria-live, so a criteria change is
                announced without moving focus — moving it would drag a
                keyboard user out of the sheet they just applied. */}
            <h1 className="max-w-[24ch] text-h1 font-semibold text-foreground md:text-h1-lg">
              {hasCriteria ? t("search.results.title") : t("search.results.titleAll")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
              {t("search.results.countLabel", { count: results.length })}
              {/* No ordering claim when there is nothing to order. ONE claim,
                  naming the tier that actually dominates first. */}
              {results.length > 1 && ` · ${orderText}`}
            </p>

            {/* The order is the owner's choice, not a verdict. Two options, both
                statable in one sentence; price is never the silent default. */}
            {results.length > 1 && canSortByPrice && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
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

            {/* A dog search without a size cannot rule anyone out on size —
                an absent answer is not a match. Said once, here, and each row
                states the sitter's own limit. */}
            {criteria.species === "dog" && !criteria.size && someSizeLimit && (
              <p className="mt-3 max-w-[70ch] text-sm text-foreground">
                {t("search.results.sizeHint")}{" "}
                <button
                  type="button"
                  onClick={() => openSheet(true)}
                  /* 44px target, but `-my-3` keeps its margin box at the text's
                     line height so the paragraph's last line does not drop. */
                  className="-my-3 inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("search.results.sizeHintAction")}
                </button>
              </p>
            )}

            {/* What every result has in common, said once. Repeating it as
                tokens on each row would be four identical chips per entry that
                discriminate nothing (§5.2) and wrap to three lines at 390px —
                the badge mosaic §19 forbids by name. */}
            {universal.length > 0 && (
              <p className="mt-3 max-w-[70ch] text-sm text-foreground">
                {/* Labels are used verbatim: lowercasing them would damage
                    proper nouns, and a commune name is one of the things this
                    sentence can contain. */}
                {t("search.results.allOfThem")}{" "}
                {universal.map((reason, i) => (
                  <span key={i}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    {/* Each fact is isolated: a commune name is Latin text
                        inside an Arabic sentence. */}
                    <bdi>{reasonLabel(reason)}</bdi>
                  </span>
                ))}
              </p>
            )}

            {/* Scoped to the fixtures. Once the visitor publishes their own
                profile it appears in this list, and a blanket "these profiles
                are fictional" would be calling their real profile invented. */}
            {results.some((r) => r.sitter.isDemoFixture) ? (
              <DemoNotice className="my-6 md:my-8" title={t("search.demo.title")} body={t("search.demo.body")} />
            ) : (
              <div className="my-6 md:my-8" />
            )}

            {results.length === 0 ? (
              <EmptyState
                title={t("search.results.emptyTitle")}
                body={t("search.results.emptyBody")}
                /* Editing comes first — a cat owner should not be shown dog
                   sitters — and clearing every criterion is offered beside it,
                   as the honest way to see the whole (example) directory. */
                action={
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button type="button" variant="outline" onClick={() => openSheet(true)}>
                      {t("search.context.editLabel")}
                    </Button>
                    {hasCriteria && (
                      <Button type="button" variant="link" className="text-muted-foreground" onClick={clearAll}>
                        {t("search.filters.clear")}
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              /* A register, not a grid of tiles: entries separated by hairlines
                 on the page ground. §16 ranks space > surface > border > shadow,
                 and a bordered elevated card used all four at once for a
                 low-importance element. */
              <ul role="list">
                {results.map(({ sitter, rate }) => (
                  <SitterCard
                    key={sitter.id}
                    sitter={sitter}
                    rate={rate}
                    reasons={perResult.get(sitter.id) ?? []}
                    askedSpecies={criteria.species}
                    askedSize={criteria.size}
                    askedCare={criteria.care}
                    search={paramKey}
                    /* Redundant once the species is a criterion: it is then
                       true of every row and the line above has said so. */
                    showSpeciesEyebrow={criteria.species === null}
                  />
                ))}
              </ul>
            )}
          </div>
          {/* Rendered AFTER the register in the DOM and pulled back into the
              first grid column, so the page's <h1> precedes the rail's <h2>
              (§25 — logical DOM order). The rule lives on the register's
              leading edge, not the rail's trailing edge: the rail is sticky
              and short, so a rule on it would stop a third of the way down. */}
          <aside className="hidden xl:col-start-1 xl:row-start-1 xl:sticky xl:top-24 xl:block xl:pe-12">
            <h2 className="eyebrow mb-4">{t("search.brief.title")}</h2>
            <dl className="space-y-4">
              {brief.map((row) => (
                <div key={row.key}>
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className={cn("mt-0.5 text-base text-foreground", row.brand && "font-medium")}>
                    <bdi>{row.value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">{editButton}</div>
          </aside>
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
          className="flex max-h-[85vh] flex-col gap-0 rounded-t-lg p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-start md:px-6">
            <div className="mx-auto w-full max-w-[720px]">
              <SheetTitle>{t("search.context.editLabel")}</SheetTitle>
              <SheetDescription className="sr-only">{t("search.filters.description")}</SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <div className="mx-auto max-w-[720px] space-y-8">
              <fieldset>
                <legend id="f-species" className="mb-3 text-sm font-medium text-foreground">
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
                    setDraft({
                      ...draft,
                      species: v === ANY ? null : (v as Species),
                      size: v === "dog" ? draft.size : null,
                    })
                  }
                  options={[
                    { value: ANY, label: t("search.brief.anySpecies") },
                    ...SPECIES.map((sp) => ({ value: sp, label: t(`species.${sp}`), icon: SPECIES_ICON[sp] })),
                  ]}
                />
              </fieldset>

              {draft.species === "dog" && (
                <fieldset>
                  <legend id="f-size" className="mb-3 text-sm font-medium text-foreground">
                    {t("search.filters.size")}
                  </legend>
                  <ChipGroup
                    labelledBy="f-size"
                    value={draft.size ?? ANY}
                    onChange={(v) => setDraft({ ...draft, size: v === ANY ? null : (v as DogSize) })}
                    options={[
                      { value: ANY, label: t("search.filters.anySize") },
                      ...DOG_SIZES.map((size) => ({ value: size, label: t(`dogSize.${size}`) })),
                    ]}
                  />
                </fieldset>
              )}

              <fieldset>
                <legend id="f-care" className="mb-3 text-sm font-medium text-foreground">
                  {t("need.care.careLabel")}
                </legend>
                <ChipGroup
                  labelledBy="f-care"
                  value={draft.care ?? ANY}
                  onChange={(v) => setDraft({ ...draft, care: v === ANY ? null : (v as CareType) })}
                  options={[
                    { value: ANY, label: t("search.brief.anyCare") },
                    { value: "boarding", label: t("care.boarding") },
                    { value: "atOwner", label: t("care.atOwner") },
                    { value: "walk", label: t("care.walk") },
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
                    variant="link"
                    className="mt-2 h-auto p-0 text-muted-foreground"
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

          <div className="shrink-0 border-t border-border px-4 py-4 md:px-6">
            <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3">
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
                variant="link"
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
