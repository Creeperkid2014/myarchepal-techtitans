/**
 * Main App Component
 * 
 * Sets up the application with providers and routing:
 * - QueryClientProvider: React Query for data fetching
 * - TooltipProvider: Tooltip UI component provider
 * - AuthProvider: Authentication context provider (wraps entire app)
 * - BrowserRouter: React Router for navigation
 * 
 * Routes:
 * - Public routes: /, /authentication/sign-in, /authentication/sign-up
 * - Protected routes: /account, /edit-profile, etc.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NewSite from "./pages/NewSite";
import EditSite from "./pages/EditSite";
import SiteMap from "./pages/SiteMap";
import SiteLists from "./pages/SiteLists";
import SiteDetails from "./pages/SiteDetails";
import Analysis from "./pages/Analysis";
import Team from "./pages/Team";
import Explore from "./pages/Explore";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import EditProfile from "./pages/EditProfile";
import SignIn from "./pages/Authentication/sign-in";
import SignUp from "./pages/Authentication/sign-up";
import Articles from "./pages/Articles";
import ArticleDetails from "./pages/ArticleDetails";
import CreateArticle from "./pages/CreateArticle";
import EditArticle from "./pages/EditArticle";
import Artifacts from "./pages/Artifacts";
import ArtifactDetails from "./pages/ArtifactDetails";
import CreateArtifact from "./pages/CreateArtifact";
import EditArtifact from "./pages/EditArtifact";
import Checkout from "./pages/Checkout";
import Donations from "./pages/Donations";
import ContactUs from "./pages/ContactUs";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import CreateEvent from "./pages/CreateEvent";
import NotFound from "./pages/NotFound";

// Create React Query client instance
const queryClient = new QueryClient();

const App = () => (
  // React Query provider for data fetching
  <QueryClientProvider client={queryClient}>
    {/* Tooltip provider for UI components */}
    <TooltipProvider>
      {/* Auth provider wraps entire app to provide authentication state */}
      <AuthProvider>
        {/* Toast notification components */}
        <Toaster />
        <Sonner />
        {/* React Router for navigation */}
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/site-map" element={<SiteMap />} />
            <Route path="/site-lists" element={<SiteLists />} />
            <Route path="/site/:id" element={<SiteDetails />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/team" element={<Team />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/article/:id" element={<ArticleDetails />} />
            <Route path="/artifacts" element={<Artifacts />} />
            <Route path="/artifact/:id" element={<ArtifactDetails />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetails />} />

            {/* Protected creation routes - require authentication */}
            <Route path="/new-site" element={
              <ProtectedRoute>
                <NewSite />
              </ProtectedRoute>
            } />
            <Route path="/edit-site/:id" element={
              <ProtectedRoute>
                <EditSite />
              </ProtectedRoute>
            } />
            <Route path="/create-article" element={
              <ProtectedRoute>
                <CreateArticle />
              </ProtectedRoute>
            } />
            <Route path="/edit-article/:id" element={
              <ProtectedRoute>
                <EditArticle />
              </ProtectedRoute>
            } />
            <Route path="/create-artifact" element={
              <ProtectedRoute>
                <CreateArtifact />
              </ProtectedRoute>
            } />
            <Route path="/edit-artifact/:id" element={
              <ProtectedRoute>
                <EditArtifact />
              </ProtectedRoute>
            } />
            <Route path="/create-event" element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            } />

            {/* Authentication routes */}
            <Route path="/authentication/sign-in" element={<SignIn />} />
            <Route path="/authentication/sign-up" element={<SignUp />} />
            
            {/* Protected routes (require authentication) */}
            <Route path="/account" element={<Account />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            
            {/* Catch-all route for 404 pages */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
