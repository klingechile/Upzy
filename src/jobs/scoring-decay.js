const supabase = require('../db/supabase');
const scoring  = require('../services/scoring');

/**
 * Degrada leads sin actividad.
 * - Sin respuesta en 24h → -2 puntos
 * - Sin respuesta en 72h → -2 puntos adicionales
 * Ejecutar cada noche a las 2am desde index.js.
 */
const degradarLeadsFrios = async (tenantId) => {
  const ahora    = new Date();
  const hace24h  = new Date(ahora - 24 * 60 * 60 * 1000).toISOString();
  const hace72h  = new Date(ahora - 72 * 60 * 60 * 1000).toISOString();

  // Leads sin actividad en 72h con score > 1
  const { data: leads72 } = await supabase
    .from('upzy_leads')
    .select('id, score')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .lt('ultimo_contacto', hace72h)
    .gt('score', 1);

  for (const lead of leads72 || []) {
    await scoring.addScore(tenantId, lead.id, 'sin_respuesta_72h');
  }

  // Leads sin actividad en 24h (solo los que tienen score alto)
  const { data: leads24 } = await supabase
    .from('upzy_leads')
    .select('id, score')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .lt('ultimo_contacto', hace24h)
    .gte('ultimo_contacto', hace72h) // solo los que no cayeron en 72h
    .gte('score', 7); // solo degradar HOT que no respondieron

  for (const lead of leads24 || []) {
    await scoring.addScore(tenantId, lead.id, 'sin_respuesta_24h');
  }

  console.log(`[cron/decay] Procesados: ${(leads72?.length || 0) + (leads24?.length || 0)} leads`);
};

module.exports = { degradarLeadsFrios };
