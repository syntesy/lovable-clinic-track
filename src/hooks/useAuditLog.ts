import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AuditLogParams {
  action: string;
  tableName?: string;
  recordId?: string;
  oldData?: Json;
  newData?: Json;
  additionalInfo?: Json;
}

export function useAuditLog() {
  const logAction = useCallback(async (params: AuditLogParams): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("Tentativa de log sem usuário autenticado");
        return false;
      }

      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          action: params.action,
          table_name: params.tableName || null,
          record_id: params.recordId || null,
          old_data: params.oldData || null,
          new_data: params.newData || null,
          ip_address: null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          additional_info: params.additionalInfo || null,
        });

      if (error) {
        console.error("Erro ao registrar log de auditoria:", error);
        // Em ambiente de produção, poderia enviar para um serviço de monitoramento
        // Para compliance, é importante que erros de auditoria não passem despercebidos
        if (import.meta.env.PROD) {
          console.error("[AUDIT_FAILURE]", { params, error });
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
      return false;
    }
  }, []);

  // Ações predefinidas comuns
  const logLogin = useCallback(() => {
    return logAction({ action: "LOGIN", additionalInfo: { timestamp: new Date().toISOString() } });
  }, [logAction]);

  const logLogout = useCallback(() => {
    return logAction({ action: "LOGOUT", additionalInfo: { timestamp: new Date().toISOString() } });
  }, [logAction]);

  const logPatientView = useCallback((patientId: string, patientName: string) => {
    return logAction({
      action: "PATIENT_VIEW",
      tableName: "patients",
      recordId: patientId,
      additionalInfo: { patient_name: patientName },
    });
  }, [logAction]);

  const logPatientCreate = useCallback((patientId: string, patientData: Json) => {
    return logAction({
      action: "PATIENT_CREATE",
      tableName: "patients",
      recordId: patientId,
      newData: patientData,
    });
  }, [logAction]);

  const logPatientUpdate = useCallback((
    patientId: string,
    oldData: Json,
    newData: Json
  ) => {
    return logAction({
      action: "PATIENT_UPDATE",
      tableName: "patients",
      recordId: patientId,
      oldData,
      newData,
    });
  }, [logAction]);

  const logPatientDelete = useCallback((patientId: string, patientData: Json) => {
    return logAction({
      action: "PATIENT_DELETE",
      tableName: "patients",
      recordId: patientId,
      oldData: patientData,
    });
  }, [logAction]);

  const logClinicalRecordUpdate = useCallback((
    recordId: string,
    patientId: string,
    oldData: Json,
    newData: Json
  ) => {
    return logAction({
      action: "CLINICAL_RECORD_UPDATE",
      tableName: "clinical_records",
      recordId,
      oldData,
      newData,
      additionalInfo: { patient_id: patientId },
    });
  }, [logAction]);

  const logConsentAccepted = useCallback((patientId: string, consentType: string) => {
    return logAction({
      action: "CONSENT_ACCEPTED",
      tableName: "patient_consents",
      additionalInfo: { patient_id: patientId, consent_type: consentType },
    });
  }, [logAction]);

  const logConsentRevoked = useCallback((patientId: string, consentType: string, reason: string) => {
    return logAction({
      action: "CONSENT_REVOKED",
      tableName: "patient_consents",
      additionalInfo: { patient_id: patientId, consent_type: consentType, reason },
    });
  }, [logAction]);

  const logDocumentAccess = useCallback((documentId: string, documentType: string, patientId: string) => {
    return logAction({
      action: "DOCUMENT_ACCESS",
      tableName: "patient_documents",
      recordId: documentId,
      additionalInfo: { document_type: documentType, patient_id: patientId },
    });
  }, [logAction]);

  const logSessionStart = useCallback(() => {
    return logAction({
      action: "SESSION_START",
      additionalInfo: { 
        timestamp: new Date().toISOString(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
      },
    });
  }, [logAction]);

  const logSessionEnd = useCallback((duration: number) => {
    return logAction({
      action: "SESSION_END",
      additionalInfo: { 
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
      },
    });
  }, [logAction]);

  // === Attendance Events (Governança v1.1) ===
  
  const logAttendanceCreated = useCallback((attendanceId: string, patientId: string, involvesOrthobiologics: boolean) => {
    return logAction({
      action: "ATTENDANCE_CREATED",
      tableName: "attendance_sessions",
      recordId: attendanceId,
      additionalInfo: { 
        patient_id: patientId,
        involves_orthobiologics: involvesOrthobiologics,
      },
    });
  }, [logAction]);

  const logAttendanceClosed = useCallback((attendanceId: string, patientId: string) => {
    return logAction({
      action: "ATTENDANCE_CLOSED",
      tableName: "attendance_sessions",
      recordId: attendanceId,
      additionalInfo: { 
        patient_id: patientId,
        closed_at: new Date().toISOString(),
      },
    });
  }, [logAction]);

  const logAttendanceFileUploaded = useCallback((fileId: string, attendanceId: string, fileName: string, fileType: string) => {
    return logAction({
      action: "ATTENDANCE_FILE_UPLOADED",
      tableName: "attendance_files",
      recordId: fileId,
      additionalInfo: { 
        attendance_ref: attendanceId,
        file_name: fileName,
        file_type: fileType,
      },
    });
  }, [logAction]);

  const logReportSnapshotCreated = useCallback((snapshotId: string, patientId: string, attendanceRef?: string) => {
    return logAction({
      action: "REPORT_SNAPSHOT_CREATED",
      tableName: "report_snapshots",
      recordId: snapshotId,
      additionalInfo: { 
        patient_id: patientId,
        attendance_ref: attendanceRef || null,
      },
    });
  }, [logAction]);

  return {
    logAction,
    logLogin,
    logLogout,
    logPatientView,
    logPatientCreate,
    logPatientUpdate,
    logPatientDelete,
    logClinicalRecordUpdate,
    logConsentAccepted,
    logConsentRevoked,
    logDocumentAccess,
    logSessionStart,
    logSessionEnd,
    // Attendance events
    logAttendanceCreated,
    logAttendanceClosed,
    logAttendanceFileUploaded,
    logReportSnapshotCreated,
  };
}
