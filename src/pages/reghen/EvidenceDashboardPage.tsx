import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, BarChart3, Search, FileText, AlertTriangle, CheckCircle, Link as LinkIcon } from "lucide-react";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodFilter = "7" | "30" | "90";

interface EvidenceStatus {
  attendanceId: string;
  createdAt: string;
  topicKey: string | null;
  snapshotCount: number;
  status: "linked" | "insufficient" | "none";
}

export default function EvidenceDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodFilter>("30");
  const [interventionFilter, setInterventionFilter] = useState<string>("all");
  const [pathologyFilter, setPathologyFilter] = useState<string>("all");

  // Log dashboard view
  useEffect(() => {
    supabase.from("academy_ai_logs").insert({
      action: "dashboard_view",
      user_id: "", // Will be set by RLS/trigger
      input: { page: "evidence_dashboard", period },
      status: "success",
    }).then(() => {});
    // Fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodDays = parseInt(period);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [periodDays]);

  // Fetch user's attendance sessions in period
  const { data: attendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ["evidence-dashboard-attendances", startDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, created_at, patient_id, involves_orthobiologics")
        .eq("user_id", user.id)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const attendanceIds = useMemo(() => attendances.map((a: any) => a.id), [attendances]);

  // Fetch evidence links for these attendances
  const { data: links = [] } = useQuery({
    queryKey: ["evidence-dashboard-links", attendanceIds],
    queryFn: async () => {
      if (attendanceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("reghen_evidence_links")
        .select("attendance_id, topic_key, is_active")
        .in("attendance_id", attendanceIds)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: attendanceIds.length > 0,
  });

  // Fetch snapshots for these attendances
  const { data: snapshots = [] } = useQuery({
    queryKey: ["evidence-dashboard-snapshots", attendanceIds],
    queryFn: async () => {
      if (attendanceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("reghen_evidence_snapshots")
        .select("attendance_id, topic_key, retrieval_mode, papers, answer_md, created_at")
        .in("attendance_id", attendanceIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: attendanceIds.length > 0,
  });

  // Fetch RAG query count (from ai logs)
  const { data: ragCount = 0 } = useQuery({
    queryKey: ["evidence-dashboard-rag-count", startDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count, error } = await supabase
        .from("academy_ai_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "attendance_evidence_query")
        .gte("created_at", startDate);
      if (error) return 0;
      return count || 0;
    },
  });

  // Derive unique interventions and pathologies from links
  const { interventions, pathologies } = useMemo(() => {
    const intSet = new Set<string>();
    const pathSet = new Set<string>();
    links.forEach((l: any) => {
      if (l.topic_key) {
        const [int, path] = l.topic_key.split("|", 2);
        if (int) intSet.add(int);
        if (path) pathSet.add(path);
      }
    });
    return { interventions: Array.from(intSet).sort(), pathologies: Array.from(pathSet).sort() };
  }, [links]);

  // Build table rows
  const tableRows: EvidenceStatus[] = useMemo(() => {
    return attendances.map((att: any) => {
      const attLinks = links.filter((l: any) => l.attendance_id === att.id);
      const attSnapshots = snapshots.filter((s: any) => s.attendance_id === att.id);
      const topicKey = attLinks[0]?.topic_key || null;

      // Apply filters
      if (interventionFilter !== "all" && topicKey) {
        const [int] = topicKey.split("|", 2);
        if (int !== interventionFilter) return null;
      }
      if (pathologyFilter !== "all" && topicKey) {
        const [, path] = topicKey.split("|", 2);
        if (path !== pathologyFilter) return null;
      }

      let status: "linked" | "insufficient" | "none" = "none";
      if (attSnapshots.length > 0) {
        // Check if any snapshot has "insuficiente" in answer
        const hasInsufficient = attSnapshots.some((s: any) =>
          s.answer_md?.toLowerCase().includes("insuficiente")
        );
        status = hasInsufficient ? "insufficient" : "linked";
      }

      return {
        attendanceId: att.id,
        createdAt: att.created_at,
        topicKey,
        snapshotCount: attSnapshots.length,
        status,
      };
    }).filter(Boolean) as EvidenceStatus[];
  }, [attendances, links, snapshots, interventionFilter, pathologyFilter]);

  // Compute cards
  const withEvidence = tableRows.filter(r => r.status === "linked").length;
  const insufficientCount = tableRows.filter(r => r.status === "insufficient").length;
  const insufficientPct = tableRows.length > 0
    ? Math.round((insufficientCount / tableRows.length) * 100)
    : 0;

  // Top 10 topic_keys
  const topTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l: any) => {
      if (l.topic_key) counts[l.topic_key] = (counts[l.topic_key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [links]);

  // Top 10 papers
  const topPapers = useMemo(() => {
    const counts: Record<string, { title: string; count: number }> = {};
    snapshots.forEach((s: any) => {
      const papers = s.papers as any[];
      if (!papers) return;
      papers.forEach((p: any) => {
        const id = p.paper_id || p.id;
        if (!id) return;
        if (!counts[id]) counts[id] = { title: p.title || id, count: 0 };
        counts[id].count++;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [snapshots]);

  const isLoading = loadingAttendances;

  const statusBadge = (status: "linked" | "insufficient" | "none") => {
    switch (status) {
      case "linked":
        return <Badge className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Vinculada</Badge>;
      case "insufficient":
        return <Badge variant="outline" className="text-amber-600 border-amber-300"><AlertTriangle className="w-3 h-3 mr-1" />Insuficiente</Badge>;
      case "none":
        return <Badge variant="secondary"><LinkIcon className="w-3 h-3 mr-1" />Sem evidência</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Dashboard de Evidência
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de evidência científica nos seus atendimentos
          </p>
        </div>
        <EvidenceMethodSeal size="sm" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={interventionFilter} onValueChange={setInterventionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Intervenção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas intervenções</SelectItem>
            {interventions.map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pathologyFilter} onValueChange={setPathologyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Patologia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas patologias</SelectItem>
            {pathologies.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Atendimentos com evidência</CardDescription>
                <CardTitle className="text-2xl">{withEvidence}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">de {tableRows.length} atendimentos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Consultas RAG feitas</CardDescription>
                <CardTitle className="text-2xl">{ragCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">no período selecionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>% Evidência insuficiente</CardDescription>
                <CardTitle className="text-2xl">{insufficientPct}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{insufficientCount} atendimento(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tópicos consultados</CardDescription>
                <CardTitle className="text-2xl">{topTopics.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">tópicos únicos</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Topics + Top Papers side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Top 10 Tópicos Consultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum tópico no período.</p>
                ) : (
                  <div className="space-y-2">
                    {topTopics.map(([key, count], i) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          {key}
                        </span>
                        <Badge variant="secondary" className="shrink-0">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Top 10 Papers Citados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPapers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum paper citado no período.</p>
                ) : (
                  <div className="space-y-2">
                    {topPapers.map(([id, { title, count }], i) => (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          {title.slice(0, 60)}{title.length > 60 ? "…" : ""}
                        </span>
                        <Badge variant="secondary" className="shrink-0">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Atendimentos ({tableRows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tableRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum atendimento no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Data</th>
                        <th className="pb-2 pr-4">Tópico</th>
                        <th className="pb-2 pr-4">Snapshots</th>
                        <th className="pb-2">Evidência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.slice(0, 100).map((row) => (
                        <tr
                          key={row.attendanceId}
                          className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/atendimentos/${row.attendanceId}`)}
                        >
                          <td className="py-2 pr-4">
                            {format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </td>
                          <td className="py-2 pr-4">
                            {row.topicKey ? (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {row.topicKey}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">{row.snapshotCount}</td>
                          <td className="py-2">{statusBadge(row.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground italic text-center">
            Este dashboard reflete apenas as métricas de evidência dos seus atendimentos.
            Não é recomendação de conduta nem comparação com outros profissionais.
          </p>
        </>
      )}
    </div>
  );
}
