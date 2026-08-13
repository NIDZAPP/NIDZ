import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import Layout from "@/components/layout/Layout";
import DemoProvider from "@/state/demo/DemoProvider";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "@/pages/Auth";
import Pets from "@/pages/Pets";
import Search from "@/pages/Search";
import SitterRegister from "@/pages/SitterRegister";
import SitterProfile from "@/pages/SitterProfile";
import Book from "@/pages/Book";
import Chat from "@/pages/Chat";
import OwnerBookings from "@/pages/OwnerBookings";
import SitterDashboard from "@/pages/SitterDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Policies from "@/pages/Policies";
import Help from "@/pages/Help";

const queryClient = new QueryClient();

/** Old profile links kept working. Query and hash are carried across, so a
    deep link into a section survives the move. */
function LegacySitterRedirect() {
  const { id } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: `/sitters/${id}`, search, hash }} replace />;
}

/**
 * Routes come in two shapes.
 *
 *  - Browsable screens sit inside the `Layout` route and get the header and
 *    footer.
 *  - Flow screens own the full viewport, carry their own back control and
 *    their own action bar, and must not also show site chrome, so they are
 *    registered outside the layout route. (None exist yet — the first arrive
 *    with the owner need flow.)
 *
 * Public sitter profiles live under `/sitters/:id`; `/sitter/*` is the
 * sitter's own area. Keeping the two apart means no static sitter route can
 * ever be shadowed by a profile id.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DemoProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/search" element={<Search />} />
              <Route path="/sitters/:id" element={<SitterProfile />} />
              <Route path="/sitter/register" element={<SitterRegister />} />
              <Route path="/book/:listingId" element={<Book />} />
              <Route path="/chat/:bookingId" element={<Chat />} />
              <Route path="/owner/bookings" element={<OwnerBookings />} />
              <Route path="/sitter/dashboard" element={<SitterDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/help" element={<Help />} />
              {/* Profiles moved out of the sitter's own namespace; the old
                  path stays reachable so existing links do not break. */}
              <Route path="/sitter/:id" element={<LegacySitterRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </DemoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
