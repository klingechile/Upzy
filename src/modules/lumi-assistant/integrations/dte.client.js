const axios = require('axios');

async function createFactura(payload) {
  const baseUrl = String(
    process.env.DTE_SERVICE_URL ||
    process.env.DTE_SERVICE_BASE_URL ||
    process.env.GENERAR_DTE_BASE_URL ||
    'https://generar-dte-production.up.railway.app'
  ).replace(/\/$/, '');

  const token = process.env.DTE_SERVICE_TOKEN || process.env.GENERAR_DTE_API_KEY || '';
  const timeout = Number(process.env.DTE_REQUEST_TIMEOUT_MS || process.env.GENERAR_DTE_TIMEOUT_MS || 30000);

  const response = await axios.post(`${baseUrl}/api/facturas`, payload, {
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response.data?.data || response.data;
}

module.exports = { createFactura };
