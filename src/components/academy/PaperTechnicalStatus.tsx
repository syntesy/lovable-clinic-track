import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Database, RefreshCw, Loader2, ChevronDown, CheckCircle2, XCircle, Clock,
  AlertTriangle, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface FulltextData {
  extraction_method?: string;
  char_count?: number;
  word_count?: number;
  chunk_count?: number;
  has_sufficient_text?: boolean;
  is_scanned?: boolean;
  updated_at?: string;
}

interface CurationRow {
  id?: string;
  nivel_evidencia?: string;
  score_metodologico?: number;
  risco_vies?: string;
  request_id?: string;
  created_at?: string;
}

interface PaperTechnicalStatusProps {
  paperId: string;
  curationStatus: string;
  fulltextData: FulltextData | null;
  curationRow: CurationRow | null;
  userRole: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  curating: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function PaperTechnicalStatus({
  paperId,
  curationStatus,
  fulltextData,
  curationRow,
  userRole,
}: PaperTechnicalStatusProps) {
  const queryClient = useQueryClient();
  const [reprocessing, setReprocessing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const isAdmin = ["admin_academy", "teacher_approved"].includes(userRole);

  const handleReprocessPdf = async () => {
    setReprocessing(true);
    try {
      // Clear old fulltext & chunks
      const supabaseService = supabase;
      await supabaseService.from("academy_paper_fulltext" as any).delete().eq("paper_id", paperId);
      await supabaseService.from("academy_chunks" as any).delete().eq("paper_id", paperId);

      const { data, error } = await supabase.functions.invoke("academy-extract-pdf-text", {
        body: { paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("PDF reprocessado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["paper-fulltext", paperId] });
      queryClient.invalidateQueries({ queryKey: ["paper-files", paperId] });
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar PDF.");
    } finally {
      setReprocessing(false);
    }
  };

  const handleRegenerateCuration = async () => {
    setRegenerating(true);
    try {
      // Delete existing curation to allow re-generation
      await supabase.from("academy_paper_curation" as any).delete().eq("paper_id", paperId);
      await supabase.from("academy_papers").update({ curation_status: "draft" as any }).eq("id", paperId);

      const { data, error } = await supabase.functions.invoke("academy-curate-paper", {
        body: { paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Curadoria regenerada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["paper-curation", paperId] });
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao regerar curadoria.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Status Técnico do Paper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Curadoria:</span>
            <Badge variant="outline" className={`ml-2 text-[10px] ${STATUS_COLORS[curationStatus] || ""}`}>
              {curationStatus}
            </Badge>
          </div>
          {fulltextData && (
            <>
              <div>
                <span className="text-muted-foreground">Extração:</span>
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {fulltextData.extraction_method || "—"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Texto suficiente:</span>
                {fulltextData.has_sufficient_text ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Scan:</span>
                {fulltextData.is_scanned ? (
                  <Badge variant="outline" className="ml-2 text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30">Sim</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Não</Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Metrics Row */}
        {fulltextData && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              {fulltextData.char_count?.toLocaleString() || 0} chars
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {fulltextData.word_count?.toLocaleString() || 0} words
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {fulltextData.chunk_count || 0} chunks
            </Badge>
          </div>
        )}

        {/* Curation metrics */}
        {curationRow && (
          <div className="flex flex-wrap gap-2">
            {curationRow.nivel_evidencia && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                Evidência: {curationRow.nivel_evidencia}
              </Badge>
            )}
            {curationRow.score_metodologico != null && (
              <Badge variant="outline" className="text-[10px]">
                Score: {curationRow.score_metodologico}/10
              </Badge>
            )}
            {curationRow.risco_vies && (
              <Badge variant="outline" className={`text-[10px] ${
                curationRow.risco_vies === "baixo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                curationRow.risco_vies === "moderado" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                Viés: {curationRow.risco_vies}
              </Badge>
            )}
          </div>
        )}

        {/* Collapsible request_id for admin */}
        {isAdmin && curationRow?.request_id && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="w-3 h-3" /> request_id
            </CollapsibleTrigger>
            <CollapsibleContent>
              <code className="text-[10px] text-muted-foreground break-all block mt-1">
                {curationRow.request_id}
              </code>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={reprocessing}
              onClick={handleReprocessPdf}
            >
              {reprocessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Reprocessar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={regenerating}
              onClick={handleRegenerateCuration}
            >
              {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {curationStatus === "ready" ? "Regerar Curadoria" : "Gerar Curadoria"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
