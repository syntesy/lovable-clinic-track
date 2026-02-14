
-- ============================================================
-- FIX: Adicionar search_path às funções para segurança
-- ============================================================

create or replace function create_protocol_version_atomic(
  p_protocol_id uuid,
  p_clinic_id uuid,
  p_change_summary text,
  p_snapshot jsonb,
  p_user_id uuid
)
returns record
language plpgsql
set search_path = public
as $$
declare
  v_last_label text;
  v_major int;
  v_minor int;
  v_new_label text;
  v_new_version record;
begin
  -- Lock da linha do protocolo para evitar concorrência
  perform 1 from protocols 
  where id = p_protocol_id 
  for update;

  -- Buscar última versão
  select version_label
  into v_last_label
  from protocol_versions
  where protocol_id = p_protocol_id
  order by created_at desc
  limit 1;

  -- Calcular nova versão (1.0 se primeira, senão incrementar patch)
  if v_last_label is null then
    v_new_label := '1.0';
  else
    v_major := (split_part(v_last_label, '.', 1))::int;
    v_minor := (split_part(v_last_label, '.', 2))::int + 1;
    v_new_label := v_major || '.' || v_minor;
  end if;

  -- Inserir nova versão
  insert into protocol_versions (
    clinic_id,
    protocol_id,
    version_label,
    change_summary,
    snapshot,
    created_by_user_id
  )
  values (
    p_clinic_id,
    p_protocol_id,
    v_new_label,
    p_change_summary,
    p_snapshot,
    p_user_id
  )
  returning 
    id, 
    clinic_id, 
    protocol_id, 
    version_label, 
    change_summary, 
    created_by_user_id, 
    created_at
  into v_new_version;

  return v_new_version;
end;
$$;
