import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Other spellings this option should be findable by — the same place in
      another language, an alternative transliteration. Never displayed. */
  keywords?: string[];
};

/**
 * A searchable single-choice field.
 *
 * Why this exists rather than a `Select`: Algeria has 69 wilayas and Tizi Ouzou
 * alone has 67 communes. A native option list that long is a scroll hunt on a
 * phone, and it asks the user to already know how Nidz spells a place. §32 is
 * explicit that a long administrative list is a searchable combobox.
 *
 * The search is folded, not literal — see `foldForSearch` in
 * `src/data/algeria`. Someone looking for "Béjaïa" types "bejaia"; someone
 * typing Arabic may leave out the harakat, and alef has several forms that
 * different keyboards reach with different effort. Matching raw strings would
 * make the field usable only by people who already know the exact spelling,
 * which is the opposite of what searching is for.
 *
 * Accessibility comes from Radix Popover plus cmdk: the listbox is a real
 * listbox, arrow keys and Home/End work, typing filters, Escape closes and
 * focus returns to the trigger. The trigger is a button carrying the field's
 * label and description, so it announces like the form control it replaces.
 */
export default function Combobox({
  id,
  labelledBy,
  describedBy,
  invalid,
  triggerRef,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
  /** Folds a query and a candidate to a comparable form. Injected rather than
      imported so this component stays a generic control and the geography
      module keeps its own normalisation rules. */
  fold,
  className,
}: {
  id?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  triggerRef?: React.Ref<HTMLButtonElement>;
  value: string | null;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  fold: (value: string) => string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          ref={triggerRef}
          role="combobox"
          aria-expanded={open}
          aria-labelledby={labelledBy && id ? `${labelledBy} ${id}` : labelledBy}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-4 py-2 text-start text-base",
            "transition-[box-shadow,border-color,background-color] duration-150 hover:bg-secondary",
            "focus-visible:border-primary focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
            "aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "font-light text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      {/* Matched to the trigger's width so the list never opens narrower than
          the longest place name it contains. */}
      <PopoverContent className="w-[--radix-popover-trigger-width] overflow-hidden p-0" align="start">
        <Command
          filter={(candidate, search, keywords) => {
            const needle = fold(search);
            if (!needle) return 1;
            const hay = fold([candidate, ...(keywords ?? [])].join(" "));
            return hay.includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={option.keywords}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {/* Slot always reserved, so filtering never shifts the list
                      sideways under the pointer. */}
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                    {option.value === value && <Check className="size-4 text-primary" />}
                  </span>
                  <span className="ms-2 min-w-0 flex-1 truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
