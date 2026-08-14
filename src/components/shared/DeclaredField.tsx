import { useId } from "react";
import { useTranslation } from "react-i18next";

import { ChipGroup } from "@/components/shared/Chip";
import type { Declared } from "@/data/pets";

/* Two answers and a way back out of them.
 *
 * `unknown` is what a question nobody touched already stores, so it cannot be
 * drawn as a chosen answer: doing so opened every question with "I don't know"
 * pre-selected — teal fill and check glyph, this system's own signal for "you
 * chose this" — on a form the user had not touched, and contradicted the
 * dashboard, which counted the same section as unanswered.
 *
 * So `unknown` selects nothing. The third chip stays because `ChipGroup` is a
 * Radix RadioGroup with no deselect, and without it one mis-tap would become a
 * permanent declaration; it is labelled as the action it performs rather than
 * as an answer, so clearing the row is the expected result of pressing it. */
const OPTIONS: readonly Declared[] = ["yes", "no", "unknown"];

/**
 * A yes / no / left-blank question.
 *
 * The three-state control that both sides of the marketplace need: an owner
 * saying whether their cat is comfortable around dogs, and a sitter saying
 * whether they can give oral medication. Two states would force a lie in
 * exactly the same way on both — someone who has never been asked cannot
 * honestly answer "no", and a "no" they did not mean has consequences (an
 * owner filtered out of a good match, a sitter filtered out of work they could
 * do).
 *
 * Nothing is selected until the user selects it, so a skipped question stays
 * skipped rather than quietly becoming a claim.
 */
export default function DeclaredField({
  label,
  help,
  value,
  onChange,
  className,
}: {
  label: string;
  help?: string;
  value: Declared;
  onChange: (next: Declared) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className={className}>
      <p id={id} className="text-sm font-medium text-foreground">
        {label}
      </p>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-sm text-muted-foreground">
          {help}
        </p>
      )}
      <ChipGroup
        className="mt-2"
        labelledBy={id}
        /* `unknown` is the absence of an answer, so it draws no selection. */
        value={value === "unknown" ? null : value}
        onChange={onChange}
        options={OPTIONS.map((option) => ({
          value: option,
          label: t(`pets.declared.${option}`),
        }))}
      />
    </div>
  );
}
