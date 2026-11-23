import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* Nidz 1.4 — every button is a pill (design system amendment 0.1-C).

   The shape is taken from iOS notifications: a fully rounded capsule, a
   semibold label, an optional leading icon. One shape for every action means
   the eye learns "this is something I can press" once.

   Press feedback is a 0.97 scale over 150ms with a strong ease-out (Emil
   Kowalski): instant enough to feel like the button heard the finger, short
   enough never to delay what the press does. Reduced motion collapses it via
   the global rule in index.css. */
const buttonVariants = cva(
  [
    /* border-transparent: forced-colours mode drops box shadows, and then
       draws this border so every pill keeps an edge. */
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-semibold",
    "ring-offset-background transition-[transform,background-color,box-shadow,color] duration-150 ease-out active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /* The one action colour. */
        default: "bg-primary text-primary-foreground shadow-pill hover:bg-primary-hover",
        destructive: "bg-destructive text-destructive-foreground shadow-pill hover:bg-destructive/90",
        /* A white pill. On the mist ground it lifts on its own shadow; inside
           a white card the input-coloured ring carries the boundary. */
        outline:
          "bg-card text-foreground shadow-[inset_0_0_0_1px_hsl(var(--input))] hover:bg-secondary",
        /* The resting secondary action on the ground: white, soft shadow. */
        surface: "bg-card text-foreground shadow-pill hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline active:scale-100",
      },
      /* Nidz targets ~44px for important actions (design system §17).
         `sm` is for dense, secondary controls — never a page's primary. */
      size: {
        default: "h-11 px-5 text-[0.9375rem]",
        sm: "h-9 px-4 text-sm",
        /* Large pills may wrap: a translated label in a wide face can be
           longer than a 320px screen, and a second line inside the capsule
           beats a page that scrolls sideways. */
        lg: "min-h-[3.25rem] max-w-full whitespace-normal px-6 py-2.5 text-center text-base leading-tight [text-wrap:balance]",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
