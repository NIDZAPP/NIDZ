import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { VerifyStep } from "@/components/account/AccountSteps";
import { useSitter } from "@/hooks/use-sitter";
import { useDemo } from "@/state/demo/context";

export default function RequestVerify() {
  const navigate = useNavigate();
  const { sitterId } = useParams();
  const [searchParams] = useSearchParams();
  const { sitter } = useSitter(sitterId);
  const { state } = useDemo();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";

  if (!sitter) return <Navigate to="/search" replace />;
  if (!state.account?.phoneNumber) {
    return <Navigate to={`/owner/request/${sitter.id}/phone${query}`} replace />;
  }

  return (
    <VerifyStep
      backTo={`/owner/request/${sitterId ?? ""}/phone${query}`}
      onChangeNumber={() => navigate(`/owner/request/${sitter.id}/phone${query}`)}
      onDone={() => navigate(`/owner/request/${sitter.id}/review${query}`)}
    />
  );
}
