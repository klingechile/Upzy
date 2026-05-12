(function(){
  'use strict';

  const STATE = { loaded:false, data:null };

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtDate(value){
    if (!value) return 'Sin registros';
    try { return new Date(value).toLocaleString('es-CL', { dateStyle:'short', timeStyle:'short' }); }
    catch { return value; }
  }

  function injectStyles(){
    if (document.getElementById('cart-recovery-control-style')) return;
    const style = document.createElement('style');
    style.id = 'cart-recovery-control-style';
    style.textContent = `
      #cart-recovery-control{--cr-red:#e1251b;--cr-red2:#ff3b30;--cr-green:#22c55e;--cr-bg:#0b0f16;--cr-panel:#111722;--cr-panel2:#151d2a;--cr-border:#283344;--cr-text:#f8fafc;--cr-muted:#94a3b8;--cr-yellow:#f59e0b;margin-bottom:16px;}
      .cr-card{border:1px solid rgba(225,37,27,.28);border-radius:20px;background:radial-gradient(circle at 88% 0%,rgba(225,37,27,.25),transparent 30%),linear-gradient(135deg,#121a27,#080b11);box-shadow:0 18px 60px rgba(0,0,0,.32);padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;}
      .cr-kicker{font-size:11px;color:#ffaaa4;font-weight:900;text-transform:uppercase;letter-spacing:.12em;display:flex;align-items:center;gap:7px;margin-bottom:7px;}
      .cr-title{font-size:20px;font-weight:950;color:var(--cr-text);letter-spacing:-.025em;margin-bottom:6px;}
      .cr-copy{font-size:13px;color:var(--cr-muted);line-height:1.55;max-width:800px;}
      .cr-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;}
      .cr-btn{height:38px;border-radius:12px;border:1px solid var(--cr-border);background:#151d2a;color:var(--cr-text);font-size:12px;font-weight:850;padding:0 13px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .16s ease;}
      .cr-btn:hover{transform:translateY(-1px);border-color:#425268;background:#1b2535;}
      .cr-btn.primary{background:linear-gradient(135deg,var(--cr-red),var(--cr-red2));border-color:var(--cr-red);box-shadow:0 12px 32px rgba(225,37,27,.32);}
      .cr-btn.green{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.38);color:#9bf4ba;}
      .cr-btn.danger{background:rgba(225,37,27,.13);border-color:rgba(225,37,27,.45);color:#ffaaa4;}
      .cr-status{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px;}
      .cr-stat{border:1px solid var(--cr-border);border-radius:14px;background:rgba(10,15,23,.72);padding:11px;}
      .cr-stat-label{font-size:10px;color:var(--cr-muted);font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
      .cr-stat-value{font-size:17px;color:var(--cr-text);font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .cr-pill{height:26px;border-radius:999px;padding:0 10px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:6px;border:1px solid;}
      .cr-pill.on{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.36);color:#9bf4ba;}.cr-pill.off{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.40);color:#ffd18a;}
      .cr-toast{position:fixed;right:20px;bottom:20px;background:#111927;border:1px solid #36445a;border-radius:14px;color:#fff;padding:12px 15px;font-size:13px;font-weight:850;box-shadow:0 18px 55px rgba(0,0,0,.5);z-index:10000;transform:translateY(22px);opacity:0;transition:all .22s ease}.cr-toast.show{transform:translateY(0);opacity:1}.cr-toast.ok{border-color:rgba(34,197,94,.42);color:#9bf4ba}.cr-toast.err{border-color:rgba(225,37,27,.48);color:#ffaaa4}
      @media(max-width:1100px){.cr-card{grid-template-columns:1fr}.cr-actions{justify-content:flex-start}.cr-status{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:720px){.cr-status{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function mount(){
    const view = document.getElementById('vw-carritos');
    if (!view || document.getElementById('cart-recovery-control')) return false;
    injectStyles();
    const box = document.createElement('div');
    box.id = 'cart-recovery-control';
    box.innerHTML = renderLoading();
    view.prepend(box);
    box.addEventListener('click', async ev => {
      const action = ev.target.closest('[data-cr-action]')?.dataset.crAction;
      if (!action) return;
      ev.preventDefault();
      if (action === 'reload') await loadState(true);
      if (action === 'toggle') await toggle();
    });
    loadState();
    return true;
  }

  function renderLoading(){
    return '<div class="cr-card"><div><div class="cr-kicker"><i class="ti ti-shopping-cart-bolt"></i> Shopify · Carrito abandonado</div><div class="cr-title">Cargando control de recuperación...</div><div class="cr-copy">Verificando estado del webhook y automatización.</div></div><div class="cr-actions"><span class="cr-pill off">Cargando</span></div></div>';
  }

  function render(){
    const box = document.getElementById('cart-recovery-control');
    if (!box) return;
    const d = STATE.data || {};
    const stats = d.stats || {};
    const active = d.activo !== false;
    box.innerHTML = `
      <div class="cr-card">
        <div>
          <div class="cr-kicker"><i class="ti ti-shopping-cart-bolt"></i> Shopify conectado · Webhook activo</div>
          <div class="cr-title">Recuperación urgente de carritos ${active ? 'activa' : 'desactivada'}</div>
          <div class="cr-copy">Controla si Upzy detecta checkouts de Shopify abandonados y envía recuperación por WhatsApp/email. Tiempo de espera actual: ${esc(d.delay_minutes || 60)} minutos.</div>
          <div class="cr-status">
            <div class="cr-stat"><div class="cr-stat-label">Estado</div><div class="cr-stat-value"><span class="cr-pill ${active ? 'on' : 'off'}"><i class="ti ${active ? 'ti-circle-check' : 'ti-player-pause'}"></i>${active ? 'Activo' : 'Pausado'}</span></div></div>
            <div class="cr-stat"><div class="cr-stat-label">Abandonados pendientes</div><div class="cr-stat-value">${esc(stats.pending_abandoned ?? 0)}</div></div>
            <div class="cr-stat"><div class="cr-stat-label">Checkouts a evaluar</div><div class="cr-stat-value">${esc(stats.pending_checkouts ?? 0)}</div></div>
            <div class="cr-stat"><div class="cr-stat-label">Último abandono</div><div class="cr-stat-value">${esc(fmtDate(stats.last_abandoned_at))}</div></div>
          </div>
        </div>
        <div class="cr-actions">
          <button class="cr-btn" type="button" data-cr-action="reload"><i class="ti ti-refresh"></i>Actualizar</button>
          <button class="cr-btn ${active ? 'danger' : 'primary'}" type="button" data-cr-action="toggle"><i class="ti ${active ? 'ti-player-pause' : 'ti-bolt'}"></i>${active ? 'Desactivar carrito' : 'Activar carrito'}</button>
        </div>
      </div>`;
  }

  async function loadState(force){
    const box = document.getElementById('cart-recovery-control');
    if (!box) return;
    if (!STATE.loaded || force) box.innerHTML = renderLoading();
    try {
      const res = await fetch('/api/automations/cart-recovery', { headers: { Accept:'application/json' }});
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo cargar carrito');
      STATE.data = await res.json();
      STATE.loaded = true;
      render();
    } catch(err) {
      box.innerHTML = '<div class="cr-card"><div><div class="cr-kicker"><i class="ti ti-alert-triangle"></i> Shopify · Carrito abandonado</div><div class="cr-title">No pude cargar el control</div><div class="cr-copy">' + esc(err.message || err) + '</div></div><div class="cr-actions"><button class="cr-btn primary" data-cr-action="reload">Reintentar</button></div></div>';
    }
  }

  async function toggle(){
    const current = STATE.data?.activo !== false;
    try {
      const res = await fetch('/api/automations/cart-recovery', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ activo: !current })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo actualizar');
      STATE.data = await res.json();
      render();
      toast(!current ? 'Carrito abandonado activado' : 'Carrito abandonado desactivado', 'ok');
    } catch(err) { toast(err.message || 'Error al actualizar carrito', 'err'); }
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
