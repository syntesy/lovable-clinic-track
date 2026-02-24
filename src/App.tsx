import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";

// Componente de redirect para rota legada do prontuário
const ProntuarioRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/patients/${id}/records`} replace />;
};

// Import select environment page
import SelectEnvironmentPage from "./pages/SelectEnvironmentPage";

// Import new clinical records pages
import ClinicalRecordsList from "./pages/ClinicalRecordsList";
import ClinicalRecordEditor from "./pages/ClinicalRecordEditor";
import ClinicalRecordPrint from "./pages/ClinicalRecordPrint";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireAdminRole } from "./components/RequireAdminRole";
import { RequireGovernanceRole } from "./components/RequireGovernanceRole";
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
import AdminResearchExport from "./pages/admin/AdminResearchExport";
import AdminScoreFluxoDoc from "./pages/admin/AdminScoreFluxoDoc";
import AdminScoreQA from "./pages/admin/AdminScoreQA";
import AdminSeedQA from "./pages/admin/AdminSeedQA";
import LandingPage from "./pages/LandingPage";
import LandingPreview from "./pages/LandingPreview";
import NotFound from "./pages/NotFound";
import ProblemaPage from "./pages/landing/ProblemaPage";
import ArquiteturaPage from "./pages/landing/ArquiteturaPage";
import CienciaPage from "./pages/landing/CienciaPage";
import GovernancaLandingPage from "./pages/landing/GovernancaLandingPage";
import EcossistemaPage from "./pages/landing/EcossistemaPage";
import IntegracaoPage from "./pages/landing/IntegracaoPage";
import EstruturaClinicaPage from "./pages/landing/EstruturaClinicaPage";
import ScorePage from "./pages/landing/ScorePage";
import ResultadosPage from "./pages/landing/ResultadosPage";
import EvidenciaPage from "./pages/landing/EvidenciaPage";
import SegurancaPage from "./pages/landing/SegurancaPage";
import FollowUpPage from "./pages/landing/FollowUpPage";
import AcademyLandingPage from "./pages/landing/AcademyLandingPage";
import FollowupPanel from "./pages/FollowupPanel";
import { RegistryDashboard, RegistryExport } from "./pages/Registry";
import { EvidenceDashboard, EvidenceDimensions, EvidenceDimensionDetail } from "./pages/Evidence";
import { CareerDashboard } from "./pages/Career";
import { DiligenceDashboard, DiligenceCaseDetail } from "./pages/Diligence";
import DailyDashboard from "./pages/DailyDashboard";
import AnaliseResultados from "./pages/AnaliseResultados";
import { AtendimentosList, AtendimentoDetail, NovoAtendimento } from "./pages/Atendimento";
import { CollectiveDashboard, PerformanceDashboard } from "./pages/Insights";
// Patient Portal Pages - Single Function (Followup only)
import PatientLogin from "./pages/patient/PatientLogin";
import PatientHome from "./pages/patient/PatientHome";
import PatientFollowup from "./pages/patient/PatientFollowup";
// Education Pages
import { ModeProvider } from "./contexts/ModeContext";
import { EduLayout } from "./components/edu/EduLayout";
import { RequireEduMembership } from "./components/edu";
import {
  EduHome, EduDashboard, EduCohorts, EduCohortDetail, EduModuleDetail,
  EduCaseDetail, EduLearningObjectDetail, EduDecisionLabDetail, EduCheckpointDetail, EduProgress,
  EduTeacherDashboard, EduTeacherCases, EduTeacherLearningObjects, EduTeacherLearningObjectForm, EduTeacherCheckpoints, EduTeacherDecisionLab, EduTeacherAnalytics,
  EduTeacherModules, EduTeacherCohorts,
  EduDirectorConsole,
  EduAdminMembers, EduAdminEnrollments, EduAdminSettings
} from "./pages/edu";
import {
  AcademyHome, ApprovalsPage, MentorshipsPage, MentorshipDetailPage, MentorsPage, MentorDetailPage,
  MyMentorshipsPage, MyJourneyPage, AppliedSciencePage, ModoAvancado,
  MentorApplicationPage, MentorOnboardingPage, MentorApprovalsPage,
  TeacherApplicationPage, TeacherApprovalsPage,
  TeacherDashboard, ProductCreatePage, ProductEditPage, AdminProductsPage,
  MarketplacePage, MarketplaceDetailPage,
  MyPurchasesPage, CoursePlayerPage,
  AcademyFinancialAdmin, AcademyTermsPage, AcademyPrivacyPage, AcademyRefundPolicyPage,
  AcademyLibraryPage, AcademyLibraryAdminPage, AcademyPapersAdminPage,
  AcademyFeedPage, AcademyCollectionsPage, AcademyCollectionDetailPage, AcademyNotificationsPage,
  EvidenceCentralPage, AcademyAiTestsPage, AcademyWatchlistsPage, AcademyPdfHealthPage,
  AcademyTrilhasPage, AcademyMigrationsPage,
} from "./pages/academy";
import { MentorOnboardingGate } from "./components/academy/MentorOnboardingGate";
import { QAModeBanner } from "./components/QAModeBanner";
import { ProtocolsList, ProtocolDetail, ProtocolEdit, ProtocolCreate, ConformidadeDashboard } from "./pages/governance";
import { RequireGovernanceAccess } from "./components/governance/RequireGovernanceAccess";
import DevRlsTest from "./pages/DevRlsTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PatientAuthProvider>
        <Toaster />
        <Sonner />
        <QAModeBanner />
        <BrowserRouter>
        <ModeProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/select-environment" element={<ProtectedRoute><SelectEnvironmentPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/problema" element={<ProblemaPage />} />
            <Route path="/arquitetura" element={<ArquiteturaPage />} />
            <Route path="/ciencia" element={<CienciaPage />} />
            <Route path="/estrutura-cientifica" element={<CienciaPage />} />
            <Route path="/governanca-info" element={<GovernancaLandingPage />} />
            <Route path="/ecossistema" element={<EcossistemaPage />} />
            <Route path="/integracao" element={<IntegracaoPage />} />
            <Route path="/estrutura-clinica" element={<EstruturaClinicaPage />} />
            <Route path="/score" element={<ScorePage />} />
            <Route path="/resultados" element={<ResultadosPage />} />
            <Route path="/evidencia" element={<EvidenciaPage />} />
            <Route path="/seguranca" element={<SegurancaPage />} />
            <Route path="/follow-up" element={<FollowUpPage />} />
            <Route path="/academy-info" element={<AcademyLandingPage />} />
            <Route path="/landing-preview" element={<LandingPreview />} />
            
            {/* Patient Portal Routes - Single Function */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/home" element={<PatientProtectedRoute><PatientHome /></PatientProtectedRoute>} />
            <Route path="/patient/followup" element={<PatientProtectedRoute><PatientFollowup /></PatientProtectedRoute>} />
            {/* Legacy routes redirect to home */}
            <Route path="/patient/reports" element={<Navigate to="/patient/home" replace />} />
            <Route path="/patient/prescriptions" element={<Navigate to="/patient/home" replace />} />
            <Route path="/patient/partners" element={<Navigate to="/patient/home" replace />} />
          
          {/* Atendimentos Routes */}
          <Route path="/atendimentos" element={<ProtectedRoute><Layout><AtendimentosList /></Layout></ProtectedRoute>} />
          <Route path="/atendimentos/novo" element={<ProtectedRoute><Layout><NovoAtendimento /></Layout></ProtectedRoute>} />
          <Route path="/atendimentos/:attendanceId" element={<ProtectedRoute><Layout><AtendimentoDetail /></Layout></ProtectedRoute>} />
          
          {/* Daily Clinical Dashboard */}
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <DailyDashboard />
              </ProtectedRoute>
            }
          />
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
          {/* Clinical Records Routes - New Architecture */}
          <Route
            path="/patients/:patientId/records"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClinicalRecordsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:patientId/records/:recordId"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClinicalRecordEditor />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:patientId/records/:recordId/print"
            element={
              <ProtectedRoute>
                <ClinicalRecordPrint />
              </ProtectedRoute>
            }
          />
          {/* Legacy prontuario route - redirect to new records list */}
          <Route
            path="/prontuario/:id"
            element={<ProntuarioRedirect />}
          />
          <Route
            path="/pacientes/:id/prontuario"
            element={<ProntuarioRedirect />}
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
          {/* Career Engine Route */}
          <Route
            path="/career"
            element={
              <ProtectedRoute>
                <Layout>
                  <CareerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Diligence & Compliance Routes */}
          <Route
            path="/diligence"
            element={
              <ProtectedRoute>
                <Layout>
                  <DiligenceDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diligence/case/:caseId"
            element={
              <ProtectedRoute>
                <Layout>
                  <DiligenceCaseDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Insights - Collective Dashboard */}
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectiveDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Performance Dashboard - Private Benchmark */}
          <Route
            path="/insights/performance"
            element={
              <ProtectedRoute>
                <Layout>
                  <PerformanceDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Análise de Resultados */}
          <Route path="/analise-resultados" element={<ProtectedRoute><RequireGovernanceAccess><Layout><AnaliseResultados /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          {/* Governance Routes */}
          <Route path="/governanca/protocolos" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolsList /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          <Route path="/governanca/protocolos/novo" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolCreate /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          <Route path="/governanca/protocolos/:protocolId" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolDetail /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          <Route path="/governanca/protocolos/:protocolId/editar" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolEdit /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
           <Route path="/governanca/conformidade" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ConformidadeDashboard /></Layout></RequireGovernanceAccess></ProtectedRoute>} />

          {/* DEV — temporary RLS test page */}
          <Route path="/dev/rls-test" element={<ProtectedRoute><DevRlsTest /></ProtectedRoute>} />

          {/* Admin Routes - Protected by RequireAdminRole */}
          <Route
            path="/admin"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/curadoria"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminCuradoria />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/curadoria/:id"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminCuradoriaEditor />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/artigos"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminArtigos />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/artigos/novo"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminArtigoForm />
              </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/artigos/:id"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminArtigoForm />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/registry"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminRegistryDashboard />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/registry/governance"
            element={
              <RequireAdminRole>
                <Layout>
                  <RegistryGovernance />
                </Layout>
            </RequireAdminRole>
          }
          />
          <Route
            path="/admin/registry/export"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminResearchExport />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/docs/score-fluxo"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminScoreFluxoDoc />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/qa/score"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminScoreQA />
                </Layout>
              </RequireAdminRole>
            }
          />
          <Route
            path="/admin/qa/seed"
            element={
              <RequireAdminRole>
                <Layout>
                  <AdminSeedQA />
                </Layout>
              </RequireAdminRole>
            }
          />
          {/* Registry Analytics Routes */}
          <Route
            path="/registry"
            element={
              <ProtectedRoute>
                <Layout>
                  <RegistryDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registry/export"
            element={
              <ProtectedRoute>
                <Layout>
                  <RegistryExport />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Evidence Engine Routes - Dashboard restricted to admin/governance */}
          <Route
            path="/evidence"
            element={
              <RequireGovernanceRole>
                <Layout>
                  <EvidenceDashboard />
                </Layout>
              </RequireGovernanceRole>
            }
          />
          <Route
            path="/evidence/dimensions"
            element={
              <RequireGovernanceRole>
                <Layout>
                  <EvidenceDimensions />
                </Layout>
              </RequireGovernanceRole>
            }
          />
          <Route
            path="/evidence/dimensions/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EvidenceDimensionDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/manage"
            element={
              <ProtectedRoute>
                <PatientsManage />
              </ProtectedRoute>
            }
          />

          {/* Academy Routes - New REGEN Academy */}
          <Route path="/academy" element={<Navigate to="/academy/home" replace />} />
          <Route path="/academy/home" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><AcademyHome /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/mentorias" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MentorshipsPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/mentorias/:slug" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MentorshipDetailPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/mentores" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MentorsPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/mentores/:slug" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MentorDetailPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/minhas-mentorias" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MyMentorshipsPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/minha-jornada" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><MyJourneyPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/ciencia-aplicada" element={<Navigate to="/academy/evidencia?tab=aplicar" replace />} />
          <Route path="/academy/modo-avancado" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><ModoAvancado /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          <Route path="/academy/aprovacoes" element={<ProtectedRoute><MentorOnboardingGate><EduLayout><ApprovalsPage /></EduLayout></MentorOnboardingGate></ProtectedRoute>} />
          {/* Mentor Onboarding Routes - NOT wrapped by gate */}
          <Route path="/academy/mentores/candidatar" element={<EduLayout><MentorApplicationPage /></EduLayout>} />
          <Route path="/academy/mentor/onboarding" element={<ProtectedRoute><EduLayout><MentorOnboardingPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/aprovacoes/mentores" element={<RequireAdminRole><EduLayout><MentorApprovalsPage /></EduLayout></RequireAdminRole>} />
          {/* Teacher Routes */}
          <Route path="/academy/professor/candidatar" element={<ProtectedRoute><EduLayout><TeacherApplicationPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/professores" element={<ProtectedRoute><EduLayout><TeacherApprovalsPage /></EduLayout></ProtectedRoute>} />
          {/* Teacher Dashboard & Products */}
          <Route path="/academy/professor/dashboard" element={<ProtectedRoute><EduLayout><TeacherDashboard /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/professor/produtos/novo" element={<ProtectedRoute><EduLayout><ProductCreatePage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/professor/produtos/:id/editar" element={<ProtectedRoute><EduLayout><ProductEditPage /></EduLayout></ProtectedRoute>} />
          {/* Admin Products */}
          <Route path="/academy/admin/produtos" element={<ProtectedRoute><EduLayout><AdminProductsPage /></EduLayout></ProtectedRoute>} />
          {/* Marketplace */}
          <Route path="/academy/marketplace" element={<ProtectedRoute><EduLayout><MarketplacePage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/marketplace/:id" element={<ProtectedRoute><EduLayout><MarketplaceDetailPage /></EduLayout></ProtectedRoute>} />
          {/* Student Routes */}
          <Route path="/academy/minhas-compras" element={<ProtectedRoute><EduLayout><MyPurchasesPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/curso/:productId" element={<ProtectedRoute><EduLayout><CoursePlayerPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/curso/:productId/aula/:lessonId" element={<ProtectedRoute><EduLayout><CoursePlayerPage /></EduLayout></ProtectedRoute>} />
          {/* Admin Financial */}
          <Route path="/academy/admin/financeiro" element={<ProtectedRoute><EduLayout><AcademyFinancialAdmin /></EduLayout></ProtectedRoute>} />
          {/* Legal Pages */}
          <Route path="/academy/termos" element={<EduLayout><AcademyTermsPage /></EduLayout>} />
          <Route path="/academy/privacidade" element={<EduLayout><AcademyPrivacyPage /></EduLayout>} />
          <Route path="/academy/reembolso" element={<EduLayout><AcademyRefundPolicyPage /></EduLayout>} />
          {/* Evidence Central (unified) */}
          <Route path="/academy/evidencia" element={<ProtectedRoute><EduLayout><EvidenceCentralPage /></EduLayout></ProtectedRoute>} />
          {/* Legacy redirects */}
          <Route path="/academy/biblioteca" element={<Navigate to="/academy/evidencia?tab=explorar" replace />} />
          <Route path="/academy/feed" element={<Navigate to="/academy/evidencia?tab=feed" replace />} />
          <Route path="/academy/colecoes" element={<Navigate to="/academy/evidencia?tab=colecoes" replace />} />
          {/* Keep these as standalone */}
          <Route path="/academy/admin/biblioteca" element={<ProtectedRoute><EduLayout><AcademyLibraryAdminPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/papers" element={<ProtectedRoute><EduLayout><AcademyPapersAdminPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/ai-tests" element={<ProtectedRoute><EduLayout><AcademyAiTestsPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/watchlists" element={<ProtectedRoute><EduLayout><AcademyWatchlistsPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/pdf-health" element={<ProtectedRoute><EduLayout><AcademyPdfHealthPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/admin/migrations" element={<ProtectedRoute><EduLayout><AcademyMigrationsPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/trilhas" element={<ProtectedRoute><EduLayout><AcademyTrilhasPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/colecoes/:id" element={<ProtectedRoute><EduLayout><AcademyCollectionDetailPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/notificacoes" element={<ProtectedRoute><EduLayout><AcademyNotificationsPage /></EduLayout></ProtectedRoute>} />

          {/* Education Routes */}
          <Route path="/edu" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduHome /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/dashboard" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduDashboard /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/cohorts" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduCohorts /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/cohorts/:cohortId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduCohortDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/modules/:moduleId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduModuleDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/cases/:caseId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduCaseDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/learning/:learningObjectId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduLearningObjectDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/decision-lab/:scenarioId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduDecisionLabDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/checkpoints/:checkpointId" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduCheckpointDetail /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/progress" element={<ProtectedRoute><RequireEduMembership><EduLayout><EduProgress /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          {/* Teacher Routes */}
          <Route path="/edu/teacher/dashboard" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherDashboard /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/cases" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherCases /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/learning-objects" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherLearningObjects /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/learning-objects/new" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherLearningObjectForm /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/modules" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherModules /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/cohorts" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherCohorts /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/checkpoints" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherCheckpoints /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/decision-lab" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherDecisionLab /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/teacher/analytics" element={<ProtectedRoute><RequireEduMembership allowedRoles={['teacher', 'director', 'institution_admin']}><EduLayout><EduTeacherAnalytics /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          {/* Director Routes */}
          <Route path="/edu/director/console" element={<ProtectedRoute><RequireEduMembership allowedRoles={['director', 'institution_admin']}><EduLayout><EduDirectorConsole /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          {/* Admin Routes */}
          <Route path="/edu/admin/members" element={<ProtectedRoute><RequireEduMembership allowedRoles={['institution_admin']}><EduLayout><EduAdminMembers /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/admin/enrollments" element={<ProtectedRoute><RequireEduMembership allowedRoles={['institution_admin']}><EduLayout><EduAdminEnrollments /></EduLayout></RequireEduMembership></ProtectedRoute>} />
          <Route path="/edu/admin/settings" element={<ProtectedRoute><RequireEduMembership allowedRoles={['institution_admin']}><EduLayout><EduAdminSettings /></EduLayout></RequireEduMembership></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </ModeProvider>
      </BrowserRouter>
      </PatientAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
