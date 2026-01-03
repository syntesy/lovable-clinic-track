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
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          additional_info: Json | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          session_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          additional_info?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          additional_info?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          billing_date: string
          created_at: string
          id: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_date: string
          created_at?: string
          id?: string
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_date?: string
          created_at?: string
          id?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_tests: {
        Row: {
          collection_date: string
          file_name: string
          file_path: string
          id: string
          observations: string | null
          patient_id: string
          test_type: string
          uploaded_at: string
        }
        Insert: {
          collection_date: string
          file_name: string
          file_path: string
          id?: string
          observations?: string | null
          patient_id: string
          test_type: string
          uploaded_at?: string
        }
        Update: {
          collection_date?: string
          file_name?: string
          file_path?: string
          id?: string
          observations?: string | null
          patient_id?: string
          test_type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_record_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          clinical_record_id: string
          created_at: string
          data: Json
          hash_integrity: string
          id: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          clinical_record_id: string
          created_at?: string
          data: Json
          hash_integrity: string
          id?: string
          version_number: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          clinical_record_id?: string
          created_at?: string
          data?: Json
          hash_integrity?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_record_versions_clinical_record_id_fkey"
            columns: ["clinical_record_id"]
            isOneToOne: false
            referencedRelation: "clinical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_records: {
        Row: {
          anamnesis: string | null
          chief_complaint: string | null
          clinical_diagnosis: string | null
          created_at: string
          id: string
          legacy_migrated_at: string | null
          patient_id: string
          physical_exam: string | null
          updated_at: string
        }
        Insert: {
          anamnesis?: string | null
          chief_complaint?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          id?: string
          legacy_migrated_at?: string | null
          patient_id: string
          physical_exam?: string | null
          updated_at?: string
        }
        Update: {
          anamnesis?: string | null
          chief_complaint?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          id?: string
          legacy_migrated_at?: string | null
          patient_id?: string
          physical_exam?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_forms: {
        Row: {
          file_name: string
          file_path: string
          id: string
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      curadoria_articles: {
        Row: {
          abstract: string | null
          authors: string
          created_at: string
          doi: string | null
          id: string
          interest: string
          journal: string
          pdf_path: string | null
          pdf_url: string | null
          practice_change: string | null
          pubmed_url: string | null
          status: Database["public"]["Enums"]["curadoria_status"]
          tags: string[] | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          abstract?: string | null
          authors: string
          created_at?: string
          doi?: string | null
          id?: string
          interest: string
          journal: string
          pdf_path?: string | null
          pdf_url?: string | null
          practice_change?: string | null
          pubmed_url?: string | null
          status?: Database["public"]["Enums"]["curadoria_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          abstract?: string | null
          authors?: string
          created_at?: string
          doi?: string | null
          id?: string
          interest?: string
          journal?: string
          pdf_path?: string | null
          pdf_url?: string | null
          practice_change?: string | null
          pubmed_url?: string | null
          status?: Database["public"]["Enums"]["curadoria_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      curadoria_content: {
        Row: {
          article_id: string
          clinical_applicability: string | null
          created_at: string
          created_by: string | null
          evidence_level: string | null
          id: string
          limitations: string | null
          main_results: string | null
          methodology: string | null
          objective: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          clinical_applicability?: string | null
          created_at?: string
          created_by?: string | null
          evidence_level?: string | null
          id?: string
          limitations?: string | null
          main_results?: string | null
          methodology?: string | null
          objective?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          clinical_applicability?: string | null
          created_at?: string
          created_by?: string | null
          evidence_level?: string | null
          id?: string
          limitations?: string | null
          main_results?: string | null
          methodology?: string | null
          objective?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curadoria_content_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "curadoria_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      curadoria_requests: {
        Row: {
          article_id: string
          comment: string | null
          created_at: string
          id: string
          interest: string
          purpose: string | null
          status: Database["public"]["Enums"]["curadoria_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          comment?: string | null
          created_at?: string
          id?: string
          interest: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["curadoria_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          interest?: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["curadoria_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curadoria_requests_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "curadoria_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      curation_jobs: {
        Row: {
          article_id: string
          created_at: string
          curation_id: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          progress: number
          started_at: string | null
          status: string
        }
        Insert: {
          article_id: string
          created_at?: string
          curation_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          progress?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          curation_id?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          progress?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "curation_jobs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "curadoria_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curation_jobs_curation_id_fkey"
            columns: ["curation_id"]
            isOneToOne: false
            referencedRelation: "curations"
            referencedColumns: ["id"]
          },
        ]
      }
      curation_registry_links: {
        Row: {
          created_at: string
          created_by: string | null
          curation_id: string
          dimension_id: string
          id: string
          link_type: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          curation_id: string
          dimension_id: string
          id?: string
          link_type?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          curation_id?: string
          dimension_id?: string
          id?: string
          link_type?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curation_registry_links_curation_id_fkey"
            columns: ["curation_id"]
            isOneToOne: false
            referencedRelation: "curations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curation_registry_links_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "evidence_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      curation_versions: {
        Row: {
          change_reason: string | null
          created_at: string
          created_by: string | null
          curation_id: string
          data: Json
          id: string
          status: Database["public"]["Enums"]["curation_status"]
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          created_by?: string | null
          curation_id: string
          data: Json
          id?: string
          status: Database["public"]["Enums"]["curation_status"]
          version_number: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          created_by?: string | null
          curation_id?: string
          data?: Json
          id?: string
          status?: Database["public"]["Enums"]["curation_status"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "curation_versions_curation_id_fkey"
            columns: ["curation_id"]
            isOneToOne: false
            referencedRelation: "curations"
            referencedColumns: ["id"]
          },
        ]
      }
      curations: {
        Row: {
          adverse_events: string | null
          ai_coverage: string | null
          ai_notes: string | null
          applicability: Database["public"]["Enums"]["applicability"] | null
          approval_declaration: boolean | null
          article_id: string
          authors_conclusion: string | null
          bias_risk: Database["public"]["Enums"]["bias_risk"] | null
          citations: Json | null
          clinical_takeaways: string[] | null
          comparator: string | null
          created_at: string
          created_by: string | null
          design: string | null
          design_type: Database["public"]["Enums"]["study_design"] | null
          evidence_level: Database["public"]["Enums"]["evidence_level"] | null
          generated_by: string | null
          id: string
          intervention: string | null
          limitations: string | null
          objective: string | null
          outcomes_primary: string | null
          outcomes_secondary: string | null
          population: string | null
          practice_impact: string | null
          rejection_reason: string | null
          results_key: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sample_size: string | null
          status: Database["public"]["Enums"]["curation_status"]
          updated_at: string
          version: number
          what_changes_in_practice: string | null
        }
        Insert: {
          adverse_events?: string | null
          ai_coverage?: string | null
          ai_notes?: string | null
          applicability?: Database["public"]["Enums"]["applicability"] | null
          approval_declaration?: boolean | null
          article_id: string
          authors_conclusion?: string | null
          bias_risk?: Database["public"]["Enums"]["bias_risk"] | null
          citations?: Json | null
          clinical_takeaways?: string[] | null
          comparator?: string | null
          created_at?: string
          created_by?: string | null
          design?: string | null
          design_type?: Database["public"]["Enums"]["study_design"] | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          generated_by?: string | null
          id?: string
          intervention?: string | null
          limitations?: string | null
          objective?: string | null
          outcomes_primary?: string | null
          outcomes_secondary?: string | null
          population?: string | null
          practice_impact?: string | null
          rejection_reason?: string | null
          results_key?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_size?: string | null
          status?: Database["public"]["Enums"]["curation_status"]
          updated_at?: string
          version?: number
          what_changes_in_practice?: string | null
        }
        Update: {
          adverse_events?: string | null
          ai_coverage?: string | null
          ai_notes?: string | null
          applicability?: Database["public"]["Enums"]["applicability"] | null
          approval_declaration?: boolean | null
          article_id?: string
          authors_conclusion?: string | null
          bias_risk?: Database["public"]["Enums"]["bias_risk"] | null
          citations?: Json | null
          clinical_takeaways?: string[] | null
          comparator?: string | null
          created_at?: string
          created_by?: string | null
          design?: string | null
          design_type?: Database["public"]["Enums"]["study_design"] | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          generated_by?: string | null
          id?: string
          intervention?: string | null
          limitations?: string | null
          objective?: string | null
          outcomes_primary?: string | null
          outcomes_secondary?: string | null
          population?: string | null
          practice_impact?: string | null
          rejection_reason?: string | null
          results_key?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_size?: string | null
          status?: Database["public"]["Enums"]["curation_status"]
          updated_at?: string
          version?: number
          what_changes_in_practice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "curadoria_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_protocols: {
        Row: {
          application_time: number | null
          clinical_observations: string | null
          contraindications: string | null
          created_at: string
          current_intensity: number | null
          id: string
          injury_region: string | null
          needle_type: string | null
          patient_id: string | null
          protocol_name: string
          session_frequency: string | null
          specific_tissue: string | null
          technique: string | null
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          application_time?: number | null
          clinical_observations?: string | null
          contraindications?: string | null
          created_at?: string
          current_intensity?: number | null
          id?: string
          injury_region?: string | null
          needle_type?: string | null
          patient_id?: string | null
          protocol_name: string
          session_frequency?: string | null
          specific_tissue?: string | null
          technique?: string | null
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          application_time?: number | null
          clinical_observations?: string | null
          contraindications?: string | null
          created_at?: string
          current_intensity?: number | null
          id?: string
          injury_region?: string | null
          needle_type?: string | null
          patient_id?: string | null
          protocol_name?: string
          session_frequency?: string | null
          specific_tissue?: string | null
          technique?: string | null
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_audit_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      evidence_dimensions: {
        Row: {
          created_at: string
          id: string
          pathology_tag: string
          region_tag: string | null
          technique_tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          pathology_tag: string
          region_tag?: string | null
          technique_tag: string
        }
        Update: {
          created_at?: string
          id?: string
          pathology_tag?: string
          region_tag?: string | null
          technique_tag?: string
        }
        Relationships: []
      }
      evidence_snapshots: {
        Row: {
          canonical_hash: string
          computed_at: string
          created_at: string
          dimension_id: string
          id: string
          n_cases_total: number
          n_with_followup_180: number
          n_with_followup_30: number
          n_with_followup_365: number
          n_with_followup_90: number
          pain_baseline_mean: number | null
          pain_baseline_median: number | null
          pain_followup_90_mean: number | null
          pain_followup_90_median: number | null
          pct_improved_90: number | null
          time_window: string
          version: number
        }
        Insert: {
          canonical_hash: string
          computed_at?: string
          created_at?: string
          dimension_id: string
          id?: string
          n_cases_total: number
          n_with_followup_180?: number
          n_with_followup_30?: number
          n_with_followup_365?: number
          n_with_followup_90?: number
          pain_baseline_mean?: number | null
          pain_baseline_median?: number | null
          pain_followup_90_mean?: number | null
          pain_followup_90_median?: number | null
          pct_improved_90?: number | null
          time_window: string
          version: number
        }
        Update: {
          canonical_hash?: string
          computed_at?: string
          created_at?: string
          dimension_id?: string
          id?: string
          n_cases_total?: number
          n_with_followup_180?: number
          n_with_followup_30?: number
          n_with_followup_365?: number
          n_with_followup_90?: number
          pain_baseline_mean?: number | null
          pain_baseline_median?: number | null
          pain_followup_90_mean?: number | null
          pain_followup_90_median?: number | null
          pct_improved_90?: number | null
          time_window?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidence_snapshots_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "evidence_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ortobiologicos_protocols: {
        Row: {
          application_site: string | null
          associated_therapies: string | null
          clinical_observations: string | null
          collection_method: string | null
          contraindications: string | null
          created_at: string
          id: string
          injection_technique: string | null
          patient_id: string | null
          pre_procedure_exams: string | null
          processing_method: string | null
          protocol_name: string
          session_frequency: string | null
          therapy_type: string
          total_sessions: number | null
          updated_at: string
          volume_applied: number | null
          volume_collected: number | null
        }
        Insert: {
          application_site?: string | null
          associated_therapies?: string | null
          clinical_observations?: string | null
          collection_method?: string | null
          contraindications?: string | null
          created_at?: string
          id?: string
          injection_technique?: string | null
          patient_id?: string | null
          pre_procedure_exams?: string | null
          processing_method?: string | null
          protocol_name: string
          session_frequency?: string | null
          therapy_type: string
          total_sessions?: number | null
          updated_at?: string
          volume_applied?: number | null
          volume_collected?: number | null
        }
        Update: {
          application_site?: string | null
          associated_therapies?: string | null
          clinical_observations?: string | null
          collection_method?: string | null
          contraindications?: string | null
          created_at?: string
          id?: string
          injection_technique?: string | null
          patient_id?: string | null
          pre_procedure_exams?: string | null
          processing_method?: string | null
          protocol_name?: string
          session_frequency?: string | null
          therapy_type?: string
          total_sessions?: number | null
          updated_at?: string
          volume_applied?: number | null
          volume_collected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ortobiologicos_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          partner_id: string
          patient_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          partner_id: string
          patient_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          coupon_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          product_type: string
          website_url: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          product_type: string
          website_url: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          product_type?: string
          website_url?: string
        }
        Relationships: []
      }
      patient_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          consent_text: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          patient_id: string
          revocation_reason: string | null
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          witness_user_id: string | null
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          consent_text: string
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          witness_user_id?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          consent_text?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          witness_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_discharges: {
        Row: {
          created_at: string
          discharge_date: string
          discharge_notes: string | null
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          discharge_date?: string
          discharge_notes?: string | null
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          discharge_date?: string
          discharge_notes?: string | null
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_discharges_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
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
      patient_evaluation_reports: {
        Row: {
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          is_visible_to_patient: boolean | null
          patient_id: string
          professional_name: string | null
          professional_registration: string | null
          report_content: Json
        }
        Insert: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          patient_id: string
          professional_name?: string | null
          professional_registration?: string | null
          report_content: Json
        }
        Update: {
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          patient_id?: string
          professional_name?: string | null
          professional_registration?: string | null
          report_content?: Json
        }
        Relationships: [
          {
            foreignKeyName: "patient_evaluation_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_name: string
          id: string
          patient_id: string
          professional_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          patient_id: string
          professional_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_portal_access: {
        Row: {
          cpf_hash: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_surname: string
          patient_id: string
          professional_id: string
          updated_at: string | null
        }
        Insert: {
          cpf_hash: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_surname: string
          patient_id: string
          professional_id: string
          updated_at?: string | null
        }
        Update: {
          cpf_hash?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_surname?: string
          patient_id?: string
          professional_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_portal_access_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_prescriptions: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_visible_to_patient: boolean | null
          notes: string | null
          patient_id: string
          prescription_type: string
          professional_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          notes?: string | null
          patient_id: string
          prescription_type: string
          professional_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_visible_to_patient?: boolean | null
          notes?: string | null
          patient_id?: string
          prescription_type?: string
          professional_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_procedures: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          procedure_date: string
          procedure_name: string
          procedure_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure_date?: string
          procedure_name: string
          procedure_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_date?: string
          procedure_name?: string
          procedure_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_procedures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          age: number | null
          birth_date: string | null
          clinical_diagnosis: string | null
          cpf: string | null
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
          photo_url: string | null
          previous_treatments: string | null
          profession: string | null
          professional_id: string | null
          skin_phototype: string | null
          specific_limitations: string | null
          sport_activity: string | null
          status: string | null
          symptoms_duration: string | null
          total_sessions: number | null
          total_treatment_days: number | null
          treated_region: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          birth_date?: string | null
          clinical_diagnosis?: string | null
          cpf?: string | null
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
          photo_url?: string | null
          previous_treatments?: string | null
          profession?: string | null
          professional_id?: string | null
          skin_phototype?: string | null
          specific_limitations?: string | null
          sport_activity?: string | null
          status?: string | null
          symptoms_duration?: string | null
          total_sessions?: number | null
          total_treatment_days?: number | null
          treated_region?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          birth_date?: string | null
          clinical_diagnosis?: string | null
          cpf?: string | null
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
          photo_url?: string | null
          previous_treatments?: string | null
          profession?: string | null
          professional_id?: string | null
          skin_phototype?: string | null
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
      procedure_followups: {
        Row: {
          adverse_event: boolean | null
          adverse_event_description: string | null
          adverse_event_severity: string | null
          clinician_id: string
          completed_at: string | null
          created_at: string
          function_score: number | null
          function_text: string | null
          global_change: string | null
          id: string
          notes: string | null
          pain_score: number | null
          patient_id: string
          patient_self_declaration: boolean | null
          patient_self_declaration_at: string | null
          rescheduled_from: string | null
          scheduled_for: string
          screening_id: string
          status: string
          timepoint: string
          treatment_adherence: string | null
          updated_at: string
        }
        Insert: {
          adverse_event?: boolean | null
          adverse_event_description?: string | null
          adverse_event_severity?: string | null
          clinician_id: string
          completed_at?: string | null
          created_at?: string
          function_score?: number | null
          function_text?: string | null
          global_change?: string | null
          id?: string
          notes?: string | null
          pain_score?: number | null
          patient_id: string
          patient_self_declaration?: boolean | null
          patient_self_declaration_at?: string | null
          rescheduled_from?: string | null
          scheduled_for: string
          screening_id: string
          status?: string
          timepoint: string
          treatment_adherence?: string | null
          updated_at?: string
        }
        Update: {
          adverse_event?: boolean | null
          adverse_event_description?: string | null
          adverse_event_severity?: string | null
          clinician_id?: string
          completed_at?: string | null
          created_at?: string
          function_score?: number | null
          function_text?: string | null
          global_change?: string | null
          id?: string
          notes?: string | null
          pain_score?: number | null
          patient_id?: string
          patient_self_declaration?: boolean | null
          patient_self_declaration_at?: string | null
          rescheduled_from?: string | null
          scheduled_for?: string
          screening_id?: string
          status?: string
          timepoint?: string
          treatment_adherence?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_followups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_followups_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "prp_screenings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_followups_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "registry_case_summary_v1_1"
            referencedColumns: ["screening_id"]
          },
        ]
      }
      prp_lab_results: {
        Row: {
          attached_files: Json | null
          created_at: string
          extracted_text: string | null
          id: string
          interpretation: string | null
          lab_values: Json | null
          raw_text: string | null
          screening_id: string
          updated_classification: string | null
        }
        Insert: {
          attached_files?: Json | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          interpretation?: string | null
          lab_values?: Json | null
          raw_text?: string | null
          screening_id: string
          updated_classification?: string | null
        }
        Update: {
          attached_files?: Json | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          interpretation?: string | null
          lab_values?: Json | null
          raw_text?: string | null
          screening_id?: string
          updated_classification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prp_lab_results_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "prp_screenings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prp_lab_results_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "registry_case_summary_v1_1"
            referencedColumns: ["screening_id"]
          },
        ]
      }
      prp_screenings: {
        Row: {
          analysis_result: string | null
          canonical_hash: string | null
          canonical_updated_at: string | null
          classification: string | null
          clinical_anamnesis: string | null
          clinical_assessment_by: string | null
          clinical_assessment_completed_at: string | null
          clinical_chief_complaint: string | null
          clinical_diagnosis: string | null
          clinical_physical_exam: string | null
          created_at: string
          engine_computed_at: string | null
          id: string
          labs_collected_date: string | null
          labs_validated: Json | null
          patient_id: string
          patient_orientations: string | null
          questionnaire_responses: Json
          recommended_exams: Json | null
          regen_case_status: string | null
          screening_date: string
          triage_completed_at: string | null
          updated_at: string
        }
        Insert: {
          analysis_result?: string | null
          canonical_hash?: string | null
          canonical_updated_at?: string | null
          classification?: string | null
          clinical_anamnesis?: string | null
          clinical_assessment_by?: string | null
          clinical_assessment_completed_at?: string | null
          clinical_chief_complaint?: string | null
          clinical_diagnosis?: string | null
          clinical_physical_exam?: string | null
          created_at?: string
          engine_computed_at?: string | null
          id?: string
          labs_collected_date?: string | null
          labs_validated?: Json | null
          patient_id: string
          patient_orientations?: string | null
          questionnaire_responses: Json
          recommended_exams?: Json | null
          regen_case_status?: string | null
          screening_date?: string
          triage_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          analysis_result?: string | null
          canonical_hash?: string | null
          canonical_updated_at?: string | null
          classification?: string | null
          clinical_anamnesis?: string | null
          clinical_assessment_by?: string | null
          clinical_assessment_completed_at?: string | null
          clinical_chief_complaint?: string | null
          clinical_diagnosis?: string | null
          clinical_physical_exam?: string | null
          created_at?: string
          engine_computed_at?: string | null
          id?: string
          labs_collected_date?: string | null
          labs_validated?: Json | null
          patient_id?: string
          patient_orientations?: string | null
          questionnaire_responses?: Json
          recommended_exams?: Json | null
          regen_case_status?: string | null
          screening_date?: string
          triage_completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prp_screenings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_protocols: {
        Row: {
          created_at: string
          efeito_luz: string | null
          id: string
          nome: string | null
          tempo_luz_1: number | null
          tempo_luz_1_b: number | null
          tempo_luz_1_c: number | null
          tempo_luz_2: number | null
          tempo_luz_2_b: number | null
          tempo_luz_2_c: number | null
          tempo_luz_3: number | null
          tempo_luz_3_b: number | null
          tempo_luz_3_c: number | null
          tempo_luz_4: number | null
          tempo_luz_4_b: number | null
          tempo_luz_4_c: number | null
          tipo_luz_1: string | null
          tipo_luz_2: string | null
          tipo_luz_3: string | null
          tipo_luz_4: string | null
        }
        Insert: {
          created_at?: string
          efeito_luz?: string | null
          id?: string
          nome?: string | null
          tempo_luz_1?: number | null
          tempo_luz_1_b?: number | null
          tempo_luz_1_c?: number | null
          tempo_luz_2?: number | null
          tempo_luz_2_b?: number | null
          tempo_luz_2_c?: number | null
          tempo_luz_3?: number | null
          tempo_luz_3_b?: number | null
          tempo_luz_3_c?: number | null
          tempo_luz_4?: number | null
          tempo_luz_4_b?: number | null
          tempo_luz_4_c?: number | null
          tipo_luz_1?: string | null
          tipo_luz_2?: string | null
          tipo_luz_3?: string | null
          tipo_luz_4?: string | null
        }
        Update: {
          created_at?: string
          efeito_luz?: string | null
          id?: string
          nome?: string | null
          tempo_luz_1?: number | null
          tempo_luz_1_b?: number | null
          tempo_luz_1_c?: number | null
          tempo_luz_2?: number | null
          tempo_luz_2_b?: number | null
          tempo_luz_2_c?: number | null
          tempo_luz_3?: number | null
          tempo_luz_3_b?: number | null
          tempo_luz_3_c?: number | null
          tempo_luz_4?: number | null
          tempo_luz_4_b?: number | null
          tempo_luz_4_c?: number | null
          tipo_luz_1?: string | null
          tipo_luz_2?: string | null
          tipo_luz_3?: string | null
          tipo_luz_4?: string | null
        }
        Relationships: []
      }
      registry_access_logs: {
        Row: {
          access_details: Json | null
          access_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_details?: Json | null
          access_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_details?: Json | null
          access_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registry_aggregated_metrics: {
        Row: {
          aggregation_level: string
          created_at: string
          id: string
          metric_data: Json
          metric_type: string
          period_end: string
          period_start: string
          sample_size: number
          updated_at: string
        }
        Insert: {
          aggregation_level?: string
          created_at?: string
          id?: string
          metric_data: Json
          metric_type: string
          period_end: string
          period_start: string
          sample_size?: number
          updated_at?: string
        }
        Update: {
          aggregation_level?: string
          created_at?: string
          id?: string
          metric_data?: Json
          metric_type?: string
          period_end?: string
          period_start?: string
          sample_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      registry_audit_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          registry_case_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          registry_case_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          registry_case_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_audit_events_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_baseline: {
        Row: {
          age_range: string | null
          anatomical_region: string | null
          comorbidities: Json | null
          created_at: string
          id: string
          initial_pain_score: number | null
          pain_duration_range: string | null
          primary_diagnosis: string | null
          registry_case_id: string
          sex: string | null
        }
        Insert: {
          age_range?: string | null
          anatomical_region?: string | null
          comorbidities?: Json | null
          created_at?: string
          id?: string
          initial_pain_score?: number | null
          pain_duration_range?: string | null
          primary_diagnosis?: string | null
          registry_case_id: string
          sex?: string | null
        }
        Update: {
          age_range?: string | null
          anatomical_region?: string | null
          comorbidities?: Json | null
          created_at?: string
          id?: string
          initial_pain_score?: number | null
          pain_duration_range?: string | null
          primary_diagnosis?: string | null
          registry_case_id?: string
          sex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_baseline_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_cases: {
        Row: {
          consented_at: string | null
          created_at: string
          id: string
          patient_id: string
          professional_id: string
          registry_case_id: string
          screening_id: string | null
          site_id: string | null
          status: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          consented_at?: string | null
          created_at?: string
          id?: string
          patient_id: string
          professional_id: string
          registry_case_id?: string
          screening_id?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          consented_at?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string
          registry_case_id?: string
          screening_id?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_cases_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "prp_screenings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registry_cases_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "registry_case_summary_v1_1"
            referencedColumns: ["screening_id"]
          },
        ]
      }
      registry_consent_audit: {
        Row: {
          accepted_at: string | null
          consent_version: string
          created_at: string
          id: string
          registry_case_id: string
          text_hash: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          consent_version?: string
          created_at?: string
          id?: string
          registry_case_id: string
          text_hash: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          consent_version?: string
          created_at?: string
          id?: string
          registry_case_id?: string
          text_hash?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_consent_audit_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_consent_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          episode_id: string
          id: string
          new_status: string
          previous_status: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          episode_id: string
          id?: string
          new_status: string
          previous_status?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          episode_id?: string
          id?: string
          new_status?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_consent_logs_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean
          consent_version: string
          created_at: string
          id: string
          lgpd_accepted: boolean
          patient_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          consent_version?: string
          created_at?: string
          id?: string
          lgpd_accepted?: boolean
          patient_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          consent_version?: string
          created_at?: string
          id?: string
          lgpd_accepted?: boolean
          patient_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_engine_snapshots: {
        Row: {
          canonical_hash: string | null
          created_at: string
          engine_computed_at: string | null
          engine_outputs: Json
          final_state: string | null
          id: string
          registry_case_id: string
        }
        Insert: {
          canonical_hash?: string | null
          created_at?: string
          engine_computed_at?: string | null
          engine_outputs?: Json
          final_state?: string | null
          id?: string
          registry_case_id: string
        }
        Update: {
          canonical_hash?: string | null
          created_at?: string
          engine_computed_at?: string | null
          engine_outputs?: Json
          final_state?: string | null
          id?: string
          registry_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_engine_snapshots_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_episodes: {
        Row: {
          baseline_pain_0_10: number | null
          clinician_id: string
          created_at: string
          id: string
          notes_internal: string | null
          pain_duration: string | null
          patient_id: string
          planned_procedure_type: string | null
          region_primary: string | null
          registry_case_id: string | null
          registry_consent_status: string
          registry_eligible: boolean
          registry_partner: string | null
          safety_block: boolean
          status: string
          suspected_diagnosis: string | null
          updated_at: string
        }
        Insert: {
          baseline_pain_0_10?: number | null
          clinician_id: string
          created_at?: string
          id?: string
          notes_internal?: string | null
          pain_duration?: string | null
          patient_id: string
          planned_procedure_type?: string | null
          region_primary?: string | null
          registry_case_id?: string | null
          registry_consent_status?: string
          registry_eligible?: boolean
          registry_partner?: string | null
          safety_block?: boolean
          status?: string
          suspected_diagnosis?: string | null
          updated_at?: string
        }
        Update: {
          baseline_pain_0_10?: number | null
          clinician_id?: string
          created_at?: string
          id?: string
          notes_internal?: string | null
          pain_duration?: string | null
          patient_id?: string
          planned_procedure_type?: string | null
          region_primary?: string | null
          registry_case_id?: string | null
          registry_consent_status?: string
          registry_eligible?: boolean
          registry_partner?: string | null
          safety_block?: boolean
          status?: string
          suspected_diagnosis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_episodes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_exports_log: {
        Row: {
          created_at: string
          export_version: string
          exported_at: string
          exported_by: string
          filters_json: Json
          id: string
          row_count: number
        }
        Insert: {
          created_at?: string
          export_version?: string
          exported_at?: string
          exported_by: string
          filters_json?: Json
          id?: string
          row_count?: number
        }
        Update: {
          created_at?: string
          export_version?: string
          exported_at?: string
          exported_by?: string
          filters_json?: Json
          id?: string
          row_count?: number
        }
        Relationships: []
      }
      registry_followups: {
        Row: {
          created_at: string
          episode_id: string
          function_score: number | null
          id: string
          notes: string | null
          pain_0_10: number | null
          patient_satisfaction_0_10: number | null
          timepoint: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          function_score?: number | null
          id?: string
          notes?: string | null
          pain_0_10?: number | null
          patient_satisfaction_0_10?: number | null
          timepoint?: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          function_score?: number | null
          id?: string
          notes?: string | null
          pain_0_10?: number | null
          patient_satisfaction_0_10?: number | null
          timepoint?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_followups_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_lab_orders: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          order_version: string
          requested_tests_json: Json
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          order_version?: string
          requested_tests_json?: Json
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          order_version?: string
          requested_tests_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "registry_lab_orders_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_lab_results: {
        Row: {
          collected_date: string | null
          created_at: string
          episode_id: string
          id: string
          labs_json: Json
          source: string
        }
        Insert: {
          collected_date?: string | null
          created_at?: string
          episode_id: string
          id?: string
          labs_json?: Json
          source?: string
        }
        Update: {
          collected_date?: string | null
          created_at?: string
          episode_id?: string
          id?: string
          labs_json?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_lab_results_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_labs: {
        Row: {
          collection_date: string | null
          created_at: string
          crp: number | null
          ferritin: number | null
          hba1c: number | null
          hemoglobin: number | null
          id: string
          leukocytes: number | null
          platelets: number | null
          registry_case_id: string
          status: string | null
        }
        Insert: {
          collection_date?: string | null
          created_at?: string
          crp?: number | null
          ferritin?: number | null
          hba1c?: number | null
          hemoglobin?: number | null
          id?: string
          leukocytes?: number | null
          platelets?: number | null
          registry_case_id: string
          status?: string | null
        }
        Update: {
          collection_date?: string | null
          created_at?: string
          crp?: number | null
          ferritin?: number | null
          hba1c?: number | null
          hemoglobin?: number | null
          id?: string
          leukocytes?: number | null
          platelets?: number | null
          registry_case_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_labs_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_longitudinal_followups: {
        Row: {
          adverse_event_type: string | null
          completed_at: string | null
          created_at: string
          id: string
          late_adverse_event: boolean | null
          new_intervention: boolean | null
          pain_score: number | null
          perceived_improvement: number | null
          registry_case_id: string
          return_to_activity: boolean | null
          timepoint: number
        }
        Insert: {
          adverse_event_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          late_adverse_event?: boolean | null
          new_intervention?: boolean | null
          pain_score?: number | null
          perceived_improvement?: number | null
          registry_case_id: string
          return_to_activity?: boolean | null
          timepoint: number
        }
        Update: {
          adverse_event_type?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          late_adverse_event?: boolean | null
          new_intervention?: boolean | null
          pain_score?: number | null
          perceived_improvement?: number | null
          registry_case_id?: string
          return_to_activity?: boolean | null
          timepoint?: number
        }
        Relationships: [
          {
            foreignKeyName: "registry_longitudinal_followups_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_procedure_plans: {
        Row: {
          created_at: string
          episode_id: string
          guidance: boolean | null
          id: string
          notes: string | null
          planned_date: string | null
          procedure_type: string | null
          sessions_planned: number | null
          target: string | null
        }
        Insert: {
          created_at?: string
          episode_id: string
          guidance?: boolean | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          procedure_type?: string | null
          sessions_planned?: number | null
          target?: string | null
        }
        Update: {
          created_at?: string
          episode_id?: string
          guidance?: boolean | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          procedure_type?: string | null
          sessions_planned?: number | null
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_procedure_plans_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_procedures: {
        Row: {
          adverse_event_type: string | null
          anatomical_site_detail: string | null
          application_count: number | null
          created_at: string
          id: string
          image_guided: boolean | null
          immediate_adverse_event: boolean | null
          procedure_date: string
          procedure_type: string
          registry_case_id: string
        }
        Insert: {
          adverse_event_type?: string | null
          anatomical_site_detail?: string | null
          application_count?: number | null
          created_at?: string
          id?: string
          image_guided?: boolean | null
          immediate_adverse_event?: boolean | null
          procedure_date: string
          procedure_type: string
          registry_case_id: string
        }
        Update: {
          adverse_event_type?: string | null
          anatomical_site_detail?: string | null
          application_count?: number | null
          created_at?: string
          id?: string
          image_guided?: boolean | null
          immediate_adverse_event?: boolean | null
          procedure_date?: string
          procedure_type?: string
          registry_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_procedures_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
        ]
      }
      registry_procedures_performed: {
        Row: {
          adverse_event: boolean
          adverse_event_notes: string | null
          clinician_notes: string | null
          created_at: string
          episode_id: string
          guidance: boolean | null
          id: string
          performed_date: string
          procedure_type: string | null
          product_details_json: Json | null
          session_number: number | null
          target: string | null
          volume_used: number | null
        }
        Insert: {
          adverse_event?: boolean
          adverse_event_notes?: string | null
          clinician_notes?: string | null
          created_at?: string
          episode_id: string
          guidance?: boolean | null
          id?: string
          performed_date?: string
          procedure_type?: string | null
          product_details_json?: Json | null
          session_number?: number | null
          target?: string | null
          volume_used?: number | null
        }
        Update: {
          adverse_event?: boolean
          adverse_event_notes?: string | null
          clinician_notes?: string | null
          created_at?: string
          episode_id?: string
          guidance?: boolean | null
          id?: string
          performed_date?: string
          procedure_type?: string | null
          product_details_json?: Json | null
          session_number?: number | null
          target?: string | null
          volume_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_procedures_performed_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_score_snapshots: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          reasoning_json: Json | null
          recommendations_json: Json | null
          score_classification: string | null
          score_context: string
          score_value: number | null
          score_version: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          reasoning_json?: Json | null
          recommendations_json?: Json | null
          score_classification?: string | null
          score_context?: string
          score_value?: number | null
          score_version?: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          reasoning_json?: Json | null
          recommendations_json?: Json | null
          score_classification?: string | null
          score_context?: string
          score_value?: number | null
          score_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_score_snapshots_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_snapshots: {
        Row: {
          created_at: string
          id: string
          is_eligible: boolean
          patient_id: string
          professional_id: string
          snapshot_data: Json
          snapshot_type: string
          snapshot_version: number
          source_record_id: string | null
          source_table: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_eligible?: boolean
          patient_id: string
          professional_id: string
          snapshot_data: Json
          snapshot_type: string
          snapshot_version?: number
          source_record_id?: string | null
          source_table?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_eligible?: boolean
          patient_id?: string
          professional_id?: string
          snapshot_data?: Json
          snapshot_type?: string
          snapshot_version?: number
          source_record_id?: string | null
          source_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      registry_triage_snapshots: {
        Row: {
          answers_json: Json
          biological_soil_flags_json: Json | null
          created_at: string
          episode_id: string
          id: string
          lifestyle_flags_json: Json | null
          medications_flags_json: Json | null
          nutrition_flags_json: Json | null
          red_flags_list: Json | null
          red_flags_present: boolean
          triage_version: string
        }
        Insert: {
          answers_json?: Json
          biological_soil_flags_json?: Json | null
          created_at?: string
          episode_id: string
          id?: string
          lifestyle_flags_json?: Json | null
          medications_flags_json?: Json | null
          nutrition_flags_json?: Json | null
          red_flags_list?: Json | null
          red_flags_present?: boolean
          triage_version?: string
        }
        Update: {
          answers_json?: Json
          biological_soil_flags_json?: Json | null
          created_at?: string
          episode_id?: string
          id?: string
          lifestyle_flags_json?: Json | null
          medications_flags_json?: Json | null
          nutrition_flags_json?: Json | null
          red_flags_list?: Json | null
          red_flags_present?: boolean
          triage_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_triage_snapshots_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "registry_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_images: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          id: string
          image_type: string | null
          session_id: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          image_type?: string | null
          session_id: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          image_type?: string | null
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
      subscriptions: {
        Row: {
          created_at: string
          current_plan: string
          id: string
          next_renewal_date: string | null
          scheduled_effective_date: string | null
          scheduled_plan_change: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_plan?: string
          id?: string
          next_renewal_date?: string | null
          scheduled_effective_date?: string | null
          scheduled_plan_change?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_plan?: string
          id?: string
          next_renewal_date?: string | null
          scheduled_effective_date?: string | null
          scheduled_plan_change?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      thermography_images: {
        Row: {
          evaluated_region: string | null
          exam_date: string
          file_name: string
          file_path: string
          id: string
          observations: string | null
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          evaluated_region?: string | null
          exam_date: string
          file_name: string
          file_path: string
          id?: string
          observations?: string | null
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          evaluated_region?: string | null
          exam_date?: string
          file_name?: string
          file_path?: string
          id?: string
          observations?: string | null
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thermography_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sessions: {
        Row: {
          aptitude_status: string | null
          associated_techniques: string | null
          clinical_observations: string | null
          created_at: string
          exam_observations: string | null
          function_score: number | null
          glucose: number | null
          hba1c: number | null
          hematocrit: number | null
          hemoglobin: number | null
          id: string
          immediate_response: string | null
          improvement_percentage: number | null
          leukocytes: number | null
          light_type: string | null
          mobility_score: number | null
          next_session_plan: string | null
          other_techniques_description: string | null
          patient_id: string
          pcr: number | null
          pharmaceutical_used: string | null
          platelets: number | null
          selected_protocols: string[] | null
          session_date: string
          session_description: string | null
          session_number: number
          suspended: boolean | null
          treatment_time: number | null
          used_epi: boolean | null
          used_infiltration: boolean | null
          used_neuromodulation: boolean | null
          used_other_techniques: boolean | null
          used_stretching: boolean | null
          used_therapeutic_exercise: boolean | null
          vas_on_day: number | null
        }
        Insert: {
          aptitude_status?: string | null
          associated_techniques?: string | null
          clinical_observations?: string | null
          created_at?: string
          exam_observations?: string | null
          function_score?: number | null
          glucose?: number | null
          hba1c?: number | null
          hematocrit?: number | null
          hemoglobin?: number | null
          id?: string
          immediate_response?: string | null
          improvement_percentage?: number | null
          leukocytes?: number | null
          light_type?: string | null
          mobility_score?: number | null
          next_session_plan?: string | null
          other_techniques_description?: string | null
          patient_id: string
          pcr?: number | null
          pharmaceutical_used?: string | null
          platelets?: number | null
          selected_protocols?: string[] | null
          session_date: string
          session_description?: string | null
          session_number: number
          suspended?: boolean | null
          treatment_time?: number | null
          used_epi?: boolean | null
          used_infiltration?: boolean | null
          used_neuromodulation?: boolean | null
          used_other_techniques?: boolean | null
          used_stretching?: boolean | null
          used_therapeutic_exercise?: boolean | null
          vas_on_day?: number | null
        }
        Update: {
          aptitude_status?: string | null
          associated_techniques?: string | null
          clinical_observations?: string | null
          created_at?: string
          exam_observations?: string | null
          function_score?: number | null
          glucose?: number | null
          hba1c?: number | null
          hematocrit?: number | null
          hemoglobin?: number | null
          id?: string
          immediate_response?: string | null
          improvement_percentage?: number | null
          leukocytes?: number | null
          light_type?: string | null
          mobility_score?: number | null
          next_session_plan?: string | null
          other_techniques_description?: string | null
          patient_id?: string
          pcr?: number | null
          pharmaceutical_used?: string | null
          platelets?: number | null
          selected_protocols?: string[] | null
          session_date?: string
          session_description?: string | null
          session_number?: number
          suspended?: boolean | null
          treatment_time?: number | null
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
      ultrasound_images: {
        Row: {
          exam_date: string
          file_name: string
          file_path: string
          id: string
          image_type: string
          observations: string | null
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          exam_date: string
          file_name: string
          file_path: string
          id?: string
          image_type: string
          observations?: string | null
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          exam_date?: string
          file_name?: string
          file_path?: string
          id?: string
          image_type?: string
          observations?: string | null
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ultrasound_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      registry_case_summary_v1_1: {
        Row: {
          adverse_event_any: boolean | null
          baseline_function_score: number | null
          baseline_pain_nrs: number | null
          classification: string | null
          clinician_id: string | null
          d180_function: number | null
          d180_function_dummy: number | null
          d180_pain: number | null
          d30_function: number | null
          d30_global_change: string | null
          d30_pain: number | null
          d365_function: number | null
          d365_pain: number | null
          d90_function: number | null
          d90_global_change: string | null
          d90_pain: number | null
          diagnosis: string | null
          followup_completion_rate: number | null
          followups_completed: number | null
          followups_total: number | null
          has_d180: boolean | null
          has_d30: boolean | null
          has_d365: boolean | null
          has_d90: boolean | null
          missed_count: number | null
          patient_id: string | null
          procedure_type: string | null
          responder_reason_code: string | null
          responder_status: string | null
          screening_created_at: string | null
          screening_id: string | null
          tissue_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prp_screenings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      authenticate_patient: {
        Args: { p_cpf: string; p_surname: string }
        Returns: {
          patient_id: string
          patient_name: string
          professional_id: string
        }[]
      }
      check_patient_limit: {
        Args: { user_id: string }
        Returns: {
          active_patients: number
          can_add_patient: boolean
          current_plan: string
          max_patients: number
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_followups_for_screening: {
        Args: {
          p_clinician_id: string
          p_patient_id: string
          p_procedure_date?: string
          p_screening_id: string
        }
        Returns: {
          adverse_event: boolean | null
          adverse_event_description: string | null
          adverse_event_severity: string | null
          clinician_id: string
          completed_at: string | null
          created_at: string
          function_score: number | null
          function_text: string | null
          global_change: string | null
          id: string
          notes: string | null
          pain_score: number | null
          patient_id: string
          patient_self_declaration: boolean | null
          patient_self_declaration_at: string | null
          rescheduled_from: string | null
          scheduled_for: string
          screening_id: string
          status: string
          timepoint: string
          treatment_adherence: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "procedure_followups"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_integrity_hash: { Args: { data: Json }; Returns: string }
      get_next_snapshot_version: {
        Args: { p_dimension_id: string; p_time_window: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_healthcare_professional: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          p_action: string
          p_additional_info?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: string
      }
      mark_missed_followups: { Args: never; Returns: number }
      normalize_evidence_tag: { Args: { tag: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "professional" | "viewer" | "patient"
      applicability:
        | "alta"
        | "moderada"
        | "baixa"
        | "muito_baixa"
        | "nao_aplicavel"
      bias_risk: "baixo" | "moderado" | "alto" | "muito_alto" | "incerto"
      curadoria_status:
        | "sem_curadoria"
        | "solicitada"
        | "em_analise"
        | "em_producao"
        | "disponivel"
        | "indeferida"
      curation_status:
        | "rascunho"
        | "em_producao"
        | "em_revisao"
        | "aprovada"
        | "disponivel"
        | "rejeitada"
        | "arquivada"
      evidence_level: "ia" | "ib" | "iia" | "iib" | "iii" | "iv" | "v"
      study_design:
        | "rct"
        | "cohort"
        | "case_control"
        | "case_series"
        | "systematic_review"
        | "meta_analysis"
        | "observational"
        | "other"
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
    Enums: {
      app_role: ["admin", "professional", "viewer", "patient"],
      applicability: [
        "alta",
        "moderada",
        "baixa",
        "muito_baixa",
        "nao_aplicavel",
      ],
      bias_risk: ["baixo", "moderado", "alto", "muito_alto", "incerto"],
      curadoria_status: [
        "sem_curadoria",
        "solicitada",
        "em_analise",
        "em_producao",
        "disponivel",
        "indeferida",
      ],
      curation_status: [
        "rascunho",
        "em_producao",
        "em_revisao",
        "aprovada",
        "disponivel",
        "rejeitada",
        "arquivada",
      ],
      evidence_level: ["ia", "ib", "iia", "iib", "iii", "iv", "v"],
      study_design: [
        "rct",
        "cohort",
        "case_control",
        "case_series",
        "systematic_review",
        "meta_analysis",
        "observational",
        "other",
      ],
    },
  },
} as const
