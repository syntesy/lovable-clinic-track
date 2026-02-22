
-- 02A_pathology_catalog.sql
-- Catálogo: categorias, patologias, escalas (FK real) + seed

-- ======================
-- 1) TABELAS
-- ======================

create table if not exists public.pathology_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pathologies (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.pathology_categories(id) on delete restrict,
  code text not null unique,
  label text not null,
  anatomical_region text null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pathology_severity_scales (
  id uuid primary key default gen_random_uuid(),
  category_id uuid null references public.pathology_categories(id) on delete cascade,
  pathology_id uuid null references public.pathologies(id) on delete cascade,
  scale_code text not null,
  scale_label text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (category_id is not null and pathology_id is null)
    or
    (category_id is null and pathology_id is not null)
  ),
  check (jsonb_typeof(options) = 'array')
);

-- ======================
-- 2) ÍNDICES
-- ======================

create index if not exists idx_pathologies_category
  on public.pathologies(category_id);

create index if not exists idx_scales_category
  on public.pathology_severity_scales(category_id);

create index if not exists idx_scales_pathology
  on public.pathology_severity_scales(pathology_id);

create unique index if not exists uniq_scales_category_code
  on public.pathology_severity_scales(category_id, scale_code)
  where category_id is not null;

create unique index if not exists uniq_scales_pathology_code
  on public.pathology_severity_scales(pathology_id, scale_code)
  where pathology_id is not null;

create unique index if not exists uniq_default_scale_per_category
  on public.pathology_severity_scales(category_id)
  where category_id is not null and is_default = true;

create unique index if not exists uniq_default_scale_per_pathology
  on public.pathology_severity_scales(pathology_id)
  where pathology_id is not null and is_default = true;

-- ======================
-- 3) TRIGGERS updated_at
-- ======================

drop trigger if exists trg_upd_pathology_categories on public.pathology_categories;
create trigger trg_upd_pathology_categories
before update on public.pathology_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_upd_pathologies on public.pathologies;
create trigger trg_upd_pathologies
before update on public.pathologies
for each row execute function public.set_updated_at();

drop trigger if exists trg_upd_pathology_scales on public.pathology_severity_scales;
create trigger trg_upd_pathology_scales
before update on public.pathology_severity_scales
for each row execute function public.set_updated_at();

-- ======================
-- 4) RLS (catálogo somente leitura via client)
-- ======================

alter table public.pathology_categories enable row level security;
alter table public.pathologies enable row level security;
alter table public.pathology_severity_scales enable row level security;

drop policy if exists read_pathology_categories on public.pathology_categories;
create policy read_pathology_categories
on public.pathology_categories for select
using (auth.uid() is not null);

drop policy if exists read_pathologies on public.pathologies;
create policy read_pathologies
on public.pathologies for select
using (auth.uid() is not null);

drop policy if exists read_pathology_severity_scales on public.pathology_severity_scales;
create policy read_pathology_severity_scales
on public.pathology_severity_scales for select
using (auth.uid() is not null);

-- ======================
-- 5) SEED DATA
-- ======================

-- Categorias
insert into public.pathology_categories (code, label, sort_order)
values
  ('OSTEOARTHRITIS', 'Artrose', 1),
  ('TENDINOPATHY', 'Tendinopatias', 2),
  ('SPINE', 'Coluna Vertebral', 3),
  ('MUSCLE_INJURY', 'Lesão Muscular', 4)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = true;

-- Patologias
with cats as (
  select id, code from public.pathology_categories
)
insert into public.pathologies (category_id, code, label, anatomical_region, sort_order)
values
  ((select id from cats where code='OSTEOARTHRITIS'), 'OA_KNEE', 'Artrose de Joelho', 'KNEE', 1),
  ((select id from cats where code='OSTEOARTHRITIS'), 'OA_HIP', 'Artrose de Quadril', 'HIP', 2),
  ((select id from cats where code='OSTEOARTHRITIS'), 'OA_FACET_LUMBAR', 'Artrose Facetas Coluna Lombar', 'SPINE_LUMBAR', 3),
  ((select id from cats where code='OSTEOARTHRITIS'), 'OA_FACET_CERVICAL', 'Artrose Facetas Coluna Cervical', 'SPINE_CERVICAL', 4),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_SUPRASPINATUS', 'Tendinopatia Supraespinhoso', 'SHOULDER', 1),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_SUBSCAPULARIS', 'Tendinopatia Subescapular', 'SHOULDER', 2),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_INFRASPINATUS', 'Tendinopatia Infraespinhoso', 'SHOULDER', 3),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_GLUTEUS_MEDIUS', 'Tendinopatia Glúteo Médio', 'HIP', 4),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_GLUTEUS_MAXIMUS', 'Tendinopatia Glúteo Máximo', 'HIP', 5),
  ((select id from cats where code='TENDINOPATHY'), 'EPICONDYLITIS_LATERAL', 'Epicondilite Lateral', 'ELBOW', 6),
  ((select id from cats where code='TENDINOPATHY'), 'TEND_PATELLAR', 'Tendinopatia Patelar', 'KNEE', 7),
  ((select id from cats where code='SPINE'), 'DISC_HERNIATION_LUMBAR', 'Hérnia de Disco Lombar', 'SPINE_LUMBAR', 1),
  ((select id from cats where code='SPINE'), 'DISC_HERNIATION_CERVICAL', 'Hérnia de Disco Cervical', 'SPINE_CERVICAL', 2),
  ((select id from cats where code='SPINE'), 'SCIATICA', 'Ciatalgia', 'SPINE_LUMBAR', 3),
  ((select id from cats where code='SPINE'), 'LOW_BACK_PAIN', 'Lombalgia', 'SPINE_LUMBAR', 4),
  ((select id from cats where code='MUSCLE_INJURY'), 'MUSCLE_INJURY_QUADRICEPS', 'Lesão Quadríceps', 'THIGH', 1),
  ((select id from cats where code='MUSCLE_INJURY'), 'MUSCLE_INJURY_HAMSTRINGS', 'Lesão Ísquios Tibiais', 'THIGH', 2),
  ((select id from cats where code='MUSCLE_INJURY'), 'MUSCLE_INJURY_CALF', 'Lesão Panturrilha', 'LEG', 3)
