import { useEffect, useRef, useState } from "react";
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
import { SPLASH_KEY } from "@/state/splash";

/* The splash is a state of this screen, not a route of its own: a route would
   be a back-button trap, a thing a deep link could land on, and a flash of
   empty page. The key it remembers itself by lives in `src/state/splash.ts` —
   see the note there. */

function shouldSplash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(SPLASH_KEY)) return false;
    /* Never animate at someone who asked not to be animated at (§24). */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  } catch {
    return false;
  }
}


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
 * The entry screen — one screen, not two.
 *
 * Audit 1.1 split this in half: a headline with a "Get started" button, then a
 * separate screen asking which of two things you wanted. The first screen
 * disclosed nothing, so progressive disclosure (§4.5) did not justify it — it
 * was an interstitial standing in front of the real decision. Merged, and
 * `/start` now redirects here so every existing deep link and every `useBack`
 * fallback still resolves.
 *
 * WHY THE "PREVIEW OF EACH WORLD" (§13) IS NOT A PICTURE.
 *
 * The audit asks each choice to show a small visual preview of the workflow it
 * leads to, and suggests sitter photographs and avatar clusters. Nidz has no
 * sitter photographs — stock portraits presented as members are an anti-pattern
 * (§21, §40) and there are no real sitters to photograph. It also has no
 * results before a brief exists, no counts, no ratings and no reviews. Any
 * rendered mock of either world would depict data that does not exist. That is
 * not a preview; it is a fabrication with rounded corners.
 *
 * So the preview of a world is that world's own first control, live:
 *
 *   - The owner world is a question that turns into a list, so it shows the
 *     actual first question, and answering it here removes a tap later rather
 *     than adding one.
 *   - The sitter world is a structured declaration, so it names the actual
 *     sections that will be asked for. It sets the honest expectation that this
 *     path is longer.
 *
 * Nothing is depicted. Both are true.
 *
 * The two panels differ in KIND, not in colour: the owner's is lateral (a row
 * of choices, choose and go), the sitter's is vertical (a sequence of things
 * you will describe). That reads as two workflows at a glance and costs no new
 * tokens. Choosing records no role — see `src/data/workspace.ts`; the line at
 * the bottom says so out loud rather than hiding it in a tooltip.
 */
