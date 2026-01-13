-- =====================================================
-- REGHEN DATABASE SCHEMA - BASELINE EXPORT
-- Generated: 2025-01-13
-- Environment: Production (Lovable Cloud / Supabase)
-- Project ID: oedlipwpqkvhreqipoji
-- =====================================================

-- =====================================================
-- ENUMS (Custom Types)
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'professional', 'research');

CREATE TYPE public.curadoria_status AS ENUM ('sem_curadoria', 'solicitada', 'em_curadoria', 'curada', 'rejeitada');

CREATE TYPE public.curation_status AS ENUM ('rascunho', 'em_revisao', 'disponivel', 'arquivado');

CREATE TYPE public.evidence_level AS ENUM ('1a', '1b', '2a', '2b', '3a', '3b', '4', '5');

CREATE TYPE public.bias_risk AS ENUM ('baixo', 'moderado', 'alto', 'critico');

CREATE TYPE public.applicability AS ENUM ('alta', 'moderada', 'baixa', 'nao_aplicavel');

CREATE TYPE public.design_type AS ENUM ('rct', 'cohort', 'case_control', 'case_series', 'review', 'meta_analysis', 'other');


-- =====================================================
-- TABLES
-- =====================================================

-- Table: registry_score_snapshots
CREATE TABLE public.registry_score_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    score_value numeric,
    reasoning_json jsonb DEFAULT '{}'::jsonb,
    recommendations_json jsonb DEFAULT '[]'::jsonb,
    score_version text NOT NULL DEFAULT 'v1.0'::text,
    score_context text NOT NULL DEFAULT 'triage_only'::text,
    score_classification text
);

-- Table: user_sessions
CREATE TABLE public.user_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    device_info jsonb,
    last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    session_token text NOT NULL,
    ip_address text,
    user_agent text
);

-- Table: curation_versions
CREATE TABLE public.curation_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curation_id uuid NOT NULL,
    version_number integer NOT NULL,
    status curation_status NOT NULL,
    data jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    change_reason text
);

-- Table: edu_enrollments (VIEW)
-- Note: This appears to be a view rather than a table
CREATE TABLE public.edu_enrollments (
    id uuid,
    institution_id uuid,
    cohort_id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    status text
);

-- Table: app_events
CREATE TABLE public.app_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    event_data jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    event_name text NOT NULL
);

-- Table: patient_events
CREATE TABLE public.patient_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    event_name text NOT NULL
);

-- Table: registry_procedure_plans
CREATE TABLE public.registry_procedure_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    planned_date date,
    guidance boolean,
    sessions_planned integer,
    procedure_type text,
    target text,
    notes text
);

-- Table: registry_aggregated_metrics
CREATE TABLE public.registry_aggregated_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start date NOT NULL,
    period_end date NOT NULL,
    metric_data jsonb NOT NULL,
    sample_size integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    metric_type text NOT NULL,
    aggregation_level text NOT NULL DEFAULT 'monthly'::text
);

-- Table: registry_snapshots
CREATE TABLE public.registry_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    snapshot_version integer NOT NULL DEFAULT 1,
    snapshot_data jsonb NOT NULL,
    source_record_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_eligible boolean NOT NULL DEFAULT false,
    snapshot_type text NOT NULL,
    source_table text
);

-- Table: therapy_items
CREATE TABLE public.therapy_items (
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    code text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    category_code text NOT NULL,
    base_component_category_code text
);

-- Table: therapy_categories
CREATE TABLE public.therapy_categories (
    requires_score boolean NOT NULL DEFAULT false,
    requires_checklist boolean NOT NULL DEFAULT false,
    requires_curadoria boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    code text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    risk_class text NOT NULL
);

-- Table: curations
CREATE TABLE public.curations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid NOT NULL,
    version integer NOT NULL DEFAULT 1,
    status curation_status NOT NULL DEFAULT 'rascunho'::curation_status,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    evidence_level evidence_level,
    bias_risk bias_risk,
    applicability applicability,
    citations jsonb DEFAULT '[]'::jsonb,
    design_type design_type,
    approval_declaration boolean DEFAULT false,
    objective text,
    design text,
    population text,
    sample_size text,
    intervention text,
    comparator text,
    outcomes_primary text,
    outcomes_secondary text,
    results_key text,
    adverse_events text,
    limitations text,
    authors_conclusion text,
    clinical_takeaways text[],
    what_changes_in_practice text,
    practice_impact text,
    rejection_reason text,
    generated_by text DEFAULT 'ai'::text,
    ai_notes text,
    ai_coverage text,
    therapy_item_code text,
    category_code text
);

