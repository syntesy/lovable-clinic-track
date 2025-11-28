import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import DetalhePaciente from "./pages/DetalhePaciente";
import ProntuarioClinico from "./pages/ProntuarioClinico";
import Evolucao from "./pages/Evolucao";
import RegistrarEvolucao from "./pages/RegistrarEvolucao";
import Protocolos from "./pages/Protocolos";
import Relatorios from "./pages/Relatorios";
import VisualizarRelatorio from "./pages/VisualizarRelatorio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/pacientes" replace />} />
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
            path="/prontuario/:id"
            element={
              <Layout>
                <ProntuarioClinico />
              </Layout>
            }
          />
          <Route
            path="/evolucao"
            element={
              <Layout>
                <Evolucao />
              </Layout>
            }
          />
          <Route
            path="/evolucao/:id"
            element={
              <Layout>
                <RegistrarEvolucao />
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
          <Route
            path="/relatorios/visualizar/:id"
            element={<VisualizarRelatorio />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
