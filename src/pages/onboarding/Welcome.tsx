import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, House, ListChecks, PawPrint, Search, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import HomeHero from "@/components/home/HomeHero";
import { HomeHeart } from "@/components/icons/nidz-icons";
import { AnimalCategoryPicker } from "@/components/shared/AnimalCategories";
import BrandMark from "@/components/shared/BrandMark";
import InfoTip from "@/components/shared/InfoTip";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import type { Species } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/* Four of the profile's sections, named. Rates is here because it is the thing
   a prospective sitter most wants to know they control. */
const SITTER_PREVIEW: { key: string; icon: LucideIcon }[] = [
  { key: "home", icon: House },
  { key: "animals", icon: PawPrint },
  { key: "limits", icon: ListChecks },
  { key: "rates", icon: Wallet },
];

/**
 * The entry screen — the first "Accueil" (Nidz 1.4, step 2).
 *
 * BOTH DOORS ON THE FIRST SCREEN (Audit 1.3 LOT 02, kept). The deep-teal
 * card carries the approved title and subtitle over the three animals; the
 * two actions sit directly under it — "Trouver une garde" (teal pill, the
 * more frequent path) and "Devenir pet-sitter" (white pill, same size, so it
 * is as findable without competing as a second primary). Everything else
 * explains the two paths and comes after them. e2e lot02 holds both actions
 * inside the first screen down to 320×568.
 *
 * No splash, no timed reveal: the screen is ready on first paint.
 *
 * WHAT THE PICTURES ARE. Illustrations of a dog, a cat and a goldfinch — the
 * categories Nidz handles — and never anything that could pass for a sitter,
 * a member or a review (§21, §40). Each world is previewed by its own real
 * first control (the animal cards) or by the real list of what it asks (the
 * sitter's four sections).
 *
 * Choosing records no role — see `src/data/workspace.ts`; the line under the
 * actions says so, and the "!" beside it explains.
 */
export default function Welcome() {
  const { t } = useTranslation();
  const { dispatch } = useDemo();
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);

  /* What `FlowScreen` does for every other screen. React Router resets neither
     scroll nor focus, and `/start` — still the back target of
     `/owner/need/pet` and `/sitter/start` — redirects here. No visible ring:
     `:focus-visible` also matches programmatic focus. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  /* Acting on this screen is what "has been introduced" means: after it, `/`
     is the home rather than the introduction again. */
  const enter = () => dispatch({ type: "enter" });

  const findCare = () => {
    enter();
    navigate("/owner/need/pet");
  };

  const chooseSpecies = (species: Species) => {
    enter();
    /* Carried into the need flow so the first step arrives already answered.
       `petId: null` because choosing a species here is the start of describing
       an animal, not a filter over one already chosen. */
    dispatch({ type: "setNeed", patch: { species, petId: null } });
    navigate("/owner/need/pet");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {t("entry.title")}
        </title>
        <meta name="description" content={t("entry.subtitle")} />
      </Helmet>

      {/* No back control: a root screen. Language is reachable from the very
          first screen of a trilingual product — detection can land an
          Algerian visitor in English (§34). */}
      <header className="container">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between gap-4 md:h-[4.5rem]">
          <BrandMark />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 pb-14">
        <div className="container">
          <div className="mx-auto max-w-[1080px]">
            <HomeHero ref={heading} />

            <div className="mt-4 grid gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
              <Button type="button" size="lg" onClick={findCare} className="w-full sm:w-auto sm:min-w-60">
                <Search aria-hidden="true" />
                {t("entry.findCare")}
              </Button>
              {/* White, not a second filled primary — but the same size and
                  width, so it is as findable as the owner's path. */}
              <Button asChild size="lg" variant="surface" className="w-full sm:w-auto sm:min-w-60">
                <Link to="/sitter/start" onClick={enter}>
                  <HomeHeart aria-hidden="true" />
                  {t("entry.becomeSitter")}
                </Link>
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 px-1 text-sm text-muted-foreground">
              {t("entry.bothSides")}
              <InfoTip topic={t("entry.bothSides")}>{t("entry.bothSidesInfo")}</InfoTip>
            </p>

            <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-8">
              {/* ------------------------------------------- owner: discovery */}
              <section aria-labelledby="entry-animals">
                <div className="flex items-end justify-between gap-4">
                  <h2 id="entry-animals" className="text-title font-semibold text-foreground">
                    {t("entry.animalsTitle")}
                  </h2>
                  {/* The no-commitment path (§15): browsing needs no account
                      and no brief. */}
                  <Link
                    to="/search"
                    onClick={enter}
                    className="-me-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-primary hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("entry.browse")}
                    <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </div>
                {/* Buttons that navigate — the choice IS the action, and it
                    answers the need flow's first question. */}
                <AnimalCategoryPicker className="mt-4" labelledBy="entry-animals" onPick={chooseSpecies} />
                <p className="mt-3 px-1 text-sm text-muted-foreground">{t("entry.animalsHint")}</p>
              </section>

              {/* ------------------------------------------ sitter: the activity */}
              <section aria-labelledby="entry-sitter" className="surface flex flex-col p-5 md:p-6">
                <h2 id="entry-sitter" className="text-title font-semibold text-foreground">
                  {t("entry.sitterTitle")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("entry.sitterBody")}</p>
                {/* The actual sections of the sitter profile, named. */}
                <ul role="list" className="mt-5 grid gap-3">
                  {SITTER_PREVIEW.map(({ key, icon: Icon }) => (
                    <li key={key} className="flex items-center gap-3 text-sm text-foreground">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Icon className="size-[1.125rem]" />
                      </span>
                      <span>{t(`entry.sitterPreview.${key}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/sitter/start"
                  onClick={enter}
                  className="-ms-2 mt-5 inline-flex min-h-11 items-center gap-1 self-start rounded-full px-2 text-sm font-semibold text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("entry.sitterCta")}
                  <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
