import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, BookOpen, MessageSquare, FileText } from "lucide-react";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";
import { supabase } from "@/integrations/supabase/client";
import type { ReghenEvidenceSnapshot } from "@/hooks/useReghenEvidence";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvidenceTimelineModalProps {
  snapshots: ReghenEvidenceSnapshot[];
  attendanceId: string;
}

export function EvidenceTimelineModal({ snapshots, attendanceId }: EvidenceTimelineModalProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleOpen = useCallback(async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Log timeline_open (best effort, no PII)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("academy_ai_logs").insert({
            action: "timeline_open",
            user_id: user.id,
            input: { attendance_id: attendanceId },
            status: "success",
          } as any);
        }
      } catch {
        // silent
      }
    }
  }, [attendanceId]);

  if (snapshots.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Ver Timeline Completa ({snapshots.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline de Evidência
          </DialogTitle>
          <EvidenceMethodSeal size="sm" />
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-4">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="rounded-lg border p-4 space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {snap.retrieval_mode === "manual_question" ? (
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {snap.retrieval_mode === "manual_question" ? "Pergunta" : "Painel"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {snap.topic_key}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(snap.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Query */}
                {snap.query_text && (
                  <p className="text-sm italic text-muted-foreground">
                    Pergunta: "{snap.query_text}"
                  </p>
                )}

                {/* Papers */}
                <div className="flex flex-wrap gap-1">
                  {(snap.papers as any[])?.map((p: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-[9px] font-normal">
                      {(p.title || "Paper").slice(0, 50)}{(p.title || "").length > 50 ? "…" : ""}
                    </Badge>
                  ))}
                </div>

                {/* Expandable answer */}
                {snap.answer_md && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => setExpandedId(expandedId === snap.id ? null : snap.id)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {expandedId === snap.id ? "Ocultar resposta" : "Ver resposta"}
                    </Button>
                    {expandedId === snap.id && (
                      <div className="mt-2 rounded bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                        {snap.answer_md}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground italic mt-2">
          Esta timeline reflete o histórico de evidência consultada. Não é recomendação de conduta.
        </p>
      </DialogContent>
    </Dialog>
  );
}
