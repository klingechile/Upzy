// src/middleware/logger.js
// Logging estructurado para todos los requests

const logger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const color   = status >= 500 ? '🔴' : status >= 400 ? '🟡' : status >= 300 ? '🔵' : '🟢';
    const webhook = originalUrl.startsWith('/webhook') ? ' [WEBHOOK]' : '';
    console.log(`${color} ${method} ${originalUrl}${webhook} → ${status} (${ms}ms)`);
  });

  next();
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(`❌ [${req.method} ${req.originalUrl}] ${err.message}`);
  if (require('./config/env').isProd === false) console.error(err.stack);

  res.status(status).json({
    error:   err.message || 'Error interno del servidor',
    path:    req.originalUrl,
    status,
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
};

module.exports = { logger, errorHandler, notFound };
