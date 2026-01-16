import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceSession, AttendanceFile, formatAttendanceTitle, isAttendanceClosed } from "@/types/attendance";
import { toast } from "sonner";

// Hook to fetch attendance sessions for a patient
export function usePatientAttendances(patientId: string | null) {
  return useQuery({
    queryKey: ["attendance-sessions", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AttendanceSession[];
    },
    enabled: !!patientId,
  });
}

// Hook to fetch a single attendance session
export function useAttendanceSession(attendanceId: string | null) {
  return useQuery({
    queryKey: ["attendance-session", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return null;
      
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("id", attendanceId)
        .single();
      
      if (error) throw error;
      return data as AttendanceSession;
    },
    enabled: !!attendanceId,
  });
}

// Hook to fetch attendance files
export function useAttendanceFiles(attendanceId: string | null) {
  return useQuery({
    queryKey: ["attendance-files", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return [];
      
      const { data, error } = await supabase
        .from("attendance_files")
        .select("*")
        .eq("attendance_ref", attendanceId)
        .order("uploaded_at", { ascending: false });
      
      if (error) throw error;
      return data as AttendanceFile[];
    },
    enabled: !!attendanceId,
  });
}

// Hook to create a new attendance session
export function useCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      patientId, 
      involvesOrthobiologics = false 
    }: { 
      patientId: string; 
      involvesOrthobiologics?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const title = formatAttendanceTitle(new Date().toISOString());
      
      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert({
          patient_id: patientId,
          involves_orthobiologics: involvesOrthobiologics,
          title,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AttendanceSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", data.patient_id] });
      toast.success("Novo atendimento criado");
    },
    onError: (error) => {
      console.error("Error creating attendance:", error);
      toast.error("Erro ao criar atendimento");
    },
  });
}

// Hook to update attendance type (orthobiologic or not)
export function useUpdateAttendanceType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      attendanceId, 
      involvesOrthobiologics 
    }: { 
      attendanceId: string; 
      involvesOrthobiologics: boolean;
    }) => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .update({ involves_orthobiologics: involvesOrthobiologics })
        .eq("id", attendanceId)
        .select()
        .single();
      
      if (error) throw error;
      return data as AttendanceSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-session", data.id] });
      toast.success(data.involves_orthobiologics 
        ? "Atendimento marcado como Ortobiológico" 
        : "Atendimento marcado como Não Ortobiológico"
      );
    },
    onError: (error) => {
      console.error("Error updating attendance type:", error);
      toast.error("Erro ao atualizar tipo de atendimento");
    },
  });
}

// Hook to upload a file to an attendance
export function useUploadAttendanceFile() {
  const queryClient = useQueryClient();
  
  return useMutation<AttendanceFile, Error, {
    attendanceId: string;
    patientId: string;
    file: File;
    fileType: 'exam' | 'report' | 'image' | 'photo' | 'other';
    description?: string;
  }>({
    mutationFn: async ({
      attendanceId,
      patientId,
      file,
      fileType,
      description,
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // If description is provided, use it as the display name
      const displayFileName = description?.trim() ? description.trim() : file.name;
      
      // Sanitize file name for storage path (remove special chars, spaces, accents)
      const sanitizedFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-zA-Z0-9._-]/g, "_") // replace special chars with underscore
        .replace(/_+/g, "_"); // collapse multiple underscores
      
      // Upload file to storage with sanitized path
      const filePath = `${user.id}/${attendanceId}/${Date.now()}_${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("attendance-files")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Create file record with custom file name
      const { data, error } = await supabase
        .from("attendance_files")
        .insert({
          attendance_ref: attendanceId,
          patient_id: patientId,
          file_path: filePath,
          file_name: displayFileName,
          mime_type: file.type,
          file_type: fileType,
          description: description || null,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AttendanceFile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-files", data.attendance_ref] });
      toast.success("Arquivo enviado com sucesso");
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as any).message)
          : "Erro ao enviar arquivo";
      toast.error(message);
    },
  });
}

// Hook to delete an attendance file
export function useDeleteAttendanceFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: AttendanceFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("attendance-files")
        .remove([file.file_path]);
      
      if (storageError) console.warn("Error deleting from storage:", storageError);
      
      // Delete record
      const { error } = await supabase
        .from("attendance_files")
        .delete()
        .eq("id", file.id);
      
      if (error) throw error;
      return file.attendance_ref;
    },
    onSuccess: (attendanceId) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-files", attendanceId] });
      toast.success("Arquivo removido");
    },
    onError: (error) => {
      console.error("Error deleting file:", error);
      toast.error("Erro ao remover arquivo");
    },
  });
}

// Hook to close an attendance session (idempotent - only closes if not already closed)
export function useCloseAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Idempotent: only update if closed_at IS NULL
      const { data, error } = await supabase
        .from("attendance_sessions")
        .update({ 
          closed_at: new Date().toISOString(),
          closed_by: user.id 
        })
        .eq("id", attendanceId)
        .is("closed_at", null) // CRITICAL: prevents double-close
        .select()
        .single();
      
      if (error) {
        // If no rows affected (already closed), fetch current state
        if (error.code === "PGRST116") {
          const { data: existing } = await supabase
            .from("attendance_sessions")
            .select("*")
            .eq("id", attendanceId)
            .single();
          
          if (existing?.closed_at) {
            // Already closed - return existing (idempotent success)
            return existing as AttendanceSession;
          }
        }
        throw error;
      }
      return data as AttendanceSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-session", data.id] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", data.patient_id] });
      toast.success("Atendimento concluído");
    },
    onError: (error) => {
      console.error("Error closing attendance:", error);
      toast.error("Erro ao concluir atendimento");
    },
  });
}

// Helper hook to get records for an attendance
// Uses attendance_id FK for clinical records (proper relationship)
// Uses time window for screening (legacy - until FK added)
export function useAttendanceRecords(attendanceSession: AttendanceSession | null, patientId: string | null) {
  const attendanceId = attendanceSession?.id;
  const attendanceStartAt = attendanceSession?.created_at;
  const attendanceEndAt = attendanceSession?.closed_at;
  
  // Fetch clinical record by attendance_id FK (primary method)
  const clinicalRecordsQuery = useQuery({
    queryKey: ["clinical-records-attendance", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return null;
      
      const { data, error } = await supabase
        .from("clinical_records")
        .select("id, patient_id, attendance_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
        .eq("attendance_id", attendanceId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceId,
  });
  
  // Fetch screening within time window (until FK added to prp_screenings)
  const screeningQuery = useQuery({
    queryKey: ["screening-attendance", patientId, attendanceStartAt, attendanceEndAt],
    queryFn: async () => {
      if (!patientId || !attendanceStartAt) return null;
      
      let query = supabase
        .from("prp_screenings")
        .select("*")
        .eq("patient_id", patientId)
        .gte("created_at", attendanceStartAt);
      
      // If attendance is closed, also apply upper bound
      if (attendanceEndAt) {
        query = query.lte("created_at", attendanceEndAt);
      }
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId && !!attendanceStartAt,
  });
  
  return {
    clinicalRecord: clinicalRecordsQuery.data,
    isLoadingClinicalRecord: clinicalRecordsQuery.isLoading,
    screening: screeningQuery.data,
    isLoadingScreening: screeningQuery.isLoading,
  };
}
