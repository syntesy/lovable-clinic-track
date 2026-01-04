// =========================================================
// REGENAPP DILIGENCE & COMPLIANCE LAYER™ - Hook
// Read-only sobre dados clínicos, write-only sobre diligence_*
// =========================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DiligenceCaseReport,
  DiligenceCaseTimeline,
  DiligenceRiskDisclosure,
  DiligenceChecklist,
  DiligencePracticeStatement,
  DiligenceComplianceLog,
  DiligenceDashboardMetrics,
  CaseReportContent,
  DiligenceAction,
  CHECKLIST_TEMPLATES,
  DILIGENCE_DISCLAIMER,
} from '@/types/diligence';
import { Json } from '@/integrations/supabase/types';

// Helper to compute simple checksum
function computeChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function useDiligenceLayer() {
  const [loading, setLoading] = useState(false);

  // =========================================================
  // COMPLIANCE LOGGING (append-only)
  // =========================================================
  const logAction = useCallback(async (
    action: DiligenceAction,
    caseId?: string,
    details?: Record<string, unknown>
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('diligence_compliance_logs').insert({
      user_id: user.id,
      case_id: caseId || null,
      action,
      action_details: details as Json || null,
      user_agent: navigator.userAgent,
    });
  }, []);

  // =========================================================
  // READ CLINICAL DATA (READ-ONLY)
  // =========================================================
  const fetchCaseData = useCallback(async (patientId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch screening/case data
    const { data: screening } = await supabase
      .from('prp_screenings')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch consent
    const { data: consent } = await supabase
      .from('patient_consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch followups
    const { data: followups } = await supabase
      .from('procedure_followups')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_for', { ascending: true });

    // Fetch curations linked to techniques
    const { data: curations } = await supabase
      .from('curations')
      .select(`
        id,
        article_id,
        curadoria_articles!inner(title, authors, journal, year, doi)
      `)
      .eq('status', 'aprovada')
      .limit(5);

    // Fetch patient procedures
    const { data: procedures } = await supabase
      .from('patient_procedures')
      .select('*')
      .eq('patient_id', patientId)
      .order('procedure_date', { ascending: false });

    return {
      screening,
      consent,
      followups: followups || [],
      curations: curations || [],
      procedures: procedures || [],
    };
  }, []);

  // =========================================================
  // GENERATE CASE REPORT (write to diligence_case_reports)
  // =========================================================
  const generateCaseReport = useCallback(async (
    patientId: string,
    caseId: string
  ): Promise<DiligenceCaseReport | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if report already exists (idempotency)
      const { data: existingReport } = await supabase
        .from('diligence_case_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('case_id', caseId)
        .order('report_version', { ascending: false })
        .limit(1)
        .single();

      if (existingReport) {
        // Return existing report, don't duplicate
        await logAction('view_report', caseId);
        return existingReport as unknown as DiligenceCaseReport;
      }

      // Fetch clinical data (READ-ONLY)
      const caseData = await fetchCaseData(patientId);
      if (!caseData) return null;

      // Build report content
      const reportContent: CaseReportContent = {
        case_identifier: caseId.substring(0, 8).toUpperCase(),
        patient_code: `PAC-${patientId.substring(0, 6).toUpperCase()}`,
        procedure_date: caseData.procedures[0]?.procedure_date || new Date().toISOString().split('T')[0],
        technique_registered: caseData.procedures[0]?.procedure_name || caseData.screening?.classification || 'Não especificada',
        scientific_references: (caseData.curations || []).map((c: any) => ({
          title: c.curadoria_articles?.title || '',
          authors: c.curadoria_articles?.authors || '',
          journal: c.curadoria_articles?.journal || '',
          year: c.curadoria_articles?.year || 0,
          doi: c.curadoria_articles?.doi || undefined,
        })),
        consent_status: {
          has_consent: !!caseData.consent?.accepted,
          consent_date: caseData.consent?.accepted_at || undefined,
          consent_type: caseData.consent?.consent_type || undefined,
        },
        followup_status: {
          has_followup: (caseData.followups || []).length > 0,
          followup_dates: (caseData.followups || [])
            .filter((f: any) => f.status === 'completed')
            .map((f: any) => f.completed_at || f.scheduled_for),
          timepoints_completed: (caseData.followups || [])
            .filter((f: any) => f.status === 'completed')
            .map((f: any) => f.timepoint),
        },
        red_flags_documented: {
          has_red_flags: caseData.screening?.classification === 'red_flag' || false,
          red_flags_list: [],
          documented_at: caseData.screening?.created_at || undefined,
        },
        registration_events: [
          ...(caseData.screening ? [{
            event_type: 'screening_created',
            timestamp: caseData.screening.created_at,
            description: 'Triagem biológica registrada',
          }] : []),
          ...(caseData.consent?.accepted ? [{
            event_type: 'consent_obtained',
            timestamp: caseData.consent.accepted_at || caseData.consent.created_at,
            description: 'Consentimento obtido',
          }] : []),
          ...(caseData.procedures || []).map((p: any) => ({
            event_type: 'procedure_performed',
            timestamp: p.procedure_date,
            description: `Procedimento: ${p.procedure_name}`,
          })),
          ...(caseData.followups || [])
            .filter((f: any) => f.status === 'completed')
            .map((f: any) => ({
              event_type: 'followup_completed',
              timestamp: f.completed_at || f.updated_at,
              description: `Follow-up ${f.timepoint} completado`,
            })),
        ],
        disclaimer: DILIGENCE_DISCLAIMER,
      };

      // Compute checksum
      const contentString = JSON.stringify(reportContent);
      const checksum = computeChecksum(contentString);

      // Insert report (immutable after creation)
      const { data: newReport, error } = await supabase
        .from('diligence_case_reports')
        .insert({
          user_id: user.id,
          case_id: caseId,
          report_version: 1,
          report_content: reportContent as unknown as Json,
          pdf_checksum: checksum,
          immutable: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Log action
      await logAction('generate_report', caseId, { report_id: newReport.id });

      // Create timeline entries
      await createTimelineFromReport(user.id, caseId, reportContent);

      return newReport as unknown as DiligenceCaseReport;
    } catch (error) {
      console.error('Error generating case report:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCaseData, logAction]);

  // =========================================================
  // CREATE TIMELINE ENTRIES
  // =========================================================
  const createTimelineFromReport = async (
    userId: string,
    caseId: string,
    reportContent: CaseReportContent
  ) => {
    const timelineEntries = reportContent.registration_events.map(event => ({
      user_id: userId,
      case_id: caseId,
      event_type: event.event_type,
      event_description: event.description,
      event_timestamp: event.timestamp,
      immutable: true,
    }));

    if (timelineEntries.length > 0) {
      await supabase.from('diligence_case_timelines').insert(timelineEntries);
    }
  };

  // =========================================================
  // FETCH REPORTS
  // =========================================================
  const fetchCaseReports = useCallback(async (): Promise<DiligenceCaseReport[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('diligence_case_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return (data || []) as unknown as DiligenceCaseReport[];
  }, []);

  // =========================================================
  // FETCH TIMELINE
  // =========================================================
  const fetchCaseTimeline = useCallback(async (caseId: string): Promise<DiligenceCaseTimeline[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    await logAction('view_timeline', caseId);

    const { data } = await supabase
      .from('diligence_case_timelines')
      .select('*')
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .order('event_timestamp', { ascending: true });

    return (data || []) as unknown as DiligenceCaseTimeline[];
  }, [logAction]);

  // =========================================================
  // CHECKLISTS
  // =========================================================
  const getOrCreateChecklist = useCallback(async (
    caseId: string,
    checklistType: keyof typeof CHECKLIST_TEMPLATES
  ): Promise<DiligenceChecklist | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if exists
    const { data: existing } = await supabase
      .from('diligence_checklists')
      .select('*')
      .eq('user_id', user.id)
      .eq('case_id', caseId)
      .eq('checklist_type', checklistType)
      .single();

    if (existing) return existing as unknown as DiligenceChecklist;

    // Create new
    const template = CHECKLIST_TEMPLATES[checklistType];
    const { data: newChecklist, error } = await supabase
      .from('diligence_checklists')
      .insert({
        user_id: user.id,
        case_id: caseId,
        checklist_type: checklistType,
        checklist_items: template as unknown as Json,
        completed_items: [] as unknown as Json,
        status: 'pending',
        immutable: false,
      })
      .select()
      .single();

    if (error) throw error;
    return newChecklist as unknown as DiligenceChecklist;
  }, []);

  const updateChecklistItem = useCallback(async (
    checklistId: string,
    itemId: string,
    completed: boolean
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: checklist } = await supabase
      .from('diligence_checklists')
      .select('*')
      .eq('id', checklistId)
      .eq('user_id', user.id)
      .single();

    if (!checklist || checklist.immutable) return;

    const currentCompleted = (checklist.completed_items as string[]) || [];
    let newCompleted: string[];

    if (completed) {
      newCompleted = [...new Set([...currentCompleted, itemId])];
    } else {
      newCompleted = currentCompleted.filter(id => id !== itemId);
    }

    const items = checklist.checklist_items as any[];
    const allRequired = items.filter(i => i.required).map(i => i.id);
    const allRequiredCompleted = allRequired.every(id => newCompleted.includes(id));
    const newStatus = allRequiredCompleted ? 'completed' : newCompleted.length > 0 ? 'in_progress' : 'pending';

    await supabase
      .from('diligence_checklists')
      .update({
        completed_items: newCompleted as unknown as Json,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checklistId)
      .eq('user_id', user.id);

    await logAction('update_checklist_status', checklist.case_id || undefined, {
      checklist_id: checklistId,
      item_id: itemId,
      completed,
    });
  }, [logAction]);

  // =========================================================
  // PRACTICE STATEMENT
  // =========================================================
  const generatePracticeStatement = useCallback(async (): Promise<DiligencePracticeStatement | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch aggregated data for statement
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('professional_id', user.id);

      const { data: screenings } = await supabase
        .from('prp_screenings')
        .select('id, classification')
        .in('patient_id', (patients || []).map(p => p.id));

      const { data: followups } = await supabase
        .from('procedure_followups')
        .select('id, status')
        .in('patient_id', (patients || []).map(p => p.id));

      const statementContent = {
        title: 'Declaração de Padrão Técnico Profissional',
        body: `
Este documento declara, de forma factual e descritiva, o padrão técnico-científico adotado na prática clínica.

DADOS AGREGADOS:
- Total de pacientes registrados: ${patients?.length || 0}
- Total de triagens realizadas: ${screenings?.length || 0}
- Taxa de follow-up: ${followups?.length ? Math.round((followups.filter(f => f.status === 'completed').length / followups.length) * 100) : 0}%

DECLARAÇÃO:
O profissional utiliza o sistema REGENAPP para registro e acompanhamento de procedimentos de fisioterapia regenerativa, mantendo documentação técnica de processos, consentimentos e resultados.

Esta declaração não constitui parecer jurídico ou garantia de conformidade regulatória.
        `.trim(),
        version: '1.0',
        generated_at: new Date().toISOString(),
      };

      const { data: statement, error } = await supabase
        .from('diligence_practice_statements')
        .insert({
          user_id: user.id,
          statement_type: 'professional_standard',
          statement_content: statementContent as unknown as Json,
          valid_from: new Date().toISOString(),
          immutable: true,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction('generate_practice_statement', undefined, { statement_id: statement.id });

      return statement as unknown as DiligencePracticeStatement;
    } catch (error) {
      console.error('Error generating practice statement:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [logAction]);

  // =========================================================
  // DASHBOARD METRICS
  // =========================================================
  const fetchDashboardMetrics = useCallback(async (): Promise<DiligenceDashboardMetrics | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch patients
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .eq('professional_id', user.id);

    const patientIds = (patients || []).map(p => p.id);

    // Fetch reports
    const { data: reports } = await supabase
      .from('diligence_case_reports')
      .select('id, case_id')
      .eq('user_id', user.id);

    // Fetch consents
    const { data: consents } = await supabase
      .from('patient_consents')
      .select('id, patient_id, accepted')
      .in('patient_id', patientIds)
      .eq('accepted', true);

    // Fetch followups
    const { data: followups } = await supabase
      .from('procedure_followups')
      .select('id, patient_id, status')
      .in('patient_id', patientIds)
      .eq('status', 'completed');

    // Fetch checklists
    const { data: checklists } = await supabase
      .from('diligence_checklists')
      .select('id, status')
      .eq('user_id', user.id);

    // Fetch recent logs
    const { data: logs } = await supabase
      .from('diligence_compliance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const uniquePatientsWithConsent = new Set((consents || []).map(c => c.patient_id));
    const uniquePatientsWithFollowup = new Set((followups || []).map(f => f.patient_id));

    return {
      totalCases: patientIds.length,
      casesWithReports: (reports || []).length,
      casesWithConsent: uniquePatientsWithConsent.size,
      casesWithFollowup: uniquePatientsWithFollowup.size,
      checklistsCompleted: (checklists || []).filter(c => c.status === 'completed').length,
      checklistsPending: (checklists || []).filter(c => c.status !== 'completed').length,
      recentLogs: (logs || []) as unknown as DiligenceComplianceLog[],
    };
  }, []);

  // =========================================================
  // FETCH COMPLIANCE LOGS
  // =========================================================
  const fetchComplianceLogs = useCallback(async (limit = 50): Promise<DiligenceComplianceLog[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('diligence_compliance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []) as unknown as DiligenceComplianceLog[];
  }, []);

  return {
    loading,
    // Actions
    generateCaseReport,
    generatePracticeStatement,
    logAction,
    // Checklists
    getOrCreateChecklist,
    updateChecklistItem,
    // Fetch data
    fetchCaseReports,
    fetchCaseTimeline,
    fetchDashboardMetrics,
    fetchComplianceLogs,
    fetchCaseData,
  };
}
