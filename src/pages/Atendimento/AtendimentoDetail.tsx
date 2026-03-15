import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertCircle, FlaskConical, Lock, FileText, Clock, Stethoscope, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logInfo, logWarn, logError } from "@/lib/telemetry";
import {
  useAttendanceSession,
  useAttendanceFiles,
  useAttendanceRecords,
  useCloseAttendance,
  useUpdateAttendanceType
} from "@/hooks/useAttendance";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AttendanceStepper,
  AttendanceHeader,
  AttendanceDocumentsStep,
} from "@/components/attendance";
import { ClinicalAssessmentInline } from "@/components/attendance/ClinicalAssessmentInline";
import { PreviousTreatmentsCard, type PreviousTreatmentsState } from "@/components/attendance/PreviousTreatmentsCard";
import { type PathologyState, INITIAL_PATHOLOGY_STATE } from "@/components/attendance/PathologyCard";
import { DiagnosticHypothesisCard, type HypothesisState, INITIAL_HYPOTHESIS_STATE } from "@/components/attendance/DiagnosticHypothesisCard";
import { ConfirmedDiagnosisCard } from "@/components/attendance/ConfirmedDiagnosisCard";
import { 
  AttendanceStatus, 
  isAttendanceClosed,
  type AttendanceStepId 
} from "@/types/attendance";
import {
  INITIAL_STEP,
  validateStepForAttendance,
  canAccessStep,
} from "@/domain/attendanceFlow";
import {
  ensureClinicalRecordForAttendance,
  hasClinicalRecordMinimumData,
  ClinicalRecordBasic
} from "@/services/clinicalRecordsService";
import {
  buildCharacterizationJson,
  hydrateCharacterizationValues,
  type PathologyCharacterizationProfile,
} from "@/config/pathologyCharacterization";

// Import existing components for steps (reusing, not changing logic)
import { AvaliacaoRegenapp } from "@/components/RegenEvaluation";
import { AddProcedureModal } from "@/components/AddProcedureModal";
import { PrescriptionFormModal } from "@/components/patient/PrescriptionFormModal";
import { PatientPrescriptionsList } from "@/components/patient/PatientPrescriptionsList";
import { PatientProceduresList } from "@/components/patient/PatientProceduresList";
import { ClinicalStandardCard } from "@/components/clinical-standard";
import { EvidencePanel } from "@/components/attendance/EvidencePanel";
import { buildTopicKey } from "@/utils/topicKey";
import { useCreateEvidenceLink } from "@/hooks/useReghenEvidence";

