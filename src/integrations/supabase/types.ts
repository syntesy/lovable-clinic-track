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
          created_at: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          anamnesis?: string | null
          created_at?: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          anamnesis?: string | null
          created_at?: string
          id?: string
          patient_id?: string
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
        ]
      }
      prp_screenings: {
        Row: {
          analysis_result: string | null
          classification: string | null
          created_at: string
          id: string
          patient_id: string
          patient_orientations: string | null
          questionnaire_responses: Json
          recommended_exams: Json | null
          screening_date: string
          updated_at: string
        }
        Insert: {
          analysis_result?: string | null
          classification?: string | null
          created_at?: string
          id?: string
          patient_id: string
          patient_orientations?: string | null
          questionnaire_responses: Json
          recommended_exams?: Json | null
          screening_date?: string
          updated_at?: string
        }
        Update: {
          analysis_result?: string | null
          classification?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          patient_orientations?: string | null
          questionnaire_responses?: Json
          recommended_exams?: Json | null
          screening_date?: string
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
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: { Args: never; Returns: number }
      generate_integrity_hash: { Args: { data: Json }; Returns: string }
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
    }
    Enums: {
      app_role: "admin" | "professional" | "viewer"
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
      app_role: ["admin", "professional", "viewer"],
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