-- Table: registry_procedures
CREATE TABLE public.registry_procedures (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL,
    procedure_date date NOT NULL,
    image_guided boolean DEFAULT false,
    application_count integer DEFAULT 1,
    immediate_adverse_event boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    procedure_type text NOT NULL,
    anatomical_site_detail text,
    adverse_event_type text,
    therapy_item_code text
);

-- Table: diligence_risk_disclosures
CREATE TABLE public.diligence_risk_disclosures (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    case_id uuid NOT NULL,
    disclosed_at timestamp with time zone NOT NULL,
    patient_acknowledged boolean,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    immutable boolean NOT NULL DEFAULT true,
    risk_category text NOT NULL,
    risk_description text NOT NULL,
    disclosure_method text
);

-- Table: registry_case_summary_v1_1 (VIEW)
CREATE TABLE public.registry_case_summary_v1_1 (
    screening_id uuid,
    patient_id uuid,
    clinician_id uuid,
    screening_created_at timestamp with time zone,
    baseline_pain_nrs numeric,
    baseline_function_score numeric,
    followups_completed bigint,
    followups_total bigint,
    followup_completion_rate numeric,
    has_d30 boolean,
    d30_pain integer,
    d30_function integer,
    has_d90 boolean,
    d90_pain integer,
    d90_function integer,
    has_d180 boolean,
    d180_pain integer,
    d180_function integer,
    d180_function_dummy integer,
    has_d365 boolean,
    d365_pain integer,
    d365_function integer,
    adverse_event_any boolean,
    missed_count bigint,
    d30_global_change text,
    d90_global_change text,
    procedure_type text,
    tissue_type text,
    diagnosis text,
    responder_status text,
    responder_reason_code text,
    classification text
);

-- Table: edu_institution_members (VIEW)
CREATE TABLE public.edu_institution_members (
    id uuid,
    institution_id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    role text,
    status text
);

-- Table: career_consistency_index
CREATE TABLE public.career_consistency_index (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    protocol_variance numeric DEFAULT 0,
    technique_diversity numeric DEFAULT 0,
    consistency_score numeric DEFAULT 0,
    value numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    metric_type text NOT NULL DEFAULT 'consistency_index'::text
);

-- Table: prp_lab_results
CREATE TABLE public.prp_lab_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    screening_id uuid NOT NULL,
    lab_values jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    attached_files jsonb DEFAULT '[]'::jsonb,
    raw_text text,
    interpretation text,
    updated_classification text,
    extracted_text text
);

-- Table: edu_cohorts (VIEW)
CREATE TABLE public.edu_cohorts (
    id uuid,
    institution_id uuid,
    program_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name text,
    status text
);

-- Table: career_case_complexity
CREATE TABLE public.career_case_complexity (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    total_cases integer DEFAULT 0,
    unique_diagnoses integer DEFAULT 0,
    red_flags_count integer DEFAULT 0,
    complexity_score numeric DEFAULT 0,
    value numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    metric_type text NOT NULL DEFAULT 'case_complexity'::text
);

-- Table: prp_screenings
CREATE TABLE public.prp_screenings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    clinician_id uuid NOT NULL,
    screening_data jsonb,
    result_classification text,
    result_summary text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    status text DEFAULT 'pending'::text,
    tissue_type text,
    diagnosis text,
    region_treated text,
    baseline_pain_nrs integer,
    baseline_function_score integer
);

-- Table: evidence_dimensions
CREATE TABLE public.evidence_dimensions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tags_json jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    dimension_label text NOT NULL
);

