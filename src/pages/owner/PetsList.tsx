import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { answeredCount, kindLabel } from "@/data/pets";
import { useAppLocale } from "@/hooks/use-locale";
import { useDemo } from "@/state/demo/context";

/**
 * My pets (§17). A tab of the owner space since Audit 1.3 LOT 04 — a root
 * screen, so it carries no Back control.
 *
 * The screen that makes multi-pet real: Nidz no longer assumes one animal, so
 * there has to be somewhere the whole household lives.
 *
 * 1.4: a gallery of animal cards (was a register). These are a handful of rows that get read
 * top to bottom, and a card each would be four borders per animal on a white
 * ground for no gain (see the note at the top of `src/index.css`).
 *
 * The count beside each animal is ADMINISTRATIVE — how many questions have
 * been answered. §118's rule applies to animals as much as to sitters: it is
 * never quality, health or suitability, and the copy says what it is for, which
 * is deciding whether a sitter can judge this animal properly.
 */
export default function PetsList() {
  const { t } = useTranslation();
  const lng = useAppLocale();
  const { state } = useDemo();
  const pets = state.pets;

  return (
    <div className="container pb-10 pt-4 md:pb-16 md:pt-8">
      <Helmet>
        <title>
          {t("common.appName")} — {t("pets.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("pets.title")}</h1>
        <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-muted-foreground">{t("pets.intro")}</p>

        {pets.length === 0 ? (
          <EmptyState
            className="mt-6"
            art={
              <span aria-hidden="true" className="flex -space-x-4 rtl:space-x-reverse">
                {(["dog", "cat", "bird"] as const).map((sp) => (
                  <AnimalPortrait key={sp} species={sp} className="size-16 rounded-full ring-4 ring-card" />
                ))}
              </span>
            }
            title={t("pets.empty.title")}
            body={t("pets.empty.body")}
            action={
              <Button asChild size="lg">
                <Link to="/owner/pets/new">{t("pets.add")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* A gallery: each animal is a card with its picture — the owner's
                own photo when they added one, else its species portrait. */}
            <ul role="list" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {pets.map((pet) => {
                const { answered, total } = answeredCount(pet);
                const kind = kindLabel(pet, lng);
                return (
                  <li key={pet.id}>
                    <Link
                      to={`/owner/pets/${pet.id}`}
                      className="surface surface-press flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {pet.photoUrl ? (
                        <img src={pet.photoUrl} alt="" className="aspect-square w-full object-cover" />
                      ) : (
                        <AnimalPortrait species={pet.species} className="aspect-square w-full" />
                      )}
                      <span className="flex flex-1 flex-col p-3.5">
                        <span className="block truncate text-name font-semibold text-foreground">
                          <bdi>{pet.name}</bdi>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {[t(`species.${pet.species}`), kind].filter(Boolean).join(" · ")}
                        </span>
                        {/* Administrative only (§118): what a sitter can still
                            not see — never a score for the animal. */}
                        <span className="mt-auto pt-2.5 text-xs text-muted-foreground">
                          {t("pets.answered", { answered, total })}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  to="/owner/pets/new"
                  className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input/50 p-4 text-center text-[0.9375rem] font-semibold text-primary transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-primary-soft">
                    <Plus className="size-6" />
                  </span>
                  {t("pets.add")}
                </Link>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
