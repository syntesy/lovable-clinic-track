-- Add status column to clinical_records for multi-record support
-- Status: draft = editable, final = read-only

-- Add status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.clinical_records 
        ADD COLUMN status text NOT NULL DEFAULT 'draft';
    END IF;
END $$;

-- Create index for efficient history queries (if not exists)
CREATE INDEX IF NOT EXISTS clinical_records_patient_created_idx
ON public.clinical_records (patient_id, created_at DESC);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for clinical_records
DROP TRIGGER IF EXISTS trg_clinical_records_updated_at ON public.clinical_records;
CREATE TRIGGER trg_clinical_records_updated_at
BEFORE UPDATE ON public.clinical_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update RLS policies for clinical_records
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view own clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can insert own clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can update own clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "clinical_records_select_own" ON public.clinical_records;
DROP POLICY IF EXISTS "clinical_records_insert_own" ON public.clinical_records;
DROP POLICY IF EXISTS "clinical_records_update_own" ON public.clinical_records;
DROP POLICY IF EXISTS "clinical_records_delete_draft" ON public.clinical_records;

-- Enable RLS
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user owns the patient (using professional_id)
CREATE OR REPLACE FUNCTION public.user_owns_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = p_patient_id 
    AND professional_id = auth.uid()
  )
$$;

-- SELECT: users can view records for their patients
CREATE POLICY "clinical_records_select_own"
ON public.clinical_records FOR SELECT
USING (public.user_owns_patient(patient_id));

-- INSERT: users can insert records for their patients
CREATE POLICY "clinical_records_insert_own"
ON public.clinical_records FOR INSERT
WITH CHECK (public.user_owns_patient(patient_id));

-- UPDATE: users can update records for their patients
CREATE POLICY "clinical_records_update_own"
ON public.clinical_records FOR UPDATE
USING (public.user_owns_patient(patient_id))
WITH CHECK (public.user_owns_patient(patient_id));

-- DELETE: users can delete only draft records for their patients
CREATE POLICY "clinical_records_delete_draft"
ON public.clinical_records FOR DELETE
USING (public.user_owns_patient(patient_id) AND status = 'draft');