-- Table: patients
CREATE TABLE public.patients (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id uuid NOT NULL,
    birth_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    full_name text NOT NULL,
    gender text,
    phone text,
    email text,
    profession text,
    sport_activity text,
    clinical_diagnosis text,
    imaging_diagnosis text,
    treated_region text,
    symptoms_duration text,
    previous_treatments text,
    specific_limitations text,
    initial_images_description text,
    status text DEFAULT 'active'::text,
    final_outcome text,
    skin_phototype text,
    address text,
    photo_url text,
    cpf text
);

-- Table: audit_logs
CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    additional_info jsonb,
    user_email text,
    action text NOT NULL,
    table_name text,
    ip_address text,
    user_agent text,
    session_id text
);

-- Table: registry_consents
CREATE TABLE public.registry_consents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    consent_given boolean NOT NULL DEFAULT false,
    consent_date timestamp with time zone,
    lgpd_accepted boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    consent_version text NOT NULL DEFAULT 'v1.0'::text
);

-- Table: patient_documents
CREATE TABLE public.patient_documents (
    patient_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    document_type text NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL
);

-- Table: registry_access_logs
CREATE TABLE public.registry_access_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    access_details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    access_type text NOT NULL,
    ip_address text,
    user_agent text
);

-- Table: patient_portal_access
CREATE TABLE public.patient_portal_access (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    login_surname text NOT NULL,
    cpf_hash text NOT NULL
);

-- Table: partner_events
CREATE TABLE public.partner_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    patient_id uuid,
    partner_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    event_type text NOT NULL
);

-- Table: subscriptions
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    next_renewal_date timestamp with time zone,
    scheduled_effective_date timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    current_plan text NOT NULL DEFAULT 'basic'::text,
    status text NOT NULL DEFAULT 'active'::text,
    scheduled_plan_change text
);

-- Table: registry_consent_audit
CREATE TABLE public.registry_consent_audit (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL,
    accepted_at timestamp with time zone,
    withdrawn_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    consent_version text NOT NULL DEFAULT 'v1.0'::text,
    text_hash text NOT NULL
);

-- Table: patient_consents
CREATE TABLE public.patient_consents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    accepted boolean NOT NULL DEFAULT false,
    accepted_at timestamp with time zone,
    witness_user_id uuid,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    consent_type text NOT NULL,
    consent_text text NOT NULL,
    ip_address text,
    user_agent text,
    revocation_reason text
);

-- Table: registry_labs
CREATE TABLE public.registry_labs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL,
    collected_at date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    hemoglobin numeric,
    hematocrit numeric,
    platelets numeric,
    leukocytes numeric,
    neutrophils numeric,
    lymphocytes numeric,
    ferritin numeric,
    vitamin_d numeric,
    pcr numeric,
    glucose numeric,
    hba1c numeric
);

-- Table: registry_engine_snapshots
CREATE TABLE public.registry_engine_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL,
    engine_outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
    engine_computed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    final_state text,
    canonical_hash text
);

-- Table: career_narratives
CREATE TABLE public.career_narratives (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    value numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    metric_type text NOT NULL DEFAULT 'narrative'::text,
    narrative_type text NOT NULL,
    title text NOT NULL,
    content text
);

-- Table: evidence_audit_log
CREATE TABLE public.evidence_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    event_type text NOT NULL
);

-- Table: registry_consent_logs
CREATE TABLE public.registry_consent_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone NOT NULL DEFAULT now(),
    previous_status text,
    new_status text NOT NULL
);

-- Table: registry_lab_orders
CREATE TABLE public.registry_lab_orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    requested_tests_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    order_version text NOT NULL DEFAULT 'v1.0'::text
);

-- Table: patient_procedures
CREATE TABLE public.patient_procedures (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    procedure_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    procedure_type text NOT NULL,
    procedure_name text NOT NULL,
    notes text
);

-- Table: curadoria_articles
CREATE TABLE public.curadoria_articles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year integer NOT NULL,
    status curadoria_status NOT NULL DEFAULT 'sem_curadoria'::curadoria_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    authors text NOT NULL,
    journal text NOT NULL,
    interest text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    doi text,
    pubmed_url text,
    pdf_url text,
    practice_change text,
    pdf_path text,
    abstract text
);

-- Table: registry_cases
CREATE TABLE public.registry_cases (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    screening_id uuid,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    consented_at timestamp with time zone,
    withdrawn_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    site_id text DEFAULT 'default_site'::text,
    status text NOT NULL DEFAULT 'included'::text
);

