(function(){
  'use strict';

  const BRAND = {
    red: '#C0392B',
    red2: '#E1251B',
    black: '#111111',
    bg: '#0B0F16',
    panel: '#121722',
    border: '#283344',
    text: '#F8FAFC',
    muted: '#94A3B8'
  };

  function injectStyles(){
    if (document.getElementById('upzy-professional-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'upzy-professional-ui-style';
    style.textContent = `
      :root{
        --bg:#0B0F16!important;--bg2:#111722!important;--bg3:#151D2A!important;--bg4:#1A2433!important;
        --border:#283344!important;--border2:#3A475B!important;--text:#F8FAFC!important;--t2:#A7B3C2!important;--t3:#64748B!important;
        --green:#22C55E!important;--gb:#C0392B!important;--gdim:rgba(192,57,43,.16)!important;
        --red:#C0392B!important;--rdim:rgba(192,57,43,.18)!important;--ora:#F59E0B!important;--blue:#3B82F6!important;
        --r:10px!important;--rl:16px!important;
      }
      body{background:radial-gradient(circle at top right,rgba(192,57,43,.12),transparent 26%),var(--bg)!important;}
      .sb{background:linear-gradient(180deg,#0B0F16,#080B10)!important;border-right:1px solid rgba(192,57,43,.18)!important;}
      .logo{border-bottom:1px solid rgba(192,57,43,.18)!important;}
      .logo-mk{background:#111111!important;border:1px solid #C0392B!important;color:#fff!important;box-shadow:0 0 0 3px rgba(192,57,43,.12)!important;}
      .logo-mk::after{content:'';width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #C0392B;margin-left:2px;}
      .ni.active::before{background:#C0392B!important;box-shadow:0 0 12px rgba(192,57,43,.5)!important;}
      .ni:hover,.ni.active{background:rgba(192,57,43,.10)!important;}
      .topbar{background:rgba(17,23,34,.96)!important;border-bottom:1px solid rgba(192,57,43,.16)!important;backdrop-filter:blur(8px);}
      .card,.scard{background:linear-gradient(180deg,#121A27,#0F1622)!important;border-color:#283344!important;box-shadow:0 12px 36px rgba(0,0,0,.18)!important;}
      .scard::before{background:var(--ac,#C0392B)!important;}
      .btp{background:linear-gradient(135deg,#C0392B,#E1251B)!important;border-color:#C0392B!important;color:#fff!important;box-shadow:0 8px 24px rgba(192,57,43,.26)!important;}
      .btp:hover{filter:brightness(1.08)!important;}
      input:focus,select:focus,textarea:focus{border-color:#C0392B!important;box-shadow:0 0 0 3px rgba(192,57,43,.16)!important;}
      .dot{background:#22C55E!important;box-shadow:0 0 8px rgba(34,197,94,.65)!important;}
      .upzy-health-strip{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #283344;border-radius:12px;background:rgba(8,13,20,.72);font-size:11px;color:#94A3B8;margin-left:auto;}
      .upzy-health-dot{width:8px;height:8px;border-radius:999px;background:#64748b;box-shadow:0 0 8px currentColor;}
      .upzy-health-strip.ok .upzy-health-dot{background:#22C55E;color:#22C55E}.upzy-health-strip.err .upzy-health-dot{background:#C0392B;color:#C0392B}.upzy-health-strip.warn .upzy-health-dot{background:#F59E0B;color:#F59E0B}
      .upzy-action-rail{position:fixed;right:18px;bottom:18px;z-index:80;display:flex;flex-direction:column;gap:8px;}
      .upzy-rail-btn{height:40px;border-radius:14px;border:1px solid #344154;background:#111927;color:#F8FAFC;padding:0 13px;font-size:12px;font-weight:850;display:flex;align-items:center;gap:7px;box-shadow:0 12px 40px rgba(0,0,0,.35);cursor:pointer;}
      .upzy-rail-btn.primary{background:linear-gradient(135deg,#C0392B,#E1251B);border-color:#C0392B;}
      .upzy-toast-pro{position:fixed;right:20px;bottom:76px;z-index:10000;background:#111927;border:1px solid #36445a;border-radius:14px;color:#fff;padding:12px 15px;font-size:13px;font-weight:850;box-shadow:0 18px 55px rgba(0,0,0,.5);transform:translateY(22px);opacity:0;transition:all .22s ease}.upzy-toast-pro.show{transform:translateY(0);opacity:1}.upzy-toast-pro.ok{border-color:rgba(34,197,94,.42);color:#9bf4ba}.upzy-toast-pro.err{border-color:rgba(192,57,43,.48);color:#ffaaa4}
    `;
    document.head.appendChild(style);
  }

  async function json(path, options){
    const token = window._upzyToken || sessionStorage.getItem('upzy_token');
    const headers = { Accept:'application/json', ...(options?.body ? {'Content-Type':'application/json'} : {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(path, { ...(options || {}), headers: { ...headers, ...(options?.headers || {}) }});
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(body?.error || body?.message || `${path} respondió ${res.status}`);
    return body;
  }

  function toast(message, type){
    const old = document.querySelector('.upzy-toast-pro');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = `upzy-toast-pro ${type || ''}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 240); }, 2800);
  }

  function mountHealth(){
    if (document.getElementById('upzy-health-strip')) return;
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const el = document.createElement('div');
    el.id = 'upzy-health-strip';
    el.className = 'upzy-health-strip warn';
    el.innerHTML = '<span class="upzy-health-dot"></span><span>Verificando sistema...</span>';
    topbar.appendChild(el);
    refreshHealth();
    setInterval(refreshHealth, 60000);
  }

  async function refreshHealth(){
    const el = document.getElementById('upzy-health-strip');
    if (!el) return;
    try {
      const h = await json('/health');
      const channels = h.channels || {};
      const missing = [];
      if (!channels.shopify) missing.push('Shopify');
      if (!channels.whatsapp) missing.push('WhatsApp');
      const status = missing.length ? 'warn' : 'ok';
      el.className = `upzy-health-strip ${status}`;
      el.innerHTML = `<span class="upzy-health-dot"></span><span>${missing.length ? 'Revisar ' + missing.join(', ') : 'Sistema operativo'} · ${h.env || 'prod'}</span>`;
    } catch (err) {
      el.className = 'upzy-health-strip err';
      el.innerHTML = '<span class="upzy-health-dot"></span><span>Backend con error</span>';
    }
  }

  function mountActionRail(){
    if (document.getElementById('upzy-action-rail')) return;
    const rail = document.createElement('div');
    rail.id = 'upzy-action-rail';
    rail.className = 'upzy-action-rail';
    rail.innerHTML = `
      <button class="upzy-rail-btn" type="button" data-upzy-action="health"><i class="ti ti-activity"></i>Estado</button>
      <button class="upzy-rail-btn" type="button" data-upzy-action="cart"><i class="ti ti-shopping-cart-bolt"></i>Carritos</button>
      <button class="upzy-rail-btn primary" type="button" data-upzy-action="email"><i class="ti ti-mail-bolt"></i>Email</button>
    `;
    document.body.appendChild(rail);
    rail.addEventListener('click', async (ev) => {
      const action = ev.target.closest('[data-upzy-action]')?.dataset.upzyAction;
      if (!action) return;
      if (action === 'health') {
        await refreshHealth();
        toast('Estado actualizado', 'ok');
      }
      if (action === 'cart') {
        const btn = Array.from(document.querySelectorAll('.ni')).find(b => /Carritos/i.test(b.textContent || ''));
        if (window.showView && btn) window.showView('carritos', btn);
        else location.hash = '#carritos';
      }
      if (action === 'email') {
        const btn = Array.from(document.querySelectorAll('.ni')).find(b => /Email Marketing/i.test(b.textContent || ''));
        if (window.showView && btn) window.showView('email', btn);
        else location.hash = '#email';
      }
    });
  }

  function hardenFetchErrors(){
    window.addEventListener('error', (ev) => {
      console.error('[Upzy UI]', ev.error || ev.message);
      toast('Error visual detectado. Revisa consola.', 'err');
    });
    window.addEventListener('unhandledrejection', (ev) => {
      console.error('[Upzy UI promise]', ev.reason);
      toast('Error de carga detectado. Revisa consola/API.', 'err');
    });
  }

  function boot(){
    injectStyles();
    mountHealth();
    mountActionRail();
    hardenFetchErrors();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