on conflict (code) do update
set label = excluded.label,
    anatomical_region = excluded.anatomical_region,
    sort_order = excluded.sort_order,
    is_active = true;

-- Escalas CLINICAL_SIMPLE por categoria (default)
with c as (select id, code from public.pathology_categories)
insert into public.pathology_severity_scales
  (category_id, scale_code, scale_label, is_default, sort_order, options)
values
  ((select id from c where code='OSTEOARTHRITIS'), 'CLINICAL_SIMPLE', 'Clínica (Leve/Moderada/Grave)', true, 1,
   '[{"value":"MILD","label":"Leve","help":"Dor intermitente, pouca limitação funcional."},{"value":"MODERATE","label":"Moderada","help":"Dor frequente, limitação funcional moderada."},{"value":"SEVERE","label":"Grave","help":"Dor constante e/ou limitação importante."}]'::jsonb),
  ((select id from c where code='TENDINOPATHY'), 'CLINICAL_SIMPLE', 'Clínica (Leve/Moderada/Grave)', true, 1,
   '[{"value":"MILD","label":"Leve","help":"Sintomas leves, pouca limitação."},{"value":"MODERATE","label":"Moderada","help":"Sintomas frequentes, limitação moderada."},{"value":"SEVERE","label":"Grave","help":"Sintomas intensos, limitação importante."}]'::jsonb),
  ((select id from c where code='SPINE'), 'CLINICAL_SIMPLE', 'Clínica (Leve/Moderada/Grave)', true, 1,
   '[{"value":"MILD","label":"Leve","help":"Dor leve/intermitente, pouca limitação."},{"value":"MODERATE","label":"Moderada","help":"Dor frequente, limitação moderada."},{"value":"SEVERE","label":"Grave","help":"Dor intensa e/ou incapacitante."}]'::jsonb),
  ((select id from c where code='MUSCLE_INJURY'), 'CLINICAL_SIMPLE', 'Clínica (Leve/Moderada/Grave)', true, 1,
   '[{"value":"MILD","label":"Leve","help":"Dor leve, pouca perda funcional."},{"value":"MODERATE","label":"Moderada","help":"Dor moderada, perda funcional parcial."},{"value":"SEVERE","label":"Grave","help":"Dor intensa e grande limitação."}]'::jsonb)
on conflict (category_id, scale_code) where category_id is not null
do update set
  scale_label = excluded.scale_label,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order,
  options = excluded.options,
  is_active = true;

-- Kellgren-Lawrence (OSTEOARTHRITIS)
with c as (select id from public.pathology_categories where code='OSTEOARTHRITIS')
insert into public.pathology_severity_scales
  (category_id, scale_code, scale_label, is_default, sort_order, options)
values
  ((select id from c), 'KELLGREN_LAWRENCE', 'Kellgren-Lawrence (KL0–KL4)', false, 2,
   '[{"value":"KL0","label":"KL0","help":"Sem alterações radiográficas."},{"value":"KL1","label":"KL1","help":"Osteófito duvidoso/pequeno."},{"value":"KL2","label":"KL2","help":"Osteófito definido, possível estreitamento."},{"value":"KL3","label":"KL3","help":"Estreitamento claro do espaço articular."},{"value":"KL4","label":"KL4","help":"Estreitamento severo + esclerose/deformidade."}]'::jsonb)
on conflict (category_id, scale_code) where category_id is not null
do update set
  scale_label = excluded.scale_label,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order,
  options = excluded.options,
  is_active = true;

-- Grau de lesão muscular (MUSCLE_INJURY)
with c as (select id from public.pathology_categories where code='MUSCLE_INJURY')
insert into public.pathology_severity_scales
  (category_id, scale_code, scale_label, is_default, sort_order, options)
values
  ((select id from c), 'MUSCLE_GRADE', 'Grau de lesão muscular (I–III)', false, 2,
   '[{"value":"GRADE_1","label":"Grau I","help":"Distensão leve/pequenas fibras."},{"value":"GRADE_2","label":"Grau II","help":"Rotura parcial, perda funcional moderada."},{"value":"GRADE_3","label":"Grau III","help":"Rotura completa, perda funcional importante."}]'::jsonb)
on conflict (category_id, scale_code) where category_id is not null
do update set
  scale_label = excluded.scale_label,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order,
  options = excluded.options,
  is_active = true;
