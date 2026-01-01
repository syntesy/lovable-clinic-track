import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PatientAuthProvider } from "./contexts/PatientAuthContext";
import { PatientProtectedRoute } from "./components/patient/PatientProtectedRoute";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Pacientes from "./pages/Pacientes";
import NovoPaciente from "./pages/NovoPaciente";
import DetalhePaciente from "./pages/DetalhePaciente";
import ProntuarioClinico from "./pages/ProntuarioClinico";
import RegistrarEvolucao from "./pages/RegistrarEvolucao";
import ProtocolosMenu from "./pages/ProtocolosMenu";
import ProtocolosMAC from "./pages/ProtocolosMAC";
import ProtocolosEPI from "./pages/ProtocolosEPI";
import ProtocolosOrtobiologicos from "./pages/ProtocolosOrtobiologicos";
import ProtocolosOndasChoque from "./pages/ProtocolosOndasChoque";
import Relatorios from "./pages/Relatorios";
import VisualizarRelatorio from "./pages/VisualizarRelatorio";
import ProtocoloMAC from "./pages/ProtocoloMAC";
import AgenteMAC from "./pages/AgenteMAC";
import TriagemBiologica from "./pages/TriagemBiologica";
import FisioRegenScore from "./pages/FisioRegenScore";
import CuradoriaClinica from "./pages/CuradoriaClinica";
import CuradoriaDetalhe from "./pages/CuradoriaDetalhe";
import CuradoriaOriginal from "./pages/CuradoriaOriginal";
import Partners from "./pages/Partners";
import Subscription from "./pages/Subscription";
import PatientsManage from "./pages/PatientsManage";
import AdminCuradoria from "./pages/admin/AdminCuradoria";
import AdminCuradoriaEditor from "./pages/admin/AdminCuradoriaEditor";
import AdminArtigos from "./pages/admin/AdminArtigos";
import AdminArtigoForm from "./pages/admin/AdminArtigoForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRegistryDashboard from "./pages/admin/AdminRegistryDashboard";
import RegistryGovernance from "./pages/admin/RegistryGovernance";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import FollowupPanel from "./pages/FollowupPanel";
// Patient Portal Pages
import PatientLogin from "./pages/patient/PatientLogin";
import PatientHome from "./pages/patient/PatientHome";
import PatientReports from "./pages/patient/PatientReports";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientPartners from "./pages/patient/PatientPartners";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PatientAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/" element={<LandingPage />} />
            
            {/* Patient Portal Routes */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/home" element={<PatientProtectedRoute><PatientHome /></PatientProtectedRoute>} />
            <Route path="/patient/reports" element={<PatientProtectedRoute><PatientReports /></PatientProtectedRoute>} />
            <Route path="/patient/prescriptions" element={<PatientProtectedRoute><PatientPrescriptions /></PatientProtectedRoute>} />
            <Route path="/patient/partners" element={<PatientProtectedRoute><PatientPartners /></PatientProtectedRoute>} />
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
            path="/protocolos/ondas-choque"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProtocolosOndasChoque />
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
          <Route
            path="/fisioregen-score"
            element={
              <ProtectedRoute>
                <Layout>
                  <FisioRegenScore />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/followups"
            element={
              <ProtectedRoute>
                <Layout>
                  <FollowupPanel />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/curadoria"
            element={
              <ProtectedRoute>
                <Layout>
                  <CuradoriaClinica />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/curadoria/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CuradoriaDetalhe />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/curadoria/:id/original"
            element={
              <ProtectedRoute>
                <Layout>
                  <CuradoriaOriginal />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/partners"
            element={
              <ProtectedRoute>
                <Layout>
                  <Partners />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/subscription"
            element={
              <ProtectedRoute>
                <Layout>
                  <Subscription />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/curadoria"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminCuradoria />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/curadoria/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminCuradoriaEditor />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artigos"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminArtigos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artigos/novo"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminArtigoForm />
              </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/artigos/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminArtigoForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registry"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminRegistryDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registry/governance"
            element={
              <ProtectedRoute>
                <Layout>
                  <RegistryGovernance />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Patient Management for Professionals */}
          <Route
            path="/patients/manage"
            element={
              <ProtectedRoute>
                <PatientsManage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </PatientAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
