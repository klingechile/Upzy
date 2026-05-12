(function(){
  'use strict';

  const BRAND = {
    red: '#C0392B',
    red2: '#E74C3C',
    black: '#111111',
    bg: '#080B10',
    panel: '#111722',
    panel2: '#151D2A',
    border: '#2A3342',
    text: '#F8FAFC',
    muted: '#94A3B8'
  };

  function css(){
    return `
      :root{
        --bg:${BRAND.bg}!important;
        --bg2:${BRAND.panel}!important;
        --bg3:${BRAND.panel2}!important;
        --bg4:#1B2433!important;
        --border:${BRAND.border}!important;
        --border2:#3B4658!important;
        --text:${BRAND.text}!important;
        --t2:${BRAND.muted}!important;
        --green:${BRAND.red}!important;
        --gb:${BRAND.red2}!important;
        --gdim:rgba(192,57,43,.16)!important;
        --red:${BRAND.red2}!important;
        --rdim:rgba(231,76,60,.16)!important;
        --r:10px!important;
        --rl:16px!important;
      }
      body{background:radial-gradient(circle at top right,rgba(192,57,43,.11),transparent 32%),var(--bg)!important;}
      .sb{background:linear-gradient(180deg,#0E141F,#090D14)!important;box-shadow:12px 0 40px rgba(0,0,0,.18)}
      .logo{padding:16px!important}.logo-mk{background:#111!important;border:2px solid #fff!important;color:#fff!important;border-radius:4px!important;position:relative;overflow:hidden;font-weight:950!important}.logo-mk:after{content:'';position:absolute;right:3px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid ${BRAND.red};}.logo h1{letter-spacing:.5px!important;text-transform:uppercase}.logo p{color:#A3A3A3!important;}
      .ni{border-radius:12px!important;margin-bottom:2px}.ni.active{background:rgba(192,57,43,.14)!important;color:#fff!important}.ni.active::before{background:${BRAND.red}!important;width:3px!important}.ni:hover{background:#192233!important;color:#fff!important}.nbadge.ng,.nbadge.no{background:${BRAND.red}!important;color:#fff!important;}
      .topbar{height:56px!important;background:rgba(17,23,34,.96)!important;backdrop-filter:blur(12px);box-shadow:0 12px 35px rgba(0,0,0,.18)}.tt{font-size:15px!important;font-weight:850!important;letter-spacing:-.01em}.content{padding:22px!important;}
      .card,.scard{border-radius:18px!important;background:linear-gradient(180deg,#121A27,#0F1621)!important;border-color:#273244!important;box-shadow:0 16px 45px rgba(0,0,0,.14)}.card{padding:18px 20px!important}.scard::before{background:var(--ac,${BRAND.red})!important;width:4px!important}.scard:hover,.card:hover{border-color:#3D4A5E!important}.sval{font-weight:950!important;letter-spacing:-.04em}.ctitle{color:#CBD5E1!important;font-weight:900!important;}
      .btn{border-radius:12px!important;font-weight:800!important;background:#172131!important}.btp{background:linear-gradient(135deg,${BRAND.red},${BRAND.red2})!important;border-color:${BRAND.red}!important;box-shadow:0 10px 26px rgba(192,57,43,.25)!important}.btp:hover{filter:brightness(1.06)}
      input,select,textarea{border-radius:12px!important;background:#0B111A!important;border-color:#2E3A4C!important}input:focus,select:focus,textarea:focus{border-color:${BRAND.red}!important;box-shadow:0 0 0 3px rgba(192,57,43,.14)!important;}
      .pill.pg,.pg{background:rgba(192,57,43,.15)!important;color:#FFB1AA!important}.cb-wa{background:rgba(192,57,43,.13)!important;color:#FFB1AA!important}.msg.bot,.msg.ai,.msg.lumi{background:rgba(192,57,43,.11)!important;border-color:rgba(192,57,43,.3)!important;color:#FFD0CB!important}.ci.active{border-left-color:${BRAND.red}!important}.lcard:hover{border-color:${BRAND.red}!important}.dot{background:${BRAND.red}!important;box-shadow:0 0 8px ${BRAND.red}!important;}
      .upzy-command-center{border:1px solid rgba(192,57,43,.32);background:radial-gradient(circle at 85% 0%,rgba(192,57,43,.24),transparent 34%),linear-gradient(135deg,#151D2A,#080B10);border-radius:22px;padding:18px 20px;margin-bottom:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;box-shadow:0 22px 65px rgba(0,0,0,.25)}
      .upzy-command-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#FFB1AA;font-weight:950;margin-bottom:6px;display:flex;align-items:center;gap:7px}.upzy-command-title{font-size:22px;line-height:1.1;font-weight:950;color:#fff;letter-spacing:-.03em;margin-bottom:6px}.upzy-command-copy{font-size:13px;color:#AEB8C6;line-height:1.55}.upzy-command-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.upzy-command-actions button{height:38px;border-radius:12px;border:1px solid #344155;background:#151F2E;color:#fff;font-size:12px;font-weight:850;padding:0 12px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.upzy-command-actions button.primary{background:linear-gradient(135deg,${BRAND.red},${BRAND.red2});border-color:${BRAND.red};}
      .upzy-healthbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.upzy-health-chip{height:30px;border-radius:999px;border:1px solid #304054;background:#0E1520;color:#CBD5E1;font-size:11px;font-weight:850;padding:0 10px;display:inline-flex;align-items:center;gap:6px}.upzy-health-chip.ok{border-color:rgba(34,197,94,.38);color:#9BF4BA}.upzy-health-chip.warn{border-color:rgba(245,158,11,.38);color:#FFD18A}.upzy-health-chip.bad{border-color:rgba(192,57,43,.45);color:#FFAAA4}
      .upzy-error-panel{position:fixed;right:18px;bottom:18px;z-index:9998;max-width:420px;border:1px solid rgba(192,57,43,.42);background:#111722;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.45);padding:14px;color:#F8FAFC;display:none}.upzy-error-panel.show{display:block}.upzy-error-title{font-size:13px;font-weight:950;color:#FFAAA4;margin-bottom:6px}.upzy-error-text{font-size:12px;color:#CBD5E1;line-height:1.45;white-space:pre-wrap}.upzy-error-panel button{margin-top:10px;height:30px;border-radius:10px;border:1px solid #3B4658;background:#172131;color:#fff;font-size:11px;font-weight:800;padding:0 10px;cursor:pointer}
      @media(max-width:960px){.upzy-command-center{grid-template-columns:1fr}.upzy-command-actions{justify-content:flex-start}.content{padding:14px!important}.stats{grid-template-columns:repeat(2,1fr)!important}.sb{width:72px!important}.logo h1,.logo p,.ni span:not(.nbadge),.ns,.sbot{display:none!important}.ni{justify-content:center}.main{min-width:0}}
    `;
  }

  function injectCss(){
    if (document.getElementById('upzy-professional-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'upzy-professional-ui-style';
    style.textContent = css();
    document.head.appendChild(style);
  }

  function currentUser(){
    try { return window._upzyUser || JSON.parse(sessionStorage.getItem('upzy_user') || 'null') || {}; }
    catch { return {}; }
  }

  function addCommandCenter(){
    const content = document.querySelector('.content');
    if (!content || document.getElementById('upzy-command-center')) return;
    const user = currentUser();
    const box = document.createElement('section');
    box.id = 'upzy-command-center';
    box.className = 'upzy-command-center';
    box.innerHTML = `
      <div>
        <div class="upzy-command-kicker"><i class="ti ti-dashboard"></i> Centro comercial Klinge</div>
        <div class="upzy-command-title">Control de ventas, recuperación y automatizaciones</div>
        <div class="upzy-command-copy">${user.nombre ? `Bienvenido, ${escapeHtml(user.nombre)}. ` : ''}Monitorea leads, carritos, campañas y flujos comerciales desde un panel con foco en cierre.</div>
      </div>
      <div class="upzy-command-actions">
        <button type="button" onclick="showView && showView('carritos', nv && nv('carritos'))"><i class="ti ti-shopping-cart-bolt"></i>Carritos</button>
        <button type="button" onclick="showView && showView('email', nv && nv('email'))"><i class="ti ti-mail"></i>Email</button>
        <button class="primary" type="button" onclick="showView && showView('templates', nv && nv('templates'))"><i class="ti ti-template"></i>Plantillas</button>
      </div>`;
    content.prepend(box);
  }

  async function addHealthBar(){
    const content = document.querySelector('.content');
    if (!content || document.getElementById('upzy-healthbar')) return;
    const bar = document.createElement('div');
    bar.id = 'upzy-healthbar';
    bar.className = 'upzy-healthbar';
    bar.innerHTML = '<span class="upzy-health-chip warn"><i class="ti ti-loader"></i>Verificando sistema...</span>';
    const command = document.getElementById('upzy-command-center');
    if (command) command.after(bar); else content.prepend(bar);

    try {
      const token = sessionStorage.getItem('upzy_token');
      const [health, cart] = await Promise.allSettled([
        fetch('/health').then(r => r.json()),
        fetch('/api/automations/cart-recovery', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : null)
      ]);
      const h = health.status === 'fulfilled' ? health.value : null;
      const c = cart.status === 'fulfilled' ? cart.value : null;
      bar.innerHTML = `
        <span class="upzy-health-chip ${h?.status === 'ok' ? 'ok' : 'bad'}"><i class="ti ti-server"></i>Backend ${h?.status === 'ok' ? 'OK' : 'Error'}</span>
        <span class="upzy-health-chip ${h?.channels?.shopify ? 'ok' : 'warn'}"><i class="ti ti-brand-shopify"></i>Shopify ${h?.channels?.shopify ? 'activo' : 'revisar'}</span>
        <span class="upzy-health-chip ${c?.activo !== false ? 'ok' : 'warn'}"><i class="ti ti-shopping-cart-bolt"></i>Carrito ${c ? (c.activo !== false ? 'activo' : 'pausado') : 'sin datos'}</span>
        <span class="upzy-health-chip ${h?.channels?.whatsapp ? 'ok' : 'warn'}"><i class="ti ti-brand-whatsapp"></i>WhatsApp ${h?.channels?.whatsapp ? 'OK' : 'OFF'}</span>`;
    } catch (err) {
      bar.innerHTML = `<span class="upzy-health-chip bad"><i class="ti ti-alert-triangle"></i>No pude verificar sistema</span>`;
    }
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function showError(message){
    let panel = document.getElementById('upzy-error-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'upzy-error-panel';
      panel.className = 'upzy-error-panel';
      document.body.appendChild(panel);
    }
    panel.innerHTML = `<div class="upzy-error-title"><i class="ti ti-alert-triangle"></i> Error detectado en dashboard</div><div class="upzy-error-text">${escapeHtml(message)}</div><button type="button" onclick="this.closest('.upzy-error-panel').classList.remove('show')">Cerrar</button>`;
    panel.classList.add('show');
  }

  function captureErrors(){
    if (window.__upzyProfessionalErrorCapture) return;
    window.__upzyProfessionalErrorCapture = true;
    window.addEventListener('error', (ev) => {
      const msg = ev.message || 'Error JS desconocido';
      if (/ResizeObserver loop|Script error/i.test(msg)) return;
      showError(`${msg}\n${ev.filename || ''}${ev.lineno ? ':' + ev.lineno : ''}`);
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = ev.reason?.message || ev.reason || 'Promesa rechazada sin detalle';
      showError(String(reason));
    });
  }

  function boot(){
    injectCss();
    captureErrors();
    addCommandCenter();
    addHealthBar();
    const obs = new MutationObserver(() => {
      addCommandCenter();
      addHealthBar();
    });
    obs.observe(document.body, { childList:true, subtree:true });
    setTimeout(() => obs.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
