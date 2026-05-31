(function () {
  if (window.__UPZY_LUMI_WEB__) return;
  window.__UPZY_LUMI_WEB__ = true;

  const currentScript = document.currentScript;
  const API_BASE = (currentScript?.dataset?.upzyApi || window.location.origin).replace(/\/$/, '');
  const BRAND = currentScript?.dataset?.upzyBrand || 'Klinge';
  const PRODUCT = currentScript?.dataset?.upzyProduct || document.title || 'Producto web';
  const SESSION_KEY = 'upzy_lumi_web_session';
  const CONVERSATION_KEY = 'upzy_lumi_web_conversation_id';

  const state = {
    open: false,
    loading: false,
    conversationId: localStorage.getItem(CONVERSATION_KEY),
    messages: [],
  };

  function sessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .upzy-lumi-button{position:fixed;right:22px;bottom:22px;z-index:999999;border:0;border-radius:999px;background:#111827;color:#fff;padding:14px 18px;box-shadow:0 18px 50px rgba(0,0,0,.28);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-weight:800;cursor:pointer;display:flex;gap:8px;align-items:center}
      .upzy-lumi-button span{width:10px;height:10px;border-radius:50%;background:#39d0d8;box-shadow:0 0 0 6px rgba(57,208,216,.2)}
      .upzy-lumi-panel{position:fixed;right:22px;bottom:84px;width:min(380px,calc(100vw - 32px));height:560px;max-height:calc(100vh - 120px);z-index:999999;background:#0f172a;color:#e5e7eb;border:1px solid rgba(255,255,255,.12);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.38);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;display:none;flex-direction:column}
      .upzy-lumi-panel.is-open{display:flex}
      .upzy-lumi-head{padding:16px;background:linear-gradient(135deg,#111827,#1f2937);display:flex;align-items:center;justify-content:space-between;gap:12px}
      .upzy-lumi-title{font-weight:900;font-size:15px}.upzy-lumi-sub{font-size:12px;color:#9ca3af;margin-top:3px}.upzy-lumi-close{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:10px;padding:8px;cursor:pointer}
      .upzy-lumi-body{padding:14px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px;background:#0b1120}
      .upzy-lumi-msg{max-width:84%;padding:10px 12px;border-radius:16px;font-size:13px;line-height:1.42;white-space:pre-wrap}.upzy-lumi-msg.bot{align-self:flex-start;background:#182235;color:#e5e7eb}.upzy-lumi-msg.cliente,.upzy-lumi-msg.customer{align-self:flex-end;background:#39d0d8;color:#06252a}.upzy-lumi-msg.agente,.upzy-lumi-msg.agent{align-self:flex-start;background:#17351f;color:#e5e7eb}
      .upzy-lumi-form{padding:12px;border-top:1px solid rgba(255,255,255,.1);background:#0f172a;display:grid;gap:8px}.upzy-lumi-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.upzy-lumi-input,.upzy-lumi-text{width:100%;box-sizing:border-box;background:#111827;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px;font-size:13px;outline:none}.upzy-lumi-text{resize:none;min-height:62px}.upzy-lumi-send{border:0;border-radius:12px;background:#39d0d8;color:#05282c;padding:11px;font-weight:900;cursor:pointer}.upzy-lumi-note{font-size:11px;color:#94a3b8;text-align:center}
      .upzy-lumi-hidden{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function renderShell() {
    const button = document.createElement('button');
    button.className = 'upzy-lumi-button';
    button.innerHTML = '<span></span> ¿Te ayudo?';
    button.addEventListener('click', toggle);

    const panel = document.createElement('section');
    panel.className = 'upzy-lumi-panel';
    panel.innerHTML = `
      <header class="upzy-lumi-head">
        <div><div class="upzy-lumi-title">Lumi · ${BRAND}</div><div class="upzy-lumi-sub">Asesoría rápida para tu negocio</div></div>
        <button class="upzy-lumi-close" type="button">✕</button>
      </header>
      <div class="upzy-lumi-body" data-upzy-lumi-body></div>
      <form class="upzy-lumi-form" data-upzy-lumi-form>
        <div class="upzy-lumi-row" data-upzy-contact-row>
          <input class="upzy-lumi-input" name="name" placeholder="Nombre" autocomplete="name">
          <input class="upzy-lumi-input" name="contact" placeholder="Email o WhatsApp" autocomplete="email">
        </div>
        <input class="upzy-lumi-input upzy-lumi-hidden" name="website" autocomplete="off" tabindex="-1">
        <textarea class="upzy-lumi-text" name="message" placeholder="Escribe tu consulta..." required></textarea>
        <button class="upzy-lumi-send" type="submit">Enviar mensaje</button>
        <div class="upzy-lumi-note">El equipo responderá por este chat. No compartimos tus datos.</div>
      </form>
    `;

    panel.querySelector('.upzy-lumi-close').addEventListener('click', close);
    panel.querySelector('[data-upzy-lumi-form]').addEventListener('submit', submit);

    document.body.appendChild(button);
    document.body.appendChild(panel);
    renderMessages();
  }

  function bodyEl() { return document.querySelector('[data-upzy-lumi-body]'); }
  function panelEl() { return document.querySelector('.upzy-lumi-panel'); }

  function toggle() { state.open ? close() : open(); }
  function open() { state.open = true; panelEl().classList.add('is-open'); refreshMessages(); }
  function close() { state.open = false; panelEl().classList.remove('is-open'); }

  function renderMessages() {
    const body = bodyEl();
    if (!body) return;
    const defaults = state.messages.length ? state.messages : [{ origen: 'bot', contenido: `Hola 👋 Soy Lumi de ${BRAND}. Cuéntame qué necesitas y te ayudamos a elegir la mejor opción.` }];
    body.innerHTML = defaults.map((m) => `<div class="upzy-lumi-msg ${m.origen || 'bot'}">${escapeHtml(m.contenido || '')}</div>`).join('');
    body.scrollTop = body.scrollHeight;
  }

  async function submit(event) {
    event.preventDefault();
    if (state.loading) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const website = String(formData.get('website') || '').trim();
    if (!message) return;

    state.loading = true;
    try {
      if (!state.conversationId) {
        const isEmail = contact.includes('@');
        const payload = await request('/api/lumi-web/conversations', {
          name,
          email: isEmail ? contact : null,
          phone: isEmail ? null : contact,
          message,
          page_url: window.location.href,
          product: PRODUCT,
          session_id: sessionId(),
          website,
        });
        state.conversationId = payload.conversation.id;
        localStorage.setItem(CONVERSATION_KEY, state.conversationId);
        state.messages = payload.messages || [];
        const row = document.querySelector('[data-upzy-contact-row]');
        if (row) row.classList.add('upzy-lumi-hidden');
      } else {
        await request(`/api/lumi-web/conversations/${state.conversationId}/messages`, { message });
        state.messages.push({ origen: 'cliente', contenido: message });
      }
      form.elements.message.value = '';
      renderMessages();
      setTimeout(refreshMessages, 600);
    } catch (err) {
      state.messages.push({ origen: 'bot', contenido: `No pude registrar el mensaje: ${err.message}` });
      renderMessages();
    } finally {
      state.loading = false;
    }
  }

  async function refreshMessages() {
    if (!state.conversationId) return;
    try {
      const payload = await request(`/api/lumi-web/conversations/${state.conversationId}/messages`, null, 'GET');
      state.messages = payload.messages || state.messages;
      const row = document.querySelector('[data-upzy-contact-row]');
      if (row) row.classList.add('upzy-lumi-hidden');
      renderMessages();
    } catch (_) {}
  }

  async function request(path, body, method) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
    return payload;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  injectStyles();
  renderShell();
})();
