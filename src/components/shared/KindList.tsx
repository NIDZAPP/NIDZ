import { Check, Search } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { classificationOf } from "@/data/animal-catalogue";
import { searchKinds } from "@/data/animal-kinds";
import type { Species } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   A CATEGORY'S BREEDS OR SPECIES, SEARCHABLE (Nidz 1.7 §7, §19).

   The whole list, in the catalogue's practical order, filtered as the person
   types — in any of the three languages and by the common other names
   (« pitbull » finds the American Staffordshire, « maknine » the goldfinch).
   No illustration per breed: the list is text, and long.

     single  the owner's « Quelle est la race de votre animal ? » — a radio
             group (one choice, arrow keys move it).
     multi   the sitter's « Certaines races uniquement » — checkboxes.

   The rows are 48px tall: a long list read with a thumb, not a mouse.
   ------------------------------------------------------------------------ */

type Props = {
  species: Species;
  labelledBy?: string;
  className?: string;
  /** Max height of the scrolling list; the page scrolls when omitted. */
  listClassName?: string;
} & ({ mode: "single"; value: string | null; onChange: (id: string) => void } | { mode: "multi"; values: readonly string[]; onToggle: (id: string) => void });

export default function KindList(props: Props) {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const [query, setQuery] = useState("");
  const list = useRef<HTMLUListElement>(null);
  const classification = classificationOf(props.species) ?? "breed";
  const kinds = useMemo(() => searchKinds(props.species, query), [props.species, query]);

  const isOn = (id: string) => (props.mode === "single" ? props.value === id : props.values.includes(id));
  const press = (id: string) => (props.mode === "single" ? props.onChange(id) : props.onToggle(id));

  /* Single mode is one tab stop: the chosen row, else the first. */
  const tabTarget = props.mode === "single" ? (kinds.find((k) => isOn(k.id))?.id ?? kinds[0]?.id) : null;

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (props.mode !== "single") return;
    const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const next =
      event.key === "ArrowDown" ? index + 1 : event.key === "ArrowUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = buttons[Math.max(0, Math.min(buttons.length - 1, next))];
    target?.focus();
    const id = target?.dataset.kind;
    if (id) press(id);
  };

  return (
    <div className={className(props.className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(`catalogue.search.${classification}`)}
          aria-label={t(`catalogue.search.${classification}`)}
          className="ps-11"
          autoComplete="off"
          enterKeyHint="search"
          onKeyDown={(e) => {
            /* Enter in a search box inside a form would submit the step. */
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </div>

      {kinds.length === 0 ? (
        <p role="status" className="mt-4 px-1 text-sm text-muted-foreground">
          {t("catalogue.noMatch", { query: query.trim() })}
        </p>
      ) : (
        <ul
          ref={list}
          role={props.mode === "single" ? "radiogroup" : "group"}
          aria-labelledby={props.labelledBy}
          onKeyDown={onKeyDown}
          className={cn("surface mt-3 divide-y divide-border overflow-y-auto overscroll-contain p-1", props.listClassName)}
        >
          {kinds.map((kind) => {
            const on = isOn(kind.id);
            return (
              <li key={kind.id}>
                <button
                  type="button"
                  data-kind={kind.id}
                  role={props.mode === "single" ? "radio" : "checkbox"}
                  aria-checked={on}
                  tabIndex={props.mode === "single" ? (kind.id === tabTarget ? 0 : -1) : 0}
                  onClick={() => press(kind.id)}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-start text-[0.9375rem] transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    on ? "bg-primary-soft font-semibold text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span className="min-w-0 flex-1">{kind.name[lng]}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center border transition-colors duration-150",
                      props.mode === "single" ? "rounded-full" : "rounded-md",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
                    )}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const className = (extra?: string) => cn("min-w-0", extra);
