import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WidgetSettings from "./pages/WidgetSettings";
import Settings from "./pages/Settings";
import Embed from "./pages/Embed";
import Index from "./pages/Index";
import AdminDemo from "./pages/AdminDemo";
import AdminPanel from "./pages/AdminPanel";
import InviteAccept from "./pages/InviteAccept";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/widget/:id" element={<WidgetSettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/embed" element={<Embed />} />
            <Route path="/demo" element={<Index />} />
            <Route path="/admin/demo" element={<AdminDemo />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
