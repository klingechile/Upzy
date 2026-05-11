// src/routes/api.flows.js
// CRUD de automatizaciones + API para el flow builder visual

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// Flows default (hardcoded, no se pueden borrar)
const DEFAULT_FLOWS = [
  {
    id: 'bienvenida_wa',
    nombre: 'Bienvenida WhatsApp',
    trigger: 'primer_mensaje_wa',
    canal: 'whatsapp',
    activo: true,
    tipo: 'default',
    descripcion: 'Saluda al nuevo lead. Si no responde en 3 min, envía catálogo',
    ejecuciones: 0,
    pasos: [
      { id: '1', tipo: 'trigger',   label: 'Nuevo contacto llega por WhatsApp',   color: '#d29922', icon: 'ti-bolt' },
      { id: '2', tipo: 'mensaje',   label: 'Enviar saludo de bienvenida con Lumi', color: '#2ea043', icon: 'ti-message' },
      { id: '3', tipo: 'delay',     label: 'Esperar 3 minutos',                   color: '#545d68', icon: 'ti-clock' },
      { id: '4', tipo: 'condicion', label: '¿Respondió el cliente?',              color: '#388bfd', icon: 'ti-git-branch' },
      { id: '5', tipo: 'mensaje',   label: 'No respondió → Enviar catálogo PDF',  color: '#2ea043', icon: 'ti-file' },
    ],
  },
  {
    id: 'carrito_abandonado',
    nombre: 'Recuperación Carrito',
    trigger: 'checkout_abandoned',
    canal: 'whatsapp',
    activo: true,
    tipo: 'default',
    descripcion: 'WA a la 1h · Descuento 10% a las 24h si no compra',
    ejecuciones: 0,
    pasos: [
      { id: '1', tipo: 'trigger',   label: 'Shopify: checkout abandonado',        color: '#d29922', icon: 'ti-shopping-cart' },
      { id: '2', tipo: 'delay',     label: 'Esperar 1 hora',                      color: '#545d68', icon: 'ti-clock' },
      { id: '3', tipo: 'mensaje',   label: 'WA: "Dejaste [producto] en tu carrito 🛒"', color: '#2ea043', icon: 'ti-message' },
      { id: '4', tipo: 'delay',     label: 'Esperar 23 horas más',                color: '#545d68', icon: 'ti-clock' },
      { id: '5', tipo: 'condicion', label: '¿Sigue sin comprar?',                 color: '#388bfd', icon: 'ti-git-branch' },
      { id: '6', tipo: 'mensaje',   label: 'Enviar código VUELVE10 (10% off)',    color: '#f85149', icon: 'ti-tag' },
    ],
  },
  {
    id: 'calificacion_lead',
    nombre: 'Calificación de Lead',
    trigger: 'consulta_precio',
    canal: 'whatsapp',
    activo: true,
    tipo: 'default',
    descripcion: 'Pregunta tipo de negocio y cantidad para calificar al lead',
    ejecuciones: 0,
    pasos: [
      { id: '1', tipo: 'trigger',   label: 'Lead pregunta por precio o cotización', color: '#d29922', icon: 'ti-bolt' },
      { id: '2', tipo: 'mensaje',   label: 'Lumi: ¿Qué tipo de negocio tienes?',  color: '#2ea043', icon: 'ti-message' },
      { id: '3', tipo: 'delay',     label: 'Esperar respuesta hasta 24h',          color: '#545d68', icon: 'ti-clock' },
      { id: '4', tipo: 'condicion', label: '¿Respondió con tipo de negocio?',     color: '#388bfd', icon: 'ti-git-branch' },
      { id: '5', tipo: 'mensaje',   label: '¿Cuántas pantallas necesitas?',        color: '#2ea043', icon: 'ti-message' },
      { id: '6', tipo: 'accion',    label: 'Actualizar score del lead',            color: '#bc8cff', icon: 'ti-star' },
    ],
  },
  {
    id: 'followup_frio',
    nombre: 'Follow-up Lead Frío',
    trigger: 'sin_respuesta_48h',
    canal: 'whatsapp',
    activo: true,
    tipo: 'default',
    descripcion: 'Reactiva leads WARM con 48h+ sin respuesta',
    ejecuciones: 0,
    pasos: [
      { id: '1', tipo: 'trigger',   label: 'Lead sin respuesta por 48h+',         color: '#d29922', icon: 'ti-clock-off' },
      { id: '2', tipo: 'condicion', label: '¿Es segmento WARM?',                  color: '#388bfd', icon: 'ti-git-branch' },
      { id: '3', tipo: 'mensaje',   label: 'Enviar mensaje de reactivación',      color: '#2ea043', icon: 'ti-message' },
    ],
  },
];

// GET /api/flows — todos los flows (default + custom)
router.get('/', async (req, res) => {
  try {
    const { data: custom } = await supabase
      .from('upzy_automatizaciones')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    res.json({
      defaults: DEFAULT_FLOWS,
      custom:   (custom || []).map(f => ({
        id:          f.id,
        nombre:      f.nombre,
        trigger:     f.trigger,
        canal:       f.canal,
        activo:      f.activo,
        tipo:        'custom',
        ejecuciones: f.ejecuciones,
        pasos:       f.pasos,
        created_at:  f.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/flows/:id — detalle de un flow
router.get('/:id', async (req, res) => {
  const def = DEFAULT_FLOWS.find(f => f.id === req.params.id);
  if (def) return res.json(def);

  const { data } = await supabase
    .from('upzy_automatizaciones')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!data) return res.status(404).json({ error: 'Flow no encontrado' });
  res.json(data);
});

// POST /api/flows — crear flow custom
router.post('/', async (req, res) => {
  const { nombre, trigger, canal, pasos } = req.body;
  if (!nombre || !trigger) return res.status(400).json({ error: 'nombre y trigger requeridos' });

  const { data, error } = await supabase
    .from('upzy_automatizaciones')
    .insert({
      tenant_id: TENANT_ID,
      nombre,
      trigger,
      canal:   canal || 'whatsapp',
      pasos:   pasos || [],
      activo:  true,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/flows/:id — actualizar flow
router.patch('/:id', async (req, res) => {
  const { nombre, trigger, canal, pasos, activo } = req.body;
  const updates = {};
  if (nombre   !== undefined) updates.nombre  = nombre;
  if (trigger  !== undefined) updates.trigger = trigger;
  if (canal    !== undefined) updates.canal   = canal;
  if (pasos    !== undefined) updates.pasos   = pasos;
  if (activo   !== undefined) updates.activo  = activo;

  const { data, error } = await supabase
    .from('upzy_automatizaciones')
    .update(updates)
    .eq('id', req.params.id)
    .eq('tenant_id', TENANT_ID)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/flows/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('upzy_automatizaciones')
    .delete()
    .eq('id', req.params.id)
    .eq('tenant_id', TENANT_ID);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/flows/:id/test — test manual de un flow
router.post('/:id/test', async (req, res) => {
  const { lead_id } = req.body;
  if (!lead_id) return res.status(400).json({ error: 'lead_id requerido' });
  const automations = require('../services/automations');
  await automations.ejecutarFlow(TENANT_ID, lead_id, req.params.id, {});
  res.json({ ok: true, mensaje: `Flow ${req.params.id} ejecutado para lead ${lead_id}` });
});

module.exports = router;
