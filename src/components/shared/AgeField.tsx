import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Chip } from "@/components/shared/Chip";
import { AGE_MAX_YEARS } from "@/data/pets";
import NativeSelect from "@/components/shared/NativeSelect";

/* ---------------------------------------------------------------------------
   AN ANIMAL'S AGE (Nidz 1.7 §8.2) — years and months, estimated or unknown.

   Two native selects (the phone's own wheel, the fastest control there is
   for a number) for years and months, so a three-month-old kitten and a
   twelve-year-old parrot are both two taps. « Âge approximatif » marks an
   estimate; « Je ne connais pas son âge » is a complete answer that clears
   and disables the numbers — nobody is made to invent an age.
   ------------------------------------------------------------------------ */

export type AgeValue = { mode: string; years: number; months: number };

export default function AgeField({
  value,
  onChange,
  label,
  question,
}: {
  value: AgeValue;
  onChange: (next: AgeValue) => void;
  label: string;
  question?: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const unknown = value.mode === "unknown";
  const estimated = value.mode === "estimated";

  const setNumbers = (patch: Partial<AgeValue>) => {
    const next = { ...value, ...patch };
    /* Touching a number answers the question: known, unless marked estimated. */
    onChange({ ...next, mode: estimated ? "estimated" : "known" });
  };

  return (
    <fieldset aria-describedby={question ? `${id}-q` : undefined}>
      <legend className="text-[0.9375rem] font-medium text-foreground">{label}</legend>
      {question && (
        <p id={`${id}-q`} className="mt-1 text-sm text-muted-foreground">
          {question}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-years`} className="mb-1.5 block text-sm text-muted-foreground">
            {t("age.years")}
          </label>
          <NativeSelect
            id={`${id}-years`}
            disabled={unknown}
            value={unknown || !value.mode ? "" : String(value.years)}
            onChange={(e) => setNumbers({ years: Number(e.target.value) || 0 })}
          >
            <option value="" disabled>
              {t("age.choose")}
            </option>
            {Array.from({ length: AGE_MAX_YEARS + 1 }, (_, n) => (
              <option key={n} value={n}>
                {t("age.yearsCount", { count: n })}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor={`${id}-months`} className="mb-1.5 block text-sm text-muted-foreground">
            {t("age.months")}
          </label>
          <NativeSelect
            id={`${id}-months`}
            disabled={unknown}
            value={unknown || !value.mode ? "" : String(value.months)}
            onChange={(e) => setNumbers({ months: Number(e.target.value) || 0 })}
          >
            <option value="" disabled>
              {t("age.choose")}
            </option>
            {Array.from({ length: 12 }, (_, n) => (
              <option key={n} value={n}>
                {t("age.monthsCount", { count: n })}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip
          selected={estimated}
          disabled={unknown}
          onClick={() => onChange({ ...value, mode: estimated ? (value.mode ? "known" : "") : "estimated" })}
        >
          {t("age.estimated")}
        </Chip>
        <Chip
          selected={unknown}
          onClick={() => onChange(unknown ? { mode: "", years: 0, months: 0 } : { mode: "unknown", years: 0, months: 0 })}
        >
          {t("age.unknown")}
        </Chip>
      </div>
    </fieldset>
  );
}
