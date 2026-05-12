import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AgendaPage from "./pages/AgendaPage";
import VehiculosPage from "./pages/VehiculosPage";
import FacturacionPage from "./pages/FacturacionPage";
import FinanzasPage from "./pages/FinanzasPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/agenda"
              element={
                <ProtectedRoute>
                  <AgendaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vehiculos"
              element={
                <ProtectedRoute>
                  <VehiculosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/facturacion"
              element={
                <ProtectedRoute>
                  <FacturacionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/finanzas"
              element={
                <ProtectedRoute>
                  <FinanzasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/configuracion"
              element={
                <ProtectedRoute>
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
