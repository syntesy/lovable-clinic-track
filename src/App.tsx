import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import LoginDNA from "./pages/LoginDNA";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import DetalhePaciente from "./pages/DetalhePaciente";
import ProntuarioClinico from "./pages/ProntuarioClinico";
import RegistrarEvolucao from "./pages/RegistrarEvolucao";
import ProtocolosMenu from "./pages/ProtocolosMenu";
import ProtocolosMAC from "./pages/ProtocolosMAC";
import ProtocolosEPI from "./pages/ProtocolosEPI";
import ProtocolosOrtobiologicos from "./pages/ProtocolosOrtobiologicos";
import Relatorios from "./pages/Relatorios";
import VisualizarRelatorio from "./pages/VisualizarRelatorio";
import ProtocoloMAC from "./pages/ProtocoloMAC";
import AgenteMAC from "./pages/AgenteMAC";
import TriagemBiologica from "./pages/TriagemBiologica";
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
          <Route path="/auth/login-dna" element={<LoginDNA />} />
          <Route path="/" element={<Navigate to="/pacientes" replace />} />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Pacientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/novo"
            element={
              <ProtectedRoute>
                <Layout>
                  <NovoPaciente />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <DetalhePaciente />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prontuario/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProntuarioClinico />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evolucao/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <RegistrarEvolucao />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocolos"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocolosMenu />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocolos/mac"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocolosMAC />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocolos/epi"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocolosEPI />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocolos/ortobiologicos"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocolosOrtobiologicos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocolo-mac/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocoloMAC />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Layout>
                  <Relatorios />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios/visualizar/:id"
            element={<VisualizarRelatorio />}
          />
          <Route
            path="/agente-mac"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgenteMAC />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/triagem-biologica"
            element={
              <ProtectedRoute>
                <Layout>
                  <TriagemBiologica />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
