import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NewFind from "./pages/NewFind";
import SiteMap from "./pages/SiteMap";
import Analysis from "./pages/Analysis";
import Team from "./pages/Team";
import Explore from "./pages/Explore";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/new-find" element={<NewFind />} />
          <Route path="/site-map" element={<SiteMap />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/team" element={<Team />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/account" element={<Account />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
