(function(){
  'use strict';

  const STATE = {
    templates: [],
    filtered: [],
    selectedId: null,
    query: '',
    canal: '',
    categoria: '',
    loaded: false,
  };

  const SAMPLE = {
    nombre: 'María',
    producto: 'Panel LED Publicitario 100x50cm',
    productos: 'Panel LED Publicitario 100x50cm',
    precio: '$149.990',
    empresa: 'Cafetería Norte',
    negocio: 'cafetería',
    cart_url: 'https://www.klinge.cl/cart',
    checkout_url: 'https://www.klinge.cl/checkout',
    pedido: '#KLG-2048',
    descuento: '10%',
    fecha: 'hoy',
    ciudad: 'Santiago',
  };

  const ICONS = {
    whatsapp: 'ti-brand-whatsapp',
    email: 'ti-mail',
    instagram: 'ti-brand-instagram',
    sms: 'ti-message',
    default: 'ti-template'
  };

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function attr(value){ return esc(value).replace(/`/g, '&#96;'); }

  function stripHtml(value){
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function truncate(value, n){
    const text = String(value || '').trim();
    return text.length > n ? text.slice(0, n - 1).trim() + '…' : text;
  }

  function normalizeCanal(value){ return String(value || 'whatsapp').toLowerCase(); }
  function getCanal(t){ return normalizeCanal(t.canal || t.tipo || t.channel); }
  function getCategoria(t){ return String(t.categoria || 'general').toLowerCase(); }
  function getCuerpo(t){ return t.cuerpo || t.html || t.body || ''; }
  function getAsunto(t){ return t.asunto || t.subject || ''; }
  function isEmail(t){ return getCanal(t) === 'email'; }
  function hasHtml(t){ return /<\s*(html|body|table|div|section|p|h1|h2|img|a|br|span)\b/i.test(getCuerpo(t)); }

  function variablesFrom(t){
    let vars = t.variables || [];
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch { vars = vars.split(','); }
    }
    if (!Array.isArray(vars)) vars = [];
    const found = (getCuerpo(t).match(/\[([^\]]+)\]/g) || []).map(v => v.slice(1, -1));
    return [...new Set([...vars, ...found].map(v => String(v || '').trim()).filter(Boolean))];
  }

  function replaceVars(raw, template){
    let out = String(raw || '');
    const vars = variablesFrom(template);
    vars.forEach(v => {
      const value = SAMPLE[v] || SAMPLE[v.toLowerCase()] || `[${v}]`;
      out = out.replaceAll(`[${v}]`, value).replaceAll(`{{${v}}}`, value);
    });
    return out;
  }

  function injectStyles(){
    if (document.getElementById('klinge-template-polish-style')) return;
    const css = `
      #vw-templates{--kt-red:#e52929;--kt-red2:#ff4b4b;--kt-red-dim:#e529291a;--kt-black:#05070a;--kt-card:#121820;--kt-card2:#161d26;--kt-line:#27313d;--kt-text:#f4f7fb;--kt-muted:#93a0ad;--kt-soft:#d9e2ec;--kt-white:#fff;}
      .kt-page{display:flex;flex-direction:column;gap:16px;min-height:calc(100vh - 88px);}
      .kt-hero{border:1px solid var(--kt-line);background:linear-gradient(135deg,#111821 0%,#0c1016 58%,#211012 100%);border-radius:18px;padding:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;box-shadow:0 18px 45px #00000026;}
      .kt-kicker{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#ff8d8d;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:8px;}
      .kt-hero h2{font-size:24px;line-height:1.1;margin:0 0 8px;color:var(--kt-text);letter-spacing:-.02em;}
      .kt-hero p{margin:0;color:var(--kt-muted);font-size:13px;max-width:760px;line-height:1.6;}
      .kt-hero-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;}
      .kt-btn{border:1px solid var(--kt-line);background:#171f29;color:var(--kt-text);border-radius:10px;height:36px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:all .16s ease;text-decoration:none;white-space:nowrap;}
      .kt-btn:hover{transform:translateY(-1px);border-color:#3a4858;background:#1d2632;}
      .kt-btn.primary{background:var(--kt-red);border-color:var(--kt-red);color:#fff;box-shadow:0 8px 25px #e5292933;}
      .kt-btn.primary:hover{background:var(--kt-red2);border-color:var(--kt-red2);}
      .kt-btn.ghost{background:transparent;}
      .kt-btn.danger{border-color:#6d2525;color:#ff8585;background:#2a1113;}
      .kt-toolbar{border:1px solid var(--kt-line);background:#101720;border-radius:16px;padding:12px;display:grid;grid-template-columns:minmax(220px,1fr) 170px 190px auto;gap:10px;align-items:center;}
      .kt-input-wrap{position:relative;}
      .kt-input-wrap i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--kt-muted);font-size:16px;}
      .kt-toolbar input,.kt-toolbar select,.kt-field input,.kt-field select,.kt-field textarea{height:38px;border-radius:10px;border:1px solid var(--kt-line);background:#0d131b;color:var(--kt-text);font-size:13px;padding:0 12px;outline:none;width:100%;}
      .kt-input-wrap input{padding-left:36px;}
      .kt-field textarea{height:auto;min-height:220px;padding:12px;line-height:1.45;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;resize:vertical;}
      .kt-toolbar input:focus,.kt-toolbar select:focus,.kt-field input:focus,.kt-field select:focus,.kt-field textarea:focus{border-color:var(--kt-red);box-shadow:0 0 0 3px var(--kt-red-dim);}
      .kt-layout{display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:16px;align-items:start;}
      .kt-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
      .kt-card{border:1px solid var(--kt-line);background:linear-gradient(180deg,#141c25 0%,#101720 100%);border-radius:16px;padding:14px;cursor:pointer;transition:all .16s ease;min-height:172px;position:relative;overflow:hidden;}
      .kt-card:hover{border-color:#455566;transform:translateY(-1px);}
      .kt-card.active{border-color:var(--kt-red);box-shadow:0 0 0 3px var(--kt-red-dim);}
      .kt-card-top{display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;}
      .kt-ico{width:34px;height:34px;border-radius:10px;background:#0b1118;border:1px solid var(--kt-line);display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#ff6868;}
      .kt-title-wrap{min-width:0;flex:1;}
      .kt-title{font-size:14px;color:var(--kt-text);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;}
      .kt-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;}
      .kt-chip{height:20px;padding:0 7px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;border:1px solid #2a3542;color:#b7c2ce;background:#0c121a;}
      .kt-chip.email{border-color:#334d78;color:#8bbcff;background:#0d1b31;}.kt-chip.whatsapp{border-color:#1f5b3b;color:#70e3a0;background:#0b2116;}.kt-chip.off{border-color:#5c3030;color:#ff9c9c;background:#240f10;}.kt-chip.on{border-color:#2d5636;color:#88e19b;background:#0e2113;}
      .kt-subject{font-size:12px;color:#d8e2ee;font-weight:700;margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .kt-snippet{font-size:12px;color:var(--kt-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:12px;min-height:54px;}
      .kt-vars{display:flex;flex-wrap:wrap;gap:5px;min-height:22px;margin-bottom:12px;}
      .kt-var{font-size:10px;color:#c8d3df;background:#0a1017;border:1px solid #263342;border-radius:6px;padding:3px 6px;}
      .kt-card-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #25303c;padding-top:10px;}
      .kt-mini{font-size:11px;color:var(--kt-muted);display:flex;gap:10px;align-items:center;}
      .kt-icon-btn{border:1px solid var(--kt-line);background:#0e151e;color:#cbd6e2;border-radius:8px;height:28px;padding:0 8px;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;cursor:pointer;}
      .kt-icon-btn:hover{border-color:#4b5b6b;background:#141e29;}
      .kt-preview{position:sticky;top:0;border:1px solid var(--kt-line);background:#101720;border-radius:18px;overflow:hidden;box-shadow:0 20px 55px #00000029;}
      .kt-preview-head{padding:15px;border-bottom:1px solid var(--kt-line);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:#121a24;}
      .kt-preview-title{font-size:14px;font-weight:900;color:var(--kt-text);margin-bottom:5px;}
      .kt-preview-sub{font-size:11px;color:var(--kt-muted);line-height:1.4;}
      .kt-preview-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
      .kt-preview-body{padding:16px;max-height:calc(100vh - 265px);overflow:auto;}
      .kt-empty{border:1px dashed #2d3947;border-radius:16px;padding:46px 22px;text-align:center;color:var(--kt-muted);background:#0d131b;}
      .kt-empty i{font-size:36px;color:#4a5868;display:block;margin-bottom:10px;}
      .kt-frame-wrap{background:#f5f7fb;border-radius:14px;padding:12px;border:1px solid #e3e8ef;}
      .kt-frame-label{color:#52616f;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px;display:flex;align-items:center;justify-content:space-between;}
      .kt-email-frame{width:100%;height:560px;border:1px solid #d8dee7;background:white;border-radius:10px;display:block;}
      .kt-phone{max-width:330px;margin:0 auto;background:#060707;border:1px solid #202a24;border-radius:32px;padding:12px;box-shadow:0 20px 55px #00000055;}
      .kt-phone-screen{background:#0b141a;border-radius:24px;min-height:520px;padding:16px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;}
      .kt-phone-head{margin:-6px -4px 8px;padding:10px 12px;border-radius:18px;background:#121b22;color:#e9edef;font-size:12px;font-weight:800;display:flex;align-items:center;gap:8px;}
      .kt-wa-bubble{background:#202c33;color:#e9edef;border-radius:14px 14px 14px 4px;padding:12px;font-size:13px;line-height:1.55;white-space:pre-wrap;border:1px solid #2a3942;}
      .kt-wa-note{font-size:10px;color:#7b8b95;text-align:right;margin-top:8px;}
      .kt-code-preview{background:#0b1118;border:1px solid #273442;border-radius:12px;padding:14px;white-space:pre-wrap;color:#d8e2ee;font-size:12px;line-height:1.55;max-height:520px;overflow:auto;}
      .kt-loading{padding:34px;text-align:center;color:var(--kt-muted);border:1px dashed #2c3948;border-radius:16px;background:#0d131b;}
      .kt-modal-backdrop{position:fixed;inset:0;background:#000000b8;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999;}
      .kt-modal{width:min(860px,96vw);max-height:92vh;background:#101720;border:1px solid #33404d;border-radius:18px;box-shadow:0 30px 100px #00000080;display:flex;flex-direction:column;overflow:hidden;}
      .kt-modal.small{width:min(520px,94vw);}.kt-modal-head{padding:16px 18px;border-bottom:1px solid var(--kt-line);display:flex;align-items:center;justify-content:space-between;background:#131b25;}.kt-modal-title{font-size:16px;font-weight:900;color:var(--kt-text);}.kt-modal-body{padding:18px;overflow:auto;}.kt-modal-foot{padding:14px 18px;border-top:1px solid var(--kt-line);display:flex;justify-content:flex-end;gap:8px;background:#121a24;}
      .kt-form-grid{display:grid;grid-template-columns:1fr 170px 180px;gap:12px;}.kt-field{margin-bottom:14px;}.kt-field label{display:block;font-size:11px;color:var(--kt-muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;}.kt-hint{font-size:11px;color:var(--kt-muted);line-height:1.45;margin-top:6px;}
      .kt-toast{position:fixed;right:20px;bottom:20px;background:#111923;border:1px solid #33404d;border-radius:12px;color:#f4f7fb;padding:12px 14px;font-size:13px;font-weight:700;box-shadow:0 15px 45px #0000005c;z-index:10000;transform:translateY(20px);opacity:0;transition:all .2s ease;}.kt-toast.show{transform:translateY(0);opacity:1;}.kt-toast.ok{border-color:#245c35;color:#92e7a4}.kt-toast.err{border-color:#6b2a2a;color:#ff8c8c}
      @media(max-width:1280px){.kt-layout{grid-template-columns:1fr}.kt-preview{position:relative}.kt-preview-body{max-height:none}.kt-list{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:860px){.kt-hero{grid-template-columns:1fr}.kt-toolbar{grid-template-columns:1fr}.kt-list{grid-template-columns:1fr}.kt-form-grid{grid-template-columns:1fr}.kt-hero-actions{justify-content:flex-start}}
    `;
    const style = document.createElement('style');
    style.id = 'klinge-template-polish-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function enhanceTemplates(){
    const root = document.getElementById('vw-templates');
    if (!root || root.dataset.klingeTemplatesPolished === '1') return false;
    root.dataset.klingeTemplatesPolished = '1';
    injectStyles();
    root.innerHTML = `
      <div class="kt-page">
        <div class="kt-hero">
          <div>
            <div class="kt-kicker"><i class="ti ti-sparkles"></i> Plantillas de mensajes</div>
            <h2>Biblioteca limpia para WhatsApp, Email y automatizaciones</h2>
            <p>Vista previa controlada, edición rápida y tarjetas compactas. El HTML ya no se renderiza dentro de la grilla: se previsualiza en un panel dedicado para revisar antes de usar o enviar prueba.</p>
          </div>
          <div class="kt-hero-actions">
            <button class="kt-btn ghost" type="button" data-kt-action="reload"><i class="ti ti-refresh"></i>Actualizar</button>
            <button class="kt-btn primary" type="button" data-kt-action="new"><i class="ti ti-plus"></i>Nueva plantilla</button>
          </div>
        </div>
        <div class="kt-toolbar">
          <div class="kt-input-wrap"><i class="ti ti-search"></i><input id="kt-search" placeholder="Buscar por nombre, asunto o contenido"></div>
          <select id="kt-canal"><option value="">Todos los canales</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="sms">SMS</option></select>
          <select id="kt-categoria"><option value="">Todas las categorías</option></select>
          <button class="kt-btn" type="button" data-kt-action="reload"><i class="ti ti-refresh"></i>Recargar</button>
        </div>
        <div class="kt-layout">
          <div id="kt-list" class="kt-list"><div class="kt-loading">Cargando plantillas...</div></div>
          <aside id="kt-preview" class="kt-preview"></aside>
        </div>
      </div>`;
    bindRoot(root);
    loadTemplatesPro();
    return true;
  }

  function bindRoot(root){
    root.addEventListener('click', (ev) => {
      const action = ev.target.closest('[data-kt-action]')?.dataset.ktAction;
      if (!action) return;
      ev.preventDefault(); ev.stopPropagation();
      const id = ev.target.closest('[data-id]')?.dataset.id;
      const t = id ? STATE.templates.find(x => String(x.id) === String(id)) : null;
      if (action === 'reload') loadTemplatesPro(true);
      if (action === 'new') openEditor();
      if (action === 'select' && t) selectTemplate(t.id);
      if (action === 'edit' && t) openEditor(t);
      if (action === 'copy' && t) copyTemplate(t);
      if (action === 'test' && t) openTestModal(t);
    });
    root.querySelector('#kt-search')?.addEventListener('input', ev => { STATE.query = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kt-canal')?.addEventListener('change', ev => { STATE.canal = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kt-categoria')?.addEventListener('change', ev => { STATE.categoria = ev.target.value || ''; applyFilters(); });
  }

  async function loadTemplatesPro(force){
    const list = document.getElementById('kt-list');
    const preview = document.getElementById('kt-preview');
    if (!list) return;
    if (!STATE.loaded || force) list.innerHTML = '<div class="kt-loading">Cargando plantillas...</div>';
    if (preview && !STATE.selectedId) preview.innerHTML = previewEmpty();
    try{
      const res = await fetch('/api/templates', {headers:{'Accept':'application/json'}});
      if (!res.ok) throw new Error(await res.text());
      STATE.templates = await res.json();
      STATE.loaded = true;
      buildCategories();
      applyFilters();
    }catch(err){
      console.error('[templates-polish]', err);
      list.innerHTML = `<div class="kt-empty"><i class="ti ti-alert-circle"></i><strong>No pude cargar las plantillas</strong><br><span>${esc(err.message || err)}</span></div>`;
    }
  }

  function buildCategories(){
    const select = document.getElementById('kt-categoria');
    if (!select) return;
    const current = select.value;
    const cats = [...new Set(STATE.templates.map(getCategoria).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option value="${attr(c)}">${esc(label(c))}</option>`).join('');
    select.value = cats.includes(current) ? current : '';
    STATE.categoria = select.value;
  }

  function label(value){
    return String(value || 'General').replace(/[_-]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }

  function applyFilters(){
    const q = STATE.query.toLowerCase().trim();
    STATE.filtered = STATE.templates.filter(t => {
      if (STATE.canal && getCanal(t) !== STATE.canal) return false;
      if (STATE.categoria && getCategoria(t) !== STATE.categoria) return false;
      if (!q) return true;
      const haystack = [t.nombre, getAsunto(t), stripHtml(getCuerpo(t)), getCanal(t), getCategoria(t)].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    if (!STATE.selectedId || !STATE.filtered.some(t => String(t.id) === String(STATE.selectedId))) {
      STATE.selectedId = STATE.filtered[0]?.id || null;
    }
    renderList();
    renderSelectedPreview();
  }

  function renderList(){
    const list = document.getElementById('kt-list');
    if (!list) return;
    if (!STATE.filtered.length) {
      list.innerHTML = '<div class="kt-empty"><i class="ti ti-template-off"></i><strong>No hay plantillas para este filtro</strong><br><span>Prueba cambiar búsqueda, canal o categoría.</span></div>';
      return;
    }
    list.innerHTML = STATE.filtered.map(cardHtml).join('');
  }

  function cardHtml(t){
    const canal = getCanal(t);
    const categoria = getCategoria(t);
    const vars = variablesFrom(t);
    const cuerpo = getCuerpo(t);
    const snippetSource = hasHtml(t) ? stripHtml(cuerpo) : cuerpo;
    const active = t.activo === false ? 'off' : 'on';
    const icon = ICONS[canal] || ICONS.default;
    return `
      <article class="kt-card ${String(t.id) === String(STATE.selectedId) ? 'active' : ''}" data-id="${attr(t.id)}" data-kt-action="select">
        <div class="kt-card-top">
          <div class="kt-ico"><i class="ti ${icon}"></i></div>
          <div class="kt-title-wrap">
            <div class="kt-title" title="${attr(t.nombre)}">${esc(t.nombre || 'Sin nombre')}</div>
            <div class="kt-meta"><span class="kt-chip ${canal}">${esc(canal)}</span><span class="kt-chip">${esc(label(categoria))}</span><span class="kt-chip ${active}">${active === 'on' ? 'Activo' : 'Inactivo'}</span></div>
          </div>
        </div>
        ${getAsunto(t) ? `<p class="kt-subject">${esc(getAsunto(t))}</p>` : ''}
        <div class="kt-snippet">${esc(truncate(snippetSource, 210))}</div>
        <div class="kt-vars">${vars.slice(0,5).map(v => `<span class="kt-var">[${esc(v)}]</span>`).join('')}${vars.length > 5 ? `<span class="kt-var">+${vars.length - 5}</span>` : ''}</div>
        <div class="kt-card-actions">
          <div class="kt-mini"><span><i class="ti ti-variable"></i> ${vars.length}</span><span><i class="ti ti-click"></i> ${t.usos || 0}</span></div>
          <div style="display:flex;gap:6px">
            <button class="kt-icon-btn" type="button" data-kt-action="copy" title="Copiar"><i class="ti ti-copy"></i></button>
            <button class="kt-icon-btn" type="button" data-kt-action="edit" title="Editar"><i class="ti ti-edit"></i>Editar</button>
          </div>
        </div>
      </article>`;
  }

  function previewEmpty(){
    return `<div class="kt-preview-head"><div><div class="kt-preview-title">Vista previa</div><div class="kt-preview-sub">Selecciona una plantilla para revisar contenido, variables y acciones.</div></div></div><div class="kt-preview-body"><div class="kt-empty"><i class="ti ti-eye"></i>Sin plantilla seleccionada</div></div>`;
  }

  function selectTemplate(id){
    STATE.selectedId = id;
    renderList();
    renderSelectedPreview();
  }

  function renderSelectedPreview(){
    const t = STATE.templates.find(x => String(x.id) === String(STATE.selectedId));
    const target = document.getElementById('kt-preview');
    if (!target) return;
    if (!t) { target.innerHTML = previewEmpty(); return; }
    const canal = getCanal(t);
    const vars = variablesFrom(t);
    target.innerHTML = `
      <div class="kt-preview-head">
        <div style="min-width:0">
          <div class="kt-preview-title">${esc(t.nombre || 'Plantilla')}</div>
          <div class="kt-preview-sub">${esc(label(getCategoria(t)))} · ${esc(canal)} · ${vars.length} variables</div>
        </div>
        <div class="kt-preview-actions">
          ${isEmail(t) ? `<button class="kt-icon-btn" type="button" data-id="${attr(t.id)}" data-kt-action="test"><i class="ti ti-send"></i>Prueba</button>` : ''}
          <button class="kt-icon-btn" type="button" data-id="${attr(t.id)}" data-kt-action="copy"><i class="ti ti-copy"></i></button>
          <button class="kt-icon-btn" type="button" data-id="${attr(t.id)}" data-kt-action="edit"><i class="ti ti-edit"></i>Editar</button>
        </div>
      </div>
      <div class="kt-preview-body" id="kt-preview-body"><div class="kt-loading">Preparando vista previa...</div></div>`;
    if (isEmail(t)) renderEmailPreview(t); else renderMessagePreview(t);
  }

  async function renderEmailPreview(t){
    const body = document.getElementById('kt-preview-body');
    if (!body) return;
    let html = replaceVars(getCuerpo(t), t);
    let asunto = replaceVars(getAsunto(t), t);
    try{
      const res = await fetch('/api/email/preview', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template_id:t.id,datos:SAMPLE})});
      if (res.ok) {
        const data = await res.json();
        html = data.html || html;
        asunto = data.asunto || asunto;
      }
    } catch(err){ console.warn('[templates-polish] preview fallback', err); }
    if (!hasHtml({...t, cuerpo: html})) html = `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111;padding:28px;white-space:pre-wrap">${esc(html)}</div>`;
    body.innerHTML = `
      <div class="kt-frame-wrap">
        <div class="kt-frame-label"><span>Preview email</span><span>${esc(asunto || 'Sin asunto')}</span></div>
        <iframe class="kt-email-frame" sandbox srcdoc="${attr(html)}"></iframe>
      </div>`;
  }

  function renderMessagePreview(t){
    const body = document.getElementById('kt-preview-body');
    if (!body) return;
    const text = replaceVars(hasHtml(t) ? stripHtml(getCuerpo(t)) : getCuerpo(t), t);
    body.innerHTML = `
      <div class="kt-phone">
        <div class="kt-phone-screen">
          <div class="kt-phone-head"><i class="ti ti-brand-whatsapp"></i> Klinge</div>
          <div class="kt-wa-bubble">${esc(text)}</div>
          <div class="kt-wa-note">Vista previa con datos de ejemplo</div>
        </div>
      </div>`;
  }

  function copyTemplate(t){
    const value = replaceVars(hasHtml(t) ? stripHtml(getCuerpo(t)) : getCuerpo(t), t);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(() => toast('Plantilla copiada', 'ok')).catch(() => fallbackCopy(value));
    else fallbackCopy(value);
  }

  function fallbackCopy(value){
    const ta = document.createElement('textarea');
    ta.value = value; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast('Plantilla copiada', 'ok'); }catch{ toast('No pude copiar', 'err'); }
    ta.remove();
  }

  function openEditor(t){
    const isEdit = !!t;
    const vars = variablesFrom(t || {}).join(', ');
    const modal = document.createElement('div');
    modal.className = 'kt-modal-backdrop';
    modal.innerHTML = `
      <div class="kt-modal">
        <div class="kt-modal-head"><div class="kt-modal-title">${isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</div><button class="kt-icon-btn" type="button" data-close><i class="ti ti-x"></i></button></div>
        <div class="kt-modal-body">
          <div class="kt-form-grid">
            <div class="kt-field"><label>Nombre</label><input id="kt-f-nombre" value="${attr(t?.nombre || '')}" placeholder="Ej: Carrito abandonado"></div>
            <div class="kt-field"><label>Canal</label><select id="kt-f-canal"><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="instagram">Instagram</option><option value="sms">SMS</option></select></div>
            <div class="kt-field"><label>Categoría</label><input id="kt-f-categoria" value="${attr(t?.categoria || 'general')}" placeholder="carrito, bienvenida..."></div>
          </div>
          <div class="kt-field"><label>Asunto / título interno</label><input id="kt-f-asunto" value="${attr(getAsunto(t || {}))}" placeholder="Solo para email o referencia interna"></div>
          <div class="kt-field"><label>Contenido</label><textarea id="kt-f-cuerpo" placeholder="Usa variables como [nombre], [producto], [cart_url]">${esc(getCuerpo(t || {}))}</textarea><div class="kt-hint">Para email puedes pegar HTML completo. En la grilla se mostrará resumido y la vista real quedará en el panel de preview.</div></div>
          <div class="kt-field"><label>Variables</label><input id="kt-f-vars" value="${attr(vars)}" placeholder="nombre, producto, cart_url"><div class="kt-hint">También se detectan automáticamente desde el contenido usando [variable].</div></div>
        </div>
        <div class="kt-modal-foot"><button class="kt-btn ghost" type="button" data-close>Cancelar</button><button class="kt-btn primary" type="button" data-save>${isEdit ? 'Guardar cambios' : 'Crear plantilla'}</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#kt-f-canal').value = getCanal(t || {canal:'whatsapp'});
    modal.addEventListener('click', async ev => {
      if (ev.target.closest('[data-close]')) modal.remove();
      if (ev.target.closest('[data-save]')) {
        const payload = {
          nombre: modal.querySelector('#kt-f-nombre').value.trim(),
          canal: modal.querySelector('#kt-f-canal').value,
          categoria: modal.querySelector('#kt-f-categoria').value.trim() || 'general',
          asunto: modal.querySelector('#kt-f-asunto').value.trim() || null,
          cuerpo: modal.querySelector('#kt-f-cuerpo').value,
          variables: modal.querySelector('#kt-f-vars').value.split(',').map(x=>x.trim()).filter(Boolean),
        };
        if (!payload.nombre || !payload.cuerpo.trim()) { toast('Nombre y contenido son obligatorios', 'err'); return; }
        try{
          const res = await fetch(isEdit ? `/api/templates/${encodeURIComponent(t.id)}` : '/api/templates', {method:isEdit?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
          if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar');
          modal.remove(); toast(isEdit ? 'Plantilla actualizada' : 'Plantilla creada', 'ok'); await loadTemplatesPro(true);
        }catch(err){ toast(err.message || 'Error al guardar', 'err'); }
      }
    });
  }

  function openTestModal(t){
    const modal = document.createElement('div');
    modal.className = 'kt-modal-backdrop';
    modal.innerHTML = `
      <div class="kt-modal small">
        <div class="kt-modal-head"><div class="kt-modal-title">Enviar email de prueba</div><button class="kt-icon-btn" type="button" data-close><i class="ti ti-x"></i></button></div>
        <div class="kt-modal-body">
          <div class="kt-field"><label>Destinatarios</label><input id="kt-test-to" placeholder="correo@klinge.cl, otro@klinge.cl"><div class="kt-hint">Puedes separar varios correos con coma. Se enviará usando datos de ejemplo.</div></div>
          <div class="kt-empty" style="padding:18px;text-align:left"><strong>${esc(t.nombre)}</strong><br><span>${esc(getAsunto(t) || 'Sin asunto')}</span></div>
        </div>
        <div class="kt-modal-foot"><button class="kt-btn ghost" type="button" data-close>Cancelar</button><button class="kt-btn primary" type="button" data-send><i class="ti ti-send"></i>Enviar prueba</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', async ev => {
      if (ev.target.closest('[data-close]')) modal.remove();
      if (ev.target.closest('[data-send]')) {
        const destinatarios = modal.querySelector('#kt-test-to').value.split(',').map(x=>x.trim()).filter(Boolean);
        if (!destinatarios.length) { toast('Agrega al menos un destinatario', 'err'); return; }
        try{
          const res = await fetch('/api/email/test', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template_id:t.id,destinatarios,datos:SAMPLE})});
          if (!res.ok) throw new Error((await res.json()).error || 'No se pudo enviar la prueba');
          modal.remove(); toast('Email de prueba enviado', 'ok');
        }catch(err){ toast(err.message || 'Error al enviar prueba', 'err'); }
      }
    });
  }

  function toast(msg, type){
    const el = document.createElement('div');
    el.className = `kt-toast ${type || ''}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(), 250);}, 2600);
  }

  function boot(){
    if (enhanceTemplates()) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (enhanceTemplates() || tries > 40) clearInterval(timer);
    }, 250);
    const obs = new MutationObserver(() => enhanceTemplates());
    obs.observe(document.body, {childList:true, subtree:true});
    setTimeout(()=>obs.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
