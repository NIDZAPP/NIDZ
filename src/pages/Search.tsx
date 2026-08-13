import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Cat, Check, Dog, MapPin, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChipGroup } from "@/components/shared/Chip";
import EmptyState from "@/components/shared/EmptyState";
import { DateRangeField, LocationFields, SelectField } from "@/components/shared/fields";
import { DemoNotice, ProvenanceLabel } from "@/components/shared/trust";
import {
  EMPTY_CRITERIA,
  PRICE_STEPS,
  activeCriteriaCount,
  criteriaToParams,
  matchSitters,
  needPatchFromCriteria,
  normalizeCriteria,
  parseCriteria,
  type MatchReason,
  type SearchCriteria,
} from "@/data/criteria";
import { DEMO_SITTERS, offeredServices } from "@/data/demo-sitters";
import { communeName, getWilaya } from "@/data/locations";
import { CARE_UNIT_KEY, localized, type CareType, type Species } from "@/data/types";
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
  const { dispatch } = useDemo();

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

  const results = useMemo(() => matchSitters(DEMO_SITTERS, criteria), [criteria]);
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

  /** Concrete compatibility, never a score (§8.2, §8.3). Each reason names a
      hard constraint that was actually checked against the sitter's own data.
      Exhaustive by construction: adding a `MatchReason` kind without a label
      is a type error rather than a silent empty token. */
  const reasonLabel = (reason: MatchReason): string => {
    switch (reason.kind) {
      case "species":
        return t(`accepts.${reason.species}`);
      case "care":
        return careLabel(reason.care);
      case "zone":
        return zoneLabel(reason.zone);
      case "dates":
        return t("search.reason.dates");
      case "noCat":
        return t("search.reason.noCat");
    }
  };

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
      <div className="sticky top-16 z-30 border-b border-border bg-background xl:hidden">
        <div className="container flex h-14 items-center gap-3">
          <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
            {/* Terracotta names the animal, and nothing else on this page. The
                species is never carried by colour alone — it is the first value
                in the line and is labelled in the rail. */}
            {speciesText && <bdi className="font-medium text-brand">{speciesText}</bdi>}
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
      <section className="container scroll-pt-[7.5rem] py-8 md:py-12">
        {/* Asymmetric at xl: a brief rail against a register column, both hung
            off one leading axis. Symmetric margins on a 1440 canvas are what
            made the previous grid read as unfinished. */}
        <div className="mx-auto max-w-[1120px] xl:grid xl:grid-cols-[264px_minmax(0,1fr)] xl:items-start">
          {/* The rule lives on the register's leading edge, not the rail's
              trailing edge: the rail is sticky and short, so a rule on it would
              stop a third of the way down the page. */}
          <aside className="hidden xl:sticky xl:top-24 xl:block xl:pe-12">
            <h2 className="eyebrow mb-4">{t("search.brief.title")}</h2>
            <dl className="space-y-4">
              {brief.map((row) => (
                <div key={row.key}>
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className={cn("mt-0.5 text-base", row.brand ? "font-medium text-brand" : "text-foreground")}>
                    <bdi>{row.value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">{editButton}</div>
          </aside>

          <div className="min-w-0 xl:border-s xl:border-border xl:ps-12">
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

            <DemoNotice className="my-6 md:my-8" title={t("search.demo.title")} body={t("search.demo.body")} />

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
                {results.map(({ sitter: s, rate, reasons }) => {
                  const rest = [
                    ...s.acceptedSpecies
                      .filter((sp) => sp !== criteria.species)
                      .map((sp) => t(`accepts.${sp}`)),
                    ...offeredServices(s)
                      .filter((c) => c !== criteria.care)
                      .map(careLabel),
                  ];

                  return (
                    <li key={s.id} className="border-b border-border">
                      <article
                        className={cn(
                          "relative grid rounded-md px-3 py-6 transition-colors md:py-8",
                          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                          /* Gated so the wash does not stick after a tap. */
                          "[@media(hover:hover)]:hover:bg-muted",
                          /* Mobile: identity beside the entry, price on a
                             second row. Desktop: adds the price axis as a
                             third column. */
                          "grid-cols-[40px_minmax(0,1fr)] gap-x-3",
                          "md:grid-cols-[48px_minmax(0,1fr)_190px] md:gap-x-6",
                        )}
                      >
                        {/* A monogram, not a stock portrait: §21 and §40 both
                            forbid presenting stock photography as a real
                            person's profile. */}
                        <span
                          aria-hidden="true"
                          className="flex size-10 items-center justify-center rounded-sm bg-secondary text-base font-semibold text-foreground md:size-12 md:text-name"
                        >
                          {s.publicName.charAt(0)}
                        </span>

                        <div className="min-w-0">
                          {/* Species as a filing system: scanning the column
                              shows the page is organised around animals before
                              it is organised around people. */}
                          <p className="eyebrow">
                            {s.acceptedSpecies.map((sp) => t(`speciesPlural.${sp}`)).join(" · ")}
                          </p>
                          {/* <bdi> isolates these Latin strings: without it
                              "Youcef H." renders as ".Youcef H" in Arabic, the
                              trailing period being a neutral character. */}
                          <h2 className="mt-1.5 text-name font-semibold text-foreground">
                            <bdi>{s.publicName}</bdi>
                          </h2>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            <bdi className="truncate">{zoneLabel(s.communeCode)}</bdi>
                          </p>

                          <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-foreground">
                            {localized(s.headline, lng)}
                          </p>

                          {/* Why this one fits: the hard constraints that were
                              actually checked, in the words of the thing
                              checked. Containment is the match signal — an
                              answer to something the owner asked is held in a
                              token, everything else is plain text, and the mark
                              is never the only way to read the fact. */}
                          <ul role="list" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                            {reasons
                              /* An absence is not a confirmation: "has not
                                 declared these dates unavailable" gets plain
                                 text, so it cannot be read as a fourth tick
                                 alongside three facts the sitter did declare. */
                              .filter((reason) => reason.kind !== "dates")
                              .map((reason) => (
                                <li
                                  key={reason.kind + ("species" in reason ? reason.species : "")}
                                  className="inline-flex items-center gap-1 rounded-sm bg-accent px-2 py-0.5 font-medium text-accent-foreground"
                                >
                                  <Check className="size-3 shrink-0" aria-hidden="true" />
                                  <span className="sr-only">{t("search.card.matchLabel")} : </span>
                                  {reasonLabel(reason)}
                                </li>
                              ))}
                            {rest.length > 0 && <li className="text-muted-foreground">{rest.join(" · ")}</li>}
                            {reasons.some((r) => r.kind === "dates") && (
                              <li className="text-muted-foreground">{t("search.reason.dates")}</li>
                            )}
                          </ul>

                          {/* Provenance byline, merged with the demo marker so
                              the entry carries one honesty line rather than
                              two. */}
                          <ProvenanceLabel className="mt-3">
                            {s.isDemoFixture ? ` · ${t("search.card.demoTag")}` : null}
                          </ProvenanceLabel>
                        </div>

                        {/* Price on its own axis: at md+ the amounts line up in
                            one column, so "classés par prix" is visible rather
                            than asserted — and the entry stops reading as a
                            pricing card. */}
                        <div className="col-span-2 mt-4 flex items-end justify-between gap-4 md:col-span-1 md:mt-0 md:block md:text-end">
                          <div>
                            {rate.isFrom && <p className="text-sm text-muted-foreground">{t("search.card.from")}</p>}
                            <p className="text-price font-semibold tabular-nums text-foreground">
                              {formatDZD(rate.amount, lng)}
                            </p>
                            <p className="text-sm text-muted-foreground">{t(CARE_UNIT_KEY[rate.careType])}</p>
                          </div>
                          {/* The entry's only action. The stretched pseudo
                              element makes the whole row clickable while
                              keeping exactly one tab stop. The name is in the
                              accessible name via sr-only, so the visible label
                              stays a prefix of it (WCAG 2.5.3). */}
                          <Button asChild className="md:mt-4">
                            <Link
                              to={{ pathname: `/sitters/${s.id}`, search: paramKey }}
                              className="after:absolute after:inset-0"
                            >
                              {t("search.card.viewProfile")}
                              <span className="sr-only"> — {s.publicName}</span>
                            </Link>
                          </Button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
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
