import type { Json } from '@/integrations/supabase/types';

/**
 * Seed Data Generator Hook - QA+ Phase
 * 
 * Generates synthetic clinical data for QA/Testing purposes.
 * ONLY for dev/staging environments - blocks production.
 * 
 * Features:
 * - Global is_synthetic tagging on all tables
 * - Clinical profile presets (Conservative/Good/Excellent)
 * - 3 synthetic professionals with varied performance
 * - Transactional cleanup in correct order
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { evaluateClinicalStandard, type EvaluationInput } from "@/lib/clinical-standard-evaluator";
import { toast } from "sonner";
import { areQAToolsEnabled } from "@/config/environment";

// Clinical profile presets for outcomes generation
export type ClinicalProfile = 'conservative' | 'good' | 'excellent';

export interface ProfileConfig {
  name: string;
  description: string;
  avgPainReduction: number; // baseline - followup
  response30Pct: number; // % of cases with >=30% improvement
  response50Pct: number; // % of cases with >=50% improvement
  goodOutcomePct: number;
  moderateOutcomePct: number;
  poorOutcomePct: number;
}

export const CLINICAL_PROFILES: Record<ClinicalProfile, ProfileConfig> = {
  conservative: {
    name: 'Conservador',
    description: 'Δ Dor baixo, Resposta ≥30% ~40-50%, pouca resposta ≥50%',
    avgPainReduction: 2,
    response30Pct: 0.45,
    response50Pct: 0.15,
    goodOutcomePct: 0.25,
    moderateOutcomePct: 0.35,
    poorOutcomePct: 0.40,
  },
  good: {
    name: 'Bom',
    description: 'Δ Dor moderado, Resposta ≥30% ~60-70%, Resposta ≥50% ~30%',
    avgPainReduction: 3,
    response30Pct: 0.65,
    response50Pct: 0.30,
    goodOutcomePct: 0.50,
    moderateOutcomePct: 0.30,
    poorOutcomePct: 0.20,
  },
  excellent: {
    name: 'Excelente',
    description: 'Δ Dor alto, Resposta ≥30% ~80%, Resposta ≥50% ~50%',
    avgPainReduction: 4,
    response30Pct: 0.80,
    response50Pct: 0.50,
    goodOutcomePct: 0.65,
    moderateOutcomePct: 0.25,
    poorOutcomePct: 0.10,
  },
};

// Synthetic professional configurations for benchmark testing
interface SyntheticProfessional {
  id: string;
  name: string;
  performanceLevel: 'above_average' | 'average' | 'below_average';
  profile: ClinicalProfile;
}

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

// Generate followup pain based on profile and improvement type
const generateFollowupPain = (
  baseline: number, 
  improvementType: 'good' | 'moderate' | 'poor',
  profile: ProfileConfig
) => {
  switch (improvementType) {
    case 'good':
      // 40-60% improvement
      const goodReduction = Math.ceil(baseline * (0.4 + Math.random() * 0.2));
      return Math.max(0, baseline - goodReduction);
    case 'moderate':
      // 20-35% improvement
      const modReduction = Math.ceil(baseline * (0.2 + Math.random() * 0.15));
      return Math.max(0, baseline - modReduction);
    case 'poor':
      // 0-15% improvement or slight worsening
      const poorChange = Math.ceil(baseline * (Math.random() * 0.15 - 0.05));
      return Math.min(10, Math.max(0, baseline - poorChange));
  }
};

// Determine improvement type based on profile
const getImprovementType = (profile: ProfileConfig): 'good' | 'moderate' | 'poor' => {
  const roll = Math.random();
  if (roll < profile.goodOutcomePct) return 'good';
  if (roll < profile.goodOutcomePct + profile.moderateOutcomePct) return 'moderate';
  return 'poor';
};

// Generate function score based on scale type
const generateFunctionScore = (
  scaleType: string, 
  isBaseline: boolean, 
  improvement: 'good' | 'moderate' | 'poor'
) => {
  // Scales where lower is better: ODI, NDI, WOMAC, DASH
  const isLowerBetter = ['ODI', 'NDI', 'WOMAC', 'DASH'].includes(scaleType);
  
  if (isBaseline) {
    return isLowerBetter ? randomInRange(40, 70) : randomInRange(30, 50);
  }
  
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
  clinicalProfile?: ClinicalProfile;
}

export interface SeedMetadata {
  lastGeneration: string | null;
  totalSyntheticPatients: number;
  totalSyntheticAttendances: number;
  totalSyntheticOutcomes: number;
  totalSyntheticProcedures: number;
  lastProfile: string | null;
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
    totalSyntheticOutcomes: 0,
    totalSyntheticProcedures: 0,
    lastProfile: null,
  });

  // Fetch current synthetic data stats using is_synthetic flag
  const fetchMetadata = useCallback(async () => {
    try {
      // Count synthetic patients
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('is_synthetic', true);

      // Count synthetic attendances
      const { count: attendanceCount } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_synthetic', true);

      // Count synthetic outcomes
      const { count: outcomeCount } = await supabase
        .from('patient_reported_outcomes')
        .select('*', { count: 'exact', head: true })
        .eq('is_synthetic', true);

      // Count synthetic procedures
      const { count: procedureCount } = await supabase
        .from('procedure_standard_records')
        .select('*', { count: 'exact', head: true })
        .eq('is_synthetic', true);

      // Get last generation from audit log
      const { data: lastGen } = await supabase
        .from('audit_logs')
        .select('created_at, additional_info')
        .eq('action', 'seed_data_generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setMetadata({
        lastGeneration: lastGen?.created_at || null,
        totalSyntheticPatients: patientCount || 0,
        totalSyntheticAttendances: attendanceCount || 0,
        totalSyntheticOutcomes: outcomeCount || 0,
        totalSyntheticProcedures: procedureCount || 0,
        lastProfile: (lastGen?.additional_info as any)?.profile || null,
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
      clinicalProfile = 'good',
    } = config;

    const profileConfig = CLINICAL_PROFILES[clinicalProfile];

    if (!areQAToolsEnabled()) {
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

      // Create 3 synthetic professionals with different performance levels
      setProgress(p => ({ ...p, phase: 'Criando profissionais sintéticos...' }));
      
      const syntheticProfessionals: SyntheticProfessional[] = [
        { 
          id: `synth_prof_above_${Date.now()}`, 
          name: 'Prof. Sintético - Acima da Média', 
          performanceLevel: 'above_average',
          profile: 'excellent'
        },
        { 
          id: `synth_prof_average_${Date.now()}`, 
          name: 'Prof. Sintético - Na Média', 
          performanceLevel: 'average',
          profile: 'good'
        },
        { 
          id: `synth_prof_below_${Date.now()}`, 
          name: 'Prof. Sintético - Abaixo da Média', 
          performanceLevel: 'below_average',
          profile: 'conservative'
        },
      ];

      // For now, we'll use the current user as the professional
      // In a real scenario, you'd create actual user accounts
      const professionalIds = [userId, userId, userId];

      // Create synthetic patients
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
            professional_id: professionalIds[i % 3],
            status: 'ativo',
            is_synthetic: true, // Mark as synthetic
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
            const patientIndex = randomInRange(0, syntheticPatients.length - 1);
            const patientId = syntheticPatients[patientIndex];
            const professionalId = professionalIds[patientIndex % 3];
            
            // Get profile based on professional (for varied performance)
            const professionalProfile = syntheticProfessionals[patientIndex % 3];
            const activeProfile = CLINICAL_PROFILES[professionalProfile.profile];
            
            // Determine improvement type based on profile
            const improvement = getImprovementType(activeProfile);
            
            // ~25% with penalty
            const withPenalty = Math.random() < 0.25;

            // 1. Create attendance session with is_synthetic
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendance_sessions')
              .insert({
                patient_id: patientId,
                user_id: professionalId,
                involves_orthobiologics: true,
                has_standardized_procedure: true,
                title: `Atendimento Sintético QA - ${clusterConfig.pathology}`,
                is_synthetic: true,
              })
              .select('id')
              .single();

            if (attendanceError) {
              throw new Error(`Attendance: ${attendanceError.message}`);
            }

            // 2. Create procedure_standard_records with is_synthetic
            const severityValue = clusterConfig.specific_location 
              ? `${clusterConfig.severity}|${clusterConfig.specific_location}`
              : clusterConfig.severity;

            const { data: procedureRecord, error: procedureError } = await supabase
              .from('procedure_standard_records')
              .insert([{
                // attendance_id is set by trigger, don't include here
                procedure_type: 'PRP',
                pathology: clusterConfig.pathology,
                anatomic_region: clusterConfig.region,
                specific_location: clusterConfig.specific_location || null,
                severity_classification: severityValue,
                symptom_duration: ['menos_3_meses', '3_6_meses', '6_12_meses', 'mais_12_meses'][randomInRange(0, 3)],
                is_synthetic: true,
              }] as any)
              .select('id')
              .single();

            if (procedureError) {
              throw new Error(`Procedure: ${procedureError.message}`);
            }

            // 3. Create prp_protocol_core with is_synthetic
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
                is_synthetic: true,
              });

            if (prpError) {
              throw new Error(`PRP Protocol: ${prpError.message}`);
            }

            // 4. Create co_interventions_core with is_synthetic
            const coInterventions = generateCoInterventions();
            const { error: coError } = await supabase
              .from('co_interventions_core')
              .insert({
                procedure_standard_record_id: procedureRecord.id,
                ...coInterventions,
                is_synthetic: true,
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

            // 6. Create patient_reported_outcomes with is_synthetic
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
                is_synthetic: true,
              });

            if (baselineError) {
              throw new Error(`Baseline outcome: ${baselineError.message}`);
            }

            // M1 outcome (optional)
            if (includeM1) {
              const m1Pain = generateFollowupPain(baselinePain, improvement, activeProfile);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm1',
                  pain_score: m1Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                  is_synthetic: true,
                });
            }

            // M3 outcome (always)
            const m3Pain = generateFollowupPain(baselinePain, improvement, activeProfile);
            const { error: m3Error } = await supabase
              .from('patient_reported_outcomes')
              .insert({
                attendance_id: attendance.id,
                procedure_standard_record_id: procedureRecord.id,
                timepoint: 'm3',
                pain_score: m3Pain,
                function_scale_type: functionScaleType,
                function_score: generateFunctionScore(functionScaleType, false, improvement),
                is_synthetic: true,
              });

            if (m3Error) {
              throw new Error(`M3 outcome: ${m3Error.message}`);
            }

            // M6 outcome (optional)
            if (includeM6) {
              const m6Pain = generateFollowupPain(baselinePain, improvement, activeProfile);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm6',
                  pain_score: m6Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                  is_synthetic: true,
                });
            }

            // M12 outcome (optional)
            if (includeM12) {
              const m12Pain = generateFollowupPain(baselinePain, improvement, activeProfile);
              await supabase
                .from('patient_reported_outcomes')
                .insert({
                  attendance_id: attendance.id,
                  procedure_standard_record_id: procedureRecord.id,
                  timepoint: 'm12',
                  pain_score: m12Pain,
                  function_scale_type: functionScaleType,
                  function_score: generateFunctionScore(functionScaleType, false, improvement),
                  is_synthetic: true,
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
          profile: clinicalProfile,
          profile_config: profileConfig,
          synthetic_professionals: syntheticProfessionals.map(p => ({
            name: p.name,
            performanceLevel: p.performanceLevel,
            profile: p.profile,
          })),
        } as unknown as Json,
      });
      
      if (errors.length === 0) {
        toast.success(`${totalCases} casos sintéticos gerados com sucesso! (Perfil: ${profileConfig.name})`);
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

  // Transactional cleanup in correct order - ONLY deletes is_synthetic=true records
  const clearSyntheticData = useCallback(async () => {
    setIsGenerating(true);
    setProgress({ total: 6, current: 0, phase: 'Iniciando limpeza...', errors: [] });
    
    const cleanupErrors: string[] = [];

    try {
      // Order matters due to foreign key constraints:
      // 1. patient_reported_outcomes
      // 2. co_interventions_core
      // 3. prp_protocol_core
      // 4. procedure_standard_records
      // 5. attendance_sessions
      // 6. patients

      setProgress(p => ({ ...p, current: 1, phase: '1/6 - Removendo outcomes...' }));
      const { error: e1 } = await supabase
        .from('patient_reported_outcomes')
        .delete()
        .eq('is_synthetic', true);
      if (e1) cleanupErrors.push(`Outcomes: ${e1.message}`);

      setProgress(p => ({ ...p, current: 2, phase: '2/6 - Removendo co-intervenções...' }));
      const { error: e2 } = await supabase
        .from('co_interventions_core')
        .delete()
        .eq('is_synthetic', true);
      if (e2) cleanupErrors.push(`Co-interventions: ${e2.message}`);

      setProgress(p => ({ ...p, current: 3, phase: '3/6 - Removendo protocolos PRP...' }));
      const { error: e3 } = await supabase
        .from('prp_protocol_core')
        .delete()
        .eq('is_synthetic', true);
      if (e3) cleanupErrors.push(`PRP protocols: ${e3.message}`);

      setProgress(p => ({ ...p, current: 4, phase: '4/6 - Removendo procedimentos...' }));
      const { error: e4 } = await supabase
        .from('procedure_standard_records')
        .delete()
        .eq('is_synthetic', true);
      if (e4) cleanupErrors.push(`Procedures: ${e4.message}`);

      setProgress(p => ({ ...p, current: 5, phase: '5/6 - Removendo atendimentos...' }));
      const { error: e5 } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('is_synthetic', true);
      if (e5) cleanupErrors.push(`Attendances: ${e5.message}`);

      setProgress(p => ({ ...p, current: 6, phase: '6/6 - Removendo pacientes...' }));
      const { error: e6 } = await supabase
        .from('patients')
        .delete()
        .eq('is_synthetic', true);
      if (e6) cleanupErrors.push(`Patients: ${e6.message}`);

      // Log clear action
      await supabase.from('audit_logs').insert([{
        action: 'seed_data_cleared',
        additional_info: { 
          timestamp: new Date().toISOString(),
          errors: cleanupErrors,
          success: cleanupErrors.length === 0,
        },
      }]);
      
      if (cleanupErrors.length === 0) {
        toast.success('Dados sintéticos removidos com sucesso!');
        setProgress(p => ({ ...p, phase: 'Limpeza concluída!', errors: [] }));
      } else {
        toast.warning(`Limpeza concluída com ${cleanupErrors.length} erros`);
        setProgress(p => ({ ...p, phase: 'Limpeza concluída com erros', errors: cleanupErrors }));
      }
      
      // Refresh metadata
      await fetchMetadata();
      
      return { success: cleanupErrors.length === 0, errors: cleanupErrors };
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
    CLINICAL_PROFILES,
  };
}
