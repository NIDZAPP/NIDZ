import { useId, useRef } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Combobox, { type ComboboxOption } from "@/components/shared/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WILAYAS,
  communesOf,
  foldForSearch,
  getWilaya,
  hasCommuneCoverage,
} from "@/data/algeria";
import { localized, type DateRange, type Localized } from "@/data/types";
import type { AppLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { toISODate, today } from "@/utils/dates";

/* ---------------------------------------------------------------------------
   Form field wrappers.

   Design system §18 is the whole brief: a visible label always, help text
   where the expectation is not obvious, the error next to the field, and never
   a placeholder standing in for a label.
   ------------------------------------------------------------------------ */

export type FieldWiring = {
  /** Put on the control. */
  id: string;
  /** Put on the control — otherwise the help and error text below it are
      rendered but never announced. */
  describedBy: string | undefined;
  /** Id of the visible label, for controls that cannot use `label[for]`. */
  labelId: string;
  invalid: boolean;
};

/**
 * Label + control + help/error, with the ARIA wiring handed back to the caller.
 *
 * `children` is a function because the shell renders the described-by targets
 * but only the control can carry the attribute that points at them. Passing
 * plain children would render help text that assistive technology never
 * associates with the field.
 */
export function FieldShell({
  label,
  help,
  error,
  children,
  className,
}: {
  label: string;
  help?: string;
  error?: string;
  children: (wiring: FieldWiring) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const helpId = help && !error ? `${id}-help` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <Label id={`${id}-label`} htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </Label>
      {children({ id, describedBy, labelId: `${id}-label`, invalid: Boolean(error) })}
      {helpId && (
        <p id={helpId} className="mt-2 text-sm text-muted-foreground">
          {help}
        </p>
      )}
      {/* The error carries text, not just a colour (§25). */}
      {errorId && (
        /* Announced as it appears: a validation message the user only finds by
           reading the screen is not an accessible error (§25). */
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A labelled Select.
 *
 * Radix renders the trigger as `<button role="combobox">`. `label[for]` does
 * not name a button, and the combobox role forbids name-from-content, so the
 * field name is wired with `aria-labelledby` pointing at the one visible label
 * — adding a second `<label for>` would make it a control with two labels.
 */
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  help,
  error,
  disabled,
  className,
}: {
  label: string;
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  help?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <FieldShell label={label} help={help} error={error} className={className}>
      {({ id, describedBy, labelId, invalid }) => (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
          <SelectTrigger
            id={id}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}

/**
 * Wilaya, then commune.
 *
 * Two chained selects rather than one long list, because that is the shape an
 * authoritative Algerian dataset has: hundreds of communes under dozens of
 * wilayas. `src/data/locations.ts` currently holds a small launch subset, and
 * this control has to keep working when that file is replaced without being
 * rewritten.
 *
 * The commune is optional — "toutes les communes" searches the whole wilaya —
 * so someone who does not know the commune name is never stuck.
 *
 * Used by both the need flow and the `/search` filter sheet, so the location a
 * person defines and the location they adjust are the same control.
 */
export function LocationFields({
  wilayaCode,
  communeCode,
  onChange,
  locale,
  anyWilayaLabel,
  anyCommuneLabel,
  wilayaLabel,
  wilayaPlaceholder,
  communeLabel,
  communePlaceholder,
  wilayaRef,
  help,
  error,
  className,
}: {
  wilayaCode: string | null;
  communeCode: string | null;
  onChange: (next: { wilayaCode: string | null; communeCode: string | null }) => void;
  locale: AppLocale;
  /** Offer "anywhere" on the wilaya field. Omit in the need flow, where the
      question is where the owner actually is. */
  anyWilayaLabel?: string;
  anyCommuneLabel: string;
  wilayaLabel: string;
  /** Shown when nothing is chosen yet, so the trigger is never an empty box. */
  wilayaPlaceholder?: string;
  communeLabel: string;
  communePlaceholder?: string;
  wilayaRef?: React.Ref<HTMLButtonElement>;
  help?: string;
  error?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const ANY = "__any__";
  const wilaya = getWilaya(wilayaCode);
  const communes = communesOf(wilayaCode);
  /* Three different states, and they must not be blurred into one empty list:
     no wilaya chosen yet, a wilaya whose commune list Nidz does not carry, and
     a wilaya with its communes. Only the third gets a picker. */
  const communeListMissing = Boolean(wilaya) && !hasCommuneCoverage(wilayaCode);

  const option = (value: string, name: Localized): ComboboxOption => ({
    value,
    label: localized(name, locale),
    /* Findable by its name in any of the three languages, not only the one the
       interface happens to be in. Algeria is bilingual in practice and someone
       may know a place by its other name. */
    keywords: [name.fr, name.en, name.ar],
  });

  const wilayaOptions: ComboboxOption[] = [
    ...(anyWilayaLabel ? [{ value: ANY, label: anyWilayaLabel }] : []),
    ...WILAYAS.map((w) => option(w.id, w.name)),
  ];

  const communeOptions: ComboboxOption[] = [
    { value: ANY, label: anyCommuneLabel },
    ...communes.map((c) => option(c.id, c.name)),
  ];

  return (
    <div className={cn("space-y-5", className)}>
      <FieldShell label={wilayaLabel} error={error}>
        {({ id, describedBy, labelId, invalid }) => (
          <Combobox
            id={id}
            labelledBy={labelId}
            describedBy={describedBy}
            invalid={invalid}
            triggerRef={wilayaRef}
            value={wilayaCode ?? (anyWilayaLabel ? ANY : null)}
            onChange={(v) =>
              /* Changing wilaya always clears the commune: keeping it would
                 leave a commune that belongs to a different wilaya. */
              onChange({ wilayaCode: v === ANY ? null : v, communeCode: null })
            }
            options={wilayaOptions}
            placeholder={wilayaPlaceholder ?? wilayaLabel}
            searchPlaceholder={t("location.searchWilaya")}
            emptyLabel={t("location.noMatch")}
            fold={foldForSearch}
          />
        )}
      </FieldShell>

      <FieldShell label={communeLabel} help={help}>
        {({ id, describedBy, labelId }) =>
          communeListMissing ? (
            /* Said plainly rather than shown as an empty picker. An empty
               commune list would read as "this wilaya has no communes", which
               is false everywhere — what is true is that Nidz does not carry
               the list yet (see KNOWN_GAPS in src/data/algeria/metadata.ts). */
            <p id={id} aria-describedby={describedBy} className="text-sm text-muted-foreground">
              {t("location.communeListUnavailable")}
            </p>
          ) : (
            <Combobox
              id={id}
              labelledBy={labelId}
              describedBy={describedBy}
              /* Disabled until a wilaya scopes it, so the control never offers
                 371 communes from every wilaya at once. */
              disabled={!wilaya}
              value={wilaya ? (communeCode ?? ANY) : null}
              onChange={(v) => onChange({ wilayaCode, communeCode: v === ANY ? null : v })}
              options={communeOptions}
              placeholder={communePlaceholder ?? communeLabel}
              searchPlaceholder={t("location.searchCommune")}
              emptyLabel={t("location.noMatch")}
              fold={foldForSearch}
            />
          )
        }
      </FieldShell>
    </div>
  );
}

/**
 * When the care is needed.
 *
 * Native `<input type="date">`: the picker, the ISO value, the keyboard
 * support and the Arabic/French localisation all come from the platform, and
 * `min` prevents a past date instead of flagging it red afterwards (§18 —
 * prevention over error). A walk is a single day, so it renders one field and
 * stores `start === end`, keeping one shape in the model.
 */
export function DateRangeField({
  singleDay,
  value,
  onChange,
  startLabel,
  endLabel,
  singleLabel,
  help,
  error,
  startRef,
}: {
  startRef?: React.Ref<HTMLInputElement>;
  singleDay: boolean;
  value: DateRange | null;
  onChange: (next: DateRange | null) => void;
  startLabel: string;
  endLabel: string;
  singleLabel: string;
  help?: string;
  error?: string;
}) {
  const min = toISODate(today());

  const setStart = (start: string) => {
    if (!start) return onChange(null);
    if (singleDay) return onChange({ start, end: start });
    /* An end before the new start is not an error to report, it is a value to
       correct: pull it along rather than making the owner fix it. */
    const end = value && value.end >= start ? value.end : start;
    onChange({ start, end });
  };

  return (
    <div className="space-y-5">
      <FieldShell label={singleDay ? singleLabel : startLabel} help={singleDay ? help : undefined} error={error}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            ref={startRef}
            type="date"
            min={min}
            value={value?.start ?? ""}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => setStart(e.target.value)}
          />
        )}
      </FieldShell>

      {!singleDay && (
        <FieldShell label={endLabel} help={help}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="date"
              /* Never earlier than the start, so an impossible range cannot be
                 entered in the first place. */
              min={value?.start || min}
              value={value?.end ?? ""}
              disabled={!value?.start}
              aria-describedby={describedBy}
              onChange={(e) =>
                value?.start && onChange({ start: value.start, end: e.target.value || value.start })
              }
            />
          )}
        </FieldShell>
      )}
    </div>
  );
}

/**
 * A local image preview.
 *
 * There is no server in this project, so nothing is uploaded and nothing is
 * stored: the file becomes an object URL, is shown, and is forgotten on
 * reload. The copy says exactly that. Anything that looked like a completed
 * upload would be claiming infrastructure Nidz does not have.
 */
export function PhotoField({
  label,
  help,
  value,
  onChange,
  className,
}: {
  label: string;
  help?: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  /* Deliberately NO revoke on unmount. The URL outlives this field: it is
     handed to the caller, stored on the pet, and read again when the owner
     comes back to the step or reaches the request summary. Revoking on unmount
     killed the image the moment the step was left, so Back rendered a broken
     frame over a button reading "Changer la photo". The field revokes only the
     URLs it actually replaces or removes, below. */

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary"
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {value ? t("common.changePhoto") : t("common.addPhoto")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                URL.revokeObjectURL(value);
                onChange(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="size-4" aria-hidden="true" />
              {t("common.remove")}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={label}
        /* Out of the tab order: the visible button is the control, and a
           second, invisible stop for the same action is a trap for keyboard
           users. */
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          /* Cleared unconditionally: without it, picking the same file twice
             in a row fires no change event and the control looks broken. */
          e.target.value = "";
          if (!file) return;
          if (value) URL.revokeObjectURL(value);
          onChange(URL.createObjectURL(file));
        }}
      />
      <p className="mt-2 text-sm text-muted-foreground">{help ?? t("common.photoLocalOnly")}</p>
    </div>
  );
}

/**
 * A document field for the sitter's identity paper.
 *
 * Records the file name locally and nothing else. Adding a document NEVER
 * produces a verified badge — the state it leads to is "vérification en
 * attente", and only a real, traceable review could change that
 * (Audit p.449, design system §6 B).
 */
export function DocumentField({
  label,
  help,
  fileName,
  onSelect,
  onClear,
  className,
}: {
  label: string;
  help?: string;
  fileName?: string | null;
  onSelect: (fileName: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}

      {fileName ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{fileName}</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {t("common.remove")}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
          {t("sitterFlow.trust.add")}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        aria-label={label}
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onSelect(file.name);
        }}
      />
    </div>
  );
}
