import { Outlet } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";

/**
 * The browsable shell: header, page, footer.
 *
 * Applied through a layout route rather than wrapped around every screen, so
 * flow routes can opt out of the chrome entirely. A wizard step that carries
 * its own back control and its own action bar must not also carry a site
 * header — two competing navigations on one screen is exactly the ambiguity
 * §4.2 warns about.
 */
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
