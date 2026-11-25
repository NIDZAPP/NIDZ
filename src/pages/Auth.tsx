import { Navigate, useLocation } from "react-router-dom";

import { REGISTER_PATH } from "@/data/navigation";

/**
 * The 1.2–1.6 sign-in gateway. Since Nidz 1.7 an account is opened through
 * the three journeys of `/register` (Google, Apple, phone), so this address
 * forwards there — with the request it was protecting (`next`), so a detour
 * from a sitter's profile still comes back to that sitter.
 */
export default function Auth() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: REGISTER_PATH, search }} replace />;
}
