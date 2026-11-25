import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";

import { ChipGroup } from "@/components/shared/Chip";
import InfoTip from "@/components/shared/InfoTip";
import { Input } from "@/components/ui/input";
import { classificationOf } from "@/data/animal-catalogue";
import { getKind, kindsOf, searchKinds } from "@/data/animal-kinds";
import type { Species } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";

/** Shown before anyone types: enough to answer most owners at a glance. */
const FIRST_SCREEN = 6;
const OTHER = "__other__";
const UNSET = "";

/**
 * Breed (dog, cat) or species (bird), after the category is chosen (Nidz 1.4,
 * step 3): a search field, the most common kinds as chips, the rest on
 * demand, and « Mon animal n'est pas dans la liste » for the owner's own
 * words. Optional, and says so; "Je ne sais pas" is a way back out of a
 * mis-tap.
 *
 * Used on the animal's own sheet (Nidz 1.7). The guided journey has its own
 * full-screen step (`NeedBreed`). The "!" says what a breed does since 1.7:
 * it can decide whether a sitter who takes only some breeds can be asked —
 * and it predicts nothing about behaviour.
 */
export default function KindPicker({
  species,
  kindId,
  kindOther,
  onChange,
}: {
  species: Species;
  kindId: string | null;
  kindOther: string;
  onChange: (next: { kindId: string | null; kindOther: string }) => void;
}) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const id = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  /* "Other" is a state of its own: an owner can pick it before typing. */
  const [otherOpen, setOtherOpen] = useState(() => !kindId && kindOther.trim().length > 0);

  const selected = getKind(kindId, species);
  const value = selected ? selected.id : otherOpen ? OTHER : UNSET;

  const visible = useMemo(() => {
    const matches = searchKinds(species, query);
    const shown = query.trim() || expanded ? matches : matches.slice(0, FIRST_SCREEN);
    /* The chosen kind stays on screen whatever the filter, so the group never
       loses the radio that carries its value. */
    return selected && !shown.some((k) => k.id === selected.id) ? [selected, ...shown] : shown;
  }, [species, query, expanded, selected]);
  const total = kindsOf(species).length;
  const hidden = !query.trim() && !expanded && total > FIRST_SCREEN;
  const noMatch = query.trim().length > 0 && searchKinds(species, query).length === 0;

  const classification = classificationOf(species) ?? "breed";
  const label = t(`catalogue.label.${classification}`);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p id={`${id}-label`} className="text-[0.9375rem] font-medium text-foreground">
          {label} <span className="font-normal text-muted-foreground">· {t("common.optional")}</span>
        </p>
        <InfoTip topic={label}>{t("needFlow.breed.note")}</InfoTip>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(`catalogue.search.${classification}`)}
          aria-label={t(`catalogue.search.${classification}`)}
          className="ps-11"
          autoComplete="off"
          enterKeyHint="search"
          /* Enter in a search box inside a form would submit the step. */
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </div>

      <ChipGroup
        className="mt-3"
        labelledBy={`${id}-label`}
        value={value === UNSET ? null : value}
        onChange={(next) => {
          if (next === OTHER) {
            setOtherOpen(true);
            onChange({ kindId: null, kindOther });
          } else if (next === UNSET) {
            setOtherOpen(false);
            onChange({ kindId: null, kindOther: "" });
          } else {
            setOtherOpen(false);
            onChange({ kindId: next, kindOther: "" });
          }
        }}
        options={[
          ...visible.map((kind) => ({ value: kind.id, label: kind.name[lng] })),
          { value: OTHER, label: t("needFlow.breed.other"), icon: Plus },
          { value: UNSET, label: t("needFlow.breed.unknown") },
        ]}
      />

      {noMatch && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {t("pets.kind.noMatch", { query: query.trim() })}
        </p>
      )}
      {hidden && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="-ms-2 mt-1 inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("pets.kind.showAll")}
        </button>
      )}

      {otherOpen && (
        <div className="mt-3 animate-fade-in">
          <label htmlFor={`${id}-other`} className="mb-2 block text-[0.9375rem] font-medium text-foreground">
            {t(`needFlow.breed.otherLabel.${classification}`)}
          </label>
          <Input
            id={`${id}-other`}
            value={kindOther}
            autoComplete="off"
            placeholder={t(`needFlow.breed.otherPlaceholder.${classification}`)}
            onChange={(e) => onChange({ kindId: null, kindOther: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
