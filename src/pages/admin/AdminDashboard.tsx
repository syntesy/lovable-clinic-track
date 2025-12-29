import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  FileText,
  BookOpen,
  Clock,
  MousePointerClick,
  HeadphonesIcon,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { PeriodFilter } from "@/components/admin/dashboard/PeriodFilter";
import { AlertsWidget } from "@/components/admin/dashboard/AlertsWidget";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { PlanDistributionChart } from "@/components/admin/dashboard/PlanDistributionChart";
import { DataTable, StatusBadge, PriorityBadge } from "@/components/admin/dashboard/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    period,
    setPeriod,
    setCustomRange,
    isLoading,
    isAdmin,
    dashboardData,
    revenueChart,
    planDistribution,
    curationQueue,
    topPartners,
    supportTickets,
    alerts,
    refresh
  } = useAdminDashboard();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAlertClick = (action: string) => {
    switch (action) {
      case "delinquent":
        document.getElementById("section-subscriptions")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "premium_limit":
        document.getElementById("section-patients")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "curation":
        document.getElementById("section-content")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "revenue":
        document.getElementById("section-revenue")?.scrollIntoView({ behavior: "smooth" });
        break;
      default:
        break;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Verificando acesso...</h2>
          <p className="text-sm text-muted-foreground">Aguarde enquanto validamos suas permissões.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard — Administrador</h1>
            <p className="text-sm text-muted-foreground">Visão geral do REGENAPP</p>
          </div>
        </div>
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          onCustomRangeChange={setCustomRange}
          onRefresh={refresh}
          isLoading={isLoading}
        />
      </div>

      {/* Alerts Widget */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Atenção
          </h3>
          <AlertsWidget alerts={alerts} onAlertClick={handleAlertClick} />
        </div>
      )}

      {/* KPIs Section */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">KPIs Principais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Usuários Ativos"
            value={dashboardData?.activeUsers.value || 0}
            variation={dashboardData?.activeUsers.variation}
            subtitle="vs. período anterior"
            icon={UserCheck}
            iconColor="text-green-500"
          />
          <KPICard
            title="Usuários Totais"
            value={dashboardData?.totalUsers.value || 0}
            variation={dashboardData?.totalUsers.variation}
            subtitle="cadastros"
            icon={Users}
            iconColor="text-blue-500"
          />
          <KPICard
            title="Inadimplentes"
            value={dashboardData?.delinquentUsers.value || 0}
            icon={UserX}
            iconColor="text-red-500"
            badge={
              (dashboardData?.delinquentUsers.value || 0) > 0
                ? { text: "Ver lista", variant: "error" }
                : undefined
            }
            onClick={() => document.getElementById("section-subscriptions")?.scrollIntoView({ behavior: "smooth" })}
          />
          <KPICard
            title="Receita no Período"
            value={formatCurrency(dashboardData?.revenue.value || 0)}
            variation={dashboardData?.revenue.variation}
            subtitle="vs. período anterior"
            icon={DollarSign}
            iconColor="text-primary"
          />
          <KPICard
            title="MRR"
            value={formatCurrency(dashboardData?.mrr.value || 0)}
            subtitle="receita recorrente mensal"
            icon={TrendingUp}
            iconColor="text-primary"
          />
          <KPICard
            title="Pacientes Atendidos"
            value={dashboardData?.totalPatients.value || 0}
            subtitle="somatório global"
            icon={Stethoscope}
            iconColor="text-cyan-500"
          />
          <KPICard
            title="Documentos Gerados"
            value={dashboardData?.documentsGenerated.value || 0}
            variation={dashboardData?.documentsGenerated.variation}
            subtitle="relatórios + prescrições"
            icon={FileText}
            iconColor="text-violet-500"
          />
          <KPICard
            title="Artigos Publicados"
            value={dashboardData?.articlesPublished.value || 0}
            icon={BookOpen}
            iconColor="text-amber-500"
          />
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Revenue & Subscriptions Section */}
      <section id="section-revenue" className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Receita e Assinaturas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart data={revenueChart} />
          </div>
          <PlanDistributionChart data={planDistribution} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Novos Assinantes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardData?.activeUsers.value || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cancelamentos (Churn)</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground mt-1">Sem dados no período</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <UserX className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="bg-border" id="section-subscriptions" />

      {/* Patients Section */}
      <section id="section-patients" className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Gestão de Pacientes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Pacientes Ativos Globais"
            value={dashboardData?.totalPatients.value || 0}
            icon={Stethoscope}
            iconColor="text-cyan-500"
          />
          <KPICard
            title="Média por Usuário"
            value={
              dashboardData?.activeUsers.value
                ? Math.round((dashboardData?.totalPatients.value || 0) / dashboardData.activeUsers.value)
                : 0
            }
            subtitle="pacientes/profissional"
            icon={Users}
            iconColor="text-blue-500"
          />
          <KPICard
            title="Premium no Limite"
            value={dashboardData?.premiumUsersNearLimit || 0}
            subtitle="≥90 de 100 pacientes"
            icon={AlertTriangle}
            iconColor="text-yellow-500"
            badge={
              (dashboardData?.premiumUsersNearLimit || 0) > 0
                ? { text: "Candidatos upgrade", variant: "warning" }
                : undefined
            }
          />
          <KPICard
            title="Cliques Parceiros"
            value={(dashboardData?.partnerClicks.value || 0) + (dashboardData?.patientPartnerClicks.value || 0)}
            subtitle="prof. + pacientes"
            icon={MousePointerClick}
            iconColor="text-purple-500"
          />
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Content / Curation Section */}
      <section id="section-content" className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Conteúdo e Curadoria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Artigos Publicados"
            value={dashboardData?.articlesPublished.value || 0}
            icon={BookOpen}
            iconColor="text-green-500"
          />
          <KPICard
            title="Aguardando Curadoria"
            value={dashboardData?.articlesAwaitingCuration || 0}
            icon={Clock}
            iconColor="text-yellow-500"
            onClick={() => navigate("/admin/curadoria")}
          />
          <KPICard
            title="Em Revisão"
            value={dashboardData?.articlesInReview || 0}
            icon={FileText}
            iconColor="text-blue-500"
          />
          <KPICard
            title="Tickets Abertos"
            value={dashboardData?.openTickets || 0}
            icon={HeadphonesIcon}
            iconColor="text-red-500"
          />
        </div>

        <DataTable
          title="Fila de Curadoria"
          icon={Clock}
          data={curationQueue}
          columns={[
            {
              key: "title",
              header: "Título",
              render: (item) => (
                <span className="font-medium text-foreground truncate max-w-[300px] block">
                  {item.title}
                </span>
              )
            },
            {
              key: "interest",
              header: "Categoria",
              render: (item) => (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {item.interest}
                </span>
              )
            },
            {
              key: "status",
              header: "Status",
              render: (item) => <StatusBadge status={item.status} />
            },
            {
              key: "requestedAt",
              header: "Solicitado em",
              render: (item) => (
                <span className="text-muted-foreground text-xs">
                  {format(new Date(item.requestedAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )
            }
          ]}
          emptyMessage="Nenhum artigo na fila de curadoria"
          onRowClick={(item) => navigate(`/admin/curadoria`)}
          actionButton={{
            label: "Gerenciar",
            onClick: () => navigate("/admin/curadoria")
          }}
        />
      </section>

      <Separator className="bg-border" />

      {/* Partners Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Parceiros e Comissionamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Cliques (Profissionais)"
            value={dashboardData?.partnerClicks.value || 0}
            icon={MousePointerClick}
            iconColor="text-blue-500"
          />
          <KPICard
            title="Cliques (Pacientes)"
            value={dashboardData?.patientPartnerClicks.value || 0}
            icon={MousePointerClick}
            iconColor="text-cyan-500"
          />
          <KPICard
            title="Top Parceiro"
            value={topPartners[0]?.name || "—"}
            subtitle={topPartners[0] ? `${topPartners[0].clicks} cliques` : "Sem dados"}
            icon={TrendingUp}
            iconColor="text-green-500"
          />
          <KPICard
            title="Comissão Estimada"
            value={formatCurrency(0)}
            subtitle="estimativa futura"
            icon={DollarSign}
            iconColor="text-muted-foreground"
          />
        </div>

        <DataTable
          title="Top Parceiros"
          icon={TrendingUp}
          data={topPartners}
          columns={[
            {
              key: "name",
              header: "Parceiro",
              render: (item) => <span className="font-medium text-foreground">{item.name}</span>
            },
            {
              key: "category",
              header: "Categoria",
              render: (item) => (
                <span className="text-xs text-muted-foreground">{item.category}</span>
              )
            },
            {
              key: "clicks",
              header: "Cliques",
              className: "text-right",
              render: (item) => (
                <span className="font-semibold text-foreground">{item.clicks}</span>
              )
            }
          ]}
          emptyMessage="Nenhum clique registrado no período"
        />
      </section>

      <Separator className="bg-border" />

      {/* Support Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Qualidade e Suporte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tickets Abertos"
            value={dashboardData?.openTickets || 0}
            icon={HeadphonesIcon}
            iconColor="text-blue-500"
          />
          <KPICard
            title="Tickets Resolvidos"
            value={dashboardData?.resolvedTickets || 0}
            subtitle="no período"
            icon={CheckCircle}
            iconColor="text-green-500"
          />
          <KPICard
            title="Tempo Médio Resolução"
            value="—"
            subtitle="sem dados suficientes"
            icon={Clock}
            iconColor="text-muted-foreground"
          />
          <KPICard
            title="Erros Críticos"
            value={0}
            subtitle="últimos 7 dias"
            icon={AlertTriangle}
            iconColor="text-red-500"
          />
        </div>

        <DataTable
          title="Tickets Recentes"
          icon={HeadphonesIcon}
          data={supportTickets}
          columns={[
            {
              key: "subject",
              header: "Assunto",
              render: (item) => (
                <span className="font-medium text-foreground truncate max-w-[250px] block">
                  {item.subject}
                </span>
              )
            },
            {
              key: "status",
              header: "Status",
              render: (item) => <StatusBadge status={item.status} />
            },
            {
              key: "priority",
              header: "Prioridade",
              render: (item) => <PriorityBadge priority={item.priority} />
            },
            {
              key: "createdAt",
              header: "Criado em",
              render: (item) => (
                <span className="text-muted-foreground text-xs">
                  {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              )
            }
          ]}
          emptyMessage="Nenhum ticket de suporte"
        />
      </section>
    </div>
  );
}