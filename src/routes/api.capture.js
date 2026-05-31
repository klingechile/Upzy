const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// POST /api/capture/leads
// Public endpoint for website/modal lead capture. Do not expose Supabase keys in frontend.
router.post('/leads', async (req, res) => {
  try {
    const {
      email,
      nombre,
      telefono,
      tipo_negocio,
      producto_interes,
      source,
      campaign,
      website, // honeypot
    } = req.body || {};

    if (website) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(telefono);

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: 'email o teléfono requerido' });
    }

    if (email && !cleanEmail) {
      return res.status(400).json({ error: 'email inválido' });
    }

    const canalId = cleanEmail || cleanPhone;
    const notes = buildNotes({ source, campaign, producto_interes });

    const lead = {
      tenant_id: TENANT_ID,
      nombre: safeText(nombre),
      telefono: cleanPhone,
      email: cleanEmail,
      tipo_negocio: safeText(tipo_negocio),
      canal: 'web',
      canal_id: canalId,
      score: 1,
      segmento: 'cold',
      etapa: 'nuevo',
      notas: notes,
    };

    const { data, error } = await supabase
      .from('upzy_leads')
      .upsert(lead, { onConflict: 'tenant_id,canal,canal_id', ignoreDuplicates: false })
      .select('id, nombre, email, telefono, canal, segmento, etapa, created_at')
      .single();

    if (error) {
      console.error('[capture] upsert error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      ok: true,
      lead: data,
      event: 'lead.email_captured',
    });
  } catch (err) {
    console.error('[capture] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

function normalizeEmail(value) {
  if (!value) return null;
  const email = String(value).trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return valid ? email : null;
}

function normalizePhone(value) {
  if (!value) return null;
  let phone = String(value).replace(/[\s\-\(\)\.]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (phone.startsWith('9') && phone.length === 9) phone = `56${phone}`;
  if (phone.startsWith('56') && phone.length === 11) return phone;
  if (phone.length >= 8) return phone;
  return null;
}

function safeText(value) {
  if (!value) return null;
  return String(value).trim().slice(0, 180) || null;
}

function buildNotes({ source, campaign, producto_interes }) {
  const parts = [];
  if (source) parts.push(`source:${safeText(source)}`);
  if (campaign) parts.push(`campaign:${safeText(campaign)}`);
  if (producto_interes) parts.push(`producto_interes:${safeText(producto_interes)}`);
  return parts.length ? parts.join(' | ') : null;
}

module.exports = router;
