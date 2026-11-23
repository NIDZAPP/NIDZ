import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import { HeroScene } from "@/components/illustrations/animals";
import { cn } from "@/lib/utils";

/**
 * The home's first object: the promise and the animals, on the deep-teal
 * field (Nidz 1.4, step 2).
 *
 * The title and the subtitle are fixed copy, approved word for word
 * (design system amendment 0.1, « Accueil »). The picture is a dog, a cat and
 * a goldfinch — the three animals Nidz handles — and nothing that could pass
 * for a member, a review or a photograph of a real sitter.
 *
 * Compact by construction: on a short screen (under 640px of height) the
 * picture steps aside so the two actions below the card stay in the first
 * screen (e2e lot02 checks both at 320×568).
 */
const HomeHero = forwardRef<HTMLHeadingElement, { className?: string; headingClassName?: string }>(
  function HomeHero({ className, headingClassName }, ref) {
    const { t } = useTranslation();
    return (
      <section
        aria-labelledby="home-hero-title"
        className={cn(
          "relative overflow-hidden rounded-3xl bg-primary-deep text-white shadow-card",
          "md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-end",
          className,
        )}
      >
        <div className="relative z-10 px-6 pb-2 pt-7 md:px-10 md:pb-12 md:pt-12">
          <h1
            id="home-hero-title"
            ref={ref}
            tabIndex={-1}
            className={cn(
              "max-w-[16ch] text-[clamp(1.75rem,8.4vw,2.125rem)] font-semibold leading-[1.08] tracking-[-0.03em] focus:outline-none md:text-display-lg",
              headingClassName,
            )}
          >
            {t("entry.title")}
          </h1>
          <p className="mt-3 max-w-[34ch] text-base leading-relaxed text-primary-on-deep md:mt-5 md:text-lg">
            {t("entry.subtitle")}
          </p>
        </div>
        <div className="[@media(max-height:640px)]:hidden">
          <HeroScene className="-mb-px h-auto w-full md:mt-6" />
        </div>
      </section>
    );
  },
);

export default HomeHero;