const AtendimentoDetail = () => {
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Default step is INITIAL_STEP from domain contract
  const [currentStep, setCurrentStep] = useState<AttendanceStepId>(INITIAL_STEP);
  const [completedSteps] = useState<AttendanceStepId[]>([]);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSavingTreatments, setIsSavingTreatments] = useState(false);
  const [isSavingPathology, setIsSavingPathology] = useState(false);
  const [treatmentsValidationError, setTreatmentsValidationError] = useState<string | null>(null);
  const [shockwaveValidationError, setShockwaveValidationError] = useState<string | null>(null);
  const [laserValidationError, setLaserValidationError] = useState<string | null>(null);
  const [orthobiologicPrevValidationError, setOrthobiologicPrevValidationError] = useState<string | null>(null);
  const [orthobiologicPrevOtherValidationError, setOrthobiologicPrevOtherValidationError] = useState<string | null>(null);
  const [nsaidTimeBucketValidationError, setNsaidTimeBucketValidationError] = useState<string | null>(null);
  const [previousTreatments, setPreviousTreatments] = useState<PreviousTreatmentsState>({
    treatments: [],
    lastTreatmentTimeBucket: "",
    otherText: "",
    shockwaveType: "",
    laserIntensity: "",
    orthobiologicPrevType: "",
    orthobiologicPrevOtherText: "",
    epiUsGuided: "",
    physioType: "",
    physioDuration: "",
    nsaidTimeBucket: "",
  });

  const [pathologyState, setPathologyState] = useState<PathologyState>(INITIAL_PATHOLOGY_STATE);
  const [hypothesisState, setHypothesisState] = useState<HypothesisState>(INITIAL_HYPOTHESIS_STATE);
  const [isConfirmedDiagnosisVisible, setIsConfirmedDiagnosisVisible] = useState(false);
  const [characterizationValues, setCharacterizationValues] = useState<Record<string, string>>({});

  // Plan step modals
  const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);

  // Fetch attendance session
  const {
    data: attendance,
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useAttendanceSession(attendanceId ?? null);

  // Close attendance mutation
  const closeAttendance = useCloseAttendance();
  
  // Update attendance type mutation
  const updateAttendanceType = useUpdateAttendanceType();

  // Check if attendance is closed
  const isClosed = isAttendanceClosed(attendance ?? null);

  // Fetch attendance files for counter
  const { data: files = [] } = useAttendanceFiles(attendanceId ?? null);

  // Fetch previous treatments from DB
  const { data: dbPreviousTreatments } = useQuery({
    queryKey: ["attendance-previous-treatments", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return null;
      const { data, error } = await supabase
        .from("attendance_previous_treatments")
        .select("*")
        .eq("attendance_id", attendanceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceId,
  });

  // Sync DB data into local state when loaded
  useEffect(() => {
    if (dbPreviousTreatments) {
      const details = dbPreviousTreatments.details as Record<string, unknown> | null;
      const shockwave = details?.shockwave as Record<string, unknown> | null;
      const laser = details?.laser as Record<string, unknown> | null;
      const orthobiologicPrev = details?.orthobiologic_prev as Record<string, unknown> | null;
      const epi = details?.epi as Record<string, unknown> | null;
      const physio = details?.physiotherapy as Record<string, unknown> | null;
      const nsaids = details?.nsaids as Record<string, unknown> | null;
      setPreviousTreatments({
        treatments: dbPreviousTreatments.treatments ?? [],
        lastTreatmentTimeBucket: dbPreviousTreatments.last_treatment_time_bucket ?? "",
        otherText: (details?.other_text as string) ?? "",
        shockwaveType: (shockwave?.type as string) ?? "",
        laserIntensity: (laser?.intensity as string) ?? "",
        orthobiologicPrevType: (orthobiologicPrev?.type as string) ?? "",
        orthobiologicPrevOtherText: (orthobiologicPrev?.other_text as string) ?? "",
        epiUsGuided: (epi?.us_guided as string) ?? "",
        physioType: (physio?.type as string) ?? "",
        physioDuration: (physio?.duration as string) ?? "",
        nsaidTimeBucket: (nsaids?.time_bucket as string) ?? "",
      });
    }
  }, [dbPreviousTreatments]);

  // Fetch attendance pathology from DB (READ only)
  const { data: dbAttendancePathology, isSuccess: isPathologyQuerySuccess } = useQuery({
    queryKey: ["attendance-pathology", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return null;
      const { data, error } = await supabase
        .from("attendance_pathology")
        .select("*")
        .eq("attendance_id", attendanceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Hydrate pathologyState from DB only once per attendanceId
  const didHydratePathologyRef = useRef(false);

  useEffect(() => {
    // Reset hydration flag when attendanceId changes
    didHydratePathologyRef.current = false;
    setPathologyState(INITIAL_PATHOLOGY_STATE);
    setHypothesisState(INITIAL_HYPOTHESIS_STATE);
    setIsConfirmedDiagnosisVisible(false);
    setCharacterizationValues({});
  }, [attendanceId]);

  useEffect(() => {
    if (!isPathologyQuerySuccess || didHydratePathologyRef.current) return;

    if (dbAttendancePathology) {
      const diagStage = (dbAttendancePathology as any).diagnosis_stage ?? "SUSPECTED";
      
      // Hydrate hypothesis
      setHypothesisState({
        categoryId: dbAttendancePathology.category_id,
        pathologyId: dbAttendancePathology.pathology_id,
        customLabel: dbAttendancePathology.custom_pathology_label ?? "",
        clinicalObservation: (dbAttendancePathology as any).clinical_observation ?? "",
      });

      // Hydrate confirmed diagnosis state
      setPathologyState({
        categoryId: dbAttendancePathology.category_id,
        pathologyId: dbAttendancePathology.pathology_id,
        customLabel: dbAttendancePathology.custom_pathology_label ?? "",
        structuralModel: (dbAttendancePathology.structural_model as PathologyState["structuralModel"]) ?? "NONE",
        structuralGrade: dbAttendancePathology.structural_grade ?? null,
        structuralGroup: dbAttendancePathology.structural_group ?? null,
        imagingMethod: dbAttendancePathology.imaging_method ?? null,
        tearPercentage: dbAttendancePathology.tear_percentage ?? null,
        discLevelEnum: dbAttendancePathology.disc_level_enum ?? null,
        discLocationEnum: dbAttendancePathology.disc_location_enum ?? null,
        evaPain: dbAttendancePathology.eva_pain ?? null,
        ifnFunction: dbAttendancePathology.ifn_function ?? null,
      });

      // If already confirmed, show the confirmed card
      if (diagStage === "CONFIRMED") {
        setIsConfirmedDiagnosisVisible(true);
      }

      // Hydrate characterization values if present
      const charJson = (dbAttendancePathology as any).characterization_json;
      if (charJson) {
        setCharacterizationValues(hydrateCharacterizationValues(charJson));
      }
    }

    didHydratePathologyRef.current = true;
  }, [isPathologyQuerySuccess, dbAttendancePathology]);

  // Fetch patient info
  const { data: patient } = useQuery({
    queryKey: ["patient", attendance?.patient_id],
    queryFn: async () => {
      if (!attendance?.patient_id) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender")
        .eq("id", attendance.patient_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!attendance?.patient_id,
  });

  // Fetch records within attendance time window
  const { clinicalRecord, screening } = useAttendanceRecords(
    attendance ?? null,
    attendance?.patient_id ?? null
  );

  // Ensure clinical record exists automatically (internal system detail)
  // This avoids forcing a manual "Criar Prontuário" action at the start of the attendance.
  useEffect(() => {
    if (!attendance || !attendanceId) return;
    if (isClosed) return;
    if (clinicalRecord) return;
    if (isCreatingRecord) return;

    let cancelled = false;

    (async () => {
      setIsCreatingRecord(true);
      try {
        await ensureClinicalRecordForAttendance(attendanceId, attendance.patient_id);
        if (!cancelled) {
          await queryClient.invalidateQueries({
            queryKey: ["clinical-records-attendance", attendanceId],
          });
        }
      } catch (error: any) {
        logError("clinical_record.autocreate.error", { attendanceId, code: error?.code });
      } finally {
        if (!cancelled) setIsCreatingRecord(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attendance, attendanceId, clinicalRecord, isClosed, isCreatingRecord, queryClient]);

  // Validate and normalize step when attendance changes
  useEffect(() => {
    if (!attendance) return;
    
    const validatedStep = validateStepForAttendance(currentStep, { involves_orthobiologics: attendance.involves_orthobiologics });
    if (validatedStep !== currentStep) {
      setCurrentStep(validatedStep);
    }
  }, [currentStep, attendance]);

  // Guarded step change handler
  const handleStepChange = useCallback((step: AttendanceStepId) => {
    if (!attendance) return;
    
    const validatedStep = validateStepForAttendance(step, { involves_orthobiologics: attendance.involves_orthobiologics });
    setCurrentStep(validatedStep);
  }, [attendance]);


  const handleEnsureClinicalAssessment = useCallback(async () => {
    if (!attendance || !attendanceId) return;

    setIsCreatingRecord(true);
    try {
      await ensureClinicalRecordForAttendance(attendanceId, attendance.patient_id);
      await queryClient.invalidateQueries({ queryKey: ["clinical-records-attendance", attendanceId] });
    } catch (error: any) {
      logError("clinical_record.ensure.error", { attendanceId, code: error?.code });
      toast.error("Erro ao iniciar avaliação clínica. Tente novamente.");
    } finally {
      setIsCreatingRecord(false);
    }
  }, [attendance, attendanceId, queryClient]);


  // Handler: Save hypothesis (SUSPECTED stage)
  const handleSaveHypothesis = useCallback(async () => {
    if (!attendanceId) return;

    const { categoryId, pathologyId, customLabel, clinicalObservation } = hypothesisState;

    const isCustom = pathologyId === null;
    const trimmedCustom = customLabel.trim();

    // At least category or pathology should be present for a meaningful save
    if (!categoryId && !trimmedCustom) {
      toast.error("Selecione pelo menos uma categoria ou informe a patologia.");
      return;
    }

    if (isCustom && trimmedCustom && (trimmedCustom.length < 2 || trimmedCustom.length > 120)) {
      toast.error("Informe a patologia (2 a 120 caracteres).");
      return;
    }

    const payload = {
      attendance_id: attendanceId,
      category_id: categoryId || "00000000-0000-0000-0000-000000000000", // fallback required by NOT NULL
      pathology_id: isCustom ? null : pathologyId,
      custom_pathology_label: isCustom ? trimmedCustom : null,
      clinical_observation: clinicalObservation.trim() || null,
      diagnosis_stage: "SUSPECTED",
      severity_model: "NONE",
      structural_model: null as string | null,
      structural_grade: null as string | null,
      structural_group: null as string | null,
      imaging_method: null as string | null,
      tear_percentage: null as number | null,
      disc_level_enum: null as string | null,
      disc_location_enum: null as string | null,
      eva_pain: null as number | null,
      ifn_function: null as number | null,
    };

    setIsSavingPathology(true);
    try {
      const { error } = await supabase
        .from("attendance_pathology")
        .upsert(payload as any, { onConflict: "attendance_id" });

      if (error) throw error;

      toast.success("Hipótese diagnóstica salva.");
      await queryClient.invalidateQueries({
        queryKey: ["attendance-pathology", attendanceId],
      });
    } catch (e) {
      console.error("hypothesis.save.error", e);
      toast.error("Não foi possível salvar. Revise os campos.");
    } finally {
      setIsSavingPathology(false);
    }
  }, [attendanceId, hypothesisState, queryClient]);

  // Handler: Save confirmed diagnosis (CONFIRMED stage)
  const handleSavePathology = useCallback(async () => {
    if (!attendanceId) return;

    const categoryId = pathologyState.categoryId || hypothesisState.categoryId;
    const pathologyId = pathologyState.pathologyId || hypothesisState.pathologyId;
    const customLabel = pathologyState.customLabel || hypothesisState.customLabel;
    const { structuralModel, structuralGrade, structuralGroup, imagingMethod, tearPercentage, discLevelEnum, discLocationEnum, evaPain, ifnFunction } = pathologyState;

    if (!categoryId) {
      toast.error("Selecione a categoria.");
      return;
    }

    const trimmedCustom = customLabel.trim();
    const isCustom = pathologyId === null;
    if (isCustom && (!trimmedCustom || trimmedCustom.length < 2 || trimmedCustom.length > 120)) {
      toast.error("Informe a patologia (2 a 120 caracteres).");
      return;
    }

    // Structural validation
    if (structuralModel && structuralModel !== "NONE") {
      if (!structuralGrade) {
        toast.error("Selecione a classificação estrutural.");
        return;
      }
      if (!imagingMethod) {
        toast.error("Selecione o método de imagem.");
        return;
      }
      if (structuralModel === "DISC_HERNIATION_TYPE") {
        if (!discLevelEnum) { toast.error("Selecione o nível do disco."); return; }
        if (!discLocationEnum) { toast.error("Selecione a localização."); return; }
        if (imagingMethod !== "MRI") { toast.error("Hérnia discal requer MRI."); return; }
      }
    }

    // EVA and IFN are always required for CONFIRMED
    if (evaPain == null) {
      toast.error("Informe a dor (EVA 0–10).");
      return;
    }
    if (ifnFunction == null) {
      toast.error("Informe a função (IFN 0–10).");
      return;
    }

    // Validate required characterization fields (if profile is resolved)
    if (characterizationProfile) {
      const missingRequired = characterizationProfile.fields.find(
        f => f.required && !f.advancedOnly && !characterizationValues[f.key]
      );
      if (missingRequired) {
        toast.error(`Selecione "${missingRequired.label}" na caracterização científica.`);
        return;
      }
    }

    // When structural_model is NONE, ensure all structural fields are null
    const isStructural = structuralModel && structuralModel !== "NONE";

    // Build characterization JSON payload
    const characterizationJson = characterizationProfile
      ? buildCharacterizationJson(characterizationProfile, characterizationValues)
      : null;

    const payload = {
      attendance_id: attendanceId,
      category_id: categoryId,
      pathology_id: isCustom ? null : pathologyId,
      custom_pathology_label: isCustom ? trimmedCustom : null,
      clinical_observation: hypothesisState.clinicalObservation?.trim() || null,
      diagnosis_stage: "CONFIRMED",
      severity_model: structuralModel || "NONE",
      severity_scale_id: null as string | null,
      severity_value: isStructural ? structuralGrade : null,
      structural_model: structuralModel || "NONE",
      structural_grade: isStructural ? structuralGrade : null,
      structural_group: isStructural ? structuralGroup : null,
      imaging_method: isStructural ? imagingMethod : null,
      tear_percentage: isStructural ? tearPercentage : null,
      disc_level_enum: isStructural && structuralModel === "DISC_HERNIATION_TYPE" ? discLevelEnum : null,
      disc_location_enum: isStructural && structuralModel === "DISC_HERNIATION_TYPE" ? discLocationEnum : null,
      eva_pain: evaPain,
      ifn_function: ifnFunction,
      characterization_json: characterizationJson,
    };

    setIsSavingPathology(true);
    try {
      const { error } = await supabase
        .from("attendance_pathology")
        .upsert(payload as any, { onConflict: "attendance_id" });

      if (error) throw error;

      toast.success("Diagnóstico confirmado salvo.");
      await queryClient.invalidateQueries({
        queryKey: ["attendance-pathology", attendanceId],
      });
    } catch (e) {
      console.error("confirmed_diagnosis.save.error", e);
      toast.error("Não foi possível salvar. Revise os campos.");
    } finally {
      setIsSavingPathology(false);
    }
  }, [attendanceId, pathologyState, hypothesisState, queryClient]);

  // Handler: Save previous treatments via UPSERT
  const handleSavePreviousTreatments = useCallback(async () => {
    if (!attendanceId) return;

    // Validation: if OTHER is selected, otherText is required
    if (previousTreatments.treatments.includes("OTHER") && !previousTreatments.otherText.trim()) {
      setTreatmentsValidationError("Especifique o tratamento.");
      return;
    }
    setTreatmentsValidationError(null);

    // Validation: if SHOCKWAVE is selected, shockwaveType is required
    if (previousTreatments.treatments.includes("SHOCKWAVE") && !previousTreatments.shockwaveType) {
      setShockwaveValidationError("Selecione o tipo de ondas de choque.");
      return;
    }
    setShockwaveValidationError(null);

    // Validation: if LASER is selected, laserIntensity is required
    if (previousTreatments.treatments.includes("LASER") && !previousTreatments.laserIntensity) {
      setLaserValidationError("Selecione a intensidade do laser.");
      return;
    }
    setLaserValidationError(null);

    // Validation: if ORTHOBIOLOGIC_PREV is selected, orthobiologicPrevType is required
    if (previousTreatments.treatments.includes("ORTHOBIOLOGIC_PREV") && !previousTreatments.orthobiologicPrevType) {
      setOrthobiologicPrevValidationError("Selecione o tipo de ortobiológico prévio.");
      return;
    }
    setOrthobiologicPrevValidationError(null);

    // Validation: if ORTHOBIOLOGIC_PREV type is OTHER, other text is required
    if (previousTreatments.treatments.includes("ORTHOBIOLOGIC_PREV") && previousTreatments.orthobiologicPrevType === "OTHER" && !previousTreatments.orthobiologicPrevOtherText.trim()) {
      setOrthobiologicPrevOtherValidationError("Especifique qual ortobiológico.");
      return;
    }
    setOrthobiologicPrevOtherValidationError(null);

    // Validation: if NSAIDS is selected, nsaidTimeBucket is required
    if (previousTreatments.treatments.includes("NSAIDS") && !previousTreatments.nsaidTimeBucket) {
      setNsaidTimeBucketValidationError("Selecione o tempo desde o último uso de AINE.");
      return;
    }
    setNsaidTimeBucketValidationError(null);

    // Build details JSONB
    const details: Record<string, unknown> = {};
    if (previousTreatments.treatments.includes("OTHER") && previousTreatments.otherText.trim()) {
      details.other_text = previousTreatments.otherText.trim();
    }
    if (previousTreatments.treatments.includes("SHOCKWAVE") && previousTreatments.shockwaveType) {
      details.shockwave = { type: previousTreatments.shockwaveType };
    }
    if (previousTreatments.treatments.includes("LASER") && previousTreatments.laserIntensity) {
      details.laser = { intensity: previousTreatments.laserIntensity };
    }
    if (previousTreatments.treatments.includes("ORTHOBIOLOGIC_PREV") && previousTreatments.orthobiologicPrevType) {
      const orthobioPrev: Record<string, string> = { type: previousTreatments.orthobiologicPrevType };
      if (previousTreatments.orthobiologicPrevType === "OTHER" && previousTreatments.orthobiologicPrevOtherText.trim()) {
        orthobioPrev.other_text = previousTreatments.orthobiologicPrevOtherText.trim();
      }
      details.orthobiologic_prev = orthobioPrev;
    }
    if (previousTreatments.treatments.includes("EPI") && previousTreatments.epiUsGuided) {
      details.epi = { us_guided: previousTreatments.epiUsGuided };
    }
    if (previousTreatments.treatments.includes("PHYSIOTHERAPY") && previousTreatments.physioDuration) {
      details.physiotherapy = { duration: previousTreatments.physioDuration };
    }
    if (previousTreatments.treatments.includes("NSAIDS") && previousTreatments.nsaidTimeBucket) {
      details.nsaids = { time_bucket: previousTreatments.nsaidTimeBucket };
    }

    // NONE enforcement
    const finalTreatments = previousTreatments.treatments.includes("NONE")
      ? ["NONE"]
      : previousTreatments.treatments;

    setIsSavingTreatments(true);
    try {
      const payload = {
        attendance_id: attendanceId,
        treatments: finalTreatments,
        last_treatment_time_bucket: previousTreatments.lastTreatmentTimeBucket || null,
        details: details as unknown as import("@/integrations/supabase/types").Json,
      };
      const { error } = await supabase
        .from("attendance_previous_treatments")
        .upsert(payload, { onConflict: "attendance_id" });

      if (error) throw error;

      toast.success("Tratamentos prévios salvos");
      await queryClient.invalidateQueries({
        queryKey: ["attendance-previous-treatments", attendanceId],
      });
      // Avança automaticamente para o Plano Terapêutico
      setCurrentStep("plan");
    } catch (e) {
      logError("previous_treatments.save.error", { attendanceId });
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setIsSavingTreatments(false);
    }
  }, [attendanceId, previousTreatments, queryClient]);

  const handleGenerateReport = useCallback(() => {
    logInfo("report.generate.clicked", { attendanceId: attendanceId || "unknown" });

    if (!clinicalRecord) {
      logWarn("report.generate.blocked.no_record", { attendanceId: attendanceId || "unknown" });
      toast.error("Para gerar relatório, complete a avaliação clínica primeiro.");
      setCurrentStep("clinical");
      return;
    }

    if (!hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic)) {
      logWarn("report.generate.blocked.incomplete_record", {
        attendanceId: attendanceId || "unknown",
        recordId: clinicalRecord.id,
      });
      toast.error("A avaliação clínica precisa ter pelo menos: queixa + anamnese OU diagnóstico clínico.");
      setCurrentStep("clinical");
      return;
    }

    logInfo("report.generate.start", { attendanceId: attendanceId || "unknown", recordId: clinicalRecord.id });
    setCurrentStep("report");
  }, [clinicalRecord, attendanceId]);

  // Helper: Persist report metadata to attendance (audit trail)
  const persistReportMetadata = useCallback(async (
    type: 'preview' | 'pdf',
    recordId: string,
    durationMs: number
  ) => {
    if (!attendanceId) return;

    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({
          last_report_generated_at: new Date().toISOString(),
          last_report_record_id: recordId,
          last_report_type: type,
          last_report_duration_ms: durationMs,
        })
        .eq("id", attendanceId);

      if (error) throw error;

      logInfo("report.persist.success", { attendanceId, recordId, type, ms: durationMs });
      queryClient.invalidateQueries({ queryKey: ["attendance", attendanceId] });
    } catch (error: any) {
      logError("report.persist.error", { attendanceId, recordId, code: error?.code });
    }
  }, [attendanceId, queryClient]);

  // Handler: Export PDF with full telemetry
  const handleExportPdf = useCallback(async () => {
    if (!clinicalRecord || !patient || isExportingPdf) return;

    const t0 = performance.now();
    const recordId = clinicalRecord.id;

    logInfo("report.generate.export_start", { attendanceId: attendanceId || "unknown", recordId });
    setIsExportingPdf(true);

    try {
      navigate(`/relatorios/visualizar/${attendance.patient_id}?recordId=${clinicalRecord.id}`);

      const ms = Math.round(performance.now() - t0);
      logInfo("report.generate.success", {
        attendanceId: attendanceId || "unknown",
        recordId,
        hasExport: true,
        ms
      });

      persistReportMetadata('pdf', recordId, ms);
      toast.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      const ms = Math.round(performance.now() - t0);
      logError("report.generate.error", {
        attendanceId: attendanceId || "unknown",
        recordId,
        code: error?.code || "UNKNOWN",
        message: error?.message?.slice(0, 50),
        ms
      });
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [clinicalRecord, patient, isExportingPdf, attendanceId, navigate, persistReportMetadata]);

  // Handler: Preview report
  const handlePreviewReport = useCallback(async () => {
    if (!clinicalRecord) return;
    const t0 = performance.now();
    const recordId = clinicalRecord.id;

    logInfo("report.preview.clicked", { attendanceId: attendanceId || "unknown", recordId });

    const ms = Math.round(performance.now() - t0);
    persistReportMetadata('preview', recordId, ms);

    navigate(`/relatorios/visualizar/${attendance?.patient_id}?recordId=${clinicalRecord.id}`);
  }, [clinicalRecord, attendanceId, attendance, navigate, persistReportMetadata]);

  // Handle conclude attendance
  const handleConclude = async () => {
    if (!attendance) return;
    if (!confirm("Tem certeza que deseja concluir este atendimento? Após a conclusão, não será possível fazer novas alterações.")) {
      return;
    }
    await closeAttendance.mutateAsync(attendance.id);

    // Marca o evento clínico do dia como atendido (best-effort, não bloqueia)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const eventDate = new Date(attendance.created_at).toISOString().slice(0, 10);
        await supabase
          .from("clinical_scheduled_events")
          .update({ attended: true, attended_at: new Date().toISOString() })
          .eq("patient_id", attendance.patient_id)
          .eq("user_id", user.id)
          .eq("event_date", eventDate)
          .eq("attended", false);
      }
    } catch {
      // falha silenciosa — não impede a conclusão do atendimento
    }
  };

  // Derive topic_key from attendance pathology + intervention type
  const createEvidenceLink = useCreateEvidenceLink();

  // Fetch pathology label + code for evidence linking and profile resolution
  const { data: pathologyMeta } = useQuery({
    queryKey: ["pathology-meta", dbAttendancePathology?.pathology_id],
    queryFn: async () => {
      if (!dbAttendancePathology?.pathology_id) return null;
      const { data } = await supabase
        .from("pathologies")
        .select("label, code")
        .eq("id", dbAttendancePathology.pathology_id)
        .single();
      return data || null;
    },
    enabled: !!dbAttendancePathology?.pathology_id,
  });
  const pathologyLabel = pathologyMeta?.label || null;

  
  const topicKey = useMemo(() => {
    if (!dbAttendancePathology) return null;
    const pathLabel = dbAttendancePathology.custom_pathology_label || pathologyLabel || null;
    if (!pathLabel) return null;
    const intervention = attendance?.involves_orthobiologics ? "PRP" : "FISIOTERAPIA";
    return buildTopicKey(intervention, pathLabel);
  }, [dbAttendancePathology, pathologyLabel, attendance?.involves_orthobiologics]);

  // Profile is resolved inside ConfirmedDiagnosisCard and reported back via callback
  const [characterizationProfile, setCharacterizationProfile] = useState<PathologyCharacterizationProfile | null>(null);

  // Auto-create evidence link when topic_key changes
  useEffect(() => {
    if (!topicKey || !attendanceId || isClosed) return;
    createEvidenceLink.mutate({
      attendanceId,
      patientId: attendance?.patient_id,
      pathologyId: dbAttendancePathology?.pathology_id || undefined,
      interventionCode: attendance?.involves_orthobiologics ? "PRP" : "FISIOTERAPIA",
      topicKey,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicKey, attendanceId]);

  // Determine current clinical status (S0-S3)
  const currentStatus: AttendanceStatus = useMemo(() => {
    if (!attendance?.involves_orthobiologics) return "S1";
    if (!screening) return "S0";

    if (screening.labs_validated) {
      if (screening.canonical_hash) {
        return "S3";
      }
      return "S2";
    }

    return "S1";
  }, [attendance, screening]);

  if (isLoadingAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (attendanceError || !attendance) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atendimento não encontrado</AlertTitle>
          <AlertDescription>
            O atendimento solicitado não existe ou você não tem permissão para acessá-lo.
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/atendimentos")}
          >
            Voltar para Atendimentos
          </Button>
        </Alert>
      </div>
    );
  }

  const renderStepContent = () => {
    const renderClosedAlert = () => (
      <Alert className="mb-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Atendimento Concluído</AlertTitle>
        <AlertDescription>
          Este atendimento foi concluído. As informações estão disponíveis apenas para visualização.
        </AlertDescription>
      </Alert>
    );

    switch (currentStep) {
      case "clinical":
        return (
          <div className="space-y-6">
            {/* Clinical Assessment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Avaliação Clínica
                </CardTitle>
                <CardDescription>
                  Registre queixa, anamnese, exame físico e diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isClosed && renderClosedAlert()}

                <div className="space-y-4">
                  <ClinicalAssessmentInline
                    attendanceId={attendanceId!}
                    patientId={attendance.patient_id}
                    clinicalRecord={clinicalRecord as ClinicalRecordBasic | null}
                    isClosed={isClosed}
                    isBusy={isCreatingRecord}
                    onEnsureRecord={handleEnsureClinicalAssessment}
                    onSaved={async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["clinical-records-attendance", attendanceId],
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hipótese Diagnóstica Inicial */}
            <DiagnosticHypothesisCard
              value={hypothesisState}
              onChange={setHypothesisState}
              onSave={handleSaveHypothesis}
              disabled={isClosed}
              isSaving={isSavingPathology}
            />

            {/* Diagnóstico Confirmado (Imagem) */}
            <ConfirmedDiagnosisCard
              value={pathologyState}
              onChange={setPathologyState}
              onSave={handleSavePathology}
              disabled={isClosed}
              isSaving={isSavingPathology}
              isVisible={isConfirmedDiagnosisVisible}
              onRequestOpen={() => setIsConfirmedDiagnosisVisible(true)}
              hypothesisCategoryId={hypothesisState.categoryId}
              hypothesisPathologyId={hypothesisState.pathologyId}
              hypothesisCustomLabel={hypothesisState.customLabel}
              characterizationValues={characterizationValues}
              onCharacterizationChange={setCharacterizationValues}
              onProfileChange={setCharacterizationProfile}
            />

            {/* Previous Treatments Card */}
            <PreviousTreatmentsCard
              value={previousTreatments}
              onChange={(v) => {
                setPreviousTreatments(v);
                setTreatmentsValidationError(null);
                setShockwaveValidationError(null);
                setLaserValidationError(null);
                setOrthobiologicPrevValidationError(null);
                setOrthobiologicPrevOtherValidationError(null);
                setNsaidTimeBucketValidationError(null);
              }}
              onSave={handleSavePreviousTreatments}
              disabled={isClosed}
              isSaving={isSavingTreatments}
              validationError={treatmentsValidationError}
              shockwaveValidationError={shockwaveValidationError}
              laserValidationError={laserValidationError}
              orthobiologicPrevValidationError={orthobiologicPrevValidationError}
              orthobiologicPrevOtherValidationError={orthobiologicPrevOtherValidationError}
              nsaidTimeBucketValidationError={nsaidTimeBucketValidationError}
            />

            {/* Evidence Panel (Reghen Evidence Method™) */}
            {attendanceId && (
              <EvidencePanel
                attendanceId={attendanceId}
                topicKey={topicKey}
                isClosed={isClosed}
              />
            )}
          </div>
        );

      case "triage":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                Triagem (Opcional)
              </CardTitle>
              <CardDescription>
                Questionário de triagem, scores e elegibilidade — pode ser pulado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isClosed && renderClosedAlert()}
              {screening ? (
                <AvaliacaoRegenapp
                  patientId={attendance.patient_id}
                  patientName={patient?.full_name}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Triagem não realizada — esta etapa é opcional
                  </p>
                  {!isClosed && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate(`/triagem-biologica?paciente=${attendance.patient_id}`)}>
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Iniciar Triagem
                      </Button>
                      <Button variant="outline" onClick={() => setCurrentStep("attachments")}>
                        Pular Triagem
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "plan":
        return (
          <div className="space-y-6">
            {/* Attendance Type Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Tipo de Atendimento
                </CardTitle>
                <CardDescription>
                  Selecione se este atendimento envolve terapias ortobiológicas. Isso habilita a Triagem específica (opcional).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={attendance.involves_orthobiologics ? "orthobiologic" : "non-orthobiologic"}
                  onValueChange={(value) => {
                    if (isClosed) return;
                    const isOrtho = value === "orthobiologic";
                    updateAttendanceType.mutate({
                      attendanceId: attendance.id,
                      involvesOrthobiologics: isOrtho
                    });
                  }}
                  disabled={isClosed || updateAttendanceType.isPending}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="orthobiologic" id="orthobiologic" />
                    <Label htmlFor="orthobiologic" className="cursor-pointer">
                      <span className="font-medium">Ortobiológico</span>
                      <span className="text-muted-foreground text-sm ml-2">(com Triagem)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-orthobiologic" id="non-orthobiologic" />
                    <Label htmlFor="non-orthobiologic" className="cursor-pointer">
                      <span className="font-medium">Não Ortobiológico</span>
                      <span className="text-muted-foreground text-sm ml-2">(sem Triagem)</span>
                    </Label>
                  </div>
                </RadioGroup>
                {attendance.involves_orthobiologics && (
                  <p className="text-sm text-muted-foreground mt-3">
                    ✓ Triagem disponível na próxima etapa (opcional).
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Plano Terapêutico
                </CardTitle>
                <CardDescription>
                  Registre procedimentos e prescrições/orientações para este paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => {
                    const diagStage = (dbAttendancePathology as any)?.diagnosis_stage;
                    if (diagStage !== 'CONFIRMED') {
                      toast.error("Registre o diagnóstico confirmado por imagem antes de adicionar um procedimento.");
                      return;
                    }
                    setIsAddProcedureOpen(true);
                  }} disabled={isClosed}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Procedimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPrescriptionOpen(true)}
                    disabled={isClosed || !attendance || !patient?.full_name}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Prescrição
                  </Button>
                </div>

                {isClosed && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Atendimento concluído: alterações estão desabilitadas.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Clinical Standard Engine */}
            {attendanceId && (
              <ClinicalStandardCard 
                attendanceId={attendanceId} 
                isClosed={isClosed} 
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Procedimentos</CardTitle>
                  <CardDescription>Procedimentos planejados/realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <PatientProceduresList patientId={attendance.patient_id} />
                  ) : (
                    <div className="text-muted-foreground text-center py-8">Carregando...</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prescrições</CardTitle>
                  <CardDescription>Orientações, medicações e suplementações</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <PatientPrescriptionsList patientId={attendance.patient_id} patientName={patient?.full_name ?? "Paciente"} />
                  ) : (
                    <div className="text-muted-foreground text-center py-8">Carregando...</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {attendance && (
              <>
                <AddProcedureModal
                  open={isAddProcedureOpen}
                  onOpenChange={setIsAddProcedureOpen}
                  patientId={attendance.patient_id}
                  onSuccess={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: ["patient-procedures", attendance.patient_id],
                    });
                  }}
                />

                {patient?.full_name && (
                  <PrescriptionFormModal
                    open={isAddPrescriptionOpen}
                    onOpenChange={setIsAddPrescriptionOpen}
                    patientId={attendance.patient_id}
                    patientName={patient.full_name}
                  />
                )}
              </>
            )}
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-6">
            {attendanceId && attendance?.patient_id && (
              <AttendanceDocumentsStep
                attendanceId={attendanceId}
                patientId={attendance.patient_id}
                disabled={isClosed}
              />
            )}
          </div>
        );

      case "report": {
        const hasRecord = !!clinicalRecord;
        const hasMinData = hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic | null);
        const canGenerateReport =
          hasRecord &&
          hasMinData &&
          (attendance?.involves_orthobiologics ? currentStatus === "S3" : true);

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório</CardTitle>
                <CardDescription>
                  Gere e exporte o relatório final do atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasRecord && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Preparando avaliação clínica...
                  </div>
                )}

                {hasRecord && !hasMinData && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">Avaliação Clínica Incompleta</p>
                    <p className="text-muted-foreground mb-4">
                      Preencha pelo menos: queixa + anamnese OU diagnóstico clínico.
                    </p>
                    <Button variant="outline" onClick={() => setCurrentStep("clinical")}>
                      Ir para Avaliação Clínica
                    </Button>
                  </div>
                )}

                {hasRecord && hasMinData && attendance?.involves_orthobiologics && currentStatus !== "S3" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Relatório disponível após conclusão do Score Definitivo (S3)</p>
                    <p className="text-sm mt-2">Status atual: {currentStatus}</p>
                  </div>
                )}

                {canGenerateReport && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Pronto para Gerar Relatório</AlertTitle>
                      <AlertDescription>
                        {attendance?.involves_orthobiologics
                          ? "O score definitivo foi gerado. Você pode gerar o relatório final."
                          : "A avaliação clínica está completa. Você pode gerar o relatório final."}
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button onClick={handleExportPdf} disabled={isExportingPdf}>
                        {isExportingPdf ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          "Gerar Relatório PDF"
                        )}
                      </Button>
                      <Button variant="outline" onClick={handlePreviewReport}>
                        Visualizar Preview
                      </Button>
                    </div>

                    {attendance?.last_report_generated_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Último relatório gerado em{" "}
                          {format(new Date(attendance.last_report_generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {attendance.last_report_type && (
                            <span className="ml-1">
                              ({attendance.last_report_type === "pdf" ? "PDF" : "Preview"})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          {files.length} arquivo(s) anexado(s) — <button 
                            type="button"
                            onClick={() => setCurrentStep("attachments")} 
                            className="text-primary hover:underline"
                          >
                            ver anexos
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence used block (Reghen Evidence Method™) */}
            {attendanceId && (
              <EvidencePanel
                attendanceId={attendanceId}
                topicKey={topicKey}
                isClosed={true}
              />
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AttendanceHeader
        attendance={attendance}
        patientName={patient?.full_name || "Carregando..."}
        status={currentStatus}
        fileCount={files.length}
        onSave={undefined}
        onGenerateReport={handleGenerateReport}
        onConclude={handleConclude}
        isConcluding={closeAttendance.isPending}
        onNavigateToAttachments={() => handleStepChange("attachments")}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stepper */}
        <div className="mb-8">
          <AttendanceStepper
            involvesOrthobiologics={attendance.involves_orthobiologics}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default AtendimentoDetail;
