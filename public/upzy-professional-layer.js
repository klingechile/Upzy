(function(){
  'use strict';

  const BRAND = {
    red: '#C0392B',
    red2: '#E1251B',
    black: '#111111',
    white: '#FFFFFF',
    bg: '#0B0F16',
    panel: '#111722',
    border: '#2A3342',
    muted: '#94A3B8'
  };

  function addStyle(){
    if (document.getElementById('upzy-professional-layer-style')) return;
    const style = document.createElement('style');
    style.id = 'upzy-professional-layer-style';
    style.textContent = `
      :root{
        --green:${BRAND.red}!important;
        --gb:${BRAND.red}!important;
        --gdim:rgba(192,57,43,.16)!important;
        --red:${BRAND.red2}!important;
        --bg:#0B0F16!important;
        --bg2:#111722!important;
        --bg3:#151D2A!important;
        --bg4:#1A2433!important;
        --border:#283344!important;
        --border2:#3A4658!important;
        --text:#F8FAFC!important;
        --t2:#AAB6C5!important;
        --t3:#6B7788!important;
        --r:10px!important;
        --rl:16px!important;
      }
      body{background:linear-gradient(135deg,#07090d 0%,#0b0f16 100%)!important;}
      .logo-mk{background:${BRAND.black}!important;border-color:${BRAND.red}!important;color:${BRAND.white}!important;box-shadow:0 0 0 3px rgba(192,57,43,.12)!important;}
      .logo h1:after{content:' CRM';color:${BRAND.red};font-size:11px;margin-left:6px;letter-spacing:.08em;}
      .ni.active::before{background:${BRAND.red}!important;}
      .btp{background:${BRAND.red}!important;border-color:${BRAND.red}!important;color:#fff!important;box-shadow:0 8px 22px rgba(192,57,43,.22)!important;}
      .btp:hover{background:${BRAND.red2}!important;border-color:${BRAND.red2}!important;}
      input:focus,select:focus,textarea:focus{border-color:${BRAND.red}!important;box-shadow:0 0 0 3px rgba(192,57,43,.16)!important;}
      .card,.scard,.modal{box-shadow:0 16px 44px rgba(0,0,0,.18)!important;}
      .scard::before{background:var(--ac,${BRAND.red})!important;}
      .dot{background:${BRAND.red}!important;box-shadow:0 0 8px ${BRAND.red}!important;}
      .qr:hover,.lcard:hover,.add-step-btn:hover{border-color:${BRAND.red}!important;color:#ffb0aa!important;}
      .msg.bot,.msg.ai,.msg.lumi{background:rgba(192,57,43,.10)!important;border-color:rgba(192,57,43,.35)!important;color:#ffd2ce!important;}
      .upzy-pro-alert{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;background:#111722;border:1px solid #3A4658;color:#F8FAFC;border-radius:14px;padding:12px 14px;box-shadow:0 18px 55px rgba(0,0,0,.55);font-size:13px;display:flex;gap:10px;align-items:center;max-width:min(680px,calc(100vw - 32px));}
      .upzy-pro-alert strong{color:#ffb0aa}.upzy-pro-alert button{background:transparent;border:0;color:#94A3B8;cursor:pointer;font-size:18px;line-height:1;margin-left:auto;}
      .upzy-pro-badge{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;background:rgba(192,57,43,.14);border:1px solid rgba(192,57,43,.34);color:#ffb0aa;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;}
    `;
    document.head.appendChild(style);
  }

  function enhanceHeader(){
    const topbar = document.querySelector('.topbar');
    if (!topbar || topbar.querySelector('.upzy-pro-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'upzy-pro-badge';
    badge.innerHTML = '<i class="ti ti-shield-check"></i> Klinge Pro';
    const title = topbar.querySelector('#vt');
    if (title) title.insertAdjacentElement('afterend', badge);
  }

  function patchFetch(){
    if (window.__upzyProfessionalFetchPatched) return;
    window.__upzyProfessionalFetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init){
      const started = Date.now();
      try {
        const res = await originalFetch(input, init);
        if (!res.ok && typeof input === 'string' && input.startsWith('/api/')) {
          console.warn('[Upzy API]', res.status, input, Date.now() - started + 'ms');
        }
        return res;
      } catch (err) {
        showAlert('Error de conexión', 'No se pudo conectar con el backend. Revisa Railway o la sesión.');
        throw err;
      }
    };
  }

  function showAlert(title, message){
    const old = document.querySelector('.upzy-pro-alert');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'upzy-pro-alert';
    el.innerHTML = '<i class="ti ti-alert-triangle"></i><div><strong>'+escapeHtml(title)+'</strong><br>'+escapeHtml(message)+'</div><button type="button" aria-label="Cerrar">×</button>';
    el.querySelector('button').onclick = () => el.remove();
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 7000);
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function addQualityPanel(){
    if (document.getElementById('upzy-quality-button')) return;
    const btn = document.createElement('button');
    btn.id = 'upzy-quality-button';
    btn.type = 'button';
    btn.title = 'Estado del sistema';
    btn.innerHTML = '<i class="ti ti-activity-heartbeat"></i>';
    btn.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9998;width:44px;height:44px;border-radius:14px;border:1px solid rgba(192,57,43,.42);background:#111722;color:#ffb0aa;box-shadow:0 16px 40px rgba(0,0,0,.45);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center';
    btn.onclick = runQuickCheck;
    document.body.appendChild(btn);
  }

  async function runQuickCheck(){
    const checks = [];
    async function check(label, url){
      try {
        const res = await fetch(url, { headers: { Accept:'application/json' }});
        checks.push({ label, ok: res.ok, status: res.status });
      } catch {
        checks.push({ label, ok: false, status: 'ERR' });
      }
    }
    await check('Health', '/health');
    await check('Plantillas', '/api/templates');
    await check('Email branding', '/api/email/branding');
    await check('Carrito Shopify', '/api/automations/cart-recovery');
    const msg = checks.map(c => `${c.ok ? '✅' : '❌'} ${c.label}: ${c.status}`).join(' · ');
    showAlert('Diagnóstico rápido', msg);
  }

  function boot(){
    addStyle();
    patchFetch();
    enhanceHeader();
    addQualityPanel();
    const obs = new MutationObserver(() => {
      enhanceHeader();
      addQualityPanel();
    });
    obs.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
