import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Cat, Check, Dog, Info, MapPin, PawPrint, SlidersHorizontal, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatDZD } from "@/utils/format";
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n";

/* ---------------------------------------------------------------------------
   DEMONSTRATION DATA — NOT REAL PEOPLE, NOT REAL LISTINGS.
   Every field is something a sitter would DECLARE about themselves
   (design system §6 A). There is deliberately NO rating, review count,
   verification flag, response time or availability: Nidz has no mechanism
   behind any of those, and inventing them is forbidden (§6.1, §7, §8.3).
   Rates are per service, because a nightly rate is not the price of a walk.
   ------------------------------------------------------------------------ */

type Species = "dog" | "cat";
type CareType = "boarding" | "atOwner" | "walk";

type DemoSitter = {
  id: number;
  /** Public identity is first name + initial only (§27, Audit p.156). */
  name: string;
  /** Approximate zone. Nidz never has, and never shows, an exact address. */
  communeKey: string;
  species: Species[];
  /** A rate exists only for a service the sitter actually offers. */
  rates: Partial<Record<CareType, number>>;
  bioKey: string;
};

const DEMO_SITTERS: DemoSitter[] = [
  {
    id: 1,
    name: "Amina B.",
    communeKey: "hydra",
    species: ["dog"],
    rates: { boarding: 1200, walk: 600 },
    bioKey: "sitters.s1.bio",
  },
  {
    id: 2,
    name: "Karim B.",
    communeKey: "elBiar",
    species: ["dog"],
    rates: { boarding: 900, walk: 500 },
    bioKey: "sitters.s2.bio",
  },
  {
    id: 3,
    name: "Sarah M.",
    communeKey: "kouba",
    species: ["cat"],
    rates: { atOwner: 800 },
    bioKey: "sitters.s3.bio",
  },
  {
    id: 4,
    name: "Youcef H.",
    communeKey: "babEzzouar",
    species: ["cat", "dog"],
    rates: { boarding: 800 },
    bioKey: "sitters.s4.bio",
  },
];

const COMMUNE_KEYS = ["hydra", "elBiar", "kouba", "babEzzouar"];
const SPECIES: Species[] = ["dog", "cat"];
const CARE_TYPES: CareType[] = ["boarding", "atOwner", "walk"];
const PRICE_STEPS = [600, 900, 1200];

/** The unit belongs to the service, never to the sitter. */
const CARE_UNIT: Record<CareType, string> = {
  boarding: "search.card.unit.night",
  atOwner: "search.card.unit.visit",
  walk: "search.card.unit.walk",
};

const ANY = "any";

type Criteria = {
  species: Species[];
  care: CareType[];
  commune: string | null;
  maxPrice: number | null;
};

const NO_CRITERIA: Criteria = { species: [], care: [], commune: null, maxPrice: null };

/* The search lives in the URL, not in component state. A result card navigates
   to a sitter, so without this, Back would return to an empty form and throw
   away everything the owner told us. It also makes a result set linkable. */
function parseCriteria(params: URLSearchParams): Criteria {
  const list = (key: string) => (params.get(key) || "").split(",").filter(Boolean);
  const max = Number(params.get("max"));
  const commune = params.get("commune");
  return {
    species: list("species").filter((v): v is Species => SPECIES.includes(v as Species)),
    care: list("care").filter((v): v is CareType => CARE_TYPES.includes(v as CareType)),
    commune: commune && COMMUNE_KEYS.includes(commune) ? commune : null,
    maxPrice: PRICE_STEPS.includes(max) ? max : null,
  };
}

