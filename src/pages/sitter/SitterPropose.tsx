import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { AnimalPortrait } from "@/components/illustrations/animals";
import { categoryText } from "@/components/request/pet-facts";
import FlowScreen from "@/components/shared/FlowScreen";
import { FieldShell } from "@/components/shared/fields";
import { DraftNotice, SaveFeedback } from "@/components/shared/SaveFeedback";
import { DemoNotice } from "@/components/shared/trust";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { compatibility } from "@/data/compatibility";
import { petRef } from "@/data/criteria";
import { SITTER_HOME, hasSession, postPath, sitterVisibility } from "@/data/navigation";
import { offeredServices, rateFor } from "@/data/offer";
import { PROPOSAL_MESSAGE_MAX, acceptsProposals, liveProposal, type Proposal } from "@/data/publications";
import { findPost } from "@/data/repository";
import { CARE_UNIT_KEY } from "@/data/types";
import { useDraftField } from "@/hooks/use-form-draft";
import { useAppLocale } from "@/hooks/use-locale";
import { useSave } from "@/hooks/use-save";
import { useDemo } from "@/state/demo/context";
import { formatDateRange, toISODate, today } from "@/utils/dates";
import { formatDZD } from "@/utils/format";

/**
 * « Proposer mes services » (Nidz 1.7 §14.2) — a short message, the rate the
 * sitter already declared for this service, and one action.
 *
 * Proposing is not accepting a booking and asks for no payment: it tells the
 * owner « I am interested », and the owner decides. The id is minted once so
 * a double tap is one proposal, and the reducer refuses a second live
 * proposal from the same sitter on the same post.
 */
export default function SitterPropose() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useDemo();
  const post = findPost(state, id);
  const scope = post ? `proposal-${post.id}` : null;
  const save = useSave({ scope });
  const [message, setMessage] = useDraftField<string>(scope, "message", () => "");
  const [proposalId] = useState(() => `proposal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);

  if (!hasSession(state) || !state.sitter) return <Navigate to="/welcome" replace />;
  if (!post) return <Navigate to={SITTER_HOME} replace />;
  const profile = state.sitter.profile;
  const eligible =
    sitterVisibility(state) === "listed" &&
    acceptsProposals(post, toISODate(today())) &&
    !liveProposal(state.proposals, post.id, profile.id) &&
    compatibility(profile, petRef(post.pet)).level !== "incompatible" &&
    offeredServices(profile).includes(post.careType);
  if (!eligible) return <Navigate to={postPath("sitter", post.id)} replace />;

  const rate = rateFor(profile, [post.careType]);

  const submit = () => {
    const proposal: Proposal = {
      id: proposalId,
      postId: post.id,
      sitterId: profile.id,
      createdAt: new Date().toISOString(),
      message: message.trim().slice(0, PROPOSAL_MESSAGE_MAX),
      displayedRate: rate ? { amount: rate.amount, careType: rate.careType } : null,
      status: "pending",
      respondedAt: null,
      simulated: false,
    };
    const saved = save.save({ type: "addProposal", proposal });
    if (saved) navigate(`${postPath("sitter", post.id)}?proposed=1`, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>
          {t("common.appName")} — {t("propose.title")}
        </title>
      </Helmet>
      <FlowScreen
        backTo={postPath("sitter", post.id)}
        title={t("propose.title")}
        intro={t("propose.intro", { name: post.ownerName })}
        headerExtra={<DraftNotice save={save} />}
        action={
          <Button type="button" size="lg" onClick={submit}>
            {t("propose.submit")}
          </Button>
        }
      >
        <div className="surface flex items-center gap-3.5 p-3.5">
          <AnimalPortrait species={post.pet.species} className="size-14 shrink-0 rounded-lg" sizes="56px" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-foreground">
              <bdi>{post.pet.name}</bdi> · {categoryText(post.pet, t)}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {t(`care.${post.careType}`)} · {formatDateRange(post.dates, locale)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <FieldShell label={t("propose.messageLabel")} help={t("propose.messageHelp")}>
            {({ id: fieldId, describedBy }) => (
              <Textarea
                id={fieldId}
                rows={5}
                maxLength={PROPOSAL_MESSAGE_MAX}
                value={message}
                placeholder={t("propose.messagePlaceholder")}
                aria-describedby={describedBy}
                onChange={(e) => setMessage(e.target.value)}
              />
            )}
          </FieldShell>
        </div>

        <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
          <p className="font-semibold text-foreground">{t("propose.rateTitle")}</p>
          <p className="mt-1 text-foreground">
            {rate ? `${formatDZD(rate.amount, locale)} / ${t(CARE_UNIT_KEY[rate.careType])}` : t("propose.noRate")}
          </p>
          <p className="mt-1 text-muted-foreground">{t("propose.noPayment")}</p>
        </div>

        <DemoNotice
          className="mt-6"
          title={post.isDemoFixture ? t("postDetail.exampleTitle") : t("postDetail.ownTitle")}
          body={post.isDemoFixture ? t("propose.exampleBody") : t("postDetail.ownBody")}
        />
        <SaveFeedback save={save} onRetry={submit} />
      </FlowScreen>
    </>
  );
}