export default function Welcome() {
  const { t } = useTranslation();
  const { dispatch } = useDemo();
  const navigate = useNavigate();
  const [splash, setSplash] = useState(shouldSplash);
  const heading = useRef<HTMLHeadingElement>(null);

  /* What `FlowScreen` does for every other screen, and what this one lost by
     no longer being one. React Router resets neither scroll nor focus, and
     `/start` — still the back target of `/owner/need/pet` and `/sitter/start` —
     now redirects here. Without this, going back from either lands a keyboard
     user on <body>, part-way down a screen that is much taller than the one it
     replaced, with nothing announced.

     No visible ring: `:focus-visible` also matches programmatic focus, so a
     ring would box the heading on every arrival including mouse ones. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  /* Acting on this screen is what "has been introduced" means: after it, `/`
     is the home rather than the introduction again. */
  const enter = () => dispatch({ type: "enter" });

  const chooseSpecies = (species: Species) => {
    enter();
    /* Carried into the need flow so the first step arrives already answered.
       This is the whole reason the preview is the real control and not a
       decorative illustration of one.

       `petId: null` is not tidiness. `NeedPet` resolves the saved pet BEFORE
       the declared species, so leaving a previous selection behind means
       someone who saved a dog, came back here and tapped Cat would land on a
       form pre-filled with the dog — name, age, notes, photo — and submitting
       it would overwrite that dog under its own id. Choosing a species here is
       the start of describing an animal, not a filter over one already chosen. */
    dispatch({ type: "setNeed", patch: { species, petId: null } });
    navigate("/owner/need/pet");
  };

  useEffect(() => {
    if (!splash) return;
    const timer = window.setTimeout(() => {
      setSplash(false);
      try {
        window.sessionStorage.setItem(SPLASH_KEY, "1");
      } catch {
        /* Private mode: the wordmark shows once per navigation instead. */
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [splash]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Helmet>
        <title>
          {t("common.appName")} — {t("entry.title")}
        </title>
        <meta name="description" content={t("entry.intro")} />
      </Helmet>

      {splash && (
        <div
          aria-hidden="true"
          /* `pointer-events-none` because the introduction underneath is
             already interactive — the wordmark is a cover, not a gate, and an
             overlay that swallows taps would be the artificial delay the audit
             rules out.

             It fades into a masthead of the same colour, so the splash settles
             into place rather than lifting like a curtain off a different
             screen. Motion with a cause, which is the only kind §24 allows. */
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-brand-soft motion-safe:animate-fade-out motion-safe:[animation-delay:550ms] motion-safe:[animation-fill-mode:forwards]"
        >
          <span className="flex items-center gap-3">
            <PawPrint className="size-8 text-brand" />
            <span className="text-h1-lg font-semibold tracking-tight text-foreground">
              {t("common.appName")}
            </span>
          </span>
        </div>
      )}

      {/* No back control: this is a root screen (Audit p.23). Language has to be
          reachable from the very first screen in a trilingual product — detection
          can land an Algerian visitor in English (§34). */}
      <div className="bg-brand-soft">
        <div className="container flex h-14 items-center justify-end">
          <LanguageSwitcher />
        </div>
      </div>

      <main className="flex-1">
        {/* The one warm surface on the screen, and one of only three in the
            product. Removing the cream ground left `brand-soft` carrying the
            whole warm half of the brand, so where it lands is no longer
            decoration — see src/index.css. */}
        <div className="bg-brand-soft pb-10 pt-2">
          <div className="container">
            <div className="mx-auto max-w-[960px]">
              <PawPrint className="mb-6 size-8 text-brand" aria-hidden="true" />
              <h1
                ref={heading}
                tabIndex={-1}
                className="max-w-[22ch] text-h1 font-semibold text-foreground focus:outline-none md:text-h1-lg"
              >
                {t("entry.title")}
              </h1>
              <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
                {t("entry.intro")}
              </p>
            </div>
          </div>
        </div>

        <div className="container py-10 md:py-14">
          <div className="mx-auto grid max-w-[960px] gap-10 md:grid-cols-2 md:gap-12">
            {/* ---------------------------------------------------- owner */}
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
              {/* Buttons that navigate, not form controls — nothing is being
                  submitted, and the choice IS the action. Same silhouette as
                  `Chip` so the two read as the same level of decision, without
                  borrowing its radio semantics. */}
              <div
                role="group"
                aria-labelledby="entry-species"
                className="mt-3 flex flex-wrap gap-2"
              >
                {SPECIES.map((species) => {
                  const Icon = SPECIES_ICON[species];
                  return (
                    <button
                      key={species}
                      type="button"
                      onClick={() => chooseSpecies(species)}
                      /* The visually dominant interactive group on this screen.
                         The owner path is the higher-frequency one, so it gets
                         the weight; the sitter panel's single outline button
                         sits lower and lighter. Equal structural weight — both
                         are full sections with a heading and a preview —
                         unequal visual weight, deliberately. */
                      className="inline-flex min-h-14 items-center gap-2.5 rounded-md border border-input px-5 text-base font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {t(`species.${species}`)}
                    </button>
                  );
                })}
              </div>

              {/* The no-commitment path (§15): browsing needs no account and no
                  brief. Deliberately not "I already have an account" — there is
                  no sign-in, no session and no server, so an authentication
                  affordance here would promise something Nidz cannot do. */}
              <p className="mt-5 text-sm">
                <Link
                  to="/search"
                  onClick={enter}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("entry.browse")}
                </Link>
              </p>
            </section>

            {/* --------------------------------------------------- sitter */}
            {/* The rule rotates to the inline start on desktop, which is the
                idiom /search already uses for its rail — and which gives RTL
                for free, because `border-s` is logical. */}
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

              <div className="mt-6">
                {/* Not `size="lg"`, and not full-width: it was the only large
                    filled-width control on the screen, which made the sitter
                    path look like the primary one in an owner-first
                    marketplace. */}
                <Button asChild variant="outline">
                  <Link to="/sitter/start" onClick={enter}>
                    {t("entry.sitterCta")}
                  </Link>
                </Button>
              </div>
            </section>
          </div>

          <p className="mx-auto mt-10 max-w-[960px] text-sm text-muted-foreground">
            {t("intent.bothSides")}
          </p>
        </div>
      </main>
    </div>
  );
}
