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
      attendance_files: {
        Row: {
          attendance_ref: string
          description: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          mime_type: string | null
          patient_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          attendance_ref: string
          description?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          mime_type?: string | null
          patient_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          attendance_ref?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_files_attendance_ref_fkey"
            columns: ["attendance_ref"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          has_standardized_procedure: boolean | null
          id: string
          involves_orthobiologics: boolean
          is_synthetic: boolean | null
          last_report_duration_ms: number | null
          last_report_generated_at: string | null
          last_report_record_id: string | null
          last_report_type: string | null
          patient_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          has_standardized_procedure?: boolean | null
          id?: string
          involves_orthobiologics?: boolean
          is_synthetic?: boolean | null
          last_report_duration_ms?: number | null
          last_report_generated_at?: string | null
          last_report_record_id?: string | null
          last_report_type?: string | null
          patient_id: string
          title?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          has_standardized_procedure?: boolean | null
          id?: string
          involves_orthobiologics?: boolean
          is_synthetic?: boolean | null
          last_report_duration_ms?: number | null
          last_report_generated_at?: string | null
          last_report_record_id?: string | null
          last_report_type?: string | null
          patient_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          additional_info: Json | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
      career_access_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      career_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          period: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          period: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          period?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      career_case_complexity: {
        Row: {
          complexity_score: number | null
          created_at: string
          id: string
          metric_type: string
          period: string
          red_flags_count: number | null
          total_cases: number | null
          unique_diagnoses: number | null
          user_id: string
          value: number | null
        }
        Insert: {
          complexity_score?: number | null
          created_at?: string
          id?: string
          metric_type?: string
          period: string
          red_flags_count?: number | null
          total_cases?: number | null
          unique_diagnoses?: number | null
          user_id: string
          value?: number | null
        }
        Update: {
          complexity_score?: number | null
          created_at?: string
          id?: string
          metric_type?: string
          period?: string
          red_flags_count?: number | null
          total_cases?: number | null
          unique_diagnoses?: number | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      career_certifications: {
        Row: {
          certification_level: string
          certification_type: string
          created_at: string
          criteria_met: Json | null
          earned_at: string
          id: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          certification_level?: string
          certification_type: string
          created_at?: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          certification_level?: string
          certification_type?: string
          created_at?: string
          criteria_met?: Json | null
          earned_at?: string
          id?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      career_consistency_index: {
        Row: {
          consistency_score: number | null
          created_at: string
          id: string
          metric_type: string
          period: string
          protocol_variance: number | null
          technique_diversity: number | null
          user_id: string
          value: number | null
        }
        Insert: {
          consistency_score?: number | null
          created_at?: string
          id?: string
          metric_type?: string
          period: string
          protocol_variance?: number | null
          technique_diversity?: number | null
          user_id: string
          value?: number | null
        }
        Update: {
          consistency_score?: number | null
          created_at?: string
          id?: string
          metric_type?: string
          period?: string
          protocol_variance?: number | null
          technique_diversity?: number | null
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      career_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          percentile: number | null
          period: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          percentile?: number | null
          period: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          percentile?: number | null
          period?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      career_narratives: {
        Row: {
          content: string | null
          created_at: string
          id: string
          metric_type: string
          narrative_type: string
          period: string
          title: string
          user_id: string
          value: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          metric_type?: string
          narrative_type: string
          period: string
          title: string
          user_id: string
          value?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          metric_type?: string
          narrative_type?: string
          period?: string
          title?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      career_opportunities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_interested: boolean | null
          is_viewed: boolean | null
          opportunity_type: string
          period: string
          relevance_score: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_interested?: boolean | null
          is_viewed?: boolean | null
          opportunity_type: string
          period: string
          relevance_score?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_interested?: boolean | null
          is_viewed?: boolean | null
          opportunity_type?: string
          period?: string
          relevance_score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      career_trends: {
        Row: {
          baseline_period: string | null
          created_at: string
          id: string
          metric_type: string
          period: string
          trend_direction: string
          trend_value: number | null
          user_id: string
        }
        Insert: {
          baseline_period?: string | null
          created_at?: string
          id?: string
          metric_type: string
          period: string
          trend_direction?: string
          trend_value?: number | null
          user_id: string
        }
        Update: {
          baseline_period?: string | null
          created_at?: string
          id?: string
          metric_type?: string
          period?: string
          trend_direction?: string
          trend_value?: number | null
          user_id?: string
        }
        Relationships: []
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
          attendance_id: string | null
          chief_complaint: string | null
          clinical_diagnosis: string | null
          created_at: string
          id: string
          legacy_migrated_at: string | null
          patient_id: string
          physical_exam: string | null
          status: string
          updated_at: string
        }
        Insert: {
          anamnesis?: string | null
          attendance_id?: string | null
          chief_complaint?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          id?: string
          legacy_migrated_at?: string | null
          patient_id: string
          physical_exam?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          anamnesis?: string | null
          attendance_id?: string | null
          chief_complaint?: string | null
          clinical_diagnosis?: string | null
          created_at?: string
          id?: string
          legacy_migrated_at?: string | null
          patient_id?: string
          physical_exam?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_scheduled_events: {
        Row: {
          alerts: Json | null
          attended: boolean | null
          attended_at: string | null
          case_id: string | null
          case_summary: string | null
          clinical_stage: string
          created_at: string
          created_by: string
          event_date: string
          id: string
          last_outcome: string | null
          patient_id: string
          patient_name: string
          time_end: string | null
          time_start: string
          today_action: string
          user_id: string
        }
        Insert: {
          alerts?: Json | null
          attended?: boolean | null
          attended_at?: string | null
          case_id?: string | null
          case_summary?: string | null
          clinical_stage: string
          created_at?: string
          created_by: string
          event_date: string
          id?: string
          last_outcome?: string | null
          patient_id: string
          patient_name: string
          time_end?: string | null
          time_start: string
          today_action: string
          user_id: string
        }
        Update: {
          alerts?: Json | null
          attended?: boolean | null
          attended_at?: string | null
          case_id?: string | null
          case_summary?: string | null
          clinical_stage?: string
          created_at?: string
          created_by?: string
          event_date?: string
          id?: string
          last_outcome?: string | null
          patient_id?: string
          patient_name?: string
          time_end?: string | null
          time_start?: string
          today_action?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_scheduled_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "prp_screenings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_scheduled_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "registry_case_summary_v1_1"
            referencedColumns: ["screening_id"]
          },
          {
            foreignKeyName: "clinical_scheduled_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_taxonomies: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_user_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_user_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_user_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      co_interventions_core: {
        Row: {
          created_at: string
          epi_associated: boolean
          exercise_therapy: boolean
          id: string
          is_synthetic: boolean | null
          procedure_standard_record_id: string
          shockwave_therapy: string
        }
        Insert: {
          created_at?: string
          epi_associated?: boolean
          exercise_therapy?: boolean
          id?: string
          is_synthetic?: boolean | null
          procedure_standard_record_id: string
          shockwave_therapy?: string
        }
        Update: {
          created_at?: string
          epi_associated?: boolean
          exercise_therapy?: boolean
          id?: string
          is_synthetic?: boolean | null
          procedure_standard_record_id?: string
          shockwave_therapy?: string
        }
        Relationships: [
          {
            foreignKeyName: "co_interventions_core_procedure_standard_record_id_fkey"
            columns: ["procedure_standard_record_id"]
            isOneToOne: true
            referencedRelation: "procedure_standard_records"
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
          category_code: string | null
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
          therapy_item_code: string | null
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
          category_code?: string | null
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
          therapy_item_code?: string | null
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
          category_code?: string | null
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
          therapy_item_code?: string | null
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
          {
            foreignKeyName: "curations_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "therapy_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "curations_therapy_item_fkey"
            columns: ["therapy_item_code"]
            isOneToOne: false
            referencedRelation: "therapy_items"
            referencedColumns: ["code"]
          },
        ]
      }
      diligence_case_reports: {
        Row: {
          case_id: string
          created_at: string
          generated_at: string
          id: string
          immutable: boolean
          pdf_checksum: string | null
          pdf_storage_path: string | null
          report_content: Json
          report_version: number
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          generated_at?: string
          id?: string
          immutable?: boolean
          pdf_checksum?: string | null
          pdf_storage_path?: string | null
          report_content: Json
          report_version?: number
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          immutable?: boolean
          pdf_checksum?: string | null
          pdf_storage_path?: string | null
          report_content?: Json
          report_version?: number
          user_id?: string
        }
        Relationships: []
      }
      diligence_case_timelines: {
        Row: {
          case_id: string
          created_at: string
          event_description: string
          event_timestamp: string
          event_type: string
          id: string
          immutable: boolean
          source_record_id: string | null
          source_table: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          event_description: string
          event_timestamp: string
          event_type: string
          id?: string
          immutable?: boolean
          source_record_id?: string | null
          source_table?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          event_description?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          immutable?: boolean
          source_record_id?: string | null
          source_table?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diligence_checklists: {
        Row: {
          case_id: string | null
          checklist_items: Json
          checklist_type: string
          completed_items: Json
          created_at: string
          id: string
          immutable: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          checklist_items: Json
          checklist_type: string
          completed_items?: Json
          created_at?: string
          id?: string
          immutable?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          checklist_items?: Json
          checklist_type?: string
          completed_items?: Json
          created_at?: string
          id?: string
          immutable?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diligence_compliance_logs: {
        Row: {
          action: string
          action_details: Json | null
          case_id: string | null
          created_at: string
          id: string
          immutable: boolean
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_details?: Json | null
          case_id?: string | null
          created_at?: string
          id?: string
          immutable?: boolean
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_details?: Json | null
          case_id?: string | null
          created_at?: string
          id?: string
          immutable?: boolean
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diligence_practice_statements: {
        Row: {
          created_at: string
          id: string
          immutable: boolean
          statement_content: Json
          statement_type: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          immutable?: boolean
          statement_content: Json
          statement_type: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          immutable?: boolean
          statement_content?: Json
          statement_type?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      diligence_risk_disclosures: {
        Row: {
          case_id: string
          created_at: string
          disclosed_at: string
          disclosure_method: string | null
          id: string
          immutable: boolean
          patient_acknowledged: boolean | null
          risk_category: string
          risk_description: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          disclosed_at: string
          disclosure_method?: string | null
          id?: string
          immutable?: boolean
          patient_acknowledged?: boolean | null
          risk_category: string
          risk_description: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          disclosed_at?: string
          disclosure_method?: string | null
          id?: string
          immutable?: boolean
          patient_acknowledged?: boolean | null
          risk_category?: string
          risk_description?: string
          user_id?: string
        }
        Relationships: []
      }
      edu_learning_objects: {
        Row: {
          content_url: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          institution_id: string
          module_id: string | null
          object_type: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          institution_id: string
          module_id?: string | null
          object_type?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          institution_id?: string
          module_id?: string | null
          object_type?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_learning_objects_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "edu_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_modules: {
        Row: {
          cohort_id: string | null
          created_at: string
          description: string | null
          id: string
          institution_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institution_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      governance_audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["governance_action"]
          changed_fields: Json | null
          clinic_id: string
          entity_id: string
          entity_type: string
          id: string
          justification: string | null
          new_snapshot: Json | null
          performed_at: string
          performed_by_user_id: string
          previous_snapshot: Json | null
        }
        Insert: {
          action: Database["public"]["Enums"]["governance_action"]
          changed_fields?: Json | null
          clinic_id: string
          entity_id: string
          entity_type: string
          id?: string
          justification?: string | null
          new_snapshot?: Json | null
          performed_at?: string
          performed_by_user_id: string
          previous_snapshot?: Json | null
        }
        Update: {
          action?: Database["public"]["Enums"]["governance_action"]
          changed_fields?: Json | null
          clinic_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          justification?: string | null
          new_snapshot?: Json | null
          performed_at?: string
          performed_by_user_id?: string
          previous_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
      mentor_curation_checklists: {
        Row: {
          clinical_experience_verified: boolean | null
          created_at: string | null
          curated_at: string | null
          curated_by: string | null
          curator_notes: string | null
          ethical_compliance: boolean | null
          evidence_based_alignment: boolean | null
          formation_compatible: boolean | null
          id: string
          language_adequate: boolean | null
          mentor_id: string
          updated_at: string | null
        }
        Insert: {
          clinical_experience_verified?: boolean | null
          created_at?: string | null
          curated_at?: string | null
          curated_by?: string | null
          curator_notes?: string | null
          ethical_compliance?: boolean | null
          evidence_based_alignment?: boolean | null
          formation_compatible?: boolean | null
          id?: string
          language_adequate?: boolean | null
          mentor_id: string
          updated_at?: string | null
        }
        Update: {
          clinical_experience_verified?: boolean | null
          created_at?: string | null
          curated_at?: string | null
          curated_by?: string | null
          curator_notes?: string | null
          ethical_compliance?: boolean | null
          evidence_based_alignment?: boolean | null
          formation_compatible?: boolean | null
          id?: string
          language_adequate?: boolean | null
          mentor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_curation_checklists_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_taxonomies: {
        Row: {
          created_at: string | null
          id: string
          mentor_id: string
          taxonomy_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_id: string
          taxonomy_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_id?: string
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_taxonomies_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_taxonomies_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "clinical_taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          clinical_areas: string[] | null
          created_at: string
          email: string | null
          formation: string | null
          has_curation_seal: boolean | null
          headline: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          linkedin_url: string | null
          name: string
          onboarding_completed: boolean | null
          photo_url: string | null
          slug: string
          specialty: string
          status: Database["public"]["Enums"]["mentor_status"] | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          clinical_areas?: string[] | null
          created_at?: string
          email?: string | null
          formation?: string | null
          has_curation_seal?: boolean | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          photo_url?: string | null
          slug: string
          specialty: string
          status?: Database["public"]["Enums"]["mentor_status"] | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          clinical_areas?: string[] | null
          created_at?: string
          email?: string | null
          formation?: string | null
          has_curation_seal?: boolean | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          photo_url?: string | null
          slug?: string
          specialty?: string
          status?: Database["public"]["Enums"]["mentor_status"] | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mentorship_enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string
          id: string
          mentorship_id: string
          payment_status: string | null
          session_id: string | null
          status: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          mentorship_id: string
          payment_status?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          mentorship_id?: string
          payment_status?: string | null
          session_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_enrollments_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentorship_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_sessions: {
        Row: {
          created_at: string
          id: string
          meeting_url: string | null
          mentorship_id: string
          scheduled_at: string
          spots_available: number | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_url?: string | null
          mentorship_id: string
          scheduled_at: string
          spots_available?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_url?: string | null
          mentorship_id?: string
          scheduled_at?: string
          spots_available?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorships: {
        Row: {
          clinical_area: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_spots: number | null
          meeting_url: string | null
          mentor_id: string
          modality: string
          price_cents: number
          slug: string
          status: string
          stripe_price_id: string | null
          target_audience: string | null
          title: string
          topics: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          clinical_area?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_spots?: number | null
          meeting_url?: string | null
          mentor_id: string
          modality?: string
          price_cents?: number
          slug: string
          status?: string
          stripe_price_id?: string | null
          target_audience?: string | null
          title: string
          topics?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          clinical_area?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_spots?: number | null
          meeting_url?: string | null
          mentor_id?: string
          modality?: string
          price_cents?: number
          slug?: string
          status?: string
          stripe_price_id?: string | null
          target_audience?: string | null
          title?: string
          topics?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
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
      patient_reported_outcomes: {
        Row: {
          attendance_id: string
          created_at: string
          function_scale_type: string | null
          function_score: number | null
          id: string
          is_synthetic: boolean | null
          pain_score: number | null
          procedure_standard_record_id: string | null
          submitted_at: string
          timepoint: string
        }
        Insert: {
          attendance_id: string
          created_at?: string
          function_scale_type?: string | null
          function_score?: number | null
          id?: string
          is_synthetic?: boolean | null
          pain_score?: number | null
          procedure_standard_record_id?: string | null
          submitted_at?: string
          timepoint: string
        }
        Update: {
          attendance_id?: string
          created_at?: string
          function_scale_type?: string | null
          function_score?: number | null
          id?: string
          is_synthetic?: boolean | null
          pain_score?: number | null
          procedure_standard_record_id?: string | null
          submitted_at?: string
          timepoint?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_reported_outcomes_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reported_outcomes_procedure_standard_record_id_fkey"
            columns: ["procedure_standard_record_id"]
            isOneToOne: false
            referencedRelation: "procedure_standard_records"
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
          is_synthetic: boolean | null
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
          is_synthetic?: boolean | null
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
          is_synthetic?: boolean | null
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
      procedure_standard_records: {
        Row: {
          adverse_event_record: Json | null
          adverse_event_status: Database["public"]["Enums"]["adverse_event_status"]
          anatomic_region: string
          assisted_by_user_id: string | null
          attendance_id: string
          clinic_id: string
          clinical_standard_notes: string[] | null
          clinical_standard_status: string
          cluster_key: string | null
          created_at: string
          id: string
          is_comparable: boolean
          is_synthetic: boolean | null
          last_evaluated_at: string | null
          material_traceability: Json | null
          pathology: string
          performed_by_user_id: string
          procedure_type: string
          protocol_id: string
          protocol_signature: string | null
          protocol_version_id: string
          responsible_professional_user_id: string
          safety_checklist: Json | null
          safety_checklist_status: Database["public"]["Enums"]["safety_checklist_status"]
          scientific_badge_status: Database["public"]["Enums"]["scientific_badge_status"]
          scientific_edit_justification: string | null
          scientific_mode_enabled: boolean
          scientific_validated_at: string | null
          scientific_validated_by_user_id: string | null
          severity_classification: string
          specific_location: string | null
          symptom_duration: string | null
          updated_at: string
        }
        Insert: {
          adverse_event_record?: Json | null
          adverse_event_status?: Database["public"]["Enums"]["adverse_event_status"]
          anatomic_region: string
          assisted_by_user_id?: string | null
          attendance_id: string
          clinic_id: string
          clinical_standard_notes?: string[] | null
          clinical_standard_status?: string
          cluster_key?: string | null
          created_at?: string
          id?: string
          is_comparable?: boolean
          is_synthetic?: boolean | null
          last_evaluated_at?: string | null
          material_traceability?: Json | null
          pathology: string
          performed_by_user_id?: string
          procedure_type?: string
          protocol_id: string
          protocol_signature?: string | null
          protocol_version_id: string
          responsible_professional_user_id: string
          safety_checklist?: Json | null
          safety_checklist_status?: Database["public"]["Enums"]["safety_checklist_status"]
          scientific_badge_status?: Database["public"]["Enums"]["scientific_badge_status"]
          scientific_edit_justification?: string | null
          scientific_mode_enabled?: boolean
          scientific_validated_at?: string | null
          scientific_validated_by_user_id?: string | null
          severity_classification: string
          specific_location?: string | null
          symptom_duration?: string | null
          updated_at?: string
        }
        Update: {
          adverse_event_record?: Json | null
          adverse_event_status?: Database["public"]["Enums"]["adverse_event_status"]
          anatomic_region?: string
          assisted_by_user_id?: string | null
          attendance_id?: string
          clinic_id?: string
          clinical_standard_notes?: string[] | null
          clinical_standard_status?: string
          cluster_key?: string | null
          created_at?: string
          id?: string
          is_comparable?: boolean
          is_synthetic?: boolean | null
          last_evaluated_at?: string | null
          material_traceability?: Json | null
          pathology?: string
          performed_by_user_id?: string
          procedure_type?: string
          protocol_id?: string
          protocol_signature?: string | null
          protocol_version_id?: string
          responsible_professional_user_id?: string
          safety_checklist?: Json | null
          safety_checklist_status?: Database["public"]["Enums"]["safety_checklist_status"]
          scientific_badge_status?: Database["public"]["Enums"]["scientific_badge_status"]
          scientific_edit_justification?: string | null
          scientific_mode_enabled?: boolean
          scientific_validated_at?: string | null
          scientific_validated_by_user_id?: string | null
          severity_classification?: string
          specific_location?: string | null
          symptom_duration?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_psr_clinic"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_psr_protocol"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_psr_protocol_version"
            columns: ["protocol_version_id"]
            isOneToOne: false
            referencedRelation: "protocol_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_standard_records_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: true
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_standard_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_standard_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_standard_records_protocol_version_id_fkey"
            columns: ["protocol_version_id"]
            isOneToOne: false
            referencedRelation: "protocol_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_versions: {
        Row: {
          change_summary: string
          clinic_id: string
          created_at: string
          created_by_user_id: string
          id: string
          protocol_id: string
          snapshot: Json
          version_label: string
        }
        Insert: {
          change_summary: string
          clinic_id: string
          created_at?: string
          created_by_user_id: string
          id?: string
          protocol_id: string
          snapshot: Json
          version_label: string
        }
        Update: {
          change_summary?: string
          clinic_id?: string
          created_at?: string
          created_by_user_id?: string
          id?: string
          protocol_id?: string
          snapshot?: Json
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_versions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_versions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          area: string | null
          checklist_template: Json | null
          clinic_id: string
          created_at: string
          created_by_user_id: string
          evidence_level: string | null
          evidence_notes: string | null
          evidence_refs: Json | null
          exclusion_criteria: Json | null
          id: string
          inclusion_criteria: Json | null
          indication_summary: string | null
          is_active: boolean
          protocol_type: Database["public"]["Enums"]["protocol_type"]
          required_exams: Json | null
          source_protocol_id: string | null
          source_protocol_version_id: string | null
          technique_summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          checklist_template?: Json | null
          clinic_id: string
          created_at?: string
          created_by_user_id: string
          evidence_level?: string | null
          evidence_notes?: string | null
          evidence_refs?: Json | null
          exclusion_criteria?: Json | null
          id?: string
          inclusion_criteria?: Json | null
          indication_summary?: string | null
          is_active?: boolean
          protocol_type?: Database["public"]["Enums"]["protocol_type"]
          required_exams?: Json | null
          source_protocol_id?: string | null
          source_protocol_version_id?: string | null
          technique_summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          checklist_template?: Json | null
          clinic_id?: string
          created_at?: string
          created_by_user_id?: string
          evidence_level?: string | null
          evidence_notes?: string | null
          evidence_refs?: Json | null
          exclusion_criteria?: Json | null
          id?: string
          inclusion_criteria?: Json | null
          indication_summary?: string | null
          is_active?: boolean
          protocol_type?: Database["public"]["Enums"]["protocol_type"]
          required_exams?: Json | null
          source_protocol_id?: string | null
          source_protocol_version_id?: string | null
          technique_summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocols_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocols_source_protocol_id_fkey"
            columns: ["source_protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocols_source_version_fk"
            columns: ["source_protocol_version_id"]
            isOneToOne: false
            referencedRelation: "protocol_versions"
            referencedColumns: ["id"]
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
      prp_protocol_core: {
        Row: {
          activation_method: string | null
          created_at: string
          hyaluronic_acid_type: string | null
          id: string
          imaging_guidance: string
          is_synthetic: boolean | null
          procedure_standard_record_id: string
          prp_activation: string
          prp_type: string
          prp_with_hyaluronic_acid: boolean
          recent_nsaid_use: string
          sessions_count: string
          sessions_interval: string
          volume_per_session_range: string
        }
        Insert: {
          activation_method?: string | null
          created_at?: string
          hyaluronic_acid_type?: string | null
          id?: string
          imaging_guidance: string
          is_synthetic?: boolean | null
          procedure_standard_record_id: string
          prp_activation: string
          prp_type: string
          prp_with_hyaluronic_acid?: boolean
          recent_nsaid_use: string
          sessions_count: string
          sessions_interval: string
          volume_per_session_range: string
        }
        Update: {
          activation_method?: string | null
          created_at?: string
          hyaluronic_acid_type?: string | null
          id?: string
          imaging_guidance?: string
          is_synthetic?: boolean | null
          procedure_standard_record_id?: string
          prp_activation?: string
          prp_type?: string
          prp_with_hyaluronic_acid?: boolean
          recent_nsaid_use?: string
          sessions_count?: string
          sessions_interval?: string
          volume_per_session_range?: string
        }
        Relationships: [
          {
            foreignKeyName: "prp_protocol_core_procedure_standard_record_id_fkey"
            columns: ["procedure_standard_record_id"]
            isOneToOne: true
            referencedRelation: "procedure_standard_records"
            referencedColumns: ["id"]
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
          export_format: string | null
          export_hash: string | null
          export_name: string
          export_version: string
          exported_at: string
          exported_by: string
          filters_json: Json
          id: string
          ip_address: string | null
          notes: string | null
          row_count: number
          status: string
          user_agent: string | null
          view_version: string
        }
        Insert: {
          created_at?: string
          export_format?: string | null
          export_hash?: string | null
          export_name?: string
          export_version?: string
          exported_at?: string
          exported_by: string
          filters_json?: Json
          id?: string
          ip_address?: string | null
          notes?: string | null
          row_count?: number
          status?: string
          user_agent?: string | null
          view_version?: string
        }
        Update: {
          created_at?: string
          export_format?: string | null
          export_hash?: string | null
          export_name?: string
          export_version?: string
          exported_at?: string
          exported_by?: string
          filters_json?: Json
          id?: string
          ip_address?: string | null
          notes?: string | null
          row_count?: number
          status?: string
          user_agent?: string | null
          view_version?: string
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
          therapy_item_code: string | null
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
          therapy_item_code?: string | null
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
          therapy_item_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_procedures_registry_case_id_fkey"
            columns: ["registry_case_id"]
            isOneToOne: false
            referencedRelation: "registry_cases"
            referencedColumns: ["registry_case_id"]
          },
          {
            foreignKeyName: "registry_procedures_therapy_item_code_fkey"
            columns: ["therapy_item_code"]
            isOneToOne: false
            referencedRelation: "therapy_items"
            referencedColumns: ["code"]
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
      registry_research_data_dictionary: {
        Row: {
          created_at: string
          definition: string
          field_name: string
          field_type: string
          id: string
          is_phi: boolean
          possible_values: string | null
          source_table: string | null
          transformation_rules: string | null
          view_name: string
          view_version: string
        }
        Insert: {
          created_at?: string
          definition: string
          field_name: string
          field_type: string
          id?: string
          is_phi?: boolean
          possible_values?: string | null
          source_table?: string | null
          transformation_rules?: string | null
          view_name: string
          view_version: string
        }
        Update: {
          created_at?: string
          definition?: string
          field_name?: string
          field_type?: string
          id?: string
          is_phi?: boolean
          possible_values?: string | null
          source_table?: string | null
          transformation_rules?: string | null
          view_name?: string
          view_version?: string
        }
        Relationships: []
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
      report_snapshots: {
        Row: {
          attendance_ref: string | null
          created_at: string
          evaluation_id: string | null
          generated_at: string
          generator_version: string
          id: string
          patient_id: string
          report_hash: string
          report_json: Json
          user_id: string
        }
        Insert: {
          attendance_ref?: string | null
          created_at?: string
          evaluation_id?: string | null
          generated_at?: string
          generator_version: string
          id?: string
          patient_id: string
          report_hash: string
          report_json: Json
          user_id: string
        }
        Update: {
          attendance_ref?: string | null
          created_at?: string
          evaluation_id?: string | null
          generated_at?: string
          generator_version?: string
          id?: string
          patient_id?: string
          report_hash?: string
          report_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_snapshots_attendance_ref_fkey"
            columns: ["attendance_ref"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      research_config: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      research_export_snapshots: {
        Row: {
          created_at: string
          created_by: string
          doi: string | null
          export_hash: string
          export_log_id: string | null
          filters_json: Json | null
          id: string
          is_published: boolean
          notes: string | null
          published_at: string | null
          row_count: number
          snapshot_code: string
          title: string | null
          view_name: string
          view_version: string
        }
        Insert: {
          created_at?: string
          created_by: string
          doi?: string | null
          export_hash: string
          export_log_id?: string | null
          filters_json?: Json | null
          id?: string
          is_published?: boolean
          notes?: string | null
          published_at?: string | null
          row_count: number
          snapshot_code: string
          title?: string | null
          view_name?: string
          view_version: string
        }
        Update: {
          created_at?: string
          created_by?: string
          doi?: string | null
          export_hash?: string
          export_log_id?: string | null
          filters_json?: Json | null
          id?: string
          is_published?: boolean
          notes?: string | null
          published_at?: string | null
          row_count?: number
          snapshot_code?: string
          title?: string | null
          view_name?: string
          view_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_export_snapshots_export_log_id_fkey"
            columns: ["export_log_id"]
            isOneToOne: false
            referencedRelation: "registry_exports_log"
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
      therapy_categories: {
        Row: {
          code: string
          created_at: string
          name: string
          requires_checklist: boolean
          requires_curadoria: boolean
          requires_score: boolean
          risk_class: string
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          requires_checklist?: boolean
          requires_curadoria?: boolean
          requires_score?: boolean
          risk_class: string
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          requires_checklist?: boolean
          requires_curadoria?: boolean
          requires_score?: boolean
          risk_class?: string
        }
        Relationships: []
      }
      therapy_items: {
        Row: {
          base_component_category_code: string | null
          category_code: string
          code: string
          created_at: string
          name: string
        }
        Insert: {
          base_component_category_code?: string | null
          category_code: string
          code: string
          created_at?: string
          name: string
        }
        Update: {
          base_component_category_code?: string | null
          category_code?: string
          code?: string
          created_at?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapy_items_base_component_fkey"
            columns: ["base_component_category_code"]
            isOneToOne: false
            referencedRelation: "therapy_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "therapy_items_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "therapy_categories"
            referencedColumns: ["code"]
          },
        ]
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
      edu_cohorts: {
        Row: {
          created_at: string | null
          id: string | null
          institution_id: string | null
          name: string | null
          program_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          name?: string | null
          program_id?: string | null
          status?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          name?: string | null
          program_id?: string | null
          status?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      edu_enrollments: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          id: string | null
          institution_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          status?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          status?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edu_institution_members: {
        Row: {
          created_at: string | null
          id: string | null
          institution_id: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          role?: never
          status?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          institution_id?: string | null
          role?: never
          status?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edu_institutions: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          status?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          status?: never
          updated_at?: string | null
        }
        Relationships: []
      }
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
      registry_research_export_v1: {
        Row: {
          age_range: string | null
          application_count: number | null
          baseline_pain_nrs: number | null
          case_created_at: string | null
          case_uid: string | null
          clinician_uid: string | null
          comorbidities: Json | null
          export_version: string | null
          image_guided: boolean | null
          pain_duration_range: string | null
          pathology_tag: string | null
          procedure_created_at: string | null
          procedure_date: string | null
          procedure_uid: string | null
          region_tag: string | null
          sex: string | null
          status: string | null
          technique_tag: string | null
          therapy_item_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registry_procedures_therapy_item_code_fkey"
            columns: ["therapy_item_code"]
            isOneToOne: false
            referencedRelation: "therapy_items"
            referencedColumns: ["code"]
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
      can_access_research_export: { Args: never; Returns: boolean }
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
      create_protocol_version_atomic: {
        Args: {
          p_change_summary: string
          p_clinic_id: string
          p_protocol_id: string
          p_snapshot: Json
          p_user_id: string
        }
        Returns: Record<string, unknown>
      }
      current_user_clinic_id: { Args: never; Returns: string }
      generate_case_uid: { Args: { p_case_id: string }; Returns: string }
      generate_clinician_uid: {
        Args: { p_clinician_id: string }
        Returns: string
      }
      generate_integrity_hash: { Args: { data: Json }; Returns: string }
      generate_procedure_uid: {
        Args: { p_procedure_id: string }
        Returns: string
      }
      generate_snapshot_code: { Args: never; Returns: string }
      get_conformity_metrics: {
        Args: {
          p_area?: string
          p_clinic_id: string
          p_end: string
          p_only_completed?: boolean
          p_protocol_type?: string
          p_start: string
        }
        Returns: Json
      }
      get_mentor_by_user_id: { Args: { _user_id: string }; Returns: string }
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
      is_approved_mentor: { Args: never; Returns: boolean }
      is_edu_admin: { Args: { _user_id: string }; Returns: boolean }
      is_healthcare_professional: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_mentor: { Args: { _user_id: string }; Returns: boolean }
      is_mentor_owner: { Args: { _mentor_id: string }; Returns: boolean }
      is_mentorship_owner: {
        Args: { _mentor_id: string; _user_id: string }
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
      mentor_has_taxonomies: { Args: { mentor_id: string }; Returns: boolean }
      mentor_has_valid_seal: { Args: { mentor_id: string }; Returns: boolean }
      normalize_evidence_tag: { Args: { tag: string }; Returns: string }
      pseudonymize_id: {
        Args: { original_id: string; salt?: string }
        Returns: string
      }
      user_owns_patient: { Args: { p_patient_id: string }; Returns: boolean }
    }
    Enums: {
      adverse_event_status: "NONE" | "REPORTED"
      app_role:
        | "admin"
        | "professional"
        | "viewer"
        | "patient"
        | "research"
        | "nurse_tech"
        | "secretary"
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
      function_scale_type:
        | "WOMAC"
        | "KOOS"
        | "ODI"
        | "NDI"
        | "DASH"
        | "VISA_A"
        | "OUTRA"
      governance_action:
        | "CREATE"
        | "UPDATE"
        | "VALIDATE"
        | "DUPLICATE"
        | "LOCK"
        | "UNLOCK"
        | "ACTIVATE"
        | "DEACTIVATE"
      mentor_status: "pending_review" | "approved" | "rejected" | "suspended"
      outcome_timepoint: "baseline" | "m1" | "m3" | "m6" | "m12"
      protocol_type: "REGEN_BASE" | "DERIVED" | "INSTITUTIONAL"
      safety_checklist_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
      scientific_badge_status: "NONE" | "DRAFT" | "VALIDATED"
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
      adverse_event_status: ["NONE", "REPORTED"],
      app_role: [
        "admin",
        "professional",
        "viewer",
        "patient",
        "research",
        "nurse_tech",
        "secretary",
      ],
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
      function_scale_type: [
        "WOMAC",
        "KOOS",
        "ODI",
        "NDI",
        "DASH",
        "VISA_A",
        "OUTRA",
      ],
      governance_action: [
        "CREATE",
        "UPDATE",
        "VALIDATE",
        "DUPLICATE",
        "LOCK",
        "UNLOCK",
        "ACTIVATE",
        "DEACTIVATE",
      ],
      mentor_status: ["pending_review", "approved", "rejected", "suspended"],
      outcome_timepoint: ["baseline", "m1", "m3", "m6", "m12"],
      protocol_type: ["REGEN_BASE", "DERIVED", "INSTITUTIONAL"],
      safety_checklist_status: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      scientific_badge_status: ["NONE", "DRAFT", "VALIDATED"],
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
