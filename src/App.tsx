import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import DetalhePaciente from "./pages/DetalhePaciente";
import Protocolos from "./pages/Protocolos";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/pacientes"
            element={
              <Layout>
                <Pacientes />
              </Layout>
            }
          />
          <Route
            path="/pacientes/novo"
            element={
              <Layout>
                <NovoPaciente />
              </Layout>
            }
          />
          <Route
            path="/pacientes/:id"
            element={
              <Layout>
                <DetalhePaciente />
              </Layout>
            }
          />
          <Route
            path="/protocolos"
            element={
              <Layout>
                <Protocolos />
              </Layout>
            }
          />
          <Route
            path="/relatorios"
            element={
              <Layout>
                <Relatorios />
              </Layout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
