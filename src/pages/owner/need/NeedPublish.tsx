import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { HandHeart, Megaphone, ShieldCheck, UserCheck } from "lucide-react";

import { AnimalPortrait } from "@/components/illustrations/animals";
import FlowScreen from "@/components/shared/FlowScreen";
import { SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { placeName } from "@/data/algeria";
import { postPath } from "@/data/navigation";
import { forSharing, kindLabel } from "@/data/pets";
import { duplicateOpenPost, publicNameOf, type CarePost } from "@/data/publications";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { formatDateRange } from "@/utils/dates";
import { isolate } from "@/utils/format";

import { stepPath, useNeedFlow } from "./animal-draft";

/**
 * « Publier votre demande de garde » (Nidz 1.7 §13.2) — the confirmation that
 * stands between « Publier ma demande » and anything being published.
 *
 * It says, in four lines, what publishing does and does not do: the request
 * goes to the feed of nearby sitters; interested sitters propose; the owner
 * chooses freely, or chooses nobody; and nothing is reserved or confirmed by
 * publishing. Then what sitters will see — the animal, the service, the dates
 * and the approximate area — and what they will not: no phone number, no
 * address, no surname.
 *
 * « Continuer » publishes ONCE: the id is minted when the screen opens, the
 * reducer ignores a second publish with the same id, and the same animal,
 * service and dates already open is refused as a duplicate with a link to it.
 * « Retour » goes back to the care step with every answer kept.
 */
export default function NeedPublish() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const { state } = useDemo();
  const save = useSave();
  const [postId] = useState(() => `post-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);

  const need = state.need;
  const pet = state.pets.find((p) => p.id === need.petId);
  const account = state.account;
  if (!account) return <Navigate to="/welcome" replace />;
  if (!pet || !need.wilayaCode) return <Navigate to={stepPath("pet", "")} replace />;
  if (!need.careType || !need.dates) return <Navigate to={stepPath("care", flow.search)} replace />;

  const duplicate = duplicateOpenPost(state.posts, {
    petId: pet.id,
    petName: pet.name,
    careType: need.careType,
    dates: need.dates,
  });

  const publish = () => {
    if (duplicate || !need.careType || !need.dates || !need.wilayaCode) return;
    const at = new Date().toISOString();
    const post: CarePost = {
      id: postId,
      createdAt: at,
      updatedAt: at,
      pet: forSharing(pet),
      petId: pet.id,
      careType: need.careType,
      dates: need.dates,
      wilayaCode: need.wilayaCode,
      communeCode: need.communeCode,
      ownerName: publicNameOf(account),
      status: "open",
      acceptedProposalId: null,
      isDemoFixture: false,
    };
    const saved = save.save({ type: "publishPost", post });
    if (saved) navigate(`${postPath("owner", post.id)}?published=1`, { replace: true });
  };

  const area = placeName({ wilayaCode: need.wilayaCode, communeCode: need.communeCode }, locale);
  const kind = kindLabel(pet, locale);
  const animal = pet.species === "other" ? pet.otherCategory : t(`species.${pet.species}`);

  const points = [
    { icon: Megaphone, key: "feed" },
    { icon: HandHeart, key: "propose" },
    { icon: UserCheck, key: "choose" },
    { icon: ShieldCheck, key: "noBooking" },
  ] as const;

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("publish.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={stepPath("care", flow.search)}
        title={t("publish.title")}
        action={
          <Button type="button" size="lg" onClick={publish} disabled={Boolean(duplicate)}>
            {t("common.continue")}
          </Button>
        }
        secondaryAction={
          <Button asChild size="lg" variant="surface">
            <Link to={stepPath("care", flow.search)} replace>
              {t("publish.back")}
            </Link>
          </Button>
        }
      >
        <ul role="list" className="grid gap-4">
          {points.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-start gap-3.5">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <p className="pt-2 text-[0.9375rem] leading-relaxed text-foreground">{t(`publish.points.${key}`)}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="publish-preview" className="mt-8">
          <h2 id="publish-preview" className="text-title font-semibold text-foreground">
            {t("publish.previewTitle")}
          </h2>
          <div className="surface mt-3 flex gap-3.5 p-3.5">
            <AnimalPortrait species={pet.species} className="size-16 shrink-0 rounded-lg" sizes="64px" />
            <div className="min-w-0 text-sm">
              <p className="text-[0.9375rem] font-semibold text-foreground">
                <bdi>{pet.name}</bdi> · {animal}
                {kind ? ` · ${kind}` : ""}
              </p>
              <p className="mt-1 text-foreground">
                {t(`care.${need.careType}`)} · {formatDateRange(need.dates, locale)}
              </p>
              <p className="mt-1 text-muted-foreground">{isolate(area ?? "")}</p>
              <p className="mt-1 text-muted-foreground">
                {pet.notes.trim() ? t("publish.needsShared") : pet.needsStatus === "nothing" ? t("publish.needsNothing") : t("publish.needsNone")}
              </p>
            </div>
          </div>
          <p className="mt-3 px-1 text-sm text-muted-foreground">{t("publish.privacy", { name: isolate(publicNameOf(account)) })}</p>
        </section>

        {duplicate && (
          <div role="alert" className="surface mt-6 p-4">
            <p className="font-semibold text-foreground">{t("publish.duplicateTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("publish.duplicateBody")}</p>
            <Button asChild variant="surface" className="mt-3">
              <Link to={postPath("owner", duplicate.id)}>{t("publish.duplicateOpen")}</Link>
            </Button>
          </div>
        )}

        <DemoNotice className="mt-8" title={t("publish.demoTitle")} body={t("publish.demoBody")} />
        <SaveFeedback save={save} onRetry={publish} />
      </FlowScreen>
    </>
  );
}
