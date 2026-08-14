import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Cat, Dog, SlidersHorizontal } from "lucide-react";

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
  type SearchCriteria,
} from "@/data/criteria";
import { DEMO_SITTERS } from "@/data/demo-sitters";
import { communeName, getWilaya } from "@/data/algeria";
import { localized, type CareType, type Species } from "@/data/types";
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
  const zoneLabel = (code: string) => communeName(code, lng) ?? code;

  /** The URL is canonical for results; the brief is mirrored back into demo
      state so the request summary later quotes what the owner actually last
      asked for, not a stale earlier answer. */
  const apply = (raw: SearchCriteria) => {
    /* Normalised on the way out, so the sheet cannot commit a combination the
       need flow would have refused — a walk carrying a six-day range, for
       instance, whose end date the user can no longer see or clear. */
    const next = normalizeCriteria(raw);
    setSearchParams(criteriaToParams(next));
    dispatch({ type: "setNeed", patch: needPatchFromCriteria(next) });
  };

  /* The fixtures plus the visitor's own profile, once they have published it.
     Without this, "votre profil est publié" would be a claim the search does
     not honour — and the two-sided loop would have no second side. */
  const published = state.sitter?.published ? state.sitter.profile : null;
  const pool = useMemo(
    () => (published ? [...DEMO_SITTERS, published] : DEMO_SITTERS),
    [published],
  );
  const results = useMemo(() => matchSitters(pool, criteria), [pool, criteria]);
  /* Every criteria-derived reason is true of every survivor by construction,
     so repeating it on each row is three lines of noise per entry that
     discriminates nothing. Shared reasons are stated once, above. */
  const { universal, perResult } = useMemo(() => partitionReasons(results), [results]);
  const reasonLabel = useReasonLabel();
  const activeFilters = activeCriteriaCount(criteria);
  const hasCriteria = activeFilters > 0;

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
      value: criteria.species ? t(`species.${criteria.species}`) : t("search.brief.anySpecies"),
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
        criteria.maxPrice !== null
          ? t("search.filters.upTo", { price: formatDZD(criteria.maxPrice, lng) })
          : t("search.filters.anyPrice"),
    },
  ];

  /* Only the criteria actually chosen, for the condensed mobile line. */
  const chosenParts = [
    ...(criteria.care ? [careLabel(criteria.care)] : []),
    ...(criteria.dates ? [formatDateRange(criteria.dates, lng)] : []),
    ...(zoneText ? [zoneText] : []),
    ...(criteria.maxPrice !== null
      ? [t("search.filters.upTo", { price: formatDZD(criteria.maxPrice, lng) })]
      : []),
  ];

  const speciesText = criteria.species ? t(`species.${criteria.species}`) : null;

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
            {speciesText && <bdi className="font-medium text-foreground">{speciesText}</bdi>}
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
              {/* No ordering claim when there is nothing to order. */}
              {results.length > 0 && ` · ${t("search.results.sortedByPrice")}`}
            </p>

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
                /* Opens the editor rather than wiping every criterion — a cat
                   owner should not be shown dog sitters. */
                action={
                  <Button type="button" variant="outline" onClick={() => openSheet(true)}>
                    {t("search.context.editLabel")}
                  </Button>
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
                <ChipGroup
                  labelledBy="f-species"
                  value={draft.species ?? ANY}
                  onChange={(v) => setDraft({ ...draft, species: v === ANY ? null : (v as Species) })}
                  options={[
                    { value: ANY, label: t("search.brief.anySpecies") },
                    { value: "dog", label: t("species.dog"), icon: Dog },
                    { value: "cat", label: t("species.cat"), icon: Cat },
                  ]}
                />
              </fieldset>

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
                    label: t("search.filters.upTo", { price: formatDZD(p, lng) }),
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
                  setDraft(EMPTY_CRITERIA);
                  apply(EMPTY_CRITERIA);
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
