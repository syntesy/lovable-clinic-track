-- Add UPDATE policy for attendance_sessions table
-- Allows users to update their own attendance sessions

CREATE POLICY "Users can update their own attendance sessions"
ON public.attendance_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);