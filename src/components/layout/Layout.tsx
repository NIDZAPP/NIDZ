import { Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";

import { resolveWorkspace, type Workspace } from "@/data/workspace";
import { cn } from "@/lib/utils";
import { useDemo } from "@/state/demo/context";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import RouteLoading from "@/components/shared/RouteLoading";
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
  const navigationType = useNavigationType();
  const { state } = useDemo();

  /* A new screen starts at its top. React Router resets nothing, so a tab
     tapped from far down a long list opened its destination part-way down
     (Audit 1.3 LOT 04 review). Back and Forward (POP) keep the browser's own
     scroll restoration. */
  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    /* …and focus moves to its heading, as FlowScreen does for every step: a
       screen-reader user hears where they arrived instead of nothing, and a
       keyboard user's next Tab starts in the new screen. Screens load on
       demand now, so the heading may need a few frames to exist. No visible
       ring on programmatic focus. */
    const deadline = performance.now() + 5000;
    let handle = 0;
    const focusHeading = () => {
      /* VISIBLE heading only: while the new screen's code loads, React keeps
         the previous screen mounted but hidden, and focusing its heading
         silently fails. */
      const heading = [...document.querySelectorAll<HTMLElement>("main h1")].find(
        (h) => h.getClientRects().length > 0,
      );
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.classList.add("focus:outline-none");
        heading.focus({ preventScroll: true });
        if (document.activeElement === heading) return;
      }
      if (performance.now() < deadline) handle = window.requestAnimationFrame(focusHeading);
    };
    handle = window.requestAnimationFrame(focusHeading);
    return () => window.cancelAnimationFrame(handle);
  }, [pathname, navigationType]);

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
      {/* The home is an "Accueil" like the entry screen, so it carries the
          same language icon (design system amendment 0.1). Elsewhere the
          choice lives in Compte. */}
      <Header workspace={workspace} navContext={navContext} actions={pathname === "/" ? <LanguageSwitcher /> : undefined} />
      {/* `pb-28` below md keeps the last content clear of the floating tab
          bar, which overlays the page rather than taking a row of its own. */}
      <main className={cn("flex-1", hasBar && "pb-28 md:pb-0")}>
        {/* Inside the shell, so the header and the bar stay put while a
            screen's code loads — only the page area waits. Keyed on the path
            so each arrival plays the one entrance (`page-in`: 8px rise, 280ms
            ease-out, from an almost-visible first frame). */}
        <div key={pathname} className="page-in">
          <Suspense fallback={<RouteLoading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      {/* Below md, when the bottom bar is there, the footer would be a second
          navigation under the first (Audit 1.3 LOT 09). Help and Policies
          stay one tap away in Compte, which is in the bar. */}
      <Footer hideOnMobile={hasBar} />
      <WorkspaceNav workspace={workspace} context={navContext} />
    </div>
  );
}
