import { Outlet, useLocation } from "react-router-dom";

import { resolveWorkspace, type Workspace } from "@/data/workspace";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

import Header from "./Header";
import Footer from "./Footer";
import WorkspaceNav from "./WorkspaceNav";
import { isNavigable, workspaceDestinations, type NavContext } from "./workspace-nav";

/**
 * The browsable shell: header, page, footer, and the mobile navigation.
 *
 * Applied through a layout route rather than wrapped around every screen, so
 * flow routes can opt out of the chrome entirely. A wizard step that carries
 * its own back control and its own action bar must not also carry a site
 * header — two competing navigations on one screen is exactly the ambiguity
 * §4.2 warns about, and the bottom bar would compete with the step's action.
 *
 * The shell deliberately does NOT render a back control. Only the page knows
 * what its parent is, which is why `useBack` makes the fallback a required
 * argument; a shell-level guess would send a visitor somewhere plausible and
 * wrong. Browsable screens place `BackButton` themselves, as the first element
 * of their content column.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const { state } = useDemo();

  /* Which workspace's chrome to draw. The PATH decides when it belongs to one
     side — so a public sitter profile, an owner-side screen living under
     `/sitters/`, keeps the owner's navigation even for a visitor who is
     themselves a sitter. A shared screen (Settings, Help, Policies) follows the
     workspace the account is actually in.

     Reading the state here never WRITES it. Only an explicit switch changes the
     active workspace; drawing a nav must not decide who you are. */
  const workspace: Workspace = resolveWorkspace(pathname, state.activeWorkspace);

  const navContext: NavContext = {
    entered: state.entered,
    sitterPublished: Boolean(state.sitter?.published),
  };
  const hasBar = isNavigable(workspaceDestinations(workspace, navContext));

  return (
    /* `has-bottom-nav` reserves scroll padding under the mobile bar, so a
       focused control is never scrolled underneath it (WCAG 2.2 AA 2.4.11).
       Conditional, because the bar is genuinely absent on the whole sitter side
       and before the introduction — applied unconditionally it reserved 5rem of
       phantom padding under screens with nothing pinned to them, and 11rem
       where a pinned action bar stacked with it. */
    <div className={cn("flex min-h-dvh flex-col", hasBar && "has-bottom-nav")}>
      <Header workspace={workspace} navContext={navContext} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WorkspaceNav workspace={workspace} context={navContext} />
    </div>
  );
}
