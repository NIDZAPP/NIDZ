import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Dog, House, ListChecks, PawPrint, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { SPECIES_ICON } from "@/components/shared/species";
import { Button } from "@/components/ui/button";
import { SPECIES, type Species } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/* Four of the profile's sections, named. Rates is here because it is the thing
   a prospective sitter most wants to know they control, and leaving it out
   under-stated how much this path asks for — which is the opposite of what the
   preview is for. */
const SITTER_PREVIEW: { key: string; icon: LucideIcon }[] = [
  { key: "home", icon: House },
  { key: "animals", icon: Dog },
  { key: "limits", icon: ListChecks },
  { key: "rates", icon: Wallet },
];

/**
 * The entry screen.
 *
 * AUDIT 1.3 LOT 02 — BOTH DOORS ON THE FIRST SCREEN.
 *
 * At 390×844 the 1.2 version put "become a sitter" below the fold: a tall
 * masthead with a paragraph of introduction stood above the two choices, and
 * the sitter's choice came after the whole owner section. Now the masthead is
 * one sentence and the two actions directly under it — "Trouver une garde"
 * (filled, the more frequent path) and "Devenir pet-sitter" (outline, the same
 * size and width, so it is equally findable without competing as a second
 * primary). Everything else on the screen explains the two paths and comes
 * after them.
 *
 * The two paths are told apart by CONTENT rather than by two equal walls of
 * text: the owner's section is discovery (pick the animal, or just look
 * around without an account); the sitter's is the activity (what you will
 * describe about how you look after animals).
 *
 * THE SPLASH IS GONE. 1.2 showed an 850 ms wordmark overlay with
 * `pointer-events-none` over an introduction that was already interactive — so
 * for most of a second the screen took taps on controls nobody could see. An
 * arbitrary delay that hides a live interface is exactly what the audit rules
 * out, and there was no loading to cover: the screen is ready on first paint.
 * The wordmark now simply sits in the top bar.
 *
 * WHY THERE IS NO PICTURE OF EACH WORLD. Nidz has no sitter photographs (stock
 * portraits presented as members are an anti-pattern, §21, §40), no results
 * before a brief exists, no counts, ratings or reviews. A rendered mock of
 * either world would depict data that does not exist, so each world is
 * previewed by its own real first control or by the real list of what it asks.
 *
 * Choosing records no role — see `src/data/workspace.ts`; the line under the
 * actions says so out loud.
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
        <meta name="description" content={t("entry.intro")} />
      </Helmet>

      {/* No back control: this is a root screen. Language has to be reachable
          from the very first screen in a trilingual product — detection can
          land an Algerian visitor in English (§34). The warm band is one of the
          three places terracotta is spent (see src/index.css). */}
      <header className="bg-brand-soft">
        <div className="container flex h-14 items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <PawPrint className="size-6 text-brand" aria-hidden="true" />
            <span className="text-lg font-semibold tracking-tight text-foreground">{t("common.appName")}</span>
          </span>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">
        <div className="bg-brand-soft pb-8 pt-4 md:pb-12 md:pt-8">
          <div className="container">
            <div className="mx-auto max-w-[960px]">
              {/* The value, in one sentence — the whole of what stands above the
                  two actions. */}
              <h1
                ref={heading}
                tabIndex={-1}
                className="max-w-[22ch] text-h1 font-semibold text-foreground focus:outline-none md:text-h1-lg"
              >
                {t("entry.title")}
              </h1>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" size="lg" onClick={findCare} className="w-full sm:w-auto sm:min-w-56">
                  {t("entry.findCare")}
                </Button>
                {/* Outline, not a second filled primary — but the same size and
                    width, so it is as findable as the owner's path. */}
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto sm:min-w-56">
                  <Link to="/sitter/start" onClick={enter}>
                    {t("entry.becomeSitter")}
                  </Link>
                </Button>
              </div>

              <p className="mt-4 max-w-[60ch] text-sm text-muted-foreground">{t("intent.bothSides")}</p>
            </div>
          </div>
        </div>

        <div className="container py-10 md:py-14">
          <div className="mx-auto grid max-w-[960px] gap-10 md:grid-cols-2 md:gap-12">
            {/* ------------------------------------------- owner: discovery */}
            <section aria-labelledby="entry-owner">
              <h2 id="entry-owner" className="text-name font-semibold text-foreground">
                {t("intent.owner")}
              </h2>
              <p className="mt-2 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
                {t("intent.ownerDescription")}
              </p>

              <p className="mt-6 text-sm font-medium text-foreground" id="entry-species">
                {t("entry.ownerPrompt")}
              </p>
              {/* Buttons that navigate, not form controls — the choice IS the
                  action, and it answers the need flow's first question. */}
              <div role="group" aria-labelledby="entry-species" className="mt-3 flex flex-wrap gap-2">
                {SPECIES.map((species) => {
                  const Icon = SPECIES_ICON[species];
                  return (
                    <button
                      key={species}
                      type="button"
                      onClick={() => chooseSpecies(species)}
                      className="inline-flex min-h-12 items-center gap-2.5 rounded-md border border-input px-5 text-base font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {t(`species.${species}`)}
                    </button>
                  );
                })}
              </div>

              {/* The no-commitment path (§15): browsing needs no account and no
                  brief. Deliberately not "I already have an account" — there is
                  no sign-in to return to. */}
              <p className="mt-5 text-sm">
                <Link
                  to="/search"
                  onClick={enter}
                  className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("entry.browse")}
                </Link>
              </p>
            </section>

            {/* ------------------------------------------ sitter: the activity */}
            <section
              aria-labelledby="entry-sitter"
              className="border-t border-border pt-10 md:border-s md:border-t-0 md:ps-12 md:pt-0"
            >
              <h2 id="entry-sitter" className="text-name font-semibold text-foreground">
                {t("intent.sitter")}
              </h2>
              <p className="mt-2 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
                {t("intent.sitterDescription")}
              </p>

              {/* The actual sections of the sitter profile, named. A preview in
                  the strict sense: these are what the flow asks for. */}
              <ul role="list" className="mt-6 space-y-2">
                {SITTER_PREVIEW.map(({ key, icon: Icon }) => (
                  <li key={key} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{t(`entry.sitterPreview.${key}`)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-sm">
                <Link
                  to="/sitter/start"
                  onClick={enter}
                  className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("entry.sitterCta")}
                </Link>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
