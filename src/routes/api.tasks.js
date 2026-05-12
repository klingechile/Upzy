const express = require('express');
const router = express.Router();
const tasks = require('../services/tasks');
const TENANT_ID = require('../config/env').tenantId;

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const data = await tasks.listTasks(TENANT_ID, {
      lead_id: req.query.lead_id,
      estado: req.query.estado,
      prioridad: req.query.prioridad,
      assigned_to: req.query.assigned_to,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/stats
router.get('/stats', async (req, res) => {
  try {
    const data = await tasks.getStats(TENANT_ID);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const data = await tasks.getTask(TENANT_ID, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Tarea no encontrada' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const data = await tasks.createTask(TENANT_ID, req.body || {});
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const data = await tasks.updateTask(TENANT_ID, req.params.id, req.body || {});
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tasks/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const data = await tasks.completeTask(TENANT_ID, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const data = await tasks.deleteTask(TENANT_ID, req.params.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
