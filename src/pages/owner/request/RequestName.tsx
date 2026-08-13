import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { NameStep } from "@/components/account/AccountSteps";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useSitter } from "@/hooks/use-sitter";

/**
 * The first step of sending a request: who is asking.
 *
 * Identity is collected HERE and not earlier — the audit is explicit that the
 * account is only requested when the owner actually wants to send something
 * (p.215). Everything before this point works without one.
 *
 * The form itself is shared with the sitter side: one account concept, one
 * implementation.
 */
export default function RequestName() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  /* Carries the search back with it, so returning to the profile keeps its fit
     section and its link to the results. */
  const goBack = useFlowBack(`/sitters/${sitterId ?? ""}${query}`);

  if (!sitter) return <Navigate to="/search" replace />;

  return (
    <NameStep
      title={t("request.name.title")}
      intro={t("request.name.intro", { name: sitter.publicName })}
      onBack={goBack}
      onDone={() => navigate(`/owner/request/${sitter.id}/phone${query}`)}
    />
  );
}
