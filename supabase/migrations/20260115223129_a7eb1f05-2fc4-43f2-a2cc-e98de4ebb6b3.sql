-- Add report audit trail fields to attendance_sessions
-- These track the last report generated for each attendance

ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS last_report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_report_record_id UUID,
ADD COLUMN IF NOT EXISTS last_report_type TEXT,
ADD COLUMN IF NOT EXISTS last_report_duration_ms INTEGER;

-- Add check constraint for report_type values
ALTER TABLE public.attendance_sessions
ADD CONSTRAINT chk_last_report_type 
CHECK (last_report_type IS NULL OR last_report_type IN ('preview', 'pdf'));

-- Index for querying attendances with reports (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_last_report
ON public.attendance_sessions (last_report_generated_at DESC)
WHERE last_report_generated_at IS NOT NULL;

COMMENT ON COLUMN public.attendance_sessions.last_report_generated_at IS 'Timestamp of the last report generation';
COMMENT ON COLUMN public.attendance_sessions.last_report_record_id IS 'Clinical record ID used for the last report';
COMMENT ON COLUMN public.attendance_sessions.last_report_type IS 'Type of last report: preview or pdf';
COMMENT ON COLUMN public.attendance_sessions.last_report_duration_ms IS 'Duration in ms to generate the last report';