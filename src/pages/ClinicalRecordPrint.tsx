import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClinicalRecordPrint() {
  const { patientId, recordId } = useParams<{ patientId: string; recordId: string }>();
  const navigate = useNavigate();

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Fetch clinical record
  const { data: record, isLoading } = useQuery({
    queryKey: ["clinical-record", recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("id", recordId)
        .eq("patient_id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!recordId && !!patientId,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record || !patient) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-center text-muted-foreground">
          Prontuário não encontrado
        </p>
        <Button
          className="mt-4 mx-auto block"
          onClick={() => navigate(`/patients/${patientId}/records`)}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden max-w-4xl mx-auto p-4 flex items-center gap-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/patients/${patientId}/records`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Visualização para Impressão</h1>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        <style>{`
          @media print {
            body { 
              font-size: 12pt; 
              color: #000; 
              background: #fff;
            }
            .print-section {
              break-inside: avoid;
              margin-bottom: 1rem;
            }
            h1, h2, h3 { color: #000; }
          }
        `}</style>

        {/* Header */}
        <div className="print-section border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            PRONTUÁRIO CLÍNICO
          </h1>
          <p className="text-center text-sm text-muted-foreground print:text-gray-600">
            Documento gerado em: {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Patient Info */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Dados do Paciente
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Nome:</strong> {patient.full_name}</div>
            <div><strong>Idade:</strong> {patient.age} anos</div>
            <div><strong>Sexo:</strong> {patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : "Não informado"}</div>
            <div><strong>Região tratada:</strong> {patient.treated_region || "—"}</div>
          </div>
        </div>

        {/* Record Info */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Informações do Prontuário
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Data de criação:</strong> {formatDate(record.created_at)}</div>
            <div><strong>Última atualização:</strong> {formatDate(record.updated_at)}</div>
            <div><strong>Status:</strong> {record.status === "final" ? "Finalizado" : "Rascunho"}</div>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Queixa Principal
          </h2>
          <p className="whitespace-pre-wrap text-sm">
            {record.chief_complaint || "Não informado"}
          </p>
        </div>

        {/* Anamnesis */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Anamnese
          </h2>
          <p className="whitespace-pre-wrap text-sm">
            {record.anamnesis || "Não informado"}
          </p>
        </div>

        {/* Physical Exam */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Exame Físico
          </h2>
          <p className="whitespace-pre-wrap text-sm">
            {record.physical_exam || "Não informado"}
          </p>
        </div>

        {/* Clinical Diagnosis */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Diagnóstico Clínico
          </h2>
          <p className="whitespace-pre-wrap text-sm">
            {record.clinical_diagnosis || "Não informado"}
          </p>
        </div>

        {/* Pain Classification */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Classificação da Dor
          </h2>
          <div className="text-sm space-y-1">
            <div>
              <strong>Nociceptiva:</strong> {patient.pain_type_nociceptive ? "Sim" : "Não"}
            </div>
            <div>
              <strong>Neuropática:</strong> {patient.pain_type_neuropathic ? "Sim" : "Não"}
            </div>
            <div>
              <strong>Nociplástica:</strong> {patient.pain_type_nociplastic ? "Sim" : "Não"}
            </div>
          </div>
        </div>

        {/* Baseline Scales */}
        <div className="print-section border border-gray-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">
            Escalas Baseline
          </h2>
          <div className="text-sm">
            <strong>EVA Inicial:</strong> {patient.initial_vas ?? "Não informado"}
          </div>
        </div>

        {/* Footer */}
        <div className="print-section border-t-2 border-gray-800 pt-8 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-sm font-medium">Assinatura do Profissional</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-sm font-medium">Data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
