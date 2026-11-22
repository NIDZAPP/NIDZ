import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DirectionProvider } from "@radix-ui/react-direction";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import DemoProvider from "@/state/demo/DemoProvider";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Search from "@/pages/Search";
import SitterProfile from "@/pages/SitterProfile";
import NotAvailable from "@/pages/NotAvailable";
import Policies from "@/pages/Policies";
import Help from "@/pages/Help";
import Settings from "@/pages/Settings";
import Welcome from "@/pages/onboarding/Welcome";
import NeedPet from "@/pages/owner/need/NeedPet";
import NeedLocation from "@/pages/owner/need/NeedLocation";
import NeedCare from "@/pages/owner/need/NeedCare";
import Auth from "@/pages/Auth";
import OwnerAccount from "@/pages/owner/OwnerAccount";
import PetsList from "@/pages/owner/PetsList";
import PetEdit from "@/pages/owner/PetEdit";
import RequestReview from "@/pages/owner/request/RequestReview";
import RequestWhen from "@/pages/owner/request/RequestWhen";
import RequestSent from "@/pages/owner/request/RequestSent";
import OwnerRequests from "@/pages/owner/OwnerRequests";
import OwnerRequestDetail from "@/pages/owner/OwnerRequestDetail";
import SitterStart from "@/pages/sitter/SitterStart";
import { SitterName, SitterPhone, SitterVerify, SitterLocation } from "@/pages/sitter/SitterJoin";
import {
  StepAbout,
  StepServices,
  StepAnimals,
  StepHousing,
  StepLimits,
  StepAvailability,
} from "@/pages/sitter/SitterBuilder";
import SitterProfileHome from "@/pages/sitter/SitterProfileHome";
import { SectionCare, SectionExperience, SectionProfessional } from "@/pages/sitter/SitterSections";
import SitterTrust from "@/pages/sitter/SitterTrust";
import SitterPreview from "@/pages/sitter/SitterPreview";
import SitterPublished from "@/pages/sitter/SitterPublished";
import SitterRequests from "@/pages/sitter/SitterRequests";

const queryClient = new QueryClient();

/** Old profile links kept working. Query and hash are carried across, so a
    deep link into a section survives the move. */
function LegacySitterRedirect() {
  const { id } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: `/sitters/${id}`, search, hash }} replace />;
}

/** The three retired request steps — name, phone and the simulated code — all
    resolve to the summary that replaced them. The search is carried across,
    because it is what tells the summary which service and dates were asked
    for. */
function LegacyRequestRedirect() {
  const { sitterId } = useParams();
  const { search } = useLocation();
  return <Navigate to={{ pathname: `/owner/request/${sitterId}`, search }} replace />;
}

/**
 * Routes come in two shapes.
 *
 *  - Browsable screens sit inside the `Layout` route and get the header and
 *    footer.
 *  - Flow screens own the full viewport, carry their own back control and
 *    their own action bar, and must not also show site chrome, so they are
 *    registered outside the layout route.
 *
 * Public sitter profiles live under `/sitters/:id`; `/sitter/*` is the
 * sitter's own area. Keeping the two apart means no static sitter route can
 * ever be shadowed by a profile id.
 */
