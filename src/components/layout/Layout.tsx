import { Outlet } from "react-router-dom";

import BottomNav from "./BottomNav";
import Header from "./Header";
import Footer from "./Footer";

/**
 * The browsable shell: header, page, footer, and the mobile navigation.
 *
 * Applied through a layout route rather than wrapped around every screen, so
 * flow routes can opt out of the chrome entirely. A wizard step that carries
 * its own back control and its own action bar must not also carry a site
 * header — two competing navigations on one screen is exactly the ambiguity
 * §4.2 warns about, and the bottom bar would compete with the step's action.
 */
export default function Layout() {
  return (
    /* `has-bottom-nav` reserves scroll padding under the mobile bar, so a
       focused control is never scrolled underneath it (WCAG 2.2 AA 2.4.11).
       Its own hook, keyed to the breakpoint the bar exists at — see
       src/index.css. */
    <div className="has-bottom-nav flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
