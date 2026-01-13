import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Printer,
  Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClinicalRecord {
  id: string;
  status: string;
  chief_complaint: string | null;
  clinical_diagnosis: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClinicalRecordsList() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch patient info
  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch clinical records
  const { data: records, isLoading } = useQuery({
    queryKey: ["clinical-record", "list", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("id, status, chief_complaint, clinical_diagnosis, created_at, updated_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClinicalRecord[];
    },
    enabled: !!patientId,
  });

  // Create new clinical record
  const handleCreateNew = async () => {
    if (!patientId) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("clinical_records")
        .insert({
          patient_id: patientId,
          status: "draft",
          chief_complaint: "",
          anamnesis: "",
          physical_exam: "",
          clinical_diagnosis: "",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        toast.success("Novo prontuário criado");
        navigate(`/patients/${patientId}/records/${data.id}`);
      }
    } catch (error) {
      console.error("Erro ao criar prontuário:", error);
      toast.error("Erro ao criar prontuário");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete draft record
  const handleDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("clinical_records")
        .delete()
        .eq("id", recordToDelete);

      if (error) throw error;

      toast.success("Prontuário excluído");
      queryClient.invalidateQueries({ queryKey: ["clinical-record", "list", patientId] });
      queryClient.invalidateQueries({ queryKey: ["clinical-record", "latest", patientId] });
    } catch (error) {
      console.error("Erro ao excluir prontuário:", error);
      toast.error("Erro ao excluir prontuário");
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "final") {
      return (
        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Finalizado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
        <Clock className="w-3 h-3 mr-1" />
        Rascunho
      </Badge>
    );
  };

  const getSummary = (record: ClinicalRecord) => {
    if (record.clinical_diagnosis?.trim()) {
      return record.clinical_diagnosis.length > 100
        ? record.clinical_diagnosis.substring(0, 100) + "..."
        : record.clinical_diagnosis;
    }
    if (record.chief_complaint?.trim()) {
      return record.chief_complaint.length > 100
        ? record.chief_complaint.substring(0, 100) + "..."
        : record.chief_complaint;
    }
    return "Sem diagnóstico informado";
  };

  if (!patientId) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/pacientes/${patientId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Prontuários Clínicos
            </h1>
            {patient && (
              <p className="text-sm text-muted-foreground">
                {patient.full_name} • {patient.age} anos
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="sm:ml-auto"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Novo Prontuário
        </Button>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !records || records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum prontuário ainda
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Clique em "Novo Prontuário" para criar o primeiro registro clínico.
            </p>
            <Button onClick={handleCreateNew} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Novo Prontuário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card
              key={record.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/patients/${patientId}/records/${record.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(record.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {getStatusBadge(record.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getSummary(record)}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Atualizado: {format(new Date(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/patients/${patientId}/records/${record.id}/print`)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {record.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRecordToDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prontuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O prontuário será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
