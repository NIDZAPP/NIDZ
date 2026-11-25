import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Megaphone, Search } from "lucide-react";

import { CARE_ICON } from "@/components/icons/domain-icons";
import FlowScreen from "@/components/shared/FlowScreen";
import OptionGroup from "@/components/shared/OptionGroup";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DateRangeField } from "@/components/shared/fields";
import { Button } from "@/components/ui/button";
import { servicesFor } from "@/data/animal-catalogue";
import { criteriaFromNeed, criteriaToParams } from "@/data/criteria";
import { canEditPost } from "@/data/publications";
import { findPost } from "@/data/repository";
import { postPath } from "@/data/navigation";
import { CARE_TYPES, type CareType, type DateRange } from "@/data/types";
import { dateRangeOrNull, oneOf } from "@/hooks/draft-validators";
import { useDraftField } from "@/hooks/use-form-draft";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { toISODate, today } from "@/utils/dates";

import { stepPath, useNeedFlow } from "./animal-draft";

const FORM_ID = "need-care";
const SCOPE = "need-care";

/**
 * « Quelle garde, et quand ? » (Nidz 1.7 §12) — the last step, and the fork
 * between the two ways of finding a sitter (§13):
 *
 *   Voir les pet-sitters   the results, nearest first, for this animal,
 *                          place, service and period;
 *   Publier ma demande     a confirmation screen first (nothing is published
 *                          from here), then the request goes to the feed of
 *                          nearby sitters, who propose.
 *
 * Only the services that make sense for this animal are offered (a walk is a
 * dog's; an aquarium is looked after at home). A walk is one day, so its end
 * date is its start. Gone from 1.6: the gear and the « Nidz ne réserve rien »
 * block — the truth it carried is said where it matters, on the publication
 * confirmation and on every result.
 *
 * With `?post=<id>` this is the EDIT of a published request that nobody has
 * been accepted for: same questions, one « Enregistrer ».
 */
