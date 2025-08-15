import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/layout/Layout";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/search" element={<Search />} />
            <Route path="/sitter/register" element={<SitterRegister />} />
            <Route path="/sitter/:id" element={<SitterProfile />} />
            <Route path="/book/:listingId" element={<Book />} />
            <Route path="/chat/:bookingId" element={<Chat />} />
            <Route path="/owner/bookings" element={<OwnerBookings />} />
            <Route path="/sitter/dashboard" element={<SitterDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/help" element={<Help />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
