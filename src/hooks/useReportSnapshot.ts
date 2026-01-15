import { supabase } from "@/integrations/supabase/client";
import { generateReportJsonHash } from "@/lib/report-hash";
import { REPORT_GENERATOR_VERSION } from "@/lib/report-version";
import type { Json } from "@/integrations/supabase/types";

export interface ReportSnapshotData {
  evaluationId: string | null;
  patientId: string;
  reportJson: Record<string, unknown>;
}

export interface ReportSnapshot {
  id: string;
  evaluation_id: string | null;
  patient_id: string;
  user_id: string;
  generated_at: string;
  generator_version: string;
  report_hash: string;
  report_json: Json;
  created_at: string;
}

/**
 * Hook para gerenciamento de snapshots imutáveis de relatórios
 */
export function useReportSnapshot() {
  /**
   * Cria um snapshot imutável do relatório ANTES de exportar PDF
   * Retorna o snapshot criado para uso na geração do PDF
   */
  const createSnapshot = async (data: ReportSnapshotData): Promise<ReportSnapshot | null> => {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Gerar hash do conteúdo para integridade
      const reportHash = await generateReportJsonHash(data.reportJson);

      // Inserir snapshot
      const { data: snapshot, error } = await supabase
        .from('report_snapshots')
        .insert({
          evaluation_id: data.evaluationId,
          patient_id: data.patientId,
          user_id: user.id,
          generator_version: REPORT_GENERATOR_VERSION,
          report_hash: reportHash,
          report_json: data.reportJson as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      return snapshot as ReportSnapshot;
    } catch (error) {
      console.error('Error creating report snapshot:', error);
      return null;
    }
  };

  /**
   * Busca snapshots de um paciente específico
   */
  const getSnapshotsByPatient = async (patientId: string): Promise<ReportSnapshot[]> => {
    try {
      const { data, error } = await supabase
        .from('report_snapshots')
        .select('*')
        .eq('patient_id', patientId)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      return (data || []) as ReportSnapshot[];
    } catch (error) {
      console.error('Error fetching report snapshots:', error);
      return [];
    }
  };

  /**
   * Busca um snapshot específico por ID
   */
  const getSnapshotById = async (snapshotId: string): Promise<ReportSnapshot | null> => {
    try {
      const { data, error } = await supabase
        .from('report_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single();

      if (error) throw error;

      return data as ReportSnapshot;
    } catch (error) {
      console.error('Error fetching report snapshot:', error);
      return null;
    }
  };

  return {
    createSnapshot,
    getSnapshotsByPatient,
    getSnapshotById,
    generatorVersion: REPORT_GENERATOR_VERSION,
  };
}
