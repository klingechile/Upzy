const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const wa       = require('../services/whatsapp');

const TENANT_ID = require('../config/env').tenantId;

// GET /api/campanas
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('upzy_campanas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/campanas — crear y enviar campaña WA
router.post('/', async (req, res) => {
  const { nombre, tipo, segmento, mensaje, asunto } = req.body;

  if (!nombre || !tipo || !mensaje) {
    return res.status(400).json({ error: 'nombre, tipo y mensaje son requeridos' });
  }

  try {
    // Obtener leads del segmento
    let query = supabase
      .from('upzy_leads')
      .select('id, nombre, telefono, email, canal')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true);

    if (segmento && segmento !== 'todos') {
      query = query.eq('segmento', segmento);
    }

    const { data: leads } = await query;

    // Crear registro de campaña
    const { data: campana, error } = await supabase
      .from('upzy_campanas')
      .insert({
        tenant_id: TENANT_ID,
        nombre,
        tipo,
        segmento: segmento || 'todos',
        estado: 'enviando',
        total_destinatarios: leads?.length || 0,
      })
      .select().single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ campana, destinatarios: leads?.length || 0, status: 'iniciada' });

    // Envío asíncrono (no bloquea la respuesta)
    if (tipo === 'whatsapp') {
      enviarCampanaWA(campana.id, leads || [], mensaje, TENANT_ID);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envío en lotes con delay para no saturar la API
async function enviarCampanaWA(campanaId, leads, plantilla, tenantId) {
  let enviados = 0;

  for (const lead of leads) {
    if (!lead.telefono) continue;

    try {
      const texto = plantilla
        .replace('[nombre]',  lead.nombre  || 'estimado cliente')
        .replace('[empresa]', lead.empresa || 'tu negocio');

      await wa.enviarTexto(lead.telefono, texto);
      enviados++;

      // Delay de 2 segundos entre mensajes para evitar bloqueos de WA
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[campaña] Error enviando a ${lead.telefono}:`, err.message);
    }
  }

  // Actualizar estadísticas de la campaña
  await supabase
    .from('upzy_campanas')
    .update({ estado: 'enviada', enviados })
    .eq('id', campanaId);

  console.log(`[campaña] ${campanaId} — ${enviados}/${leads.length} enviados`);
}

module.exports = router;
