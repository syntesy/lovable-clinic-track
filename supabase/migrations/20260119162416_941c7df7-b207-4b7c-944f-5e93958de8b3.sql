-- Add cluster_key and protocol_signature columns for aggregated analysis
ALTER TABLE public.procedure_standard_records
ADD COLUMN IF NOT EXISTS cluster_key text,
ADD COLUMN IF NOT EXISTS protocol_signature text;

-- Create index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_procedure_standard_records_cluster_key 
ON public.procedure_standard_records (cluster_key) 
WHERE is_comparable = true AND clinical_standard_status IN ('eligible', 'eligible_with_penalty');

CREATE INDEX IF NOT EXISTS idx_procedure_standard_records_comparable 
ON public.procedure_standard_records (is_comparable, clinical_standard_status);