-- Table: patient_prescriptions
CREATE TABLE public.patient_prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    is_visible_to_patient boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    prescription_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    notes text
);

-- Table: diligence_case_timelines
CREATE TABLE public.diligence_case_timelines (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    case_id uuid NOT NULL,
    event_data jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    immutable boolean NOT NULL DEFAULT true,
    event_type text NOT NULL,
    event_description text NOT NULL
);

-- Table: research_config
CREATE TABLE public.research_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    key text NOT NULL UNIQUE,
    value text NOT NULL,
    description text
);

-- Table: ultrasound_images
CREATE TABLE public.ultrasound_images (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    exam_date date NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_path text NOT NULL,
    image_type text NOT NULL,
    observations text
);

-- Table: evidence_snapshots
CREATE TABLE public.evidence_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dimension_id uuid NOT NULL,
    n_cases_total integer NOT NULL,
    n_with_followup_30 integer NOT NULL DEFAULT 0,
    n_with_followup_90 integer NOT NULL DEFAULT 0,
    n_with_followup_180 integer NOT NULL DEFAULT 0,
    n_with_followup_365 integer NOT NULL DEFAULT 0,
    pain_baseline_mean numeric DEFAULT NULL::numeric,
    pain_baseline_median numeric DEFAULT NULL::numeric,
    pain_followup_90_mean numeric DEFAULT NULL::numeric,
    pain_followup_90_median numeric DEFAULT NULL::numeric,
    pct_improved_90 numeric DEFAULT NULL::numeric,
    computed_at timestamp with time zone NOT NULL DEFAULT now(),
    version integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    time_window text NOT NULL,
    canonical_hash text NOT NULL
);

-- Table: registry_research_data_dictionary
CREATE TABLE public.registry_research_data_dictionary (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    is_phi boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    view_name text NOT NULL,
    view_version text NOT NULL,
    field_name text NOT NULL,
    field_type text NOT NULL,
    definition text NOT NULL,
    possible_values text,
    source_table text,
    transformation_rules text
);

-- Table: registry_lab_results
CREATE TABLE public.registry_lab_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    collected_date date,
    labs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    source text NOT NULL DEFAULT 'manual'::text
);

-- Table: consent_forms
CREATE TABLE public.consent_forms (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_path text NOT NULL
);

-- Table: registry_triage_snapshots
CREATE TABLE public.registry_triage_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    red_flags_present boolean NOT NULL DEFAULT false,
    red_flags_list jsonb DEFAULT '[]'::jsonb,
    medications_flags_json jsonb DEFAULT '{}'::jsonb,
    biological_soil_flags_json jsonb DEFAULT '{}'::jsonb,
    nutrition_flags_json jsonb DEFAULT '{}'::jsonb,
    lifestyle_flags_json jsonb DEFAULT '{}'::jsonb,
    triage_version text NOT NULL DEFAULT 'v1.0'::text
);

-- Table: partners
CREATE TABLE public.partners (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    logo_url text,
    product_type text NOT NULL,
    website_url text NOT NULL,
    coupon_code text DEFAULT 'REGENAPP'::text,
    description text
);

-- Table: patient_discharges
CREATE TABLE public.patient_discharges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    discharge_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    discharge_notes text
);

-- Table: registry_exports_log
CREATE TABLE public.registry_exports_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exported_by uuid NOT NULL,
    exported_at timestamp with time zone NOT NULL DEFAULT now(),
    filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    row_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    export_version text NOT NULL DEFAULT 'registry_export_v1_1'::text,
    export_format text DEFAULT 'csv'::text,
    user_agent text,
    ip_address text,
    status text NOT NULL DEFAULT 'success'::text,
    notes text,
    export_name text NOT NULL DEFAULT 'registry_research_export_v1'::text,
    export_hash text,
    view_version text NOT NULL DEFAULT 'v1'::text
);

-- Table: research_export_snapshots
CREATE TABLE public.research_export_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    export_log_id uuid,
    filters_json jsonb,
    row_count integer NOT NULL,
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamp with time zone,
    snapshot_code text NOT NULL UNIQUE,
    export_hash text NOT NULL
);

