import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ReviewTask {
  id: string;
  paper_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  paper_title?: string;
  paper_status?: string;
}

const REASON_LABELS: Record<string, string> = {
  parser_error: "Erro de parser",
  low_text_quality: "Qualidade de texto baixa",
  qa_flag: "Flag de QA",
  low_ai_confidence: "Baixa confiança IA",
  missing_metadata: "Metadados ausentes",
  duplicate_detected: "Duplicata",
  curator_request: "Solicitação do curador",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  resolved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function AcademyReviewQueuePage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("academy_review_task")
      .select("id, paper_id, reason, status, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) { toast.error("Erro ao carregar fila"); setLoading(false); return; }

    // Fetch paper titles
    const paperIds = [...new Set((data || []).map(t => t.paper_id))];
    const { data: papers } = await supabase
      .from("academy_papers")
      .select("id, title, curation_status")
      .in("id", paperIds.length > 0 ? paperIds : ["00000000-0000-0000-0000-000000000000"]);

    const paperMap = new Map((papers || []).map(p => [p.id, p]));
    const enriched = (data || []).map(t => ({
      ...t,
      paper_title: paperMap.get(t.paper_id)?.title || "—",
      paper_status: paperMap.get(t.paper_id)?.curation_status || "—",
    }));

    setTasks(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const resolveTask = async (taskId: string) => {
    await supabase.from("academy_review_task").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", taskId);
    toast.success("Task resolvida");
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fila de Revisão</h1>
          <p className="text-muted-foreground text-sm">Papers aguardando revisão humana</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
            <p className="text-muted-foreground">Nenhuma task pendente 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-medium truncate text-foreground">{task.paper_title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className={STATUS_COLORS[task.status] || ""}>
                        {task.status}
                      </Badge>
                      <Badge variant="secondary">
                        {REASON_LABELS[task.reason] || task.reason}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <Badge variant="outline">{task.paper_status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/academy/admin/paper/${task.paper_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    {task.status === "open" && (
                      <Button variant="outline" size="sm" onClick={() => resolveTask(task.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
