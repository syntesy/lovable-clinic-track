/**
 * Seed Data Generator Hook
 * 
 * Generates synthetic clinical data for QA/Testing purposes.
 * ONLY for dev/staging environments - blocks production.
 * 
 * Creates:
 * - Attendance sessions with standardized procedures
 * - PRP protocol records with outcomes
 * - Various cluster distributions for testing k-anonymity and benchmarks
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { evaluateClinicalStandard, type EvaluationInput } from "@/lib/clinical-standard-evaluator";
import { toast } from "sonner";

// Synthetic cluster configurations for testing
const CLUSTER_CONFIGS = [
  // 10 clusters with n=4 (should be hidden by k-anonymity)
  { pathology: 'artrose', region: 'joelho', severity: 'kl_2', count: 4 },
  { pathology: 'artrose', region: 'joelho', severity: 'kl_3', count: 4 },
  { pathology: 'artrose', region: 'quadril', severity: 'kl_2', count: 4 },
  { pathology: 'artrose', region: 'quadril', severity: 'kl_3', count: 4 },
  { pathology: 'tendinopatia', region: 'ombro', severity: 'moderada', count: 4 },
  { pathology: 'tendinopatia', region: 'cotovelo', severity: 'moderada', count: 4 },
  { pathology: 'lesao_muscular', region: 'coxa', severity: 'grau_2', count: 4 },
  { pathology: 'lesao_muscular', region: 'panturrilha', severity: 'grau_1', count: 4 },
  { pathology: 'hernia_disco', region: 'coluna_lombar', severity: 'protusao', count: 4, specific_location: 'l4_l5' },
  { pathology: 'hernia_disco', region: 'coluna_cervical', severity: 'protusao', count: 4, specific_location: 'c5_c6' },
  
  // 10 clusters with n=5 (should appear in dashboard)
  { pathology: 'artrose', region: 'joelho', severity: 'kl_1', count: 5, withHA: true },
  { pathology: 'artrose', region: 'quadril', severity: 'kl_1', count: 5, withHA: true },
  { pathology: 'tendinopatia', region: 'ombro', severity: 'leve', count: 5 },
  { pathology: 'tendinopatia', region: 'tornozelo', severity: 'moderada', count: 5 },
  { pathology: 'lesao_muscular', region: 'coxa', severity: 'grau_1', count: 5 },
  { pathology: 'hernia_disco', region: 'coluna_lombar', severity: 'extrusao', count: 5, specific_location: 'l5_s1' },
  { pathology: 'artrose', region: 'ombro', severity: 'leve', count: 5 },
  { pathology: 'tendinopatia', region: 'punho', severity: 'leve', count: 5 },
  { pathology: 'artrose', region: 'mao', severity: 'moderada', count: 5 },
  { pathology: 'lesao_muscular', region: 'ombro', severity: 'grau_2', count: 5 },
  
  // 10 clusters with n=12 (for benchmark testing)
  { pathology: 'artrose', region: 'joelho', severity: 'kl_4', count: 12 },
  { pathology: 'artrose', region: 'joelho', severity: 'kl_0', count: 12, withHA: true },
  { pathology: 'tendinopatia', region: 'ombro', severity: 'severa', count: 12 },
  { pathology: 'tendinopatia', region: 'cotovelo', severity: 'leve', count: 12 },
  { pathology: 'lesao_muscular', region: 'coxa', severity: 'grau_3', count: 12 },
  { pathology: 'artrose', region: 'quadril', severity: 'kl_4', count: 12 },
  { pathology: 'hernia_disco', region: 'coluna_lombar', severity: 'sequestro', count: 12, specific_location: 'l3_l4' },
  { pathology: 'tendinopatia', region: 'pe', severity: 'moderada', count: 12 },
  { pathology: 'artrose', region: 'tornozelo', severity: 'moderada', count: 12 },
  { pathology: 'lesao_muscular', region: 'panturrilha', severity: 'grau_2', count: 12 },
];

// Function scale mapping by region
const FUNCTION_SCALE_BY_REGION: Record<string, string> = {
  joelho: 'WOMAC',
  quadril: 'WOMAC',
  ombro: 'DASH',
  cotovelo: 'DASH',
  punho: 'DASH',
  mao: 'DASH',
  coluna_lombar: 'ODI',
  coluna_cervical: 'NDI',
  tornozelo: 'VISA_A',
  pe: 'VISA_A',
  coxa: 'WOMAC',
  panturrilha: 'VISA_A',
};

// Generate random value in range
const randomInRange = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random baseline pain (6-9)
const generateBaselinePain = () => randomInRange(6, 9);

// Generate followup pain based on improvement type
const generateFollowupPain = (baseline: number, improvementType: 'good' | 'moderate' | 'poor') => {
  switch (improvementType) {
    case 'good':
      return Math.max(0, baseline - randomInRange(3, 5)); // 30-50% improvement
    case 'moderate':
      return Math.max(0, baseline - randomInRange(1, 2)); // 10-30% improvement
    case 'poor':
      return Math.min(10, baseline + randomInRange(-1, 1)); // no improvement or worse
  }
};

// Generate function score based on scale type
const generateFunctionScore = (scaleType: string, isBaseline: boolean, improvement: 'good' | 'moderate' | 'poor') => {
  // Scales where lower is better: ODI, NDI, WOMAC, DASH
  // Scales where higher is better: KOOS, VISA_A
  const isLowerBetter = ['ODI', 'NDI', 'WOMAC', 'DASH'].includes(scaleType);
  
  if (isBaseline) {
    // Baseline: bad function
    return isLowerBetter ? randomInRange(40, 70) : randomInRange(30, 50);
  }
  
  // Followup based on improvement
  if (isLowerBetter) {
    switch (improvement) {
      case 'good': return randomInRange(10, 25);
      case 'moderate': return randomInRange(25, 40);
      case 'poor': return randomInRange(45, 75);
    }
  } else {
    switch (improvement) {
      case 'good': return randomInRange(70, 90);
      case 'moderate': return randomInRange(50, 70);
      case 'poor': return randomInRange(25, 45);
    }
  }
};

// Generate random PRP protocol parameters
const generatePRPProtocol = (withPenalty: boolean) => ({
  sessions_count: String(randomInRange(1, 3)),
  sessions_interval: randomInRange(1, 3) === 1 ? null : `${randomInRange(1, 4)}_semanas`,
  volume_per_session_range: ['1_3_ml', '4_6_ml', '7_10_ml'][randomInRange(0, 2)],
  prp_type: withPenalty && Math.random() < 0.5 ? 'desconhecido' : ['lp_prp', 'lr_prp'][randomInRange(0, 1)],
  prp_activation: ['nao_ativado', 'ativado'][randomInRange(0, 1)],
  activation_method: null,
  imaging_guidance: ['ultrassonografia', 'sem_guia'][randomInRange(0, 1)],
  prp_with_hyaluronic_acid: Math.random() < 0.3,
  hyaluronic_acid_type: null,
  recent_nsaid_use: withPenalty && Math.random() < 0.5 ? 'sim_menos_7_dias' : 'nao',
});

// Generate co-interventions
const generateCoInterventions = () => ({
  exercise_therapy: Math.random() < 0.6,
  shockwave_therapy: ['none', 'focalizada', 'radial'][randomInRange(0, 2)],
  epi_associated: Math.random() < 0.2,
});

export interface SeedProgress {
  total: number;
  current: number;
  phase: string;
  errors: string[];
}

export interface SeedConfig {
  totalAttendances?: number;
  includeM1?: boolean;
  includeM6?: boolean;
  includeM12?: boolean;
}

export interface SeedMetadata {
  lastGeneration: string | null;
  totalSyntheticPatients: number;
  totalSyntheticAttendances: number;
}

export function useSeedData() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<SeedProgress>({
    total: 0,
    current: 0,
    phase: '',
    errors: [],
  });
  const [metadata, setMetadata] = useState<SeedMetadata>({
    lastGeneration: null,
    totalSyntheticPatients: 0,
    totalSyntheticAttendances: 0,
  });

  // Fetch current synthetic data stats
  const fetchMetadata = useCallback(async () => {
    try {
      // Count synthetic patients
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .ilike('full_name', '%Paciente Sintético QA%');

      // Count synthetic attendances
      const { count: attendanceCount } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .ilike('title', '%Sintético QA%');

      // Get last generation from audit log
      const { data: lastGen } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('action', 'seed_data_generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setMetadata({
        lastGeneration: lastGen?.created_at || null,
        totalSyntheticPatients: patientCount || 0,
        totalSyntheticAttendances: attendanceCount || 0,
      });
    } catch (error) {
      console.error('Error fetching seed metadata:', error);
    }
  }, []);

  const generateSeedData = useCallback(async (config: SeedConfig = {}) => {
    const {
      includeM1 = true,
      includeM6 = false,
      includeM12 = false,
    } = config;

    // Check if in production (simple check - in real app would use env variable)
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('lovable.app') && !hostname.includes('preview');
    
    if (isProduction) {
      toast.error('Geração de dados sintéticos bloqueada em produção');
      return { success: false, message: 'Blocked in production' };
    }

    setIsGenerating(true);
    const errors: string[] = [];
    
    // Calculate total cases
    const totalCases = CLUSTER_CONFIGS.reduce((sum, c) => sum + c.count, 0);
    setProgress({ total: totalCases, current: 0, phase: 'Iniciando...', errors: [] });

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado');
      }
      const userId = userData.user.id;

      // Create synthetic patients first
      setProgress(p => ({ ...p, phase: 'Criando pacientes sintéticos...' }));
      
      const syntheticPatients: string[] = [];
      for (let i = 0; i < Math.min(50, totalCases); i++) {
        const birthYear = 1960 + randomInRange(0, 40);
        const birthMonth = randomInRange(0, 11);
        const birthDay = randomInRange(1, 28);
        const birthDate = new Date(birthYear, birthMonth, birthDay);
        const age = new Date().getFullYear() - birthYear;

        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .insert({
            full_name: `Paciente Sintético QA-${Date.now()}-${i}`,
            birth_date: birthDate.toISOString().split('T')[0],
            age: age,
            phone: `(11) 9${randomInRange(1000, 9999)}-${randomInRange(1000, 9999)}`,
            email: `sintetico${Date.now()}_${i}@qa.local`,
            gender: ['masculino', 'feminino'][randomInRange(0, 1)],
            professional_id: userId,
            status: 'ativo',
          })
          .select('id')
          .single();
        
        if (patientError) {
          errors.push(`Erro ao criar paciente ${i}: ${patientError.message}`);
        } else if (patient) {
          syntheticPatients.push(patient.id);
        }
      }

      if (syntheticPatients.length === 0) {
        throw new Error('Nenhum paciente sintético criado');
      }

      let currentCase = 0;
      
      // Process each cluster configuration
      for (const clusterConfig of CLUSTER_CONFIGS) {
        setProgress(p => ({ 
          ...p, 
          phase: `Cluster: ${clusterConfig.pathology} - ${clusterConfig.region} (n=${clusterConfig.count})` 
        }));

        for (let i = 0; i < clusterConfig.count; i++) {
          currentCase++;
          setProgress(p => ({ ...p, current: currentCase }));

          try {
            // Pick a random patient
            const patientId = syntheticPatients[randomInRange(0, syntheticPatients.length - 1)];
            
            // Determine improvement type for outcomes
            const improvementRoll = Math.random();
            const improvement: 'good' | 'moderate' | 'poor' = 
              improvementRoll < 0.5 ? 'good' : 
              improvementRoll < 0.8 ? 'moderate' : 'poor';
            
            // ~25% with penalty
            const withPenalty = Math.random() < 0.25;

            // 1. Create attendance session
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendance_sessions')
              .insert({
                patient_id: patientId,
                user_id: userId,
                involves_orthobiologics: true,
                has_standardized_procedure: true,
                title: `Atendimento Sintético QA - ${clusterConfig.pathology}`,
              })
              .select('id')
              .single();

            if (attendanceError) {
              throw new Error(`Attendance: ${attendanceError.message}`);
            }

            // 2. Create procedure_standard_records
            const severityValue = clusterConfig.specific_location 
              ? `${clusterConfig.severity}|${clusterConfig.specific_location}`
              : clusterConfig.severity;

            const { data: procedureRecord, error: procedureError } = await supabase
              .from('procedure_standard_records')
              .insert({
                attendance_id: attendance.id,
                procedure_type: 'PRP',
                pathology: clusterConfig.pathology,
                anatomic_region: clusterConfig.region,
                specific_location: clusterConfig.specific_location || null,
                severity_classification: severityValue,
                symptom_duration: ['menos_3_meses', '3_6_meses', '6_12_meses', 'mais_12_meses'][randomInRange(0, 3)],
              })
              .select('id')
              .single();

            if (procedureError) {
              throw new Error(`Procedure: ${procedureError.message}`);
            }

            // 3. Create prp_protocol_core
            const prpProtocol = generatePRPProtocol(withPenalty);
            if (clusterConfig.withHA) {
              prpProtocol.prp_with_hyaluronic_acid = true;
              prpProtocol.hyaluronic_acid_type = 'alto_peso_molecular';
            }
            if (prpProtocol.prp_activation === 'ativado') {
              prpProtocol.activation_method = 'cloreto_calcio';
            }
            if (prpProtocol.sessions_count === '1') {
              prpProtocol.sessions_interval = null;
            }

            const { error: prpError } = await supabase
              .from('prp_protocol_core')
              .insert({
                procedure_standard_record_id: procedureRecord.id,
                ...prpProtocol,
              });

            if (prpError) {
              throw new Error(`PRP Protocol: ${prpError.message}`);
            }

            // 4. Create co_interventions_core
            const coInterventions = generateCoInterventions();
            const { error: coError } = await supabase
              .from('co_interventions_core')
              .insert({
                procedure_standard_record_id: procedureRecord.id,
                ...coInterventions,
              });

            if (coError) {
              throw new Error(`Co-interventions: ${coError.message}`);
            }

            // 5. Run evaluation to generate cluster_key and protocol_signature
            const evalInput: EvaluationInput = {
              record: {
                pathology: clusterConfig.pathology,
                anatomic_region: clusterConfig.region,
                specific_location: clusterConfig.specific_location || null,
                severity_classification: severityValue,
                symptom_duration: 'menos_3_meses',
                procedure_type: 'PRP',
              },
              prpProtocol: {
                ...prpProtocol,
                sessions_interval: prpProtocol.sessions_interval,
              },
              coInterventions,
            };

            const evalResult = evaluateClinicalStandard(evalInput);

            // Update the procedure record with evaluation results
            const { error: updateError } = await supabase
              .from('procedure_standard_records')
              .update({
                clinical_standard_status: evalResult.status,
                clinical_standard_notes: evalResult.notes,
                is_comparable: evalResult.isComparable,
                cluster_key: evalResult.clusterKey,
                protocol_signature: evalResult.protocolSignature,
                last_evaluated_at: new Date().toISOString(),
              })
              .eq('id', procedureRecord.id);

            if (updateError) {
              throw new Error(`Evaluation update: ${updateError.message}`);
            }

            // 6. Create patient_reported_outcomes
            const functionScaleType = FUNCTION_SCALE_BY_REGION[clusterConfig.region] || 'WOMAC';
            const baselinePain = generateBaselinePain();
            
            // Baseline outcome
            const { error: baselineError } = await supabase
              .from('patient_reported_outcomes')
              .insert({
                attendance_id: attendance.id,
                procedure_standard_record_id: procedureRecord.id,
                timepoint: 'baseline',
                pain_score: baselinePain,
                function_scale_type: functionScaleType,
                function_score: generateFunctionScore(functionScaleType, true, improvement),
              });

            if (baselineError) {
              throw new Error(`Baseline outcome: ${baselineError.message}`);
            }

            // M1 outcome (optional)
            if (includeM1) {
              const m1Pain = generateFollowupPain(baselinePain, improvement);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm1',
                  pain_score: m1Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                });
            }

            // M3 outcome (always)
            const m3Pain = generateFollowupPain(baselinePain, improvement);
            const { error: m3Error } = await supabase
              .from('patient_reported_outcomes')
              .insert({
                attendance_id: attendance.id,
                procedure_standard_record_id: procedureRecord.id,
                timepoint: 'm3',
                pain_score: m3Pain,
                function_scale_type: functionScaleType,
                function_score: generateFunctionScore(functionScaleType, false, improvement),
              });

            if (m3Error) {
              throw new Error(`M3 outcome: ${m3Error.message}`);
            }

            // M6 outcome (optional)
            if (includeM6) {
              const m6Pain = generateFollowupPain(baselinePain, improvement);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm6',
                  pain_score: m6Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                });
            }

            // M12 outcome (optional)
            if (includeM12) {
              const m12Pain = generateFollowupPain(baselinePain, improvement);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm12',
                  pain_score: m12Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                });
            }

          } catch (error: any) {
            errors.push(`Caso ${currentCase}: ${error.message}`);
          }
        }
      }

      setProgress(p => ({ ...p, phase: 'Concluído!', errors }));
      
      // Log generation to audit_logs
      await supabase.from('audit_logs').insert({
        action: 'seed_data_generated',
        additional_info: {
          total_cases: totalCases,
          errors_count: errors.length,
          config: { includeM1, includeM6, includeM12 },
        },
      });
      
      if (errors.length === 0) {
        toast.success(`${totalCases} casos sintéticos gerados com sucesso!`);
      } else {
        toast.warning(`Geração concluída com ${errors.length} erros`);
      }

      // Refresh metadata
      await fetchMetadata();

      return { 
        success: errors.length === 0, 
        totalGenerated: currentCase - errors.length,
        errors 
      };

    } catch (error: any) {
      console.error('Seed data generation error:', error);
      toast.error(`Erro na geração: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setIsGenerating(false);
    }
  }, [fetchMetadata]);

  const clearSyntheticData = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Delete synthetic patients (will cascade to all related data)
      const { error } = await supabase
        .from('patients')
        .delete()
        .ilike('full_name', '%Paciente Sintético QA%');

      if (error) throw error;
      
      // Log clear action
      await supabase.from('audit_logs').insert({
        action: 'seed_data_cleared',
        additional_info: { timestamp: new Date().toISOString() },
      });
      
      toast.success('Dados sintéticos removidos com sucesso!');
      
      // Refresh metadata
      await fetchMetadata();
      
      return { success: true };
    } catch (error: any) {
      console.error('Clear synthetic data error:', error);
      toast.error(`Erro ao limpar: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setIsGenerating(false);
    }
  }, [fetchMetadata]);

  return {
    generateSeedData,
    clearSyntheticData,
    fetchMetadata,
    isGenerating,
    progress,
    metadata,
  };
}
