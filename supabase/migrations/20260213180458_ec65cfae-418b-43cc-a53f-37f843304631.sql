
-- =====================================================================
-- ETAPA 1 — Governance & Protocol Management Schema
-- =====================================================================

-- 0) Clinics table (multi-tenant base)
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clinic"
  ON public.clinics FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create clinics"
  ON public.clinics FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their clinic"
  ON public.clinics FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid());

-- 1) Enums
CREATE TYPE public.protocol_type AS ENUM ('REGEN_BASE', 'DERIVED', 'INSTITUTIONAL');
CREATE TYPE public.safety_checklist_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE public.adverse_event_status AS ENUM ('NONE', 'REPORTED');
CREATE TYPE public.scientific_badge_status AS ENUM ('NONE', 'DRAFT', 'VALIDATED');
CREATE TYPE public.governance_action AS ENUM (
  'CREATE', 'UPDATE', 'VALIDATE', 'DUPLICATE',
  'LOCK', 'UNLOCK', 'ACTIVATE', 'DEACTIVATE'
);

-- 2) Protocols table
CREATE TABLE public.protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  title TEXT NOT NULL,
  area TEXT,
  indication_summary TEXT,
  evidence_level TEXT,
  evidence_notes TEXT,
  evidence_refs JSONB DEFAULT '[]',
  inclusion_criteria JSONB DEFAULT '[]',
  exclusion_criteria JSONB DEFAULT '[]',
  required_exams JSONB DEFAULT '[]',
  technique_summary TEXT,
  checklist_template JSONB DEFAULT '[]',
  protocol_type public.protocol_type NOT NULL DEFAULT 'INSTITUTIONAL',
  source_protocol_id UUID REFERENCES public.protocols(id),
  source_protocol_version_id UUID, -- FK added after protocol_versions created
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_protocols_updated_at
  BEFORE UPDATE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Protocol Versions table
CREATE TABLE public.protocol_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, version_label)
);
ALTER TABLE public.protocol_versions ENABLE ROW LEVEL SECURITY;

-- Now add FK from protocols.source_protocol_version_id
ALTER TABLE public.protocols
  ADD CONSTRAINT protocols_source_version_fk
  FOREIGN KEY (source_protocol_version_id) REFERENCES public.protocol_versions(id);

-- 4) ALTER procedure_standard_records — add governance columns
ALTER TABLE public.procedure_standard_records
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id),
  ADD COLUMN IF NOT EXISTS protocol_id UUID REFERENCES public.protocols(id),
  ADD COLUMN IF NOT EXISTS protocol_version_id UUID REFERENCES public.protocol_versions(id),
  ADD COLUMN IF NOT EXISTS safety_checklist JSONB,
  ADD COLUMN IF NOT EXISTS safety_checklist_status public.safety_checklist_status NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS material_traceability JSONB,
  ADD COLUMN IF NOT EXISTS adverse_event_status public.adverse_event_status NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS adverse_event_record JSONB,
  ADD COLUMN IF NOT EXISTS scientific_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scientific_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scientific_validated_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS scientific_badge_status public.scientific_badge_status NOT NULL DEFAULT 'NONE';

-- 5) Governance Audit Logs (separate from existing audit_logs)
CREATE TABLE public.governance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action public.governance_action NOT NULL,
  changed_fields JSONB,
  previous_snapshot JSONB,
  new_snapshot JSONB,
  justification TEXT,
  performed_by_user_id UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.governance_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6) Indexes
CREATE INDEX idx_protocols_clinic_type_active
  ON public.protocols (clinic_id, protocol_type, is_active);

CREATE INDEX idx_protocol_versions_protocol_created
  ON public.protocol_versions (protocol_id, created_at DESC);

CREATE INDEX idx_procedures_governance
  ON public.procedure_standard_records (clinic_id, protocol_id, scientific_badge_status, created_at DESC);

CREATE INDEX idx_governance_audit_entity
  ON public.governance_audit_logs (clinic_id, entity_type, entity_id, performed_at DESC);

-- 7) Add missing RBAC roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse_tech';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretary';

-- 8) RLS Policies for protocols
CREATE POLICY "Users can view protocols of their clinic"
  ON public.protocols FOR SELECT TO authenticated
  USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Professionals can create protocols"
  ON public.protocols FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Protocol owners can update"
  ON public.protocols FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 9) RLS Policies for protocol_versions
CREATE POLICY "Users can view versions of their clinic protocols"
  ON public.protocol_versions FOR SELECT TO authenticated
  USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Professionals can create versions"
  ON public.protocol_versions FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())
  );

-- 10) RLS Policies for governance_audit_logs
CREATE POLICY "Admins and clinic owners can view governance logs"
  ON public.governance_audit_logs FOR SELECT TO authenticated
  USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert governance logs"
  ON public.governance_audit_logs FOR INSERT TO authenticated
  WITH CHECK (performed_by_user_id = auth.uid());

-- 11) Auto-create version 1.0 on protocol insert
CREATE OR REPLACE FUNCTION public.auto_create_protocol_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.protocol_versions (
    clinic_id, protocol_id, version_label, change_summary, snapshot, created_by_user_id
  ) VALUES (
    NEW.clinic_id, NEW.id, '1.0', 'Versão inicial',
    jsonb_build_object(
      'title', NEW.title,
      'area', NEW.area,
      'indication_summary', NEW.indication_summary,
      'evidence_level', NEW.evidence_level,
      'evidence_notes', NEW.evidence_notes,
      'evidence_refs', NEW.evidence_refs,
      'inclusion_criteria', NEW.inclusion_criteria,
      'exclusion_criteria', NEW.exclusion_criteria,
      'required_exams', NEW.required_exams,
      'technique_summary', NEW.technique_summary,
      'checklist_template', NEW.checklist_template,
      'protocol_type', NEW.protocol_type::text
    ),
    NEW.created_by_user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protocol_auto_v1
  AFTER INSERT ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_protocol_v1();
