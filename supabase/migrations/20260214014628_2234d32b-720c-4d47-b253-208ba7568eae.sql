
-- ============================================================
-- ETAPA 3.2: HARDENING procedure_standard_records
-- ============================================================

-- 1) CORREÇÃO DE DADOS: clinic_id NULL → obter de attendance_id
-- Se há registros com clinic_id NULL, obter a clínica do attendance_sessions
UPDATE procedure_standard_records psr
SET clinic_id = (
  SELECT clinics.id
  FROM clinics
  WHERE clinics.owner_user_id = (
    SELECT user_id FROM attendance_sessions
    WHERE id = psr.attendance_id
  )
  LIMIT 1
)
WHERE psr.clinic_id IS NULL
  AND psr.attendance_id IS NOT NULL;

-- 2) TORNAR clinic_id NOT NULL (obrigatório)
ALTER TABLE procedure_standard_records
ALTER COLUMN clinic_id SET NOT NULL;

-- 3) CRIAR FOREIGN KEY PARA clinics (clinic_id)
ALTER TABLE procedure_standard_records
ADD CONSTRAINT fk_psr_clinic
FOREIGN KEY (clinic_id)
REFERENCES clinics(id)
ON DELETE RESTRICT;

-- 4) CRIAR FOREIGN KEYS FORMAIS DE PROTOCOLO (protocol_id, protocol_version_id)
-- FK para protocol_id
ALTER TABLE procedure_standard_records
ADD CONSTRAINT fk_psr_protocol
FOREIGN KEY (protocol_id)
REFERENCES protocols(id)
ON DELETE RESTRICT;

-- FK para protocol_version_id
ALTER TABLE procedure_standard_records
ADD CONSTRAINT fk_psr_protocol_version
FOREIGN KEY (protocol_version_id)
REFERENCES protocol_versions(id)
ON DELETE RESTRICT;

-- 5) CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_psr_clinic_id ON procedure_standard_records(clinic_id);
CREATE INDEX idx_psr_protocol_id ON procedure_standard_records(protocol_id);
CREATE INDEX idx_psr_attendance_id ON procedure_standard_records(attendance_id);

-- 6) REMOVER POLÍTICAS RLS ANTIGAS (permissivas)
-- Limpar policies antigas antes de criar novas
DROP POLICY IF EXISTS "auth" ON procedure_standard_records;
DROP POLICY IF EXISTS "authenticated_users_can_select" ON procedure_standard_records;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON procedure_standard_records;
DROP POLICY IF EXISTS "authenticated_users_can_update" ON procedure_standard_records;
DROP POLICY IF EXISTS "authenticated_users_can_delete" ON procedure_standard_records;

-- 7) CRIAR NOVAS POLÍTICAS RLS COM ISOLAMENTO MULTI-TENANT (clinic_id)
-- Policy: SELECT - isolamento por clinic_id
CREATE POLICY "clinic_isolation_select"
ON procedure_standard_records
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinics.id
    FROM clinics
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE clinics.id = procedure_standard_records.clinic_id
      AND ur.role IN ('admin', 'professional')
  )
);

-- Policy: INSERT - isolamento por clinic_id
CREATE POLICY "clinic_isolation_insert"
ON procedure_standard_records
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinics.id
    FROM clinics
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE clinics.id = procedure_standard_records.clinic_id
      AND ur.role IN ('admin', 'professional')
  )
);

-- Policy: UPDATE - isolamento por clinic_id
CREATE POLICY "clinic_isolation_update"
ON procedure_standard_records
FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinics.id
    FROM clinics
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE clinics.id = procedure_standard_records.clinic_id
      AND ur.role IN ('admin', 'professional')
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinics.id
    FROM clinics
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE clinics.id = procedure_standard_records.clinic_id
      AND ur.role IN ('admin', 'professional')
  )
);

-- Policy: DELETE - isolamento por clinic_id
CREATE POLICY "clinic_isolation_delete"
ON procedure_standard_records
FOR DELETE
USING (
  clinic_id IN (
    SELECT clinics.id
    FROM clinics
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE clinics.id = procedure_standard_records.clinic_id
      AND ur.role IN ('admin', 'professional')
  )
);
