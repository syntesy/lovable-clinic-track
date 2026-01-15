-- =============================================================================
-- TASK 1 & 8: Create attendance_sessions and attendance_files tables (UX-only)
-- =============================================================================

-- Table: attendance_sessions
-- Virtual container for clinical flow - UX metadata only, no core changes
CREATE TABLE public.attendance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  involves_orthobiologics BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  user_id UUID NOT NULL
);

-- Index for fast patient lookups
CREATE INDEX idx_attendance_sessions_patient_id ON public.attendance_sessions(patient_id);
CREATE INDEX idx_attendance_sessions_created_at ON public.attendance_sessions(created_at DESC);
CREATE INDEX idx_attendance_sessions_user_id ON public.attendance_sessions(user_id);

-- Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT and INSERT only (NO UPDATE/DELETE)
CREATE POLICY "Users can view their own attendance sessions"
  ON public.attendance_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create attendance sessions"
  ON public.attendance_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Table: attendance_files
-- Documents and images attached to an attendance session
-- =============================================================================

CREATE TABLE public.attendance_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_ref UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('exam', 'report', 'image', 'photo', 'other')),
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX idx_attendance_files_attendance_ref ON public.attendance_files(attendance_ref);
CREATE INDEX idx_attendance_files_patient_id ON public.attendance_files(patient_id);
CREATE INDEX idx_attendance_files_user_id ON public.attendance_files(user_id);

-- Enable RLS
ALTER TABLE public.attendance_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT, INSERT, DELETE (NO UPDATE)
CREATE POLICY "Users can view their own attendance files"
  ON public.attendance_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload attendance files"
  ON public.attendance_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance files"
  ON public.attendance_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Storage bucket for attendance files
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-files',
  'attendance-files',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS policies
CREATE POLICY "Users can view their attendance files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'attendance-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload attendance files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'attendance-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their attendance files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'attendance-files' AND auth.uid()::text = (storage.foldername(name))[1]);