function serializeCriteria(c: Criteria): Record<string, string> {
  const out: Record<string, string> = { r: "1" };
  if (c.species.length) out.species = c.species.join(",");
  if (c.care.length) out.care = c.care.join(",");
  if (c.commune) out.commune = c.commune;
  if (c.maxPrice !== null) out.max = String(c.maxPrice);
  return out;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const servicesOf = (s: DemoSitter) => (Object.keys(s.rates) as CareType[]);

/* The price shown is the price of the service the owner asked for. When no
   single service is selected we show the cheapest one the sitter offers and
   label it "from" — a nightly rate is never presented as the price of a walk. */
function displayRate(s: DemoSitter, care: CareType[]) {
  const offered = servicesOf(s);
  const selected = care.filter((c) => offered.includes(c));
  const chosen = selected.length === 1 ? selected[0] : null;
  if (chosen) return { amount: s.rates[chosen] as number, unit: CARE_UNIT[chosen], from: false };
  const cheapest = offered.reduce((a, b) => ((s.rates[a] as number) <= (s.rates[b] as number) ? a : b));
  return { amount: s.rates[cheapest] as number, unit: CARE_UNIT[cheapest], from: offered.length > 1 };
}

function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/* A filter chip. Multi-select, so `checkbox` is the honest role. The check
   glyph means state is never carried by colour alone (§12.2). The glyph slot
   is always reserved so toggling never reflows the row under the user's
   finger, and min-h-11 meets the Nidz ~44px touch floor (§17). These replace
   two Radix Sliders whose 20px thumbs missed that floor and whose axis
   reversed meaning in RTL — a worded chip cannot reverse. */
function Chip({
  selected,
  onClick,
  icon: Icon,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center gap-2.5 rounded-full border px-5 text-[0.9375rem] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-input bg-card text-foreground hover:bg-secondary",
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
        {selected ? <Check className="size-4" /> : Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </span>
      {children}
    </button>
  );
}

export default function Search() {
  const { t, i18n } = useTranslation();
  const base = i18n.language?.split("-")[0] ?? "";
  const lng: AppLocale = isAppLocale(base) ? base : "en";

  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = searchParams.toString();

  const stage = searchParams.get("r") === "1" ? "results" : "need";
  const criteria = useMemo(() => parseCriteria(new URLSearchParams(paramKey)), [paramKey]);

  const [draft, setDraft] = useState<Criteria>(criteria);
  const [sheetOpen, setSheetOpen] = useState(false);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  /* Keep the editable copy in step with the URL — including when the change
     came from the Back button rather than from a control on this page. */
  useEffect(() => {
    setDraft(parseCriteria(new URLSearchParams(paramKey)));
  }, [paramKey]);

  /* Entering the results is a view change, not a navigation, so nothing
     resets the viewport: without this the owner lands at the form's old
     scroll offset, past both the heading and the demo notice. */
  useEffect(() => {
    if (stage !== "results") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    resultsHeading.current?.focus({ preventScroll: true });
  }, [stage]);

  const speciesLabel = (s: Species) => t(`search.species.${s}`);
  const careLabel = (c: CareType) => t(`search.care.${c}`);
  const communeLabel = (key: string) => t(`communes.${key}`);

  /* Uppercase is a no-op in Arabic and letter-spacing breaks cursive joining,
     so the eyebrow keeps its size and weight but drops both there. */
  const eyebrow = cn(
    "text-eyebrow font-semibold text-muted-foreground",
    lng === "ar" ? "tracking-normal" : "uppercase",
  );

  const apply = (next: Criteria) => setSearchParams(serializeCriteria(next));

  /* Filtered by what the owner actually chose. Nothing is ranked: there is no
     reputation, no availability and no distance-from-user to rank by. Order is
     by the price actually displayed, and the UI says so. */
  const results = useMemo(() => {
    return DEMO_SITTERS.map((s) => ({ sitter: s, rate: displayRate(s, criteria.care) }))
      .filter(({ sitter, rate }) => {
        if (criteria.species.length && !sitter.species.some((x) => criteria.species.includes(x))) return false;
        if (criteria.care.length && !servicesOf(sitter).some((x) => criteria.care.includes(x))) return false;
        if (criteria.commune && sitter.communeKey !== criteria.commune) return false;
        if (criteria.maxPrice !== null && rate.amount > criteria.maxPrice) return false;
        return true;
      })
      .sort((a, b) => a.rate.amount - b.rate.amount);
  }, [criteria]);

  const hasCriteria =
    criteria.species.length > 0 || criteria.care.length > 0 || criteria.commune !== null || criteria.maxPrice !== null;

  /* The owner's brief. Rendered as a definition list in the desktop rail and
     condensed into one line in the mobile bar — same data, one source. It is
     not chrome: it is the question every row on the page is answering. */
  const speciesText = criteria.species.length ? criteria.species.map(speciesLabel).join(" · ") : null;
  const brief = [
    { key: "species", label: t("search.brief.species"), value: speciesText ?? t("search.brief.anySpecies"), brand: true },
    {
      key: "care",
      label: t("search.brief.care"),
      value: criteria.care.length ? criteria.care.map(careLabel).join(" · ") : t("search.brief.anyCare"),
    },
    {
      key: "zone",
      label: t("search.brief.zone"),
      value: criteria.commune ? communeLabel(criteria.commune) : t("search.need.communeAny"),
    },
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
    ...criteria.care.map(careLabel),
    ...(criteria.commune ? [communeLabel(criteria.commune)] : []),
    ...(criteria.maxPrice !== null
      ? [t("search.filters.upTo", { price: formatDZD(criteria.maxPrice, lng) })]
      : []),
  ];

  const activeFilters =
    criteria.species.length +
    criteria.care.length +
    (criteria.commune ? 1 : 0) +
    (criteria.maxPrice !== null ? 1 : 0);

  const editButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => setSheetOpen(true)}
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

  /* ---------------------------------------------------------------- fields */

  const speciesField = (value: Criteria, set: (c: Criteria) => void) => (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-foreground">{t("search.need.speciesLabel")}</legend>
      <div className="flex flex-wrap gap-2">
        {SPECIES.map((s) => (
          <Chip
            key={s}
            icon={s === "dog" ? Dog : Cat}
            selected={value.species.includes(s)}
            onClick={() => set({ ...value, species: toggle(value.species, s) })}
          >
            {speciesLabel(s)}
          </Chip>
        ))}
      </div>
    </fieldset>
  );

  const careField = (value: Criteria, set: (c: Criteria) => void) => (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-foreground">{t("search.need.careLabel")}</legend>
      <div className="flex flex-wrap gap-2">
        {CARE_TYPES.map((c) => (
          <Chip
            key={c}
            selected={value.care.includes(c)}
            onClick={() => set({ ...value, care: toggle(value.care, c) })}
          >
            {careLabel(c)}
          </Chip>
        ))}
      </div>
    </fieldset>
  );

  /* Radix renders the trigger as a <button role="combobox">. `label[for]` does
     not name a button, and `combobox` forbids name-from-content, so the field
     name has to be wired explicitly or AT announces only the current value. */
  const communeField = (value: Criteria, set: (c: Criteria) => void, id: string) => (
    <div>
      <Label id={`${id}-label`} htmlFor={id} className="mb-3 block text-sm font-medium">
        {t("search.need.communeLabel")}
      </Label>
      <Select
        value={value.commune ?? ANY}
        onValueChange={(v) => set({ ...value, commune: v === ANY ? null : v })}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-label ${id}`}
          aria-describedby={`${id}-help`}
          className="h-11 w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.need.communeAny")}</SelectItem>
          {COMMUNE_KEYS.map((c) => (
            <SelectItem key={c} value={c}>
              {communeLabel(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={`${id}-help`} className="mt-2 text-sm text-muted-foreground">
        {t("search.need.communeHelp")}
      </p>
    </div>
  );

  const priceField = (value: Criteria, set: (c: Criteria) => void, id: string) => (
    <div>
      <Label id={`${id}-label`} htmlFor={id} className="mb-3 block text-sm font-medium">
        {t("search.filters.maxPrice")}
      </Label>
      <Select
        value={value.maxPrice === null ? ANY : String(value.maxPrice)}
        onValueChange={(v) => set({ ...value, maxPrice: v === ANY ? null : Number(v) })}
      >
        <SelectTrigger id={id} aria-labelledby={`${id}-label ${id}`} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{t("search.filters.anyPrice")}</SelectItem>
          {PRICE_STEPS.map((p) => (
            <SelectItem key={p} value={String(p)}>
              {t("search.filters.upTo", { price: formatDZD(p, lng) })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  /* ------------------------------------------------------------------ view */

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>
          {t("common.appName")} — {t("nav.search")}
        </title>
        <meta name="description" content={t("search.need.intro")} />
      </Helmet>

      {stage === "need" ? (
        /* ---------------------------------------------------- A. the need.
           Results are not shown before the need exists (§9.2, Audit p.91).
           This is also what makes the compatibility marks honest later. */
        <section>
          {/* A full-bleed band, not a floating tinted card: colour fills the
              width so 1440px is composed rather than empty, and the warm
              surface reads as an editorial moment instead of a notice. */}
          <div className="bg-brand-soft py-10 md:py-16">
            <div className="container">
              <div className="mx-auto max-w-[1120px]">
                <PawPrint className="mb-5 size-7 text-brand" aria-hidden="true" />
                <h1 className="max-w-[36ch] text-h1 font-semibold text-foreground md:text-h1-lg">
                  {t("search.need.title")}
                </h1>
                <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
                  {t("search.need.intro")}
                </p>
              </div>
            </div>
          </div>

          <div className="container py-10 md:py-14">
            {/* Start-aligned on one shared axis. A single generous margin reads
                as an editorial margin; two symmetric margins read unfinished. */}
            <div className="mx-auto max-w-[1120px]">
              <form
                className="max-w-[640px] space-y-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  apply(draft);
                }}
              >
                {speciesField(draft, setDraft)}
                {careField(draft, setDraft)}
                {communeField(draft, setDraft, "need-commune")}

                {/* Full-width on mobile (thumb reach), intrinsic width on desktop
                    so the one dominant action does not become a bar (§17). */}
                <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
                  <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-56">
                    {t("search.need.submit")}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="text-muted-foreground"
                    onClick={() => apply(NO_CRITERIA)}
                  >
                    {t("search.need.skip")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : (
        /* ------------------------------------------------- B. the results. */
        <>
          {/* Below xl the brief is a sticky bar; at xl it becomes the rail
              (§15 endorses the sidebar <-> drawer transformation). Only ever
              one of the two is mounted, so there is no duplicate control. */}
          <div className="sticky top-16 z-30 border-b border-border bg-background xl:hidden">
            <div className="container flex h-14 items-center gap-3">
              <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
                {/* Terracotta names the animal, and nothing else on this page.
                    The species is never carried by colour alone — it is the
                    first value in the line and is labelled in the rail. */}
                {speciesText && <bdi className="font-medium text-brand">{speciesText}</bdi>}
                {/* Each part is isolated: a commune name may be Latin text
                    inside an Arabic sentence, and the separators are neutral. */}
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
            {/* Asymmetric at xl: a brief rail against a register column, both
                hung off one left axis. Symmetric margins on a 1440 canvas are
                what made the previous grid read as unfinished. */}
            <div className="mx-auto max-w-[1120px] xl:grid xl:grid-cols-[264px_minmax(0,1fr)] xl:items-start">
              {/* The rule lives on the register's leading edge, not the rail's
                  trailing edge: the rail is sticky and short, so a rule on it
                  would stop a third of the way down the page. */}
              <aside className="hidden xl:sticky xl:top-24 xl:block xl:pe-12">
                <h2 className={cn(eyebrow, "mb-4")}>{t("search.brief.title")}</h2>
                <dl className="space-y-4">
                  {brief.map((row) => (
                    <div key={row.key}>
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd
                        className={cn(
                          "mt-0.5 text-base",
                          row.brand ? "font-medium text-brand" : "text-foreground",
                        )}
                      >
                        <bdi>{row.value}</bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6">{editButton}</div>
              </aside>

              <div className="min-w-0 xl:border-s xl:border-border xl:ps-12">
                {/* Focus moves to this heading so the view change is announced.
                    No visible ring: :focus-visible also matches this programmatic
                    focus, so a ring would box the heading on every arrival,
                    including mouse and direct-URL ones — same trade-off a skip
                    link makes. */}
                <h1
                  ref={resultsHeading}
                  tabIndex={-1}
                  className="max-w-[24ch] text-h1 font-semibold text-foreground focus:outline-none md:text-h1-lg"
                >
                  {hasCriteria ? t("search.results.title") : t("search.results.titleAll")}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                  {t("search.results.countLabel", { count: results.length })}
                  {/* No ordering claim when there is nothing to order. */}
                  {results.length > 0 && ` · ${t("search.results.sortedByPrice")}`}
                </p>

                {/* Honesty layer, as a ruled notice rather than a filled card:
                    horizontal rules read as masthead apparatus, so it keeps
                    positional weight without competing chromatically — and it
                    rhymes with the register rules below (§6.1, §16). */}
                <div className="my-6 border-y border-border py-4 md:my-8">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Info className="size-4 shrink-0" aria-hidden="true" />
                    {t("search.demo.title")}
                  </p>
                  <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{t("search.demo.body")}</p>
                </div>

                {results.length === 0 ? (
                  <div className="border-b border-border py-10">
                    <h2 className="text-name font-semibold text-foreground">{t("search.results.emptyTitle")}</h2>
                    <p className="mt-2 max-w-[60ch] text-base text-muted-foreground">
                      {t("search.results.emptyBody")}
                    </p>
                    {/* Opens the editor rather than wiping every criterion —
                        a cat owner should not be shown dog sitters. */}
                    <Button type="button" variant="outline" className="mt-6" onClick={() => setSheetOpen(true)}>
                      {t("search.context.editLabel")}
                    </Button>
                  </div>
                ) : (
                  /* A register, not a grid of tiles: entries separated by
                     hairlines on the page ground. §16 ranks space > surface >
                     border > shadow, and a bordered elevated card used all
                     four at once for a low-importance element. */
                  <ul role="list">
                    {results.map(({ sitter: s, rate }) => {
                      const facts = [
                        ...s.species.map((sp) => ({
                          key: `sp-${sp}`,
                          label: t(`search.accepts.${sp}`),
                          matched: criteria.species.includes(sp),
                        })),
                        ...servicesOf(s).map((c) => ({
                          key: `c-${c}`,
                          label: careLabel(c),
                          matched: criteria.care.includes(c),
                        })),
                      ];
                      const matched = facts.filter((f) => f.matched);
                      const rest = facts.filter((f) => !f.matched);

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
                            <span
                              aria-hidden="true"
                              className="flex size-10 items-center justify-center rounded-sm bg-secondary text-base font-semibold text-foreground md:size-12 md:text-name"
                            >
                              {s.name.charAt(0)}
                            </span>

                            <div className="min-w-0">
                              {/* Species as a filing system: scanning the column
                                  shows the page is organised around animals
                                  before it is organised around people. */}
                              <p className={eyebrow}>
                                {s.species.map((sp) => t(`search.speciesPlural.${sp}`)).join(" · ")}
                              </p>
                              {/* <bdi> isolates these Latin strings: without it
                                  "Youcef H." renders as ".Youcef H" in Arabic,
                                  the trailing period being a neutral character. */}
                              <h2 className="mt-1.5 text-name font-semibold text-foreground">
                                <bdi>{s.name}</bdi>
                              </h2>
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                <bdi className="truncate">{communeLabel(s.communeKey)}</bdi>
                              </p>

                              <p className="mt-3 max-w-[56ch] text-base leading-relaxed text-foreground">
                                {t(s.bioKey)}
                              </p>

                              {/* Declared facts. Species and services are hard
                                  constraints (§8.1), so they show whether or not
                                  criteria were set. Containment is the match
                                  signal: an answer to something the owner asked
                                  is held in a token, everything else is plain
                                  text. The mark is never the only way to read
                                  the fact. */}
                              <ul role="list" className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                                {matched.map((f) => (
                                  <li
                                    key={f.key}
                                    className="inline-flex items-center gap-1 rounded-sm bg-accent px-2 py-0.5 font-medium text-accent-foreground"
                                  >
                                    <Check className="size-3 shrink-0" aria-hidden="true" />
                                    <span className="sr-only">{t("search.card.matchLabel")} : </span>
                                    {f.label}
                                  </li>
                                ))}
                                {rest.length > 0 && (
                                  <li className="text-muted-foreground">
                                    {rest.map((f) => f.label).join(" · ")}
                                  </li>
                                )}
                              </ul>

                              {/* Provenance byline, merged with the demo marker
                                  so the entry carries one honesty line rather
                                  than two. One of four variants documented in
                                  src/index.css; the other three have no
                                  mechanism, so they have no call site. */}
                              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="size-3.5 shrink-0" aria-hidden="true" />
                                {t("search.card.demoTag")} · {t("trust.declared")}
                              </p>
                            </div>

                            {/* Price on its own axis: at md+ the amounts line up
                                in one column, so "classés par prix" is visible
                                rather than asserted — and the entry stops
                                reading as a pricing card. */}
                            <div className="col-span-2 mt-4 flex items-end justify-between gap-4 md:col-span-1 md:mt-0 md:block md:text-end">
                              <div>
                                {rate.from && (
                                  <p className="text-sm text-muted-foreground">{t("search.card.from")}</p>
                                )}
                                <p className="text-price font-semibold tabular-nums text-foreground">
                                  {formatDZD(rate.amount, lng)}
                                </p>
                                <p className="text-sm text-muted-foreground">{t(rate.unit)}</p>
                              </div>
                              {/* The entry's only action. The stretched pseudo
                                  element makes the whole row clickable while
                                  keeping exactly one tab stop. The name is in
                                  the accessible name via sr-only, so the visible
                                  label stays a prefix of it (WCAG 2.5.3). */}
                              <Button asChild className="md:mt-4">
                                <Link to={`/sitter/${s.id}`} className="after:absolute after:inset-0">
                                  {t("search.card.viewProfile")}
                                  <span className="sr-only"> — {s.name}</span>
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

          {/* One sheet edits the whole search, so "Modifier" and the filters
              are the same surface: one code path, one mental model. Flex
              column rather than a sticky footer, which would overlay the last
              field while scrolling. */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                {/* Same field order as the need form. */}
                <div className="mx-auto max-w-[720px] space-y-8">
                  {speciesField(draft, setDraft)}
                  {careField(draft, setDraft)}
                  {communeField(draft, setDraft, "filter-commune")}
                  {priceField(draft, setDraft, "filter-price")}
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
                      setDraft(NO_CRITERIA);
                      apply(NO_CRITERIA);
                      setSheetOpen(false);
                    }}
                  >
                    {t("search.filters.clear")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
