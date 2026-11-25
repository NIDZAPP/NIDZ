import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DirectionProvider } from "@radix-ui/react-direction";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import DemoProvider from "@/state/demo/DemoProvider";

import { Suspense, lazy, useEffect } from "react";

import RouteLoading from "@/components/shared/RouteLoading";

/* Every screen is its own chunk (Audit 1.3 LOT 09 — fluidity). The app used
   to ship one ~840 KB bundle, so a phone on a slow network downloaded every
   sitter-builder form before it could show the entry screen. Named exports
   are mapped to `default` for `lazy`. */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Search = lazy(() => import("@/pages/Search"));
const SitterProfile = lazy(() => import("@/pages/SitterProfile"));
const NotAvailable = lazy(() => import("@/pages/NotAvailable"));
const Policies = lazy(() => import("@/pages/Policies"));
const Help = lazy(() => import("@/pages/Help"));
const Settings = lazy(() => import("@/pages/Settings"));
const Account = lazy(() => import("@/pages/Account"));
const Messages = lazy(() => import("@/pages/Messages"));
const MessageThread = lazy(() => import("@/pages/MessageThread"));
const Welcome = lazy(() => import("@/pages/onboarding/Welcome"));
const Start = lazy(() => import("@/pages/onboarding/Start"));
const registerScreen = (name: "RegisterStart" | "RegisterStepScreen" | "Login") =>
  lazy(() => import("@/pages/onboarding/Register").then((m) => ({ default: m[name] })));
const RegisterStart = registerScreen("RegisterStart");
const RegisterStepScreen = registerScreen("RegisterStepScreen");
const Login = registerScreen("Login");
const NeedPet = lazy(() => import("@/pages/owner/need/NeedPet"));
const NeedBreed = lazy(() => import("@/pages/owner/need/NeedBreed"));
const NeedAbout = lazy(() => import("@/pages/owner/need/NeedAbout"));
const NeedNeeds = lazy(() => import("@/pages/owner/need/NeedNeeds"));
const NeedLocation = lazy(() => import("@/pages/owner/need/NeedLocation"));
const NeedCare = lazy(() => import("@/pages/owner/need/NeedCare"));
const NeedPublish = lazy(() => import("@/pages/owner/need/NeedPublish"));
const OwnerPostDetail = lazy(() => import("@/pages/owner/OwnerPostDetail"));
const SitterFeed = lazy(() => import("@/pages/sitter/SitterFeed"));
const SitterPostDetail = lazy(() => import("@/pages/sitter/SitterPostDetail"));
const SitterPropose = lazy(() => import("@/pages/sitter/SitterPropose"));
const SettingsSection = lazy(() => import("@/pages/SettingsSection"));
const Auth = lazy(() => import("@/pages/Auth"));
const OwnerAccount = lazy(() => import("@/pages/owner/OwnerAccount"));
const PetEdit = lazy(() => import("@/pages/owner/PetEdit"));
const RequestReview = lazy(() => import("@/pages/owner/request/RequestReview"));
const RequestWhen = lazy(() => import("@/pages/owner/request/RequestWhen"));
const RequestSent = lazy(() => import("@/pages/owner/request/RequestSent"));
const OwnerRequests = lazy(() => import("@/pages/owner/OwnerRequests"));
const OwnerRequestDetail = lazy(() => import("@/pages/owner/OwnerRequestDetail"));
const SitterStart = lazy(() => import("@/pages/sitter/SitterStart"));
const joinStep = (name: "SitterName" | "SitterPhone" | "SitterVerify" | "SitterLocation") =>
  lazy(() => import("@/pages/sitter/SitterJoin").then((m) => ({ default: m[name] })));
const SitterName = joinStep("SitterName");
const SitterPhone = joinStep("SitterPhone");
const SitterVerify = joinStep("SitterVerify");
const SitterLocation = joinStep("SitterLocation");
const builderStep = (
  name: "StepAbout" | "StepServices" | "StepAnimals" | "StepHousing" | "StepLimits" | "StepAvailability",
) => lazy(() => import("@/pages/sitter/SitterBuilder").then((m) => ({ default: m[name] })));
const StepAbout = builderStep("StepAbout");
const StepServices = builderStep("StepServices");
const StepAnimals = builderStep("StepAnimals");
const StepHousing = builderStep("StepHousing");
const StepLimits = builderStep("StepLimits");
const StepAvailability = builderStep("StepAvailability");
const SitterProfileHome = lazy(() => import("@/pages/sitter/SitterProfileHome"));
const sectionStep = (name: "SectionCare" | "SectionExperience" | "SectionProfessional") =>
  lazy(() => import("@/pages/sitter/SitterSections").then((m) => ({ default: m[name] })));
const SectionCare = sectionStep("SectionCare");
const SectionExperience = sectionStep("SectionExperience");
const SectionProfessional = sectionStep("SectionProfessional");
const SitterTrust = lazy(() => import("@/pages/sitter/SitterTrust"));
const SitterPreview = lazy(() => import("@/pages/sitter/SitterPreview"));
const SitterPublished = lazy(() => import("@/pages/sitter/SitterPublished"));
const SitterRequests = lazy(() => import("@/pages/sitter/SitterRequests"));

/* After the first screen has painted, fetch the others while the browser is
   idle, so moving between screens does not wait on the network. The first
   load stays small; the rest arrives in the background. */