export default function NeedCare() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flow = useNeedFlow();
  const { state } = useDemo();
  const editing = new URLSearchParams(flow.search).get("post");
  const post = editing ? findPost(state, editing) : null;
  const scope = post ? `${SCOPE}-${post.id}` : SCOPE;
  const save = useSave({ scope });

  const [careType, setCareType] = useDraftField<CareType | null>(scope, "careType", () => post?.careType ?? state.need.careType, {
    validate: oneOf(CARE_TYPES),
  });
  const [dates, setDates] = useDraftField<DateRange | null>(scope, "dates", () => post?.dates ?? state.need.dates, {
    validate: dateRangeOrNull,
  });
  const [errors, setErrors] = useState<{ care?: string; dates?: string }>({});
  const careRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);

  if (editing && (!post || !canEditPost(post, toISODate(today())))) {
    return <Navigate to={post ? postPath("owner", post.id) : "/owner/requests?tab=sent"} replace />;
  }
  const pet = post ? null : state.pets.find((p) => p.id === state.need.petId);
  if (!post && (!pet || !state.need.wilayaCode)) {
    return <Navigate to={pet ? stepPath("location", flow.search) : stepPath("pet", "")} replace />;
  }

  const species = post ? post.pet.species : pet!.species;
  const services = CARE_TYPES.filter((c) => servicesFor(species).includes(c));
  const chosen = careType && services.includes(careType) ? careType : null;
  const singleDay = chosen === "walk";

  const validate = () => {
    const next: typeof errors = {};
    if (!chosen) next.care = t("need.care.careRequired");
    if (!dates) next.dates = t("need.care.datesRequired");
    /* `min` on the input prevents a past date in the picker, but it can still
       be typed, and a stay that started last month is not a request anyone
       can answer. */
    else if (dates.start < toISODate(today())) next.dates = t("need.care.datesPast");
    setErrors(next);
    if (next.care) careRef.current?.focus();
    else if (next.dates) datesRef.current?.focus();
    return !next.care && !next.dates;
  };

  const go = (method: "search" | "publish") => {
    if (!validate() || !chosen || !dates) return;
    const saved = save.save({ type: "setNeed", patch: { careType: chosen, dates, step: "care" } });
    if (!saved) return;
    if (method === "publish") {
      navigate(stepPath("publish", flow.search));
      return;
    }
    navigate({
      pathname: "/search",
      search: new URLSearchParams(criteriaToParams(criteriaFromNeed(saved.need))).toString(),
    });
  };

  const saveEdit = () => {
    if (!post || !validate() || !chosen || !dates) return;
    const saved = save.save({ type: "updatePost", id: post.id, patch: { careType: chosen, dates } });
    if (saved) navigate(postPath("owner", post.id), { replace: true });
  };

  const publishFirst = flow.intent === "publish";
  const seeButton = (
    <Button key="see" type="button" size="lg" variant={publishFirst ? "surface" : "default"} onClick={() => go("search")}>
      <Search aria-hidden="true" />
      {t("needFlow.care.see")}
    </Button>
  );
  const publishButton = (
    <Button key="publish" type="button" size="lg" variant={publishFirst ? "default" : "surface"} onClick={() => go("publish")}>
      <Megaphone aria-hidden="true" />
      {t("needFlow.care.publish")}
    </Button>
  );

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("need.care.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={post ? postPath("owner", post.id) : stepPath("location", flow.search)}
        title={post ? t("needFlow.care.editTitle") : t("need.care.title")}
        headerExtra={<DraftNotice save={save} />}
        action={
          post ? (
            <Button type="button" size="lg" onClick={saveEdit}>
              {t("ownerAccount.save")}
            </Button>
          ) : publishFirst ? (
            publishButton
          ) : (
            seeButton
          )
        }
        secondaryAction={post ? undefined : publishFirst ? seeButton : publishButton}
      >
        <form
          id={FORM_ID}
          noValidate
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (post) saveEdit();
            else go(publishFirst ? "publish" : "search");
          }}
        >
          <div>
            <p id="care-type-label" className="mb-3 text-sm font-medium text-foreground">
              {t("need.care.careLabel")}
            </p>
            <OptionGroup
              labelledBy="care-type-label"
              describedBy={errors.care ? "care-type-error" : undefined}
              invalid={Boolean(errors.care)}
              groupRef={careRef}
              value={chosen}
              onChange={(value) => {
                setCareType(value);
                setErrors((e) => ({ ...e, care: undefined }));
                /* A walk is one day. Collapse an existing range rather than
                   silently carrying an end date the service cannot use. */
                if (value === "walk" && dates) setDates({ start: dates.start, end: dates.start });
              }}
              options={services.map((c) => ({
                value: c,
                label: t(`care.${c}`),
                description: t(`care.description.${c}`),
                icon: CARE_ICON[c],
              }))}
            />
            {errors.care && (
              <p id="care-type-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                {errors.care}
              </p>
            )}
            {services.length < CARE_TYPES.length && (
              <p className="mt-2 px-1 text-sm text-muted-foreground">
                {t("needFlow.care.onlyRelevant", { animal: t(`speciesPlural.${species === "other" ? "other" : species}`).toLocaleLowerCase() })}
              </p>
            )}
          </div>

          <DateRangeField
            singleDay={singleDay}
            value={dates}
            onChange={(next) => {
              setDates(next);
              setErrors((e) => ({ ...e, dates: undefined }));
            }}
            singleLabel={t("need.care.dateLabel")}
            startLabel={t("need.care.startLabel")}
            endLabel={t("need.care.endLabel")}
            error={errors.dates}
            startRef={datesRef}
          />
          <SaveFeedback save={save} onRetry={() => (post ? saveEdit() : go(publishFirst ? "publish" : "search"))} />
        </form>
      </FlowScreen>
    </>
  );
}
