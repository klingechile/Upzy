(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'idle',
    message: 'Listo para capturar un lead real desde el modal web.',
    lastLead: null,
  };

  function setStatus(status, message, lead) {
    state.status = status;
    state.message = message;
    state.lastLead = lead || state.lastLead;
    renderStatus();
  }

  function statusTone() {
    if (state.status === 'success') return 'live';
    if (state.status === 'error') return 'error';
    return 'fallback';
  }

  function statusBadge() {
    if (state.status === 'success') return 'CREADO';
    if (state.status === 'error') return 'ERROR';
    if (state.status === 'loading') return 'ENVIANDO';
    return 'READY';
  }

  function renderStatus() {
    const target = $('#upzy-capture-live-status');
    if (!target) return;
    const leadInfo = state.lastLead
      ? `<div class="upzy-live-detail">Lead: ${state.lastLead.email || state.lastLead.telefono || state.lastLead.id} · ${state.lastLead.canal || 'web'} · ${state.lastLead.etapa || 'nuevo'}</div>`
      : '';

    target.innerHTML = `
      <div class="upzy-live-banner ${statusTone()}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Captación Web Live</div>
          <div class="upzy-live-detail">${state.message}</div>
          ${leadInfo}
        </div>
        <span class="upzy-badge ${state.status === 'success' ? 'ok' : state.status === 'error' ? 'hot' : 'warm'}">${statusBadge()}</span>
      </div>
    `;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  async function submitLead(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const email = $('#capture-email')?.value?.trim();
    const product = $('#capture-product')?.value?.trim();
    const businessType = $('#capture-business-type')?.value?.trim();
    const website = $('#capture-website')?.value?.trim();

    if (!email || !isValidEmail(email)) {
      setStatus('error', 'Ingresa un email válido para crear el lead real.');
      return;
    }

    setStatus('loading', 'Enviando lead a /api/capture/leads...');

    try {
      const res = await fetch('/api/capture/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tipo_negocio: businessType || null,
          producto_interes: product || null,
          source: 'upzy_sprint12_modal',
          campaign: 'captacion_web_live',
          website,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || `Error HTTP ${res.status}`);
      }

      setStatus('success', 'Lead creado/actualizado correctamente en BD real.', payload?.lead);
      form.reset();
      renderLastLead(payload?.lead);
    } catch (error) {
      setStatus('error', error.message || 'No se pudo crear el lead.');
    }
  }

  function renderLastLead(lead) {
    const target = $('#upzy-last-capture');
    if (!target || !lead) return;
    target.innerHTML = `
      <div class="upzy-state-box">
        <div class="upzy-state-title">Último lead capturado</div>
        <div class="upzy-state-text">ID: ${lead.id}</div>
        <div class="upzy-state-text">Email: ${lead.email || 'Sin email'}</div>
        <div class="upzy-state-text">Canal: ${lead.canal || 'web'} · Segmento: ${lead.segmento || 'cold'} · Etapa: ${lead.etapa || 'nuevo'}</div>
      </div>
    `;
  }

  function bindForm() {
    const form = $('#upzy-live-capture-form');
    if (!form) return;
    form.addEventListener('submit', submitLead);
  }

  function boot() {
    renderStatus();
    bindForm();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
