-- Add closed_by for audit trail
ALTER TABLE public.attendance_sessions 
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Add attendance_ref to report_snapshots for legal binding
ALTER TABLE public.report_snapshots 
ADD COLUMN IF NOT EXISTS attendance_ref UUID REFERENCES public.attendance_sessions(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_snapshots_attendance_ref 
ON public.report_snapshots(attendance_ref);

COMMENT ON COLUMN public.attendance_sessions.closed_by IS 'User who closed the attendance - audit trail';
COMMENT ON COLUMN public.report_snapshots.attendance_ref IS 'Links report to specific attendance session for legal compliance';