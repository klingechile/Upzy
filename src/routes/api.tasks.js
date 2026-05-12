// src/routes/api.tasks.js
// Rutas de tareas CRM — protegidas con requireAuth desde index.js
// tenant_id viene de req.tenantId (auth middleware), no hardcodeado

const express = require('express');
const router  = express.Router();
const tasks   = require('../services/tasks');

// GET /api/tasks?lead_id=&estado=&prioridad=&assigned_to=&limit=
router.get('/', async (req, res) => {
  try {
    const data = await tasks.listTasks(req.tenantId, {
      lead_id:     req.query.lead_id     || undefined,
      estado:      req.query.estado      || undefined,
      prioridad:   req.query.prioridad   || undefined,
      assigned_to: req.query.assigned_to || undefined,
      limit:       req.query.limit       || 100,
    });
    res.json(data);
  } catch (err) {
    console.error('[tasks] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/stats — DEBE ir antes de /:id
router.get('/stats', async (req, res) => {
  try {
    const data = await tasks.getStats(req.tenantId);
    res.json(data);
  } catch (err) {
    console.error('[tasks] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await tasks.getTask(req.tenantId, req.params.id);
    if (!data) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Tarea no encontrada' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const data = await tasks.createTask(req.tenantId, req.body || {});
    res.status(201).json(data);
  } catch (err) {
    console.error('[tasks] create error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const data = await tasks.updateTask(req.tenantId, req.params.id, req.body || {});
    res.json(data);
  } catch (err) {
    console.error('[tasks] update error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tasks/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const data = await tasks.completeTask(req.tenantId, req.params.id);
    res.json(data);
  } catch (err) {
    console.error('[tasks] complete error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const data = await tasks.deleteTask(req.tenantId, req.params.id);
    res.json(data);
  } catch (err) {
    console.error('[tasks] delete error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
