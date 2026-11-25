import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/* The phone's own picker (a wheel on iOS, a sheet on Android) is the
   fastest control for a short closed list — an age, an animal, a breed. Styled
   to sit with the inputs, with a drawn chevron because `appearance-none`
   removes the native one. The chevron follows the reading direction. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2354635F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function NativeSelect(
  { className, style, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-md border border-input bg-card pe-9 ps-3 text-base text-foreground",
        "bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat rtl:bg-[position:left_0.75rem_center]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    />
  );
});

export default NativeSelect;
