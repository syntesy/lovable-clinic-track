import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Paperclip, 
  Save, 
  FileText, 
  CheckCircle,
  ArrowLeft,
  User,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AttendanceSession, AttendanceStatus, isAttendanceClosed } from "@/types/attendance";

interface AttendanceHeaderProps {
  attendance: AttendanceSession;
  patientName: string;
  status: AttendanceStatus;
  fileCount: number;
  onSave?: () => void;
  onGenerateReport?: () => void;
  onConclude?: () => void;
  isSaving?: boolean;
  isConcluding?: boolean;
  onNavigateToAttachments?: () => void;
}

const statusLabels: Record<AttendanceStatus, { label: string; className: string }> = {
  S0: { label: "S0 — Triagem", className: "bg-muted text-muted-foreground" },
  S1: { label: "S1 — Avaliação Clínica", className: "bg-blue-500/20 text-blue-700 dark:text-blue-400" },
  S2: { label: "S2 — Exames Laboratoriais", className: "bg-amber-500/20 text-amber-700 dark:text-amber-400" },
  S3: { label: "S3 — Score Definitivo", className: "bg-green-500/20 text-green-700 dark:text-green-400" },
};

export function AttendanceHeader({
  attendance,
  patientName,
  status,
  fileCount,
  onSave,
  onGenerateReport,
  onConclude,
  isSaving,
  isConcluding,
  onNavigateToAttachments,
}: AttendanceHeaderProps) {
  const navigate = useNavigate();
  const statusInfo = statusLabels[status];
  const isClosed = isAttendanceClosed(attendance);
  
  const formattedDate = format(
    new Date(attendance.created_at),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );
  
  const closedDate = attendance.closed_at 
    ? format(new Date(attendance.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top row: Back button and title */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/pacientes/${attendance.patient_id}`)}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground truncate">
                ATENDIMENTO — {formattedDate}
              </h1>
              {isClosed && (
                <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                  <Lock className="w-3 h-3" />
                  Concluído
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <User className="w-4 h-4" />
              <span className="text-sm">{patientName}</span>
              {closedDate && (
                <span className="text-xs">• Concluído em {closedDate}</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Status badges and actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
            
            {attendance.involves_orthobiologics && (
              <Badge variant="outline" className="gap-1">
                🧬 Ortobiológicos
              </Badge>
            )}
            
            <Badge 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={onNavigateToAttachments}
            >
              <Paperclip className="w-3 h-3" />
              {fileCount} arquivo{fileCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isClosed && onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            )}
            
            {onGenerateReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateReport}
                className="gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Gerar Relatório
              </Button>
            )}
            
            {!isClosed && onConclude && status === "S3" && (
              <Button
                size="sm"
                onClick={onConclude}
                disabled={isConcluding}
                className="gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Concluir Atendimento
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
