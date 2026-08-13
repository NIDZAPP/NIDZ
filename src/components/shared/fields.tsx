import { useEffect, useId, useRef } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WILAYAS } from "@/data/locations";
import { localized } from "@/data/types";
import type { AppLocale } from "@/i18n";
import { cn } from "@/lib/utils";

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
        <p id={errorId} className="mt-2 text-sm font-medium text-destructive">
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
 * The commune picker, grouped by wilaya.
 *
 * One control rather than two chained selects: the model stores a commune
 * code, and the demo covers two wilayas, so a wilaya select would be a step
 * that narrows a nine-item list. `anyLabel` keeps the field from becoming a
 * wall for someone outside the covered areas.
 */
export function CommuneField({
  label,
  value,
  onChange,
  locale,
  anyLabel,
  help,
  error,
  className,
}: {
  label: string;
  /** `null` means "anywhere". */
  value: string | null;
  onChange: (code: string | null) => void;
  locale: AppLocale;
  anyLabel?: string;
  help?: string;
  error?: string;
  className?: string;
}) {
  const ANY = "__any__";

  return (
    <FieldShell label={label} help={help} error={error} className={className}>
      {({ id, describedBy, labelId, invalid }) => (
        <Select
          value={value ?? (anyLabel ? ANY : "")}
          onValueChange={(v) => onChange(v === ANY ? null : v)}
        >
          <SelectTrigger
            id={id}
            aria-labelledby={`${labelId} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anyLabel && <SelectItem value={ANY}>{anyLabel}</SelectItem>}
            {WILAYAS.map((wilaya) => (
              <SelectGroup key={wilaya.code}>
                <SelectLabel>{localized(wilaya.name, locale)}</SelectLabel>
                {wilaya.communes.map((commune) => (
                  <SelectItem key={commune.code} value={commune.code}>
                    {localized(commune.name, locale)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
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
  /* Held in a ref so the unmount cleanup sees the last URL without making the
     effect re-run — and revoke — on every change. */
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    return () => {
      if (latest.current) URL.revokeObjectURL(latest.current);
    };
  }, []);

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
    <div className={cn("rounded-md border border-border p-4", className)}>
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onSelect(file.name);
        }}
      />
    </div>
  );
}
