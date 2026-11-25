import { useTranslation } from "react-i18next";

import type { StatusKey } from "@/components/shared/StatusBadge";
import { isPast, type CarePost, type Proposal } from "@/data/publications";
import { demoNotesOf } from "@/data/demo-posts";
import { localized, type CareRequest } from "@/data/types";
import { useAppLocale } from "@/hooks/use-locale";
import { toISODate, today } from "@/utils/dates";

const todayISO = () => toISODate(today());

/** What to show for a post: a post still « open » whose dates have started is
    past — derived, never stored. */
export function postStatusKey(post: CarePost): StatusKey {
  if (post.status === "open" && isPast(post.dates, todayISO())) return "expired";
  return post.status;
}

export function proposalStatusKey(proposal: Proposal, post: CarePost | null): StatusKey {
  if (proposal.status === "pending" && post && isPast(post.dates, todayISO())) return "expired";
  return proposal.status;
}

export function requestStatusKey(request: CareRequest): StatusKey {
  if (request.status === "pending" && isPast(request.dates, todayISO())) return "expired";
  return request.status;
}


/** The owner's needs as the sitter reads them: their words, the explicit
    « rien à signaler », or « non renseigné ». Fixture posts carry theirs in
    three languages. */
export function useNeedsText(
  post: (Pick<CarePost, "pet"> & Partial<CarePost>) | null,
): { kind: "text" | "nothing" | "none"; text: string } {
  const { t } = useTranslation();
  const locale = useAppLocale();
  if (!post) return { kind: "none", text: "" };
  const demo = post.id ? demoNotesOf(post as CarePost) : null;
  const text = demo ? localized(demo, locale) : post.pet.notes.trim();
  if (text) return { kind: "text", text };
  if (post.pet.needsStatus === "nothing") return { kind: "nothing", text: t("needs.nothing") };
  return { kind: "none", text: t("needs.none") };
}

