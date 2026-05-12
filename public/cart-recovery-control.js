(function(){
  'use strict';

  const STATE = { loaded:false, data:null, loading:false };

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtDate(value){
    if (!value) return 'Sin registros';
    try { return new Date(value).toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' }); }
    catch { return value; }
  }

  function n(value){
    return new Intl.NumberFormat('es-CL').format(Number(value || 0));
  }

  function injectStyles(){
    if (document.getElementById('cart-recovery-control-style')) return;
    const style = document.createElement('style');
    style.id = 'cart-recovery-control-style';
    style.textContent = `
      #cart-recovery-control{--cr-red:#C0392B;--cr-red2:#e1251b;--cr-black:#111111;--cr-green:#22c55e;--cr-blue:#3b82f6;--cr-yellow:#f59e0b;--cr-bg:#0b0f16;--cr-panel:#111722;--cr-border:#283344;--cr-text:#f8fafc;--cr-muted:#94a3b8;margin-bottom:16px;}
      .cr-card{border:1px solid rgba(192,57,43,.34);border-radius:20px;background:radial-gradient(circle at 88% 0%,rgba(192,57,43,.28),transparent 30%),linear-gradient(135deg,#121a27,#080b11 62%,#1d0b0b);box-shadow:0 18px 60px rgba(0,0,0,.34);padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;position:relative;overflow:hidden;}
      .cr-kicker{font-size:11px;color:#ffb3ad;font-weight:900;text-transform:uppercase;letter-spacing:.12em;display:flex;align-items:center;gap:7px;margin-bottom:7px;}
      .cr-title{font-size:21px;font-weight:950;color:var(--cr-text);letter-spacing:-.025em;margin-bottom:6px;}
      .cr-copy{font-size:13px;color:var(--cr-muted);line-height:1.55;max-width:860px;}
      .cr-actions{display:flex;gap:9px;align-items:center;justify-content:flex-end;flex-wrap:wrap;}
      .cr-btn{height:38px;border-radius:12px;border:1px solid var(--cr-border);background:#151d2a;color:var(--cr-text);font-size:12px;font-weight:850;padding:0 13px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .16s ease;}
      .cr-btn:hover{transform:translateY(-1px);border-color:#425268;background:#1b2535;}
      .cr-btn.primary{background:linear-gradient(135deg,var(--cr-red),var(--cr-red2));border-color:var(--cr-red);box-shadow:0 12px 32px rgba(192,57,43,.34);}
      .cr-btn.green{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.38);color:#9bf4ba;}
      .cr-btn.danger{background:rgba(192,57,43,.13);border-color:rgba(192,57,43,.45);color:#ffaaa4;}
      .cr-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}
      .cr-status{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px;}
      .cr-stat{border:1px solid var(--cr-border);border-radius:14px;background:rgba(10,15,23,.74);padding:11px;min-width:0;}
      .cr-stat-label{font-size:10px;color:var(--cr-muted);font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;display:flex;gap:5px;align-items:center;}
      .cr-stat-value{font-size:17px;color:var(--cr-text);font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .cr-stat-sub{font-size:10px;color:#64748b;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .cr-pill{height:26px;border-radius:999px;padding:0 10px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:6px;border:1px solid;}
      .cr-pill.on{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.36);color:#9bf4ba;}.cr-pill.off{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.40);color:#ffd18a;}.cr-pill.bad{background:rgba(192,57,43,.13);border-color:rgba(192,57,43,.45);color:#ffaaa4;}
      .cr-alert{margin-top:12px;border:1px solid rgba(245,158,11,.36);background:rgba(245,158,11,.10);color:#ffd18a;border-radius:13px;padding:10px 12px;font-size:12px;line-height:1.45;}
      .cr-toast{position:fixed;right:20px;bottom:20px;background:#111927;border:1px solid #36445a;border-radius:14px;color:#fff;padding:12px 15px;font-size:13px;font-weight:850;box-shadow:0 18px 55px rgba(0,0,0,.5);z-index:10000;transform:translateY(22px);opacity:0;transition:all .22s ease}.cr-toast.show{transform:translateY(0);opacity:1}.cr-toast.ok{border-color:rgba(34,197,94,.42);color:#9bf4ba}.cr-toast.err{border-color:rgba(192,57,43,.48);color:#ffaaa4}
      @media(max-width:1180px){.cr-card{grid-template-columns:1fr}.cr-actions{justify-content:flex-start}.cr-status{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:720px){.cr-status{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function getMountTargets(){
    return [document.getElementById('vw-carritos'), document.getElementById('vw-flows')].filter(Boolean);
  }

  function mount(){
    injectStyles();
    const targets = getMountTargets();
    if (!targets.length) return false;
    targets.forEach(view => {
      if (view.querySelector('#cart-recovery-control')) return;
      const box = document.createElement('div');
      box.id = 'cart-recovery-control';
      box.innerHTML = renderLoading();
      view.prepend(box);
      box.addEventListener('click', onClick);
    });
    loadState();
    return true;
  }

  function renderLoading(){
    return '<div class="cr-card"><div><div class="cr-kicker"><i class="ti ti-shopping-cart-bolt"></i> Shopify · Carrito abandonado</div><div class="cr-title">Cargando control de recuperación...</div><div class="cr-copy">Verificando webhook, canales y automatización.</div></div><div class="cr-actions"><span class="cr-pill off">Cargando</span></div></div>';
  }

  function alerts(d){
    const a = [];
    if (d.shopify && !d.shopify.enabled) a.push('Shopify aparece desactivado. Revisa SHOPIFY_STORE_URL en Railway.');
    if (d.shopify && !d.shopify.webhook_secret_configured && !d.shopify.skip_verify) a.push('Webhook secret no configurado. Revisa SHOPIFY_WEBHOOK_SECRET o SHOPIFY_SKIP_WEBHOOK_VERIFY para pruebas.');
    if (d.channels && !d.channels.whatsapp && !d.channels.email) a.push('No hay canal activo para recuperación. Activa WhatsApp o Email.');
    if (d.stats && Array.isArray(d.stats.errors) && d.stats.errors.length) a.push(d.stats.errors.join(' · '));
    return a;
  }

  function render(){
    document.querySelectorAll('#cart-recovery-control').forEach(box => {
      const d = STATE.data || {};
      const stats = d.stats || {};
      const shopify = d.shopify || {};
      const channels = d.channels || {};
      const active = d.activo !== false;
      const issues = alerts(d);
      box.innerHTML = `
        <div class="cr-card">
          <div>
            <div class="cr-kicker"><i class="ti ti-shopping-cart-bolt"></i> Shopify · Carrito abandonado</div>
            <div class="cr-title">Recuperación de carritos ${active ? 'activa' : 'pausada'}</div>
            <div class="cr-copy">Control urgente conectado al webhook de Shopify. Si está activo, Upzy detecta checkouts abandonados después de ${esc(d.delay_minutes || 60)} minutos y ejecuta recuperación por WhatsApp y/o email.</div>
            <div class="cr-status">
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-power"></i>Estado</div><div class="cr-stat-value"><span class="cr-pill ${active ? 'on' : 'off'}"><i class="ti ${active ? 'ti-circle-check' : 'ti-player-pause'}"></i>${active ? 'Activo' : 'Pausado'}</span></div><div class="cr-stat-sub">toggle comercial</div></div>
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-clock"></i>Delay</div><div class="cr-stat-value">${esc(d.delay_minutes || 60)} min</div><div class="cr-stat-sub">tiempo de espera</div></div>
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-shopping-cart-x"></i>Checkouts</div><div class="cr-stat-value">${n(stats.pending_checkouts)}</div><div class="cr-stat-sub">a evaluar</div></div>
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-target-arrow"></i>Pendientes</div><div class="cr-stat-value">${n(stats.pending_abandoned)}</div><div class="cr-stat-sub">abandono detectado</div></div>
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-send"></i>Canales</div><div class="cr-stat-value">${channels.whatsapp ? 'WA' : ''}${channels.whatsapp && channels.email ? ' + ' : ''}${channels.email ? 'Email' : ''}${!channels.whatsapp && !channels.email ? 'OFF' : ''}</div><div class="cr-stat-sub">Shopify ${shopify.enabled ? 'OK' : 'OFF'}</div></div>
            </div>
            <div class="cr-status" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:10px">
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-brand-shopify"></i>Tienda</div><div class="cr-stat-value">${esc(shopify.store_url || 'No configurada')}</div><div class="cr-stat-sub">webhook ${shopify.webhook_secret_configured || shopify.skip_verify ? 'configurado' : 'pendiente'}</div></div>
              <div class="cr-stat"><div class="cr-stat-label"><i class="ti ti-history"></i>Último abandono</div><div class="cr-stat-value">${esc(fmtDate(stats.last_abandoned_at))}</div><div class="cr-stat-sub">registro más reciente</div></div>
            </div>
            ${issues.length ? '<div class="cr-alert"><strong>Atención:</strong> ' + esc(issues.join(' ')) + '</div>' : ''}
          </div>
          <div class="cr-actions">
            <button class="cr-btn" type="button" data-cr-action="reload" ${STATE.loading ? 'disabled' : ''}><i class="ti ti-refresh"></i>Actualizar</button>
            <button class="cr-btn primary" type="button" data-cr-action="run" ${STATE.loading || !active ? 'disabled' : ''}><i class="ti ti-bolt"></i>Ejecutar ahora</button>
            <button class="cr-btn ${active ? 'danger' : 'green'}" type="button" data-cr-action="toggle" ${STATE.loading ? 'disabled' : ''}><i class="ti ${active ? 'ti-player-pause' : 'ti-player-play'}"></i>${active ? 'Desactivar' : 'Activar'}</button>
          </div>
        </div>`;
    });
  }

  async function loadState(force){
    if (STATE.loading) return;
    STATE.loading = true;
    if (!STATE.loaded || force) document.querySelectorAll('#cart-recovery-control').forEach(box => box.innerHTML = renderLoading());
    try {
      const res = await fetch('/api/automations/cart-recovery', { headers: { Accept:'application/json' }});
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo cargar carrito');
      STATE.data = await res.json();
      STATE.loaded = true;
      render();
    } catch(err) {
      document.querySelectorAll('#cart-recovery-control').forEach(box => {
        box.innerHTML = '<div class="cr-card"><div><div class="cr-kicker"><i class="ti ti-alert-triangle"></i> Shopify · Carrito abandonado</div><div class="cr-title">No pude cargar el control</div><div class="cr-copy">' + esc(err.message || err) + '</div></div><div class="cr-actions"><button class="cr-btn primary" data-cr-action="reload">Reintentar</button></div></div>';
      });
    } finally {
      STATE.loading = false;
    }
  }

  async function toggle(){
    const current = STATE.data?.activo !== false;
    try {
      STATE.loading = true;
      render();
      const res = await fetch('/api/automations/cart-recovery', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ activo: !current })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo actualizar');
      STATE.data = await res.json();
      STATE.loaded = true;
      toast(!current ? 'Carrito abandonado activado' : 'Carrito abandonado desactivado', 'ok');
    } catch(err) {
      toast(err.message || 'Error al actualizar carrito', 'err');
    } finally {
      STATE.loading = false;
      render();
    }
  }

  async function runNow(){
    try {
      STATE.loading = true;
      render();
      const res = await fetch('/api/automations/cart-recovery/run', { method:'POST', headers:{ Accept:'application/json' }});
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo ejecutar revisión');
      STATE.data = await res.json();
      STATE.loaded = true;
      toast('Revisión de carritos ejecutada', 'ok');
    } catch(err) {
      toast(err.message || 'Error al ejecutar revisión', 'err');
    } finally {
      STATE.loading = false;
      render();
    }
  }

  function onClick(ev){
    const action = ev.target.closest('[data-cr-action]')?.dataset.crAction;
    if (!action) return;
    ev.preventDefault();
    if (action === 'reload') loadState(true);
    if (action === 'toggle') toggle();
    if (action === 'run') runNow();
  }

  function toast(msg, type){
    const old = document.querySelector('.cr-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'cr-toast ' + (type || '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 240); }, 2600);
  }

  function boot(){
    if (mount()) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (mount() || tries > 40) clearInterval(timer);
    }, 250);
    const obs = new MutationObserver(() => mount());
    obs.observe(document.body, { childList:true, subtree:true });
    setTimeout(() => obs.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
