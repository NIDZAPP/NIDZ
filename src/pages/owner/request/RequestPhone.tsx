import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { PhoneStep } from "@/components/account/AccountSteps";
import { useFlowBack } from "@/hooks/use-flow-back";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";

export default function RequestPhone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state } = useDemo();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const goBack = useFlowBack(`/owner/request/${sitterId ?? ""}${query}`);

  if (!sitter) return <Navigate to="/search" replace />;
  /* Reached without a name means the chain was entered mid-way. */
  if (!state.account) return <Navigate to={`/owner/request/${sitter.id}${query}`} replace />;

  return (
    <PhoneStep
      intro={t("request.phone.intro")}
      onBack={goBack}
      onDone={() => navigate(`/owner/request/${sitter.id}/verify${query}`)}
    />
  );
}