const App = () => {
  const { i18n } = useTranslation();
  /* Radix reads its own context, not `<html dir>`. Without this the roving
     focus in every radio group has its arrow keys reversed in Arabic, and
     `align="end"` on a Select aligns to the wrong edge. */
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  return (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <DirectionProvider dir={dir}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DemoProvider>
          <Routes>
            {/* Flow screens: full viewport, own back control, own action bar,
                no site chrome. */}
            <Route path="/welcome" element={<Welcome />} />
            {/* Audit 1.2 merged the introduction and the owner-or-sitter
                choice into one screen: the first disclosed nothing and stood
                in front of the real decision. The route stays as a redirect
                because it is the `useBack` fallback of several steps, and
                deleting it would give those steps a back control that lands on
                the catch-all. */}
            <Route path="/start" element={<Navigate to="/welcome" replace />} />
            <Route path="/owner/need/pet" element={<NeedPet />} />
            <Route path="/owner/need/location" element={<NeedLocation />} />
            <Route path="/owner/need/care" element={<NeedCare />} />
            {/* The sign-in gateway and the quick owner account. Both are flow
                screens: they own the viewport and carry their own action bar,
                and neither should sit under site chrome offering to navigate
                away mid-decision. */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/owner/account" element={<OwnerAccount />} />
            {/* Adding or editing an animal is a form with one dominant action,
                so it is a flow screen. The LIST is browsable and sits inside
                the layout below. */}
            <Route path="/owner/pets/new" element={<PetEdit />} />
            <Route path="/owner/pets/:id" element={<PetEdit />} />

            {/* The request summary IS the request flow now. Audit 1.1 put a
                name step, a phone step and a SIMULATED code step in front of
                it; §92 forbids claiming a code was sent, and the other two are
                the quick account's job. The three old addresses redirect here
                so existing links and Back still resolve. */}
            <Route path="/owner/request/:sitterId" element={<RequestReview />} />
            {/* Service and dates for ONE sitter (Audit 1.3 LOT 01). It replaced
                the summary's detour through the generic need flow, which ended
                on the results list and forgot who the request was for. */}
            <Route path="/owner/request/:sitterId/when" element={<RequestWhen />} />
            <Route path="/owner/request/:sitterId/phone" element={<LegacyRequestRedirect />} />
            <Route path="/owner/request/:sitterId/verify" element={<LegacyRequestRedirect />} />
            <Route path="/owner/request/:sitterId/review" element={<LegacyRequestRedirect />} />
            <Route path="/owner/request/:sitterId/sent" element={<RequestSent />} />

            <Route path="/sitter/start" element={<SitterStart />} />
            <Route path="/sitter/join/name" element={<SitterName />} />
            <Route path="/sitter/join/phone" element={<SitterPhone />} />
            <Route path="/sitter/join/verify" element={<SitterVerify />} />
            <Route path="/sitter/join/location" element={<SitterLocation />} />
            {/* The dashboard (§51) moved INSIDE the layout at Audit 1.3 LOT 04
                (see below): it is the sitter's "Mon profil" tab. Its section
                editors stay here — each is a full-screen form that returns to
                it. */}
            <Route path="/sitter/profile/about" element={<StepAbout />} />
            <Route path="/sitter/profile/experience" element={<SectionExperience />} />
            <Route path="/sitter/profile/professional" element={<SectionProfessional />} />
            <Route path="/sitter/profile/services" element={<StepServices />} />
            <Route path="/sitter/profile/animals" element={<StepAnimals />} />
            <Route path="/sitter/profile/housing" element={<StepHousing />} />
            <Route path="/sitter/profile/care" element={<SectionCare />} />
            <Route path="/sitter/profile/limits" element={<StepLimits />} />
            <Route path="/sitter/profile/availability" element={<StepAvailability />} />
            <Route path="/sitter/trust" element={<SitterTrust />} />
            <Route path="/sitter/preview" element={<SitterPreview />} />
            <Route path="/sitter/published" element={<SitterPublished />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              {/* Registered, not implemented. The routes stay so deep links and
                  Back keep working; each serves one honest screen saying the
                  page is not part of this demonstration, rather than a
                  "coming soon" stub promising features nobody has committed
                  to. Admin is here too: it was never gated, and an
                  admin-looking screen with no authentication behind it is
                  worse than an honest absence. */}
              {/* Audit 1.2 made this real (§17). The old bare `/pets` address
                  redirects rather than 404s. */}
              <Route path="/owner/pets" element={<PetsList />} />
              <Route path="/pets" element={<Navigate to="/owner/pets" replace />} />
              <Route path="/search" element={<Search />} />
              <Route path="/sitters/:id" element={<SitterProfile />} />
              {/* The legacy registration page promised a verification Nidz
                  cannot perform. The flow that replaced it starts here. */}
              <Route path="/sitter/register" element={<Navigate to="/sitter/start" replace />} />
              <Route path="/sitter/requests" element={<SitterRequests />} />
              {/* "Mon profil": the sitter's sections dashboard, a tab of the
                  sitter space once published (Audit 1.3 LOT 04). */}
              <Route path="/sitter/profile" element={<SitterProfileHome />} />
              <Route path="/book/:listingId" element={<NotAvailable />} />
              <Route path="/chat/:bookingId" element={<NotAvailable />} />
              <Route path="/owner/requests" element={<OwnerRequests />} />
              <Route path="/owner/requests/:id" element={<OwnerRequestDetail />} />
              <Route path="/owner/bookings" element={<Navigate to="/owner/requests" replace />} />
              <Route path="/sitter/dashboard" element={<Navigate to="/sitter/requests" replace />} />
              <Route path="/admin" element={<NotAvailable />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/help" element={<Help />} />
              {/* Shared by both workspaces — it follows whichever is active
                  rather than belonging to one. Group 15 folds it under Profile;
                  it exists from Group 3 because §89 moved the language chooser
                  here, and a trilingual product needs somewhere to change
                  language. */}
              <Route path="/settings" element={<Settings />} />
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
    </DirectionProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
