const supabase = require('../db/supabase');

const TABLE = 'upzy_tasks';

const ALLOWED_STATUSES = new Set(['pendiente', 'en_progreso', 'hecha', 'cancelada']);
const ALLOWED_PRIORITIES = new Set(['baja', 'media', 'alta', 'urgente']);

function cleanString(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s || null;
}

function normalizeStatus(value) {
  const status = cleanString(value) || 'pendiente';
  return ALLOWED_STATUSES.has(status) ? status : 'pendiente';
}

function normalizePriority(value) {
  const priority = cleanString(value) || 'media';
  return ALLOWED_PRIORITIES.has(priority) ? priority : 'media';
}

function safeLimit(value) {
  const n = Number(value || 100);
  if (!Number.isFinite(n)) return 100;
  return Math.max(1, Math.min(250, Math.floor(n)));
}

async function listTasks(tenantId, filters = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, lead:upzy_leads(id,nombre,email,telefono,empresa,etapa,score,segmento,canal,created_at,updated_at)')
    .eq('tenant_id', tenantId)
    .order('fecha', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(safeLimit(filters.limit));

  if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
  if (filters.estado) query = query.eq('estado', filters.estado);
  if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
  if (filters.prioridad) query = query.eq('prioridad', filters.prioridad);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getTask(tenantId, id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, lead:upzy_leads(id,nombre,email,telefono,empresa,etapa,score,segmento,canal,created_at,updated_at)')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function createTask(tenantId, payload = {}) {
  const titulo = cleanString(payload.titulo || payload.title);
  const leadId = cleanString(payload.lead_id);
  if (!titulo) throw new Error('titulo requerido');
  if (!leadId) throw new Error('lead_id requerido');

  const row = {
    tenant_id: tenantId,
    lead_id: leadId,
    titulo,
    nota: cleanString(payload.nota || payload.note),
    tipo: cleanString(payload.tipo) || 'seguimiento',
    prioridad: normalizePriority(payload.prioridad || payload.priority),
    estado: normalizeStatus(payload.estado || payload.status),
    fecha: cleanString(payload.fecha || payload.due_at),
    assigned_to: cleanString(payload.assigned_to || payload.responsable),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('*, lead:upzy_leads(id,nombre,email,telefono,empresa,etapa,score,segmento,canal,created_at,updated_at)')
    .single();

  if (error) throw error;
  return data;
}

async function updateTask(tenantId, id, payload = {}) {
  const updates = {};

  if (payload.titulo !== undefined || payload.title !== undefined) updates.titulo = cleanString(payload.titulo || payload.title);
  if (payload.nota !== undefined || payload.note !== undefined) updates.nota = cleanString(payload.nota || payload.note);
  if (payload.tipo !== undefined) updates.tipo = cleanString(payload.tipo) || 'seguimiento';
  if (payload.prioridad !== undefined || payload.priority !== undefined) updates.prioridad = normalizePriority(payload.prioridad || payload.priority);
  if (payload.estado !== undefined || payload.status !== undefined) updates.estado = normalizeStatus(payload.estado || payload.status);
  if (payload.fecha !== undefined || payload.due_at !== undefined) updates.fecha = cleanString(payload.fecha || payload.due_at);
  if (payload.assigned_to !== undefined || payload.responsable !== undefined) updates.assigned_to = cleanString(payload.assigned_to || payload.responsable);

  if (updates.estado === 'hecha' && !payload.done_at) updates.done_at = new Date().toISOString();
  if (updates.estado && updates.estado !== 'hecha') updates.done_at = null;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select('*, lead:upzy_leads(id,nombre,email,telefono,empresa,etapa,score,segmento,canal,created_at,updated_at)')
    .single();

  if (error) throw error;
  return data;
}

async function completeTask(tenantId, id) {
  return updateTask(tenantId, id, { estado: 'hecha', done_at: new Date().toISOString() });
}

async function deleteTask(tenantId, id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id);

  if (error) throw error;
  return { ok: true };
}

async function getStats(tenantId) {
  const tasks = await listTasks(tenantId, { limit: 250 });
  const now = Date.now();
  return {
    total: tasks.length,
    pendientes: tasks.filter(t => t.estado !== 'hecha' && t.estado !== 'cancelada').length,
    vencidas: tasks.filter(t => t.estado !== 'hecha' && t.estado !== 'cancelada' && t.fecha && new Date(t.fecha).getTime() < now).length,
    hechas: tasks.filter(t => t.estado === 'hecha').length,
    urgentes: tasks.filter(t => t.prioridad === 'urgente' && t.estado !== 'hecha').length,
  };
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  getStats,
};
