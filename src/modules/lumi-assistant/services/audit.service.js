async function log(eventData = {}) {
  try {
    const action = eventData.action || 'lumi_assistant_event';
    const status = eventData.status || 'logged';
    console.log('[lumi-assistant]', action, status);
  } catch (_) {
    // No bloquear el flujo por auditoría.
  }
}

module.exports = { log };