function prefetchScreens() {
  const load = () => {
    void import("./pages/Index");
    void import("@/pages/Search");
    void import("@/pages/SitterProfile");
    void import("@/pages/Account");
    void import("@/pages/Settings");
    void import("@/pages/Messages");
    void import("@/pages/owner/request/RequestReview");
    void import("@/pages/owner/request/RequestWhen");
    void import("@/pages/owner/need/NeedPet");
    void import("@/pages/owner/OwnerRequests");
    void import("@/pages/owner/OwnerRequestDetail");
    void import("@/pages/sitter/SitterFeed");
    void import("@/pages/owner/need/NeedBreed");
    void import("@/pages/owner/need/NeedAbout");
    void import("@/pages/owner/PetEdit");
    void import("@/pages/sitter/SitterRequests");
    void import("@/pages/sitter/SitterProfileHome");
  };
  if (typeof window === "undefined") return;
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (idle) idle(load);
  else window.setTimeout(load, 1500);
}

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
  useEffect(() => {
    prefetchScreens();
  }, []);
  /* Radix reads its own context, not `<html dir>`. Without this the roving
     focus in every radio group has its arrow keys reversed in Arabic, and
     `align="end"` on a Select aligns to the wrong edge. */
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";

  return (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <DirectionProvider dir={dir}>
    <TooltipProvider>
      {/* ONE toast system (Audit 1.3 LOT 10). Neither was ever called; both
          were mounted. The shadcn/Radix toaster stays: it is built on the
          Nidz tokens. Sonner was unmounted because it follows `next-themes`
          with a "system" default, so on a phone in dark mode it would have
          drawn dark toasts in a product with no dark mode. Its component file
          and dependency are left in place — removing a dependency is a
          separate decision, not a side effect of a cleanup. */}
      <Toaster />
      <BrowserRouter>
        <DemoProvider>
          <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Flow screens: full viewport, own back control, own action bar,
                no site chrome. */}
            <Route path="/welcome" element={<Welcome />} />
            {/* Nidz 1.7 §3–4: opening an account (three journeys), signing
                in to the account this device holds, and the first choice of
                activity once the account exists. */}
            <Route path="/register" element={<RegisterStart />} />
            <Route path="/register/:step" element={<RegisterStepScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/start" element={<Start />} />
            {/* The owner journey (§6–§13): the animal, its breed, its name /
                age / photo, its needs, where, which care and when, and the
                publication confirmation. */}
            <Route path="/owner/need/pet" element={<NeedPet />} />
            <Route path="/owner/need/breed" element={<NeedBreed />} />
            <Route path="/owner/need/about" element={<NeedAbout />} />
            <Route path="/owner/need/needs" element={<NeedNeeds />} />
            <Route path="/owner/need/location" element={<NeedLocation />} />
            <Route path="/owner/need/care" element={<NeedCare />} />
            <Route path="/owner/need/publish" element={<NeedPublish />} />
            <Route path="/sitter/posts/:id/propose" element={<SitterPropose />} />
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
            {/* A conversation is a full-screen thread with its own top bar and
                composer (Nidz 1.4). The list is browsable, below. */}
            <Route path="/messages/to/:sitterId" element={<MessageThread />} />
            <Route path="/messages/:id" element={<MessageThread />} />
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
              {/* Mes animaux is part of Accueil since 1.7 (§15.1). */}
              <Route path="/owner/pets" element={<Navigate to="/" replace />} />
              <Route path="/pets" element={<Navigate to="/" replace />} />
              <Route path="/search" element={<Search />} />
              <Route path="/sitters/:id" element={<SitterProfile />} />
              {/* The legacy registration page promised a verification Nidz
                  cannot perform. The flow that replaced it starts here. */}
              <Route path="/sitter/register" element={<Navigate to="/sitter/start" replace />} />
              <Route path="/sitter/feed" element={<SitterFeed />} />
              <Route path="/sitter/posts/:id" element={<SitterPostDetail />} />
              <Route path="/sitter/requests" element={<SitterRequests />} />
              {/* "Mon profil": the sitter's sections dashboard, a tab of the
                  sitter space once published (Audit 1.3 LOT 04). */}
              <Route path="/sitter/profile" element={<SitterProfileHome />} />
              <Route path="/book/:listingId" element={<NotAvailable />} />
              <Route path="/chat/:bookingId" element={<NotAvailable />} />
              <Route path="/owner/requests" element={<OwnerRequests />} />
              <Route path="/owner/requests/:id" element={<OwnerRequestDetail />} />
              <Route path="/owner/posts/:id" element={<OwnerPostDetail />} />
              <Route path="/owner/bookings" element={<Navigate to="/owner/requests" replace />} />
              <Route path="/sitter/dashboard" element={<Navigate to="/sitter/requests" replace />} />
              <Route path="/admin" element={<NotAvailable />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/help" element={<Help />} />
              {/* "Compte": shared by both spaces — it follows whichever is active
                  rather than belonging to one. Since 1.6 it is the person
                  (identity, animals, the two spaces, help), and "Paramètres"
                  is its own screen behind the gear at its top-right
                  (language, security and privacy, the reset, test tools).
                  `/settings` keeps resolving, so old links and the gear on
                  every flow step still land on the language choice. */}
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:section" element={<SettingsSection />} />
              {/* Local conversations and the notifications slot (1.4). */}
              <Route path="/messages" element={<Messages />} />
              {/* Profiles moved out of the sitter's own namespace; the old
                  path stays reachable so existing links do not break. */}
              <Route path="/sitter/:id" element={<LegacySitterRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
        </DemoProvider>
      </BrowserRouter>
    </TooltipProvider>
    </DirectionProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