-- Table: curation_registry_links
CREATE TABLE public.curation_registry_links (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    curation_id uuid NOT NULL,
    dimension_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    link_type text NOT NULL DEFAULT 'contextual'::text,
    notes text
);

-- Table: career_alerts
CREATE TABLE public.career_alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL DEFAULT 'info'::text,
    title text NOT NULL,
    message text NOT NULL
);

-- Table: career_certifications
CREATE TABLE public.career_certifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    earned_at timestamp with time zone NOT NULL DEFAULT now(),
    valid_until timestamp with time zone,
    criteria_met jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    certification_type text NOT NULL,
    certification_level text NOT NULL DEFAULT 'bronze'::text
);

-- Table: registry_followups
CREATE TABLE public.registry_followups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    pain_0_10 numeric,
    function_score numeric,
    patient_satisfaction_0_10 numeric,
    timepoint text NOT NULL DEFAULT 'baseline'::text,
    notes text
);

-- Table: registry_procedures_performed
CREATE TABLE public.registry_procedures_performed (
    session_number integer,
    volume_used numeric,
    product_details_json jsonb DEFAULT '{}'::jsonb,
    adverse_event boolean NOT NULL DEFAULT false,
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    episode_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    performed_date date NOT NULL DEFAULT CURRENT_DATE,
    guidance boolean,
    procedure_type text,
    target text,
    adverse_event_notes text,
    clinician_notes text
);

-- Table: registry_longitudinal_followups
CREATE TABLE public.registry_longitudinal_followups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid NOT NULL,
    timepoint integer NOT NULL,
    pain_score integer,
    perceived_improvement integer,
    return_to_activity boolean,
    new_intervention boolean DEFAULT false,
    late_adverse_event boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    adverse_event_type text
);

-- Table: registry_audit_events
CREATE TABLE public.registry_audit_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registry_case_id uuid,
    user_id uuid,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    event_type text NOT NULL
);

-- Table: career_metrics
CREATE TABLE public.career_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    value numeric NOT NULL DEFAULT 0,
    percentile numeric,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    metric_type text NOT NULL
);

-- Table: registry_research_export_v1 (VIEW)
CREATE TABLE public.registry_research_export_v1 (
    procedure_date date,
    baseline_pain_nrs integer,
    comorbidities jsonb,
    image_guided boolean,
    application_count integer,
    case_created_at timestamp with time zone,
    procedure_created_at timestamp with time zone,
    export_version text,
    case_uid text,
    procedure_uid text,
    clinician_uid text,
    pathology_tag text,
    technique_tag text,
    region_tag text,
    age_range text,
    sex text,
    pain_duration_range text,
    therapy_item_code text,
    status text
);

-- Table: procedure_followups
CREATE TABLE public.procedure_followups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    screening_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    clinician_id uuid NOT NULL,
    scheduled_for date NOT NULL,
    rescheduled_from date,
    completed_at timestamp with time zone,
    pain_score integer,
    function_score integer,
    adverse_event boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    patient_self_declaration boolean DEFAULT false,
    patient_self_declaration_at timestamp with time zone,
    timepoint text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    function_text text,
    global_change text,
    adverse_event_severity text,
    adverse_event_description text,
    notes text,
    treatment_adherence text,
    UNIQUE (screening_id, timepoint)
);

-- Table: user_profiles
CREATE TABLE public.user_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    full_name text,
    professional_registration text,
    specialty text,
    phone text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: ortobiologicos_protocols
CREATE TABLE public.ortobiologicos_protocols (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid,
    volume_collected numeric,
    volume_applied numeric,
    total_sessions integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    protocol_name text NOT NULL,
    therapy_type text NOT NULL,
    collection_method text,
    processing_method text,
    application_site text,
    injection_technique text,
    associated_therapies text,
    session_frequency text,
    clinical_observations text,
    contraindications text,
    pre_procedure_exams text
);

