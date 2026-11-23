import { findSitter } from "@/data/repository";
import type { SitterProfile } from "@/data/types";
import { useDemo } from "@/state/demo/context";

/**
 * Resolve a public profile by id.
 *
 * Checks the fixtures first, then the profile the visitor built themselves.
 * Without the second lookup, "Publier mon profil" would lead to a 404 — the
 * sitter flow would claim to publish something no URL resolves to.
 *
 * An unpublished own-profile is deliberately still resolvable, because the
 * sitter's own preview renders through this same path. Callers that serve the
 * public (i.e. `/sitters/:id`) check `published` themselves.
 */
export function useSitter(id: string | undefined): { sitter: SitterProfile | null; isOwnProfile: boolean } {
  const { state } = useDemo();
  return findSitter(state, id);
}
