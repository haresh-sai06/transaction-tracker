import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Auth } from "@/pages/Auth";
import Index from "./pages/Index";
import { Analytics } from "./pages/Analytics";
import { Accounts } from "./pages/Accounts";
import { Trends } from "./pages/Trends";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute fallback={<Auth />}>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute fallback={<Auth />}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/accounts" element={
            <ProtectedRoute fallback={<Auth />}>
              <Accounts />
            </ProtectedRoute>
          } />
          <Route path="/trends" element={
            <ProtectedRoute fallback={<Auth />}>
              <Trends />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute fallback={<Auth />}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute fallback={<Auth />}>
              <Settings />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
