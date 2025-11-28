export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      mac_protocols: {
        Row: {
          accumulated_treatment_time: number | null
          application_method: string | null
          application_time: number
          clinical_rationale: string | null
          concentration: number | null
          created_at: string
          delivery_mode: string
          distance_to_tissue: number | null
          estimated_depth: number | null
          fluence: number
          frequency: number | null
          id: string
          irradiated_area: number
          light_type: string
          mac_time_per_session: number | null
          patient_id: string
          photosensitizer_type: string | null
          power: number
          target_tissue: string
          technical_observations: string | null
          technique: string
          time_between_application_and_irradiation: string | null
          total_energy: number
          uses_photosensitizer: boolean | null
          wavelength: number
        }
        Insert: {
          accumulated_treatment_time?: number | null
          application_method?: string | null
          application_time: number
          clinical_rationale?: string | null
          concentration?: number | null
          created_at?: string
          delivery_mode: string
          distance_to_tissue?: number | null
          estimated_depth?: number | null
          fluence: number
          frequency?: number | null
          id?: string
          irradiated_area: number
          light_type: string
          mac_time_per_session?: number | null
          patient_id: string
          photosensitizer_type?: string | null
          power: number
          target_tissue: string
          technical_observations?: string | null
          technique: string
          time_between_application_and_irradiation?: string | null
          total_energy: number
          uses_photosensitizer?: boolean | null
          wavelength: number
        }
        Update: {
          accumulated_treatment_time?: number | null
          application_method?: string | null
          application_time?: number
          clinical_rationale?: string | null
          concentration?: number | null
          created_at?: string
          delivery_mode?: string
          distance_to_tissue?: number | null
          estimated_depth?: number | null
          fluence?: number
          frequency?: number | null
          id?: string
          irradiated_area?: number
          light_type?: string
          mac_time_per_session?: number | null
          patient_id?: string
          photosensitizer_type?: string | null
          power?: number
          target_tissue?: string
          technical_observations?: string | null
          technique?: string
          time_between_application_and_irradiation?: string | null
          total_energy?: number
          uses_photosensitizer?: boolean | null
          wavelength?: number
        }
        Relationships: [
          {
            foreignKeyName: "mac_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          birth_date: string | null
          clinical_diagnosis: string | null
          created_at: string
          discharge_date: string | null
          email: string | null
          final_function: number | null
          final_mobility: number | null
          final_outcome: string | null
          final_vas: number | null
          full_name: string
          gender: string | null
          id: string
          imaging_diagnosis: string | null
          initial_function: number | null
          initial_images_description: string | null
          initial_mobility: number | null
          initial_vas: number | null
          pain_type_neuropathic: boolean | null
          pain_type_nociceptive: boolean | null
          pain_type_nociplastic: boolean | null
          phone: string | null
          previous_treatments: string | null
          profession: string | null
          specific_limitations: string | null
          sport_activity: string | null
          status: string | null
          symptoms_duration: string | null
          total_sessions: number | null
          total_treatment_days: number | null
          treated_region: string | null
        }
        Insert: {
          age?: number | null
          birth_date?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          discharge_date?: string | null
          email?: string | null
          final_function?: number | null
          final_mobility?: number | null
          final_outcome?: string | null
          final_vas?: number | null
          full_name: string
          gender?: string | null
          id?: string
          imaging_diagnosis?: string | null
          initial_function?: number | null
          initial_images_description?: string | null
          initial_mobility?: number | null
          initial_vas?: number | null
          pain_type_neuropathic?: boolean | null
          pain_type_nociceptive?: boolean | null
          pain_type_nociplastic?: boolean | null
          phone?: string | null
          previous_treatments?: string | null
          profession?: string | null
          specific_limitations?: string | null
          sport_activity?: string | null
          status?: string | null
          symptoms_duration?: string | null
          total_sessions?: number | null
          total_treatment_days?: number | null
          treated_region?: string | null
        }
        Update: {
          age?: number | null
          birth_date?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          discharge_date?: string | null
          email?: string | null
          final_function?: number | null
          final_mobility?: number | null
          final_outcome?: string | null
          final_vas?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          imaging_diagnosis?: string | null
          initial_function?: number | null
          initial_images_description?: string | null
          initial_mobility?: number | null
          initial_vas?: number | null
          pain_type_neuropathic?: boolean | null
          pain_type_nociceptive?: boolean | null
          pain_type_nociplastic?: boolean | null
          phone?: string | null
          previous_treatments?: string | null
          profession?: string | null
          specific_limitations?: string | null
          sport_activity?: string | null
          status?: string | null
          symptoms_duration?: string | null
          total_sessions?: number | null
          total_treatment_days?: number | null
          treated_region?: string | null
        }
        Relationships: []
      }
      reference_protocols: {
        Row: {
          application_time: string
          contraindications: string | null
          created_at: string
          fluence: string
          id: string
          indications: string | null
          irradiated_area: string
          methylene_blue_concentration: string | null
          observations: string | null
          power: string
          protocol_name: string
          region: string
          target_depth: string | null
          technique: string
          total_energy: string
          uses_methylene_blue: boolean | null
          wavelength: string
        }
        Insert: {
          application_time: string
          contraindications?: string | null
          created_at?: string
          fluence: string
          id?: string
          indications?: string | null
          irradiated_area: string
          methylene_blue_concentration?: string | null
          observations?: string | null
          power: string
          protocol_name: string
          region: string
          target_depth?: string | null
          technique: string
          total_energy: string
          uses_methylene_blue?: boolean | null
          wavelength: string
        }
        Update: {
          application_time?: string
          contraindications?: string | null
          created_at?: string
          fluence?: string
          id?: string
          indications?: string | null
          irradiated_area?: string
          methylene_blue_concentration?: string | null
          observations?: string | null
          power?: string
          protocol_name?: string
          region?: string
          target_depth?: string | null
          technique?: string
          total_energy?: string
          uses_methylene_blue?: boolean | null
          wavelength?: string
        }
        Relationships: []
      }
      session_images: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          id: string
          session_id: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          session_id: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          session_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "treatment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sessions: {
        Row: {
          clinical_observations: string | null
          created_at: string
          function_score: number | null
          id: string
          immediate_response: string | null
          improvement_percentage: number | null
          mobility_score: number | null
          next_session_plan: string | null
          other_techniques_description: string | null
          patient_id: string
          session_date: string
          session_description: string | null
          session_number: number
          used_epi: boolean | null
          used_infiltration: boolean | null
          used_neuromodulation: boolean | null
          used_other_techniques: boolean | null
          used_stretching: boolean | null
          used_therapeutic_exercise: boolean | null
          vas_on_day: number | null
        }
        Insert: {
          clinical_observations?: string | null
          created_at?: string
          function_score?: number | null
          id?: string
          immediate_response?: string | null
          improvement_percentage?: number | null
          mobility_score?: number | null
          next_session_plan?: string | null
          other_techniques_description?: string | null
          patient_id: string
          session_date: string
          session_description?: string | null
          session_number: number
          used_epi?: boolean | null
          used_infiltration?: boolean | null
          used_neuromodulation?: boolean | null
          used_other_techniques?: boolean | null
          used_stretching?: boolean | null
          used_therapeutic_exercise?: boolean | null
          vas_on_day?: number | null
        }
        Update: {
          clinical_observations?: string | null
          created_at?: string
          function_score?: number | null
          id?: string
          immediate_response?: string | null
          improvement_percentage?: number | null
          mobility_score?: number | null
          next_session_plan?: string | null
          other_techniques_description?: string | null
          patient_id?: string
          session_date?: string
          session_description?: string | null
          session_number?: number
          used_epi?: boolean | null
          used_infiltration?: boolean | null
          used_neuromodulation?: boolean | null
          used_other_techniques?: boolean | null
          used_stretching?: boolean | null
          used_therapeutic_exercise?: boolean | null
          vas_on_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
