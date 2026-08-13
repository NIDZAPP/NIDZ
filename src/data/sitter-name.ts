import { getDemoSitter } from "./demo-sitters";
import type { DemoState } from "@/state/demo/reducer";

/**
 * The public name of a sitter a request points at.
 *
 * One implementation, because three hand-written copies had already drifted:
 * they disagreed on the fallback (an empty string in one, the raw id in
 * another — and the empty one landed inside an interpolated sentence), and
 * none of them checked that the user's own profile is actually the sitter in
 * question, so an own-profile could label somebody else's request.
 */
export function sitterNameFor(state: DemoState, sitterId: string): string {
  const fixture = getDemoSitter(sitterId);
  if (fixture) return fixture.publicName;

  const own = state.sitter?.profile;
  if (own && own.id === sitterId && own.publicName) return own.publicName;

  return sitterId;
}
