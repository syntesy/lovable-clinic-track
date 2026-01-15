-- Add closed_at column to attendance_sessions
ALTER TABLE public.attendance_sessions
ADD COLUMN closed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.attendance_sessions.closed_at IS 'When set, the attendance is concluded and no more changes are allowed';