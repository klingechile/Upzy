-- ============================================================
-- UPZY — Schema Supabase v1.0
-- Ejecutar en: Supabase > SQL Editor
-- Orden: ejecutar de arriba hacia abajo
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- búsqueda de texto

-- ============================================================
-- TABLA: tenants
-- Un registro por negocio cliente de Upzy.
-- En el piloto: solo existe tenant_id = 'klinge'
-- ============================================================
create table if not exists public.tenants (
  id                  text primary key default 'klinge',
  nombre              text not null,
  plan                text not null default 'pro'
                        check (plan in ('starter', 'pro', 'scale')),
  shopify_domain      text,
  wa_instance_id      text,       -- nombre de instancia en Evolution API
  ig_page_id          text,       -- ID página Facebook
  ig_business_id      text,       -- ID cuenta IG Business
  resend_from_email   text,
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Insertar tenant Klinge (piloto)
insert into public.tenants (id, nombre, plan, shopify_domain, ig_business_id)
values ('klinge', 'Klinge', 'pro', 'klingecl.myshopify.com', '17841401601485577')
on conflict (id) do nothing;

-- ============================================================
-- TABLA: leads
-- Un registro por contacto/cliente de cada tenant.
-- Se crea automáticamente cuando llega un mensaje nuevo.
-- ============================================================
create table if not exists public.leads (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           text not null references public.tenants(id) on delete cascade,

  -- Datos de contacto
  nombre              text,
  empresa             text,
  telefono            text,
  email               text,
  ciudad              text,

  -- Canal de origen
  canal               text not null default 'whatsapp'
                        check (canal in ('whatsapp', 'instagram', 'email', 'web', 'shopify')),
  canal_id            text,       -- ID externo: número WA, username IG, customer_id Shopify

  -- Segmentación y scoring
  segmento            text not null default 'cold'
                        check (segmento in ('hot', 'warm', 'cold')),
  score               int not null default 1
                        check (score between 1 and 10),
  score_detalle       jsonb,      -- { responde: 2, precio: 3, carrito: 2, ... }

  -- Pipeline
  etapa               text not null default 'nuevo'
                        check (etapa in ('nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado')),

  -- Tags y contexto
  tags                text[] default '{}',
  notas               text,
  tipo_negocio        text,       -- restaurante, retail, gym, etc.
  cantidad_pantallas  int,        -- capturado por el bot durante calificación

  -- Actividad
  ultimo_contacto     timestamptz,
  total_mensajes      int not null default 0,
  total_compras       int not null default 0,
  total_gastado       numeric(12,2) not null default 0,

  -- Control
  asignado_a          text,       -- email/id del agente
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Un lead por canal_id por tenant
  unique (tenant_id, canal, canal_id)
);

-- Índices
create index if not exists leads_tenant_id_idx      on public.leads(tenant_id);
create index if not exists leads_segmento_idx       on public.leads(tenant_id, segmento);
create index if not exists leads_etapa_idx          on public.leads(tenant_id, etapa);
create index if not exists leads_score_idx          on public.leads(tenant_id, score desc);
create index if not exists leads_ultimo_contacto_idx on public.leads(tenant_id, ultimo_contacto desc);
create index if not exists leads_telefono_idx       on public.leads(tenant_id, telefono);
create index if not exists leads_canal_id_idx       on public.leads(tenant_id, canal, canal_id);

-- ============================================================
-- TABLA: eventos_shopify
-- Registra cada evento recibido del webhook de Shopify.
-- Permite auditoría y reactivación de flujos.
-- ============================================================
create table if not exists public.eventos_shopify (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           text not null references public.tenants(id) on delete cascade,
  lead_id             uuid references public.leads(id) on delete set null,

  -- Tipo de evento
  tipo                text not null
                        check (tipo in (
                          'order_created',
                          'order_paid',
                          'order_cancelled',
                          'order_fulfilled',
                          'checkout_created',
                          'checkout_updated',
                          'checkout_abandoned',
                          'refund_created'
                        )),

  -- Datos del evento
  shopify_order_id    text,
  shopify_checkout_id text,
  monto               numeric(12,2),
  moneda              text default 'CLP',
  productos           jsonb,      -- array de { title, quantity, price }
  customer_email      text,
  customer_phone      text,
  customer_name       text,
  checkout_url        text,       -- URL para recuperar carrito abandonado

  -- Estado de recuperación (para carritos abandonados)
  recuperacion_estado text default 'pendiente'
                        check (recuperacion_estado in (
                          'pendiente',
                          'wa_enviado',
                          'email_enviado',
                          'ambos_enviados',
                          'recuperado',
                          'descartado'
                        )),
  recuperacion_wa_at  timestamptz,
  recuperacion_email_at timestamptz,

  -- Payload completo para debugging
  payload_raw         jsonb,

  created_at          timestamptz not null default now()
);

-- Índices
create index if not exists eventos_shopify_tenant_idx  on public.eventos_shopify(tenant_id);
create index if not exists eventos_shopify_tipo_idx    on public.eventos_shopify(tenant_id, tipo);
create index if not exists eventos_shopify_lead_idx    on public.eventos_shopify(lead_id);
create index if not exists eventos_shopify_estado_idx  on public.eventos_shopify(tenant_id, recuperacion_estado)
  where tipo = 'checkout_abandoned';
create index if not exists eventos_shopify_created_idx on public.eventos_shopify(tenant_id, created_at desc);

-- ============================================================
-- TABLA: score_eventos
-- Log de cada cambio de score para auditoría y debugging.
-- Permite entender POR QUÉ un lead tiene el score que tiene.
-- ============================================================
create table if not exists public.score_eventos (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           text not null references public.tenants(id) on delete cascade,
  lead_id             uuid not null references public.leads(id) on delete cascade,

  motivo              text not null,  -- 'primer_mensaje', 'consulta_precio', 'carrito_abandonado', etc.
  delta               int not null,   -- cuántos puntos sumó o restó
  score_anterior      int not null,
  score_nuevo         int not null,
  segmento_anterior   text,
  segmento_nuevo      text,
  metadata            jsonb,          -- contexto extra

  created_at          timestamptz not null default now()
);

create index if not exists score_eventos_lead_idx on public.score_eventos(lead_id, created_at desc);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create or replace trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: recalcular segmento según score
-- Se llama automáticamente cuando se actualiza el score
-- ============================================================
create or replace function public.recalcular_segmento()
returns trigger language plpgsql as $$
begin
  new.segmento = case
    when new.score >= 8 then 'hot'
    when new.score >= 5 then 'warm'
    else 'cold'
  end;
  return new;
end;
$$;

create or replace trigger leads_recalcular_segmento
  before update of score on public.leads
  for each row execute function public.recalcular_segmento();

-- ============================================================
-- RLS (Row Level Security)
-- El backend usa SUPABASE_SERVICE_ROLE_KEY → bypasa RLS
-- Si en algún momento expones la API directamente al cliente,
-- habilitar estas políticas
-- ============================================================
alter table public.tenants          enable row level security;
alter table public.leads            enable row level security;
alter table public.eventos_shopify  enable row level security;
alter table public.score_eventos    enable row level security;

-- Política service role: acceso total (el backend siempre usa esto)
create policy "service_role_all" on public.tenants
  for all using (auth.role() = 'service_role');
create policy "service_role_all" on public.leads
  for all using (auth.role() = 'service_role');
create policy "service_role_all" on public.eventos_shopify
  for all using (auth.role() = 'service_role');
create policy "service_role_all" on public.score_eventos
  for all using (auth.role() = 'service_role');

-- ============================================================
-- VISTAS ÚTILES (para el dashboard)
-- ============================================================

-- Resumen de leads por segmento y etapa
create or replace view public.leads_resumen as
select
  tenant_id,
  segmento,
  etapa,
  count(*) as total,
  avg(score)::numeric(4,1) as score_promedio,
  max(ultimo_contacto) as ultimo_contacto
from public.leads
where activo = true
group by tenant_id, segmento, etapa;

-- Carritos abandonados pendientes de recuperación
create or replace view public.carritos_pendientes as
select
  e.id,
  e.tenant_id,
  e.lead_id,
  e.monto,
  e.productos,
  e.customer_name,
  e.customer_email,
  e.customer_phone,
  e.checkout_url,
  e.recuperacion_estado,
  e.created_at,
  extract(epoch from (now() - e.created_at))/3600 as horas_abandonado,
  l.nombre as lead_nombre,
  l.canal,
  l.segmento,
  l.score
from public.eventos_shopify e
left join public.leads l on l.id = e.lead_id
where e.tipo = 'checkout_abandoned'
  and e.recuperacion_estado = 'pendiente'
order by e.created_at desc;

-- Tabla automatizaciones personalizadas
