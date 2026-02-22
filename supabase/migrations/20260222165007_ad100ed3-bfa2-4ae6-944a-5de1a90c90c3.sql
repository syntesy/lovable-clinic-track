
create table if not exists public.attendance_pathology (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null unique references public.attendance_sessions(id) on delete cascade,
  category_id uuid not null references public.pathology_categories(id) on delete restrict,
  pathology_id uuid null references public.pathologies(id) on delete restrict,
  custom_pathology_label text null,
  severity_model text not null default 'UNKNOWN'
    check (severity_model in ('CLINICAL_SIMPLE','SPECIFIC_SCALE','UNKNOWN')),
  severity_scale_id uuid null references public.pathology_severity_scales(id) on delete set null,
  severity_value text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (pathology_id is not null and custom_pathology_label is null)
    or
    (pathology_id is null
      and custom_pathology_label is not null
      and length(trim(custom_pathology_label)) > 1
      and length(trim(custom_pathology_label)) <= 120
    )
  )
);

create index if not exists idx_attendance_pathology_attendance on public.attendance_pathology(attendance_id);
create index if not exists idx_attendance_pathology_category on public.attendance_pathology(category_id);
create index if not exists idx_attendance_pathology_pathology on public.attendance_pathology(pathology_id);

drop trigger if exists trg_upd_attendance_pathology on public.attendance_pathology;
create trigger trg_upd_attendance_pathology
before update on public.attendance_pathology
for each row execute function public.set_updated_at();

-- INTEGRIDADE 1: category_id compatível com pathology_id
create or replace function public.validate_attendance_pathology_category()
returns trigger language plpgsql security definer set search_path = 'public' as $$
declare
  p_cat uuid;
begin
  if new.pathology_id is not null then
    select category_id into p_cat from public.pathologies where id = new.pathology_id;
    if p_cat is null then
      raise exception 'Pathology not found: %', new.pathology_id;
    end if;
    if new.category_id <> p_cat then
      raise exception
        'Category mismatch: attendance_pathology.category_id (%) != pathologies.category_id (%)',
        new.category_id, p_cat;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_validate_att_path_category on public.attendance_pathology;
create trigger trg_validate_att_path_category
before insert or update on public.attendance_pathology
for each row execute function public.validate_attendance_pathology_category();

-- INTEGRIDADE 2: severidade coerente + escala compatível + value válido
create or replace function public.validate_attendance_pathology_severity()
returns trigger language plpgsql security definer set search_path = 'public' as $$
declare
  sc_category uuid;
  sc_pathology uuid;
  sc_active boolean;
  opt_match boolean;
begin
  if new.severity_model = 'UNKNOWN' then
    new.severity_scale_id := null;
    new.severity_value := null;
    return new;
  end if;

  if new.severity_model = 'CLINICAL_SIMPLE' then
    if new.severity_value is null or length(trim(new.severity_value)) = 0 then
      raise exception 'severity_value is required for CLINICAL_SIMPLE';
    end if;
    new.severity_value := upper(trim(new.severity_value));
    if new.severity_value not in ('MILD','MODERATE','SEVERE') then
      raise exception
        'Invalid severity_value for CLINICAL_SIMPLE: % (expected MILD/MODERATE/SEVERE)',
        new.severity_value;
    end if;
    new.severity_scale_id := null;
    return new;
  end if;

  if new.severity_model = 'SPECIFIC_SCALE' then
    if new.severity_scale_id is null then
      raise exception 'severity_scale_id is required for SPECIFIC_SCALE';
    end if;
    if new.severity_value is null or length(trim(new.severity_value)) = 0 then
      raise exception 'severity_value is required for SPECIFIC_SCALE';
    end if;
    new.severity_value := upper(trim(new.severity_value));

    select category_id, pathology_id, is_active
      into sc_category, sc_pathology, sc_active
    from public.pathology_severity_scales
    where id = new.severity_scale_id;

    if sc_category is null and sc_pathology is null then
      raise exception 'severity_scale not found: %', new.severity_scale_id;
    end if;
    if sc_active is distinct from true then
      raise exception 'severity_scale is inactive: %', new.severity_scale_id;
    end if;
    if not (
      (sc_category is not null and sc_category = new.category_id)
      or
      (sc_pathology is not null and sc_pathology = new.pathology_id)
    ) then
      raise exception 'severity_scale scope mismatch (scale does not belong to selected category/pathology)';
    end if;

    select exists (
      select 1
      from public.pathology_severity_scales s,
           jsonb_array_elements(s.options) as opt
      where s.id = new.severity_scale_id
        and upper(opt->>'value') = new.severity_value
    ) into opt_match;

    if not opt_match then
      raise exception 'severity_value (%) not found in scale options for scale_id %',
        new.severity_value, new.severity_scale_id;
    end if;
    return new;
  end if;

  raise exception 'Invalid severity_model: %', new.severity_model;
end $$;

drop trigger if exists trg_validate_att_path_severity on public.attendance_pathology;
create trigger trg_validate_att_path_severity
before insert or update on public.attendance_pathology
for each row execute function public.validate_attendance_pathology_severity();

-- RLS
alter table public.attendance_pathology enable row level security;

drop policy if exists select_attendance_pathology_by_owner on public.attendance_pathology;
create policy select_attendance_pathology_by_owner
on public.attendance_pathology for select
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_pathology.attendance_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists insert_attendance_pathology_by_owner on public.attendance_pathology;
create policy insert_attendance_pathology_by_owner
on public.attendance_pathology for insert
with check (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_pathology.attendance_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists update_attendance_pathology_by_owner on public.attendance_pathology;
create policy update_attendance_pathology_by_owner
on public.attendance_pathology for update
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_pathology.attendance_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_pathology.attendance_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists delete_attendance_pathology_by_owner on public.attendance_pathology;
create policy delete_attendance_pathology_by_owner
on public.attendance_pathology for delete
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_pathology.attendance_id
      and s.user_id = auth.uid()
  )
);
