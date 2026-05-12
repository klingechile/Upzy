-- Upzy CRM Tasks
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.upzy_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  lead_id uuid not null references public.upzy_leads(id) on delete cascade,
  titulo text not null,
  nota text,
  tipo text not null default 'seguimiento',
  prioridad text not null default 'media',
  estado text not null default 'pendiente',
  fecha timestamptz,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz,
  constraint upzy_tasks_estado_check check (estado in ('pendiente','en_progreso','hecha','cancelada')),
  constraint upzy_tasks_prioridad_check check (prioridad in ('baja','media','alta','urgente'))
);

create index if not exists idx_upzy_tasks_tenant_estado on public.upzy_tasks(tenant_id, estado);
create index if not exists idx_upzy_tasks_tenant_lead on public.upzy_tasks(tenant_id, lead_id);
create index if not exists idx_upzy_tasks_fecha on public.upzy_tasks(fecha);
create index if not exists idx_upzy_tasks_assigned_to on public.upzy_tasks(assigned_to);

create or replace function public.set_upzy_tasks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_upzy_tasks_updated_at on public.upzy_tasks;
create trigger trg_upzy_tasks_updated_at
before update on public.upzy_tasks
for each row execute function public.set_upzy_tasks_updated_at();

-- RLS queda desactivado porque el backend usa SUPABASE_SERVICE_ROLE_KEY y filtra por tenant_id.
-- Si se habilita acceso directo desde cliente, activar RLS y políticas por tenant.
alter table public.upzy_tasks disable row level security;