-- Table: treatment_sessions
CREATE TABLE public.treatment_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    session_date date NOT NULL,
    session_number integer NOT NULL,
    vas_on_day numeric,
    used_epi boolean DEFAULT false,
    used_neuromodulation boolean DEFAULT false,
    used_infiltration boolean DEFAULT false,
    used_therapeutic_exercise boolean DEFAULT false,
    used_stretching boolean DEFAULT false,
    used_other_techniques boolean DEFAULT false,
    improvement_percentage numeric,
    function_score numeric,
    mobility_score numeric,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    suspended boolean DEFAULT false,
    treatment_time numeric,
    hemoglobin numeric,
    hematocrit numeric,
    platelets numeric,
    leukocytes numeric,
    pcr numeric,
    glucose numeric,
    hba1c numeric,
    other_techniques_description text,
    session_description text,
    clinical_observations text,
    immediate_response text,
    next_session_plan text,
    light_type text,
    pharmaceutical_used text,
    associated_techniques text,
    exam_observations text,
    aptitude_status text,
    selected_protocols text[]
);

-- Table: curadoria_requests
CREATE TABLE public.curadoria_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status curadoria_status NOT NULL DEFAULT 'solicitada'::curadoria_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    interest text NOT NULL,
    purpose text,
    comment text
);

-- Table: clinical_record_versions
CREATE TABLE public.clinical_record_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinical_record_id uuid NOT NULL,
    version_number integer NOT NULL,
    data jsonb NOT NULL,
    changed_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    change_reason text,
    hash_integrity text NOT NULL
);

-- Table: chat_messages
CREATE TABLE public.chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    role text NOT NULL,
    content text NOT NULL
);

-- Table: clinical_records
CREATE TABLE public.clinical_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    legacy_migrated_at timestamp with time zone,
    anamnesis text,
    chief_complaint text,
    physical_exam text,
    clinical_diagnosis text
);

-- Table: user_roles
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'professional'::app_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Table: chat_conversations
CREATE TABLE public.chat_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    thread_id text NOT NULL,
    title text NOT NULL DEFAULT 'Nova Conversa'::text
);

-- Table: registry_episodes
CREATE TABLE public.registry_episodes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    clinician_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    baseline_pain_0_10 numeric,
    registry_eligible boolean NOT NULL DEFAULT false,
    safety_block boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'active'::text,
    region_primary text,
    suspected_diagnosis text,
    pain_duration text,
    planned_procedure_type text,
    registry_consent_status text NOT NULL DEFAULT 'not_asked'::text,
    registry_case_id text,
    registry_partner text DEFAULT 'Orthoregen'::text,
    notes_internal text
);

-- Table: blood_tests
CREATE TABLE public.blood_tests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    collection_date date NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_path text NOT NULL,
    test_type text NOT NULL,
    observations text
);

-- Table: diligence_checklists
CREATE TABLE public.diligence_checklists (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    case_id uuid,
    checklist_items jsonb NOT NULL,
    completed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    immutable boolean NOT NULL DEFAULT false,
    checklist_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text
);

-- Table: career_opportunities
CREATE TABLE public.career_opportunities (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    relevance_score numeric DEFAULT 0,
    is_viewed boolean DEFAULT false,
    is_interested boolean,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    period text NOT NULL,
    opportunity_type text NOT NULL,
    title text NOT NULL,
    description text
);

-- Table: diligence_compliance_logs
CREATE TABLE public.diligence_compliance_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    case_id uuid,
    action_details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    immutable boolean NOT NULL DEFAULT true,
    action text NOT NULL,
    ip_address text,
    user_agent text
);

-- Table: curadoria_content
CREATE TABLE public.curadoria_content (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid NOT NULL,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    summary text,
    objective text,
    methodology text,
    main_results text,
    clinical_applicability text,
    limitations text,
    evidence_level text
);

-- Table: curation_jobs
CREATE TABLE public.curation_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id uuid NOT NULL,
    curation_id uuid,
    progress integer NOT NULL DEFAULT 0,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'queued'::text,
    error_message text
);


-- =====================================================
-- INDEXES (Additional indexes may exist)
-- =====================================================

-- Indexes are managed by Supabase and include:
-- - Primary key indexes on all tables
-- - Unique constraint indexes
-- - Foreign key indexes (automatically created by Supabase)

-- Note: For complete index information, query pg_indexes system table


-- =====================================================
-- END OF SCHEMA
-- =====================================================
