import { supabase } from "@/integrations/supabase/client";
import { generateReportJsonHash, stableStringify } from "@/lib/report-hash";
import { REPORT_GENERATOR_VERSION } from "@/lib/report-version";
import type { Json } from "@/integrations/supabase/types";
import { toZonedTime, format as formatTz } from "date-fns-tz";

const SAO_PAULO_TZ = "America/Sao_Paulo";

export interface ReportSnapshotData {
  evaluationId: string | null;
  patientId: string;
  reportJson: Record<string, unknown>;
  attendanceRef?: string | null; // Links report to specific attendance session
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
 * Formata data para timezone America/Sao_Paulo
 */
export function formatDateSaoPaulo(date: Date | string, formatStr: string = "dd/MM/yyyy 'às' HH:mm"): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, SAO_PAULO_TZ);
  return formatTz(zonedDate, formatStr, { timeZone: SAO_PAULO_TZ });
}

/**
 * Retorna data atual em timezone America/Sao_Paulo como ISO string
 */
export function getNowSaoPauloISO(): string {
  const now = new Date();
  const zonedDate = toZonedTime(now, SAO_PAULO_TZ);
  return zonedDate.toISOString();
}

/**
 * Hook para gerenciamento de snapshots imutáveis de relatórios
 */
export function useReportSnapshot() {
  /**
   * Cria um snapshot imutável do relatório ANTES de exportar PDF
   * Retorna o snapshot criado para uso na geração do PDF
   * 
   * Idempotência: Se já existir um snapshot com mesmo hash + evaluation_id,
   * retorna o existente em vez de criar duplicado
   */
  const createSnapshot = async (data: ReportSnapshotData): Promise<ReportSnapshot | null> => {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Gerar hash do conteúdo para integridade (usando stable stringify)
      const reportHash = await generateReportJsonHash(data.reportJson);

      // IDEMPOTÊNCIA: Verificar se já existe snapshot idêntico
      // Mesmo hash + mesmo evaluation_id = mesmo conteúdo
      const { data: existingSnapshot } = await supabase
        .from('report_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('report_hash', reportHash)
        .eq('evaluation_id', data.evaluationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSnapshot) {
        console.log('Snapshot idêntico já existe:', existingSnapshot.id);
        return existingSnapshot as ReportSnapshot;
      }

      // Inserir snapshot com dados serializados de forma estável
      const stableJson = JSON.parse(stableStringify(data.reportJson));
      
      const { data: snapshot, error } = await supabase
        .from('report_snapshots')
        .insert({
          evaluation_id: data.evaluationId,
          patient_id: data.patientId,
          user_id: user.id,
          generator_version: REPORT_GENERATOR_VERSION,
          report_hash: reportHash,
          report_json: stableJson as unknown as Json,
          attendance_ref: data.attendanceRef || null, // Links to specific attendance
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
    formatDateSaoPaulo,
  };
}
