import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireAdminRole } from "./components/RequireAdminRole";
import { RequireGovernanceRole } from "./components/RequireGovernanceRole";
import { PatientAuthProvider } from "./contexts/PatientAuthContext";
import { PatientProtectedRoute } from "./components/patient/PatientProtectedRoute";
import { ModeProvider } from "./contexts/ModeContext";
import { EduLayout } from "./components/edu/EduLayout";
import { RequireEduMembership } from "./components/edu";
import { MentorOnboardingGate } from "./components/academy/MentorOnboardingGate";
import { QAModeBanner } from "./components/QAModeBanner";
import { RequireGovernanceAccess } from "./components/governance/RequireGovernanceAccess";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Inline redirect — must be synchronous (uses useParams before routes resolve)
const ProntuarioRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/patients/${id}/records`} replace />;
};

// ─── Static: always in initial bundle ────────────────────────────────────────
// These are either public entry points or tiny enough to not matter.
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Checkout from "./pages/Checkout";
import SelectEnvironmentPage from "./pages/SelectEnvironmentPage";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientHome from "./pages/patient/PatientHome";
import PatientFollowup from "./pages/patient/PatientFollowup";

// ─── Lazy: landing sub-pages (chunk: landing) ─────────────────────────────────
const ProblemaPage        = lazy(() => import("./pages/landing/ProblemaPage"));
const ArquiteturaPage     = lazy(() => import("./pages/landing/ArquiteturaPage"));
const CienciaPage         = lazy(() => import("./pages/landing/CienciaPage"));
const GovernancaLandingPage = lazy(() => import("./pages/landing/GovernancaLandingPage"));
const EcossistemaPage     = lazy(() => import("./pages/landing/EcossistemaPage"));
const IntegracaoPage      = lazy(() => import("./pages/landing/IntegracaoPage"));
const EstruturaClinicaPage = lazy(() => import("./pages/landing/EstruturaClinicaPage"));
const ScorePage           = lazy(() => import("./pages/landing/ScorePage"));
const ResultadosPage      = lazy(() => import("./pages/landing/ResultadosPage"));
const EvidenciaPage       = lazy(() => import("./pages/landing/EvidenciaPage"));
const SegurancaPage       = lazy(() => import("./pages/landing/SegurancaPage"));
const FollowUpPage        = lazy(() => import("./pages/landing/FollowUpPage"));
const AcademyLandingPage  = lazy(() => import("./pages/landing/AcademyLandingPage"));
const LandingPreview      = lazy(() => import("./pages/LandingPreview"));

// ─── Lazy: core clinical app (chunk: clinical) ────────────────────────────────
const Pacientes               = lazy(() => import("./pages/Pacientes"));
const NovoPaciente            = lazy(() => import("./pages/NovoPaciente"));
const DetalhePaciente         = lazy(() => import("./pages/DetalhePaciente"));
const ProntuarioClinico       = lazy(() => import("./pages/ProntuarioClinico"));
const RegistrarEvolucao       = lazy(() => import("./pages/RegistrarEvolucao"));
const ClinicalRecordsList     = lazy(() => import("./pages/ClinicalRecordsList"));
const ClinicalRecordEditor    = lazy(() => import("./pages/ClinicalRecordEditor"));
const ClinicalRecordPrint     = lazy(() => import("./pages/ClinicalRecordPrint"));
const DailyDashboard          = lazy(() => import("./pages/DailyDashboard"));
const ProtocolosMenu          = lazy(() => import("./pages/ProtocolosMenu"));
const ProtocolosMAC           = lazy(() => import("./pages/ProtocolosMAC"));
const ProtocolosEPI           = lazy(() => import("./pages/ProtocolosEPI"));
const ProtocolosOrtobiologicos = lazy(() => import("./pages/ProtocolosOrtobiologicos"));
const ProtocolosOndasChoque   = lazy(() => import("./pages/ProtocolosOndasChoque"));
const ProtocoloMAC            = lazy(() => import("./pages/ProtocoloMAC"));
const AgenteMAC               = lazy(() => import("./pages/AgenteMAC"));
const TriagemBiologica        = lazy(() => import("./pages/TriagemBiologica"));
const FisioRegenScore         = lazy(() => import("./pages/FisioRegenScore"));
const Relatorios              = lazy(() => import("./pages/Relatorios"));
const VisualizarRelatorio     = lazy(() => import("./pages/VisualizarRelatorio"));
const FollowupPanel           = lazy(() => import("./pages/FollowupPanel"));
const CuradoriaClinica        = lazy(() => import("./pages/CuradoriaClinica"));
const CuradoriaDetalhe        = lazy(() => import("./pages/CuradoriaDetalhe"));
const CuradoriaOriginal       = lazy(() => import("./pages/CuradoriaOriginal"));
const Partners                = lazy(() => import("./pages/Partners"));
const Subscription            = lazy(() => import("./pages/Subscription"));
const PatientsManage          = lazy(() => import("./pages/PatientsManage"));
const AnaliseResultados       = lazy(() => import("./pages/AnaliseResultados"));
const DevRlsTest              = lazy(() => import("./pages/DevRlsTest"));

// ─── Lazy: atendimentos (chunk: atendimentos) ─────────────────────────────────
const AtendimentosList  = lazy(() => import("./pages/Atendimento").then(m => ({ default: m.AtendimentosList })));
const AtendimentoDetail = lazy(() => import("./pages/Atendimento").then(m => ({ default: m.AtendimentoDetail })));
const NovoAtendimento   = lazy(() => import("./pages/Atendimento").then(m => ({ default: m.NovoAtendimento })));

// ─── Lazy: admin panel (chunk: admin) ─────────────────────────────────────────
const AdminCuradoria        = lazy(() => import("./pages/admin/AdminCuradoria"));
const AdminCuradoriaEditor  = lazy(() => import("./pages/admin/AdminCuradoriaEditor"));
const AdminArtigos          = lazy(() => import("./pages/admin/AdminArtigos"));
const AdminArtigoForm       = lazy(() => import("./pages/admin/AdminArtigoForm"));
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRegistryDashboard = lazy(() => import("./pages/admin/AdminRegistryDashboard"));
const RegistryGovernance    = lazy(() => import("./pages/admin/RegistryGovernance"));
const AdminResearchExport   = lazy(() => import("./pages/admin/AdminResearchExport"));
const AdminScoreFluxoDoc    = lazy(() => import("./pages/admin/AdminScoreFluxoDoc"));
const AdminScoreQA          = lazy(() => import("./pages/admin/AdminScoreQA"));
const AdminSeedQA           = lazy(() => import("./pages/admin/AdminSeedQA"));

// ─── Lazy: governance (chunk: governance) ─────────────────────────────────────
const ProtocolsList       = lazy(() => import("./pages/governance").then(m => ({ default: m.ProtocolsList })));
const ProtocolDetail      = lazy(() => import("./pages/governance").then(m => ({ default: m.ProtocolDetail })));
const ProtocolEdit        = lazy(() => import("./pages/governance").then(m => ({ default: m.ProtocolEdit })));
const ProtocolCreate      = lazy(() => import("./pages/governance").then(m => ({ default: m.ProtocolCreate })));
const ConformidadeDashboard = lazy(() => import("./pages/governance").then(m => ({ default: m.ConformidadeDashboard })));

// ─── Lazy: registry & evidence (chunk: registry) ─────────────────────────────
const RegistryDashboard     = lazy(() => import("./pages/Registry").then(m => ({ default: m.RegistryDashboard })));
const RegistryExport        = lazy(() => import("./pages/Registry").then(m => ({ default: m.RegistryExport })));
const EvidenceDashboard     = lazy(() => import("./pages/Evidence").then(m => ({ default: m.EvidenceDashboard })));
const EvidenceDimensions    = lazy(() => import("./pages/Evidence").then(m => ({ default: m.EvidenceDimensions })));
const EvidenceDimensionDetail = lazy(() => import("./pages/Evidence").then(m => ({ default: m.EvidenceDimensionDetail })));
const EvidenceDashboardPage = lazy(() => import("./pages/reghen/EvidenceDashboardPage"));

// ─── Lazy: insights & career (chunk: insights) ────────────────────────────────
const CollectiveDashboard  = lazy(() => import("./pages/Insights").then(m => ({ default: m.CollectiveDashboard })));
const PerformanceDashboard = lazy(() => import("./pages/Insights").then(m => ({ default: m.PerformanceDashboard })));
const ClinicalDashboard    = lazy(() => import("./pages/Insights").then(m => ({ default: m.ClinicalDashboard })));
const CareerDashboard      = lazy(() => import("./pages/Career").then(m => ({ default: m.CareerDashboard })));
const DiligenceDashboard   = lazy(() => import("./pages/Diligence").then(m => ({ default: m.DiligenceDashboard })));
const DiligenceCaseDetail  = lazy(() => import("./pages/Diligence").then(m => ({ default: m.DiligenceCaseDetail })));

// ─── Lazy: academy (chunk: academy) ───────────────────────────────────────────
const AcademyHome             = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyHome })));
const ApprovalsPage           = lazy(() => import("./pages/academy").then(m => ({ default: m.ApprovalsPage })));
const MentorshipsPage         = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorshipsPage })));
const MentorshipDetailPage    = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorshipDetailPage })));
const MentorsPage             = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorsPage })));
const MentorDetailPage        = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorDetailPage })));
const MyMentorshipsPage       = lazy(() => import("./pages/academy").then(m => ({ default: m.MyMentorshipsPage })));
const MyJourneyPage           = lazy(() => import("./pages/academy").then(m => ({ default: m.MyJourneyPage })));
const AppliedSciencePage      = lazy(() => import("./pages/academy").then(m => ({ default: m.AppliedSciencePage })));
const ModoAvancado            = lazy(() => import("./pages/academy").then(m => ({ default: m.ModoAvancado })));
const MentorApplicationPage   = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorApplicationPage })));
const MentorOnboardingPage    = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorOnboardingPage })));
const MentorApprovalsPage     = lazy(() => import("./pages/academy").then(m => ({ default: m.MentorApprovalsPage })));
const TeacherApplicationPage  = lazy(() => import("./pages/academy").then(m => ({ default: m.TeacherApplicationPage })));
const TeacherApprovalsPage    = lazy(() => import("./pages/academy").then(m => ({ default: m.TeacherApprovalsPage })));
const TeacherDashboard        = lazy(() => import("./pages/academy").then(m => ({ default: m.TeacherDashboard })));
const ProductCreatePage       = lazy(() => import("./pages/academy").then(m => ({ default: m.ProductCreatePage })));
const ProductEditPage         = lazy(() => import("./pages/academy").then(m => ({ default: m.ProductEditPage })));
const AdminProductsPage       = lazy(() => import("./pages/academy").then(m => ({ default: m.AdminProductsPage })));
const MarketplacePage         = lazy(() => import("./pages/academy").then(m => ({ default: m.MarketplacePage })));
const MarketplaceDetailPage   = lazy(() => import("./pages/academy").then(m => ({ default: m.MarketplaceDetailPage })));
const MyPurchasesPage         = lazy(() => import("./pages/academy").then(m => ({ default: m.MyPurchasesPage })));
const CoursePlayerPage        = lazy(() => import("./pages/academy").then(m => ({ default: m.CoursePlayerPage })));
const AcademyFinancialAdmin   = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyFinancialAdmin })));
const AcademyTermsPage        = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyTermsPage })));
const AcademyPrivacyPage      = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyPrivacyPage })));
const AcademyRefundPolicyPage = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyRefundPolicyPage })));
const AcademyLibraryPage      = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyLibraryPage })));
const AcademyLibraryAdminPage = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyLibraryAdminPage })));
const AcademyPapersAdminPage  = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyPapersAdminPage })));
const AcademyFeedPage         = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyFeedPage })));
const AcademyCollectionsPage  = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyCollectionsPage })));
const AcademyCollectionDetailPage = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyCollectionDetailPage })));
const AcademyNotificationsPage = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyNotificationsPage })));
const EvidenceCentralPage     = lazy(() => import("./pages/academy").then(m => ({ default: m.EvidenceCentralPage })));
const AcademyAiTestsPage      = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyAiTestsPage })));
const AcademyWatchlistsPage   = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyWatchlistsPage })));
const AcademyPdfHealthPage    = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyPdfHealthPage })));
const AcademyTrilhasPage      = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyTrilhasPage })));
const AcademyMigrationsPage   = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyMigrationsPage })));
const ReghenEvidenceMethodPage = lazy(() => import("./pages/academy").then(m => ({ default: m.ReghenEvidenceMethodPage })));
const AcademyPipelineHealthPage = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyPipelineHealthPage })));
const AcademyReviewQueuePage  = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyReviewQueuePage })));
const AcademyPaperDetailPage  = lazy(() => import("./pages/academy").then(m => ({ default: m.AcademyPaperDetailPage })));
const CuratorPanel            = lazy(() => import("./pages/academy").then(m => ({ default: m.CuratorPanel })));
const CuratedArticleDetailPage = lazy(() => import("./pages/academy").then(m => ({ default: m.CuratedArticleDetailPage })));
const AcademyPipelineMetricsPage = lazy(() => import("./pages/academy/AcademyPipelineMetricsPage"));

// ─── Lazy: edu (chunk: edu) ───────────────────────────────────────────────────
const EduHome                   = lazy(() => import("./pages/edu").then(m => ({ default: m.EduHome })));
const EduDashboard              = lazy(() => import("./pages/edu").then(m => ({ default: m.EduDashboard })));
const EduCohorts                = lazy(() => import("./pages/edu").then(m => ({ default: m.EduCohorts })));
const EduCohortDetail           = lazy(() => import("./pages/edu").then(m => ({ default: m.EduCohortDetail })));
const EduModuleDetail           = lazy(() => import("./pages/edu").then(m => ({ default: m.EduModuleDetail })));
const EduCaseDetail             = lazy(() => import("./pages/edu").then(m => ({ default: m.EduCaseDetail })));
const EduLearningObjectDetail   = lazy(() => import("./pages/edu").then(m => ({ default: m.EduLearningObjectDetail })));
const EduDecisionLabDetail      = lazy(() => import("./pages/edu").then(m => ({ default: m.EduDecisionLabDetail })));
const EduCheckpointDetail       = lazy(() => import("./pages/edu").then(m => ({ default: m.EduCheckpointDetail })));
const EduProgress               = lazy(() => import("./pages/edu").then(m => ({ default: m.EduProgress })));
const EduTeacherDashboard       = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherDashboard })));
const EduTeacherCases           = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherCases })));
const EduTeacherLearningObjects = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherLearningObjects })));
const EduTeacherLearningObjectForm = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherLearningObjectForm })));
const EduTeacherCheckpoints     = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherCheckpoints })));
const EduTeacherDecisionLab     = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherDecisionLab })));
const EduTeacherAnalytics       = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherAnalytics })));
const EduTeacherModules         = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherModules })));
const EduTeacherCohorts         = lazy(() => import("./pages/edu").then(m => ({ default: m.EduTeacherCohorts })));
const EduDirectorConsole        = lazy(() => import("./pages/edu").then(m => ({ default: m.EduDirectorConsole })));
const EduAdminMembers           = lazy(() => import("./pages/edu").then(m => ({ default: m.EduAdminMembers })));
const EduAdminEnrollments       = lazy(() => import("./pages/edu").then(m => ({ default: m.EduAdminEnrollments })));
const EduAdminSettings          = lazy(() => import("./pages/edu").then(m => ({ default: m.EduAdminSettings })));

// ─────────────────────────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,   // 5 min — dados considerados frescos
      gcTime: 1000 * 60 * 10,     // 10 min — cache mantido em memória
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PatientAuthProvider>
        <Toaster />
        <Sonner />
        <QAModeBanner />
        <BrowserRouter>
        <ModeProvider>
          <Suspense fallback={<PageLoader />}>
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
          <Route path="/reghen/evidence-dashboard" element={<ProtectedRoute><Layout><EvidenceDashboardPage /></Layout></ProtectedRoute>} />

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
          {/* Clinical Dashboard - Orthobiologics */}
          <Route
            path="/insights/clinical"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClinicalDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Análise de Resultados */}
          <Route path="/analise-resultados" element={<ProtectedRoute><RequireGovernanceAccess><Layout><AnaliseResultados /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          {/* Governance Routes */}
          <Route path="/governanca/protocolos" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolsList /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          <Route path="/governanca/protocolos/novo" element={<ProtectedRoute><RequireAdminRole><Layout><ProtocolCreate /></Layout></RequireAdminRole></ProtectedRoute>} />
          <Route path="/governanca/protocolos/:protocolId" element={<ProtectedRoute><RequireGovernanceAccess><Layout><ProtocolDetail /></Layout></RequireGovernanceAccess></ProtectedRoute>} />
          <Route path="/governanca/protocolos/:protocolId/editar" element={<ProtectedRoute><RequireAdminRole><Layout><ProtocolEdit /></Layout></RequireAdminRole></ProtectedRoute>} />
           <Route path="/governanca/conformidade" element={<ProtectedRoute><RequireAdminRole><Layout><ConformidadeDashboard /></Layout></RequireAdminRole></ProtectedRoute>} />

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
          {/* Academy Admin Routes — RequireAdminRole (14 rotas) */}
          <Route path="/academy/admin/professores" element={<RequireAdminRole><EduLayout><TeacherApprovalsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/produtos" element={<RequireAdminRole><EduLayout><AdminProductsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/financeiro" element={<RequireAdminRole><EduLayout><AcademyFinancialAdmin /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/biblioteca" element={<RequireAdminRole><EduLayout><AcademyLibraryAdminPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/papers" element={<RequireAdminRole><EduLayout><AcademyPapersAdminPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/ai-tests" element={<RequireAdminRole><EduLayout><AcademyAiTestsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/watchlists" element={<RequireAdminRole><EduLayout><AcademyWatchlistsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/pdf-health" element={<RequireAdminRole><EduLayout><AcademyPdfHealthPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/pipeline-health" element={<RequireAdminRole><EduLayout><AcademyPipelineHealthPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/review-queue" element={<RequireAdminRole><EduLayout><AcademyReviewQueuePage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/paper/:paperId" element={<RequireAdminRole><EduLayout><AcademyPaperDetailPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/metrics" element={<RequireAdminRole><EduLayout><AcademyPipelineMetricsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/migrations" element={<RequireAdminRole><EduLayout><AcademyMigrationsPage /></EduLayout></RequireAdminRole>} />
          <Route path="/academy/admin/curador" element={<RequireAdminRole><EduLayout><CuratorPanel /></EduLayout></RequireAdminRole>} />
          {/* Teacher Dashboard & Products */}
          <Route path="/academy/professor/dashboard" element={<ProtectedRoute><EduLayout><TeacherDashboard /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/professor/produtos/novo" element={<ProtectedRoute><EduLayout><ProductCreatePage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/professor/produtos/:id/editar" element={<ProtectedRoute><EduLayout><ProductEditPage /></EduLayout></ProtectedRoute>} />
          {/* Marketplace */}
          <Route path="/academy/marketplace" element={<ProtectedRoute><EduLayout><MarketplacePage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/marketplace/:id" element={<ProtectedRoute><EduLayout><MarketplaceDetailPage /></EduLayout></ProtectedRoute>} />
          {/* Student Routes */}
          <Route path="/academy/minhas-compras" element={<ProtectedRoute><EduLayout><MyPurchasesPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/curso/:productId" element={<ProtectedRoute><EduLayout><CoursePlayerPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/curso/:productId/aula/:lessonId" element={<ProtectedRoute><EduLayout><CoursePlayerPage /></EduLayout></ProtectedRoute>} />
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
          <Route path="/academy/artigo/:articleId" element={<ProtectedRoute><EduLayout><CuratedArticleDetailPage /></EduLayout></ProtectedRoute>} />
          <Route path="/academy/about/reghen-evidence-method" element={<ProtectedRoute><EduLayout><ReghenEvidenceMethodPage /></EduLayout></ProtectedRoute>} />
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
        </Suspense>
        </ModeProvider>
      </BrowserRouter>
      </PatientAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
