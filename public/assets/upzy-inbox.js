(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'loading',
    error: null,
    channelStatus: null,
    conversations: [],
    selected: null,
    messages: [],
    suggestion: null,
  };

  function token() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path, options = {}) {
    const auth = token();
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para usar Inbox.');
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
        ...(options.headers || {}),
      },
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `Error HTTP ${res.status}`);
    return payload;
  }

  function dateLabel(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleString('es-CL');
  }

  function badge(value) {
    const v = String(value || '').toLowerCase();
    const cls = ['bot', 'live', 'ok', 'whatsapp'].includes(v) ? 'ok' : ['agente', 'instagram', 'warn'].includes(v) ? 'warm' : 'cold';
    return `<span class="upzy-badge ${cls}">${value || 'n/a'}</span>`;
  }

  function renderStatus() {
    const target = $('#upzy-inbox-status');
    if (!target) return;
    const live = state.status === 'live';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const label = live ? 'LIVE' : error ? 'ERROR' : 'LOADING';
    const message = live
      ? `Conversaciones: ${state.conversations.length} · Modo agent_assist · Auto envío desactivado`
      : error
        ? `${state.error?.message || 'Error desconocido'} · Revisa sesión o tablas de conversaciones.`
        : 'Cargando inbox omnicanal...';
    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Inbox Omnicanal + Lumi Web Base</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${label}</span>
      </div>
    `;
  }

  function renderMetrics() {
    const target = $('#upzy-inbox-metrics');
    if (!target) return;
    const counts = state.channelStatus?.counts || {};
    const channels = state.channelStatus?.channels || {};
    const total = state.conversations.length;
    const bot = state.conversations.filter(c => c.estado === 'bot').length;
    const agente = state.conversations.filter(c => c.estado === 'agente').length;
    const instagram = state.conversations.filter(c => c.canal === 'instagram').length;
    const cards = [
      { label: 'Conversaciones', value: total, delta: 'bandeja unificada', tone: 'blue', icon: 'ti-inbox' },
      { label: 'En bot', value: bot, delta: 'Lumi activo', tone: 'green', icon: 'ti-message-chatbot' },
      { label: 'En agente', value: agente, delta: 'handoff humano', tone: 'orange', icon: 'ti-user-check' },
      { label: 'Instagram', value: instagram || (channels.instagram ? 'ON' : 'OFF'), delta: `lumi:${counts.lumi_conversations?.count || 0} upzy:${counts.upzy_conversaciones?.count || 0}`, tone: 'purple', icon: 'ti-brand-instagram' },
    ];
    target.innerHTML = cards.map(card => `
      <article class="upzy-card tone-${card.tone}">
        <div class="upzy-card-header"><div class="upzy-card-title">${card.label}</div><div class="upzy-card-icon"><i class="ti ${card.icon}"></i></div></div>
        <div class="upzy-metric-value">${card.value}</div>
        <div class="upzy-metric-delta">${card.delta}</div>
      </article>
    `).join('');
  }

  function renderConversations() {
    const target = $('#upzy-conversation-list');
    if (!target) return;
    if (!state.conversations.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay conversaciones omnicanal disponibles.</div>';
      return;
    }
    target.innerHTML = state.conversations.map(conv => {
      const active = state.selected?.id === conv.id && state.selected?.source === conv.source;
      const lead = conv.lead || {};
      const last = conv.ultimo_mensaje?.contenido || 'Sin último mensaje';
      return `
        <button class="upzy-conv-item ${active ? 'is-active' : ''}" data-conv-id="${conv.id}" data-conv-source="${conv.source}">
          <div class="upzy-conv-top">
            <strong>${lead.nombre || 'Cliente sin nombre'}</strong>
            ${badge(conv.canal)}
          </div>
          <div class="upzy-conv-meta">${conv.source} · ${conv.estado || 'sin estado'} · ${dateLabel(conv.updated_at)}</div>
          <div class="upzy-conv-last">${last}</div>
        </button>
      `;
    }).join('');

    document.querySelectorAll('[data-conv-id]').forEach(btn => {
      btn.addEventListener('click', () => selectConversation(btn.dataset.convId, btn.dataset.convSource));
    });
  }

  function renderMessages() {
    const target = $('#upzy-message-thread');
    if (!target) return;
    if (!state.selected) {
      target.innerHTML = '<div class="upzy-live-empty">Selecciona una conversación para ver el historial.</div>';
      return;
    }
    if (!state.messages.length) {
      target.innerHTML = '<div class="upzy-live-empty">Esta conversación no tiene mensajes disponibles.</div>';
      return;
    }
    target.innerHTML = state.messages.map(msg => `
      <div class="upzy-msg ${msg.origen || 'cliente'}">
        <div class="upzy-msg-origin">${msg.origen || 'mensaje'} · ${dateLabel(msg.created_at)}</div>
        <div class="upzy-msg-body">${msg.contenido || ''}</div>
      </div>
    `).join('');
  }

  function renderSelected() {
    const target = $('#upzy-selected-conversation');
    if (!target) return;
    if (!state.selected) {
      target.innerHTML = '<div class="upzy-live-empty">Sin conversación seleccionada.</div>';
      return;
    }
    const lead = state.selected.lead || {};
    target.innerHTML = `
      <div class="upzy-state-box">
        <div class="upzy-state-title">${lead.nombre || 'Cliente sin nombre'}</div>
        <div class="upzy-state-text">Canal: ${state.selected.canal} · Estado: ${state.selected.estado} · Source: ${state.selected.source}</div>
        <div class="upzy-state-text">Email: ${lead.email || 'sin email'} · Teléfono: ${lead.telefono || 'sin teléfono'}</div>
        <div class="upzy-state-text">Score: ${lead.score || 0} · Segmento: ${lead.segmento || 'cold'}</div>
      </div>
    `;
  }

  function renderSuggestion() {
    const target = $('#upzy-lumi-suggestion');
    if (!target) return;
    if (!state.suggestion) {
      target.innerHTML = '<div class="upzy-live-empty">Genera una sugerencia para apoyar al agente. No se enviará automáticamente.</div>';
      return;
    }
    target.innerHTML = `
      <div class="upzy-state-box">
        <div class="upzy-state-title">Sugerencia Lumi · Agent Assist</div>
        <div class="upzy-state-text">${state.suggestion}</div>
      </div>
    `;
  }

  async function selectConversation(id, source) {
    const conv = state.conversations.find(item => item.id === id && item.source === source);
    state.selected = conv || null;
    state.suggestion = null;
    renderConversations();
    renderSelected();
    renderSuggestion();
    try {
      state.messages = await api(`/api/inbox/${id}/mensajes?source=${encodeURIComponent(source)}`);
    } catch (error) {
      state.messages = [];
      state.error = error;
    }
    renderMessages();
  }

  async function takeConversation() {
    if (!state.selected) return;
    await api(`/api/inbox/${state.selected.id}/tomar`, { method: 'POST', body: JSON.stringify({ source: state.selected.source }) });
    await load();
  }

  async function returnBot() {
    if (!state.selected) return;
    await api(`/api/inbox/${state.selected.id}/devolver-bot`, { method: 'POST', body: JSON.stringify({ source: state.selected.source }) });
    await load();
  }

  async function suggestReply() {
    if (!state.selected) return;
    const last = state.messages[state.messages.length - 1]?.contenido || state.selected.ultimo_mensaje?.contenido || '';
    const payload = await api('/api/omnichannel/suggest-reply', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: state.selected.id,
        source: state.selected.source,
        intent: $('#upzy-intent-select')?.value || 'general',
        lead: state.selected.lead || {},
        last_message: last,
      }),
    });
    state.suggestion = payload.suggestion;
    renderSuggestion();
  }

  function bindActions() {
    const take = $('#upzy-take-conversation');
    const bot = $('#upzy-return-bot');
    const suggest = $('#upzy-suggest-reply');
    if (take) take.addEventListener('click', takeConversation);
    if (bot) bot.addEventListener('click', returnBot);
    if (suggest) suggest.addEventListener('click', suggestReply);
  }

  function renderAll() {
    renderStatus();
    renderMetrics();
    renderConversations();
    renderSelected();
    renderMessages();
    renderSuggestion();
  }

  async function load() {
    state.status = 'loading';
    renderStatus();
    try {
      const [channelStatus, conversations] = await Promise.all([
        api('/api/omnichannel/status'),
        api('/api/inbox/bandeja'),
      ]);
      state.channelStatus = channelStatus;
      state.conversations = Array.isArray(conversations) ? conversations : [];
      state.status = 'live';
      state.error = null;
      if (state.selected) {
        state.selected = state.conversations.find(c => c.id === state.selected.id && c.source === state.selected.source) || null;
      }
    } catch (error) {
      state.status = 'error';
      state.error = error;
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindActions();
    load();
  });
})();
