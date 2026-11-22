import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import { REGISTER_ROW } from "@/components/shared/register";
import { SPECIES_ICON } from "@/components/shared/species";
import { Button } from "@/components/ui/button";
import { answeredCount } from "@/data/pets";
import { useDemo } from "@/state/demo/context";

/**
 * My pets (§17). A tab of the owner space since Audit 1.3 LOT 04 — a root
 * screen, so it carries no Back control.
 *
 * The screen that makes multi-pet real: Nidz no longer assumes one animal, so
 * there has to be somewhere the whole household lives.
 *
 * A register, not a grid of cards. These are a handful of rows that get read
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
  const { state } = useDemo();
  const pets = state.pets;

  return (
    <div className="container py-10 md:py-14">
      <Helmet>
        <title>
          {t("common.appName")} — {t("pets.title")}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto max-w-[720px]">
        <h1 className="text-h1 font-semibold text-foreground md:text-h1-lg">{t("pets.title")}</h1>
        <p className="mt-4 max-w-[64ch] text-lg leading-relaxed text-muted-foreground">{t("pets.intro")}</p>

        {pets.length === 0 ? (
          <EmptyState
            className="mt-10"
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
            <div className="mt-10">
              {pets.map((pet) => {
                const Icon = SPECIES_ICON[pet.species];
                const { answered, total } = answeredCount(pet);
                return (
                  <Link key={pet.id} to={`/owner/pets/${pet.id}`} className={REGISTER_ROW}>
                    <span className="flex min-w-0 items-center gap-4">
                      {pet.photoUrl ? (
                        <img src={pet.photoUrl} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand"
                        >
                          <Icon className="size-5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block font-medium text-foreground">
                          <bdi>{pet.name}</bdi>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {t(`species.${pet.species}`)}
                          {" · "}
                          {t("pets.answered", { answered, total })}
                        </span>
                      </span>
                    </span>
                    <ArrowRight
                      className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/owner/pets/new">
                  <Plus className="size-4" aria-hidden="true" />
                  {t("pets.add")}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
