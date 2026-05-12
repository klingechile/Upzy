(function(){
  'use strict';

  const STATE = {
    templates: [],
    filtered: [],
    selectedId: null,
    query: '',
    canal: '',
    categoria: '',
    etapa: '',
    objetivo: '',
    estado: '',
    tab: 'preview',
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
    ejecutivo: 'Equipo Klinge',
    whatsapp: '+56 9 6467 2810'
  };

  const STAGE_OPTIONS = [
    ['captacion', 'Captación'],
    ['consideracion', 'Consideración'],
    ['cotizacion', 'Cotización'],
    ['seguimiento', 'Seguimiento'],
    ['cierre', 'Cierre'],
    ['postventa', 'Postventa'],
    ['reactivacion', 'Reactivación']
  ];

  const OBJECTIVE_OPTIONS = [
    ['captar', 'Captar'],
    ['nutrir', 'Nutrir'],
    ['recuperar', 'Recuperar'],
    ['confirmar', 'Confirmar'],
    ['cerrar', 'Cerrar'],
    ['fidelizar', 'Fidelizar']
  ];

  const ICONS = {
    whatsapp: 'ti-brand-whatsapp',
    email: 'ti-mail',
    instagram: 'ti-brand-instagram',
    sms: 'ti-message',
    default: 'ti-template'
  };

  const CHANNEL_LABELS = {
    whatsapp: 'WhatsApp',
    email: 'Email',
    instagram: 'Instagram',
    sms: 'SMS'
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

  function money(n){
    return new Intl.NumberFormat('es-CL').format(Number(n || 0));
  }

  function normalize(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function label(value){
    return String(value || 'General').replace(/[_-]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }

  function getCanal(t){ return normalize(t.canal || t.tipo || t.channel || 'whatsapp'); }
  function getCategoria(t){ return normalize(t.categoria || 'general') || 'general'; }
  function getCuerpo(t){ return t.cuerpo || t.html || t.body || ''; }
  function getAsunto(t){ return t.asunto || t.subject || ''; }
  function isEmail(t){ return getCanal(t) === 'email'; }
  function hasHtml(t){ return /<\s*(html|body|table|div|section|p|h1|h2|img|a|br|span|strong|button)\b/i.test(getCuerpo(t)); }

  function variablesFrom(t){
    let vars = t.variables || [];
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch { vars = vars.split(','); }
    }
    if (!Array.isArray(vars)) vars = [];
    const foundSquare = (getCuerpo(t).match(/\[([^\]]+)\]/g) || []).map(v => v.slice(1, -1));
    const foundBraces = (getCuerpo(t).match(/\{\{([^}]+)\}\}/g) || []).map(v => v.slice(2, -2));
    return [...new Set([...vars, ...foundSquare, ...foundBraces].map(v => String(v || '').trim()).filter(Boolean))];
  }

  function replaceVars(raw, template){
    let out = String(raw || '');
    variablesFrom(template).forEach(v => {
      const key = normalize(v).replace(/\s+/g, '_');
      const value = SAMPLE[v] || SAMPLE[key] || SAMPLE[String(v).toLowerCase()] || '[' + v + ']';
      out = out.replaceAll('[' + v + ']', value).replaceAll('{{' + v + '}}', value);
    });
    return out;
  }

  function inferStage(t){
    const hay = normalize([t.nombre, getCategoria(t), getAsunto(t), stripHtml(getCuerpo(t))].join(' '));
    if (/carrito|abandon|recupera|checkout/.test(hay)) return 'reactivacion';
    if (/cotiza|cotizacion|presupuesto|propuesta|precio/.test(hay)) return 'cotizacion';
    if (/seguimiento|follow|pendiente|respuesta/.test(hay)) return 'seguimiento';
    if (/cierre|cerrar|descuento|oferta|ultima|reserva|abono/.test(hay)) return 'cierre';
    if (/compra|pedido|confirmacion|confirmado|postventa|garantia/.test(hay)) return 'postventa';
    if (/bienvenida|saludo|catalogo|producto/.test(hay)) return 'captacion';
    return 'consideracion';
  }

  function inferObjective(t){
    const stage = inferStage(t);
    const map = { captacion:'captar', consideracion:'nutrir', cotizacion:'cerrar', seguimiento:'cerrar', cierre:'cerrar', postventa:'fidelizar', reactivacion:'recuperar' };
    return map[stage] || 'nutrir';
  }

  function getStatus(t){ return t.activo === false ? 'pausada' : 'activa'; }
  function isActive(t){ return t.activo !== false; }

  function getScore(t){
    const text = normalize([getAsunto(t), stripHtml(getCuerpo(t))].join(' '));
    let score = 54;
    if (/(compra|cotiza|finaliza|reserva|agenda|responde|whatsapp|aqui|link)/.test(text)) score += 14;
    if (/(48|72|garantia|clientes|stock|despacho|iva|abono|30%|ano|año)/.test(text)) score += 12;
    if (/(descuento|oferta|hoy|ultima|limitad|pendiente|carrito)/.test(text)) score += 10;
    if (variablesFrom(t).length >= 2) score += 5;
    if (isEmail(t) && hasHtml(t)) score += 5;
    if (!isActive(t)) score -= 10;
    return Math.max(30, Math.min(98, score));
  }

  function scoreLabel(score){
    if (score >= 82) return 'Alta conversión';
    if (score >= 68) return 'Buen potencial';
    return 'Optimizable';
  }

  function channelLabel(canal){ return CHANNEL_LABELS[canal] || label(canal || 'WhatsApp'); }

  function injectStyles(){
    if (document.getElementById('klinge-template-conversion-style')) return;
    const css = `
      #vw-templates{--kc-red:#e1251b;--kc-red2:#ff3b30;--kc-red3:#ff6b61;--kc-red-soft:rgba(225,37,27,.16);--kc-bg:#07090d;--kc-bg2:#0b0f16;--kc-panel:#111722;--kc-panel2:#151d2a;--kc-card:#121a27;--kc-card2:#0f1520;--kc-border:#283344;--kc-border2:#39475b;--kc-text:#f8fafc;--kc-muted:#94a3b8;--kc-muted2:#64748b;--kc-white:#fff;--kc-green:#22c55e;--kc-yellow:#f59e0b;--kc-blue:#3b82f6;--kc-pink:#e1306c;--kc-shadow:0 22px 70px rgba(0,0,0,.38);}
      #vw-templates .kc-page{display:flex;flex-direction:column;gap:16px;min-height:calc(100vh - 88px);}
      #vw-templates .kc-hero{position:relative;overflow:hidden;border:1px solid rgba(225,37,27,.28);border-radius:22px;background:radial-gradient(circle at 78% 10%,rgba(225,37,27,.34),transparent 28%),linear-gradient(135deg,#111722 0%,#080a0f 54%,#1b0c0c 100%);box-shadow:var(--kc-shadow);padding:24px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;}
      #vw-templates .kc-hero:before{content:'';position:absolute;inset:auto -90px -120px auto;width:360px;height:360px;background:radial-gradient(circle,rgba(255,59,48,.22),transparent 64%);pointer-events:none;}
      #vw-templates .kc-kicker{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffb0aa;font-weight:900;display:flex;align-items:center;gap:8px;margin-bottom:9px;}
      #vw-templates .kc-title{font-size:28px;line-height:1.06;margin:0 0 9px;color:var(--kc-text);letter-spacing:-.035em;font-weight:950;}
      #vw-templates .kc-copy{margin:0;color:#bdc7d4;font-size:13px;line-height:1.62;max-width:820px;}
      #vw-templates .kc-hero-actions{position:relative;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;}
      #vw-templates .kc-btn{height:38px;border-radius:12px;border:1px solid var(--kc-border);background:#151d2a;color:var(--kc-text);padding:0 13px;font-size:12px;font-weight:850;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:all .16s ease;text-decoration:none;white-space:nowrap;}
      #vw-templates .kc-btn:hover{transform:translateY(-1px);border-color:var(--kc-border2);background:#1b2535;}
      #vw-templates .kc-btn.primary{border-color:var(--kc-red);background:linear-gradient(135deg,var(--kc-red),var(--kc-red2));color:white;box-shadow:0 14px 35px rgba(225,37,27,.32);}
      #vw-templates .kc-btn.primary:hover{filter:brightness(1.05);}
      #vw-templates .kc-btn.ghost{background:rgba(255,255,255,.03);}
      #vw-templates .kc-btn.danger{background:rgba(225,37,27,.12);border-color:rgba(225,37,27,.45);color:#ffaaa4;}
      #vw-templates .kc-btn.green{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.34);color:#97f3b6;}
      #vw-templates .kc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
      #vw-templates .kc-metric{border:1px solid var(--kc-border);background:linear-gradient(180deg,#121a27,#0d131d);border-radius:16px;padding:14px;position:relative;overflow:hidden;}
      #vw-templates .kc-metric:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--m,var(--kc-red));}
      #vw-templates .kc-metric-label{font-size:11px;color:var(--kc-muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em;display:flex;gap:6px;align-items:center;margin-bottom:7px;}
      #vw-templates .kc-metric-value{font-size:25px;font-weight:950;color:var(--kc-text);letter-spacing:-.04em;}
      #vw-templates .kc-metric-sub{font-size:11px;color:var(--kc-muted2);margin-top:2px;}
      #vw-templates .kc-toolbar{border:1px solid var(--kc-border);background:rgba(17,23,34,.94);border-radius:18px;padding:12px;display:grid;grid-template-columns:minmax(220px,1.35fr) 145px 170px 165px 145px auto;gap:10px;align-items:center;box-shadow:0 12px 40px rgba(0,0,0,.18);}
      #vw-templates .kc-input-wrap{position:relative;}
      #vw-templates .kc-input-wrap i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--kc-muted2);font-size:17px;}
      #vw-templates input,#vw-templates select,#vw-templates textarea{height:39px;border-radius:12px;border:1px solid var(--kc-border);background:#080d14;color:var(--kc-text);font-size:13px;padding:0 12px;outline:none;width:100%;font-family:inherit;}
      #vw-templates .kc-input-wrap input{padding-left:38px;}
      #vw-templates input:focus,#vw-templates select:focus,#vw-templates textarea:focus{border-color:var(--kc-red);box-shadow:0 0 0 3px var(--kc-red-soft);}
      #vw-templates .kc-layout{display:grid;grid-template-columns:minmax(0,1fr) 455px;gap:16px;align-items:start;}
      #vw-templates .kc-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;}
      #vw-templates .kc-card{position:relative;overflow:hidden;border:1px solid var(--kc-border);border-radius:18px;background:linear-gradient(180deg,#131c2a,#0d131d);padding:15px;min-height:218px;cursor:pointer;transition:all .16s ease;}
      #vw-templates .kc-card:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(225,37,27,.11),transparent 35%);opacity:0;transition:opacity .16s ease;pointer-events:none;}
      #vw-templates .kc-card:hover{transform:translateY(-2px);border-color:#46566c;box-shadow:0 18px 45px rgba(0,0,0,.25);}
      #vw-templates .kc-card:hover:before,#vw-templates .kc-card.active:before{opacity:1;}
      #vw-templates .kc-card.active{border-color:var(--kc-red);box-shadow:0 0 0 3px var(--kc-red-soft),0 20px 52px rgba(0,0,0,.28);}
      #vw-templates .kc-card-head{position:relative;display:flex;gap:11px;align-items:flex-start;margin-bottom:12px;}
      #vw-templates .kc-ico{width:38px;height:38px;border-radius:13px;background:#090e16;border:1px solid var(--kc-border);display:flex;align-items:center;justify-content:center;color:#ff7067;font-size:18px;flex:0 0 auto;}
      #vw-templates .kc-card-title{font-size:15px;color:var(--kc-text);font-weight:950;line-height:1.18;margin:0 0 6px;letter-spacing:-.015em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      #vw-templates .kc-badges{display:flex;gap:6px;flex-wrap:wrap;}
      #vw-templates .kc-badge{height:21px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:900;letter-spacing:.03em;text-transform:uppercase;border:1px solid #334052;color:#cbd5e1;background:#0a1018;}
      #vw-templates .kc-badge.whatsapp{border-color:rgba(34,197,94,.28);color:#8df5ae;background:rgba(34,197,94,.08);}#vw-templates .kc-badge.email{border-color:rgba(59,130,246,.36);color:#9bc1ff;background:rgba(59,130,246,.10);}#vw-templates .kc-badge.instagram{border-color:rgba(225,48,108,.36);color:#ff99bd;background:rgba(225,48,108,.10);}#vw-templates .kc-badge.active{border-color:rgba(34,197,94,.34);color:#8df5ae;background:rgba(34,197,94,.10);}#vw-templates .kc-badge.paused{border-color:rgba(245,158,11,.34);color:#ffd18a;background:rgba(245,158,11,.10);}#vw-templates .kc-badge.close{border-color:rgba(225,37,27,.45);color:#ffaaa4;background:rgba(225,37,27,.12);}
      #vw-templates .kc-objective{position:relative;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid rgba(225,37,27,.18);background:rgba(225,37,27,.07);border-radius:14px;padding:10px 11px;margin-bottom:11px;}
      #vw-templates .kc-objective strong{display:block;font-size:12px;color:#fff;font-weight:950;margin-bottom:3px;}
      #vw-templates .kc-objective span{font-size:11px;color:#ffbbb6;line-height:1.35;}
      #vw-templates .kc-score{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--kc-red) calc(var(--score)*1%),#263244 0);position:relative;color:#fff;font-size:12px;font-weight:950;}
      #vw-templates .kc-score:after{content:'';position:absolute;inset:5px;border-radius:50%;background:#111722;}#vw-templates .kc-score b{position:relative;z-index:1;}
      #vw-templates .kc-subject{font-size:12px;color:#dde7f2;font-weight:850;margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #vw-templates .kc-snippet{font-size:12px;color:var(--kc-muted);line-height:1.52;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:55px;margin-bottom:12px;}
      #vw-templates .kc-vars{display:flex;gap:5px;flex-wrap:wrap;min-height:23px;margin-bottom:12px;}
      #vw-templates .kc-var{font-size:10px;color:#cbd5e1;background:#080e15;border:1px solid #263244;border-radius:7px;padding:4px 7px;}
      #vw-templates .kc-card-actions{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #253044;padding-top:11px;}
      #vw-templates .kc-mini{font-size:11px;color:var(--kc-muted2);display:flex;align-items:center;gap:10px;white-space:nowrap;}
      #vw-templates .kc-icon-btn{height:30px;border-radius:10px;border:1px solid var(--kc-border);background:#0b111a;color:#dce6f1;font-size:11px;font-weight:850;padding:0 9px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;}
      #vw-templates .kc-icon-btn:hover{border-color:#49596e;background:#121b29;}
      #vw-templates .kc-icon-btn.red{border-color:rgba(225,37,27,.44);background:rgba(225,37,27,.12);color:#ffaaa4;}
      #vw-templates .kc-preview{position:sticky;top:0;border:1px solid var(--kc-border);border-radius:22px;background:linear-gradient(180deg,#121a27,#0b1018);overflow:hidden;box-shadow:var(--kc-shadow);}
      #vw-templates .kc-preview-head{padding:16px;border-bottom:1px solid var(--kc-border);background:linear-gradient(135deg,#141d2b,#0c111a);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
      #vw-templates .kc-preview-title{font-size:16px;color:#fff;font-weight:950;line-height:1.18;margin-bottom:6px;}
      #vw-templates .kc-preview-sub{font-size:11px;color:var(--kc-muted);line-height:1.45;}
      #vw-templates .kc-preview-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;}
      #vw-templates .kc-tabs{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid var(--kc-border);background:#0d131d;}
      #vw-templates .kc-tab{height:31px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--kc-muted);font-size:11px;font-weight:850;padding:0 10px;cursor:pointer;}
      #vw-templates .kc-tab.active{background:rgba(225,37,27,.13);border-color:rgba(225,37,27,.35);color:#fff;}
      #vw-templates .kc-preview-body{padding:16px;max-height:calc(100vh - 280px);overflow:auto;}
      #vw-templates .kc-empty,#vw-templates .kc-loading{border:1px dashed #314056;background:#0a1018;border-radius:18px;padding:42px 22px;text-align:center;color:var(--kc-muted);}
      #vw-templates .kc-empty i,#vw-templates .kc-loading i{display:block;font-size:36px;color:#4f5f75;margin-bottom:10px;}
      #vw-templates .kc-email-shell{background:#f4f6fb;border:1px solid #dfe5ee;border-radius:16px;padding:13px;}
      #vw-templates .kc-email-label{display:flex;justify-content:space-between;gap:10px;color:#526174;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
      #vw-templates .kc-email-frame{display:block;width:100%;height:575px;border:1px solid #d8dee7;background:white;border-radius:12px;}
      #vw-templates .kc-phone{max-width:340px;margin:0 auto;background:#050606;border:1px solid #222b2a;border-radius:34px;padding:12px;box-shadow:0 24px 70px rgba(0,0,0,.55);}
      #vw-templates .kc-screen{background:#0b141a;border-radius:25px;min-height:540px;padding:14px;display:flex;flex-direction:column;}
      #vw-templates .kc-phone-head{background:#131c23;border-radius:18px;padding:10px 12px;color:#e9edef;font-weight:900;font-size:12px;display:flex;align-items:center;gap:8px;margin-bottom:12px;}
      #vw-templates .kc-phone-spacer{flex:1;}
      #vw-templates .kc-bubble{background:#202c33;color:#e9edef;border:1px solid #2d3c45;border-radius:16px 16px 16px 4px;padding:13px;font-size:13px;line-height:1.58;white-space:pre-wrap;}
      #vw-templates .kc-bubble-cta{margin-top:10px;border-top:1px solid #344752;padding-top:9px;color:#8ee7ff;font-weight:850;display:flex;align-items:center;gap:6px;}
      #vw-templates .kc-phone-note{text-align:right;color:#7e8e98;font-size:10px;margin-top:8px;}
      #vw-templates .kc-code{background:#070c13;border:1px solid #273346;border-radius:14px;color:#dce6f1;padding:14px;white-space:pre-wrap;line-height:1.55;font-size:12px;max-height:560px;overflow:auto;}
      #vw-templates .kc-var-table{display:grid;gap:8px;}#vw-templates .kc-var-row{display:grid;grid-template-columns:150px 1fr;gap:10px;border:1px solid #263244;background:#0a1018;border-radius:12px;padding:10px;font-size:12px;}#vw-templates .kc-var-row strong{color:#fff}#vw-templates .kc-var-row span{color:var(--kc-muted)}
      #vw-templates .kc-action-grid{display:grid;gap:9px;}#vw-templates .kc-action-card{border:1px solid #263244;background:#0a1018;border-radius:14px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;}#vw-templates .kc-action-card strong{color:#fff;font-size:13px}#vw-templates .kc-action-card p{margin:4px 0 0;color:var(--kc-muted);font-size:12px;line-height:1.4;}
      #vw-templates .kc-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999;}
      #vw-templates .kc-modal{width:min(920px,96vw);max-height:92vh;background:#0f1622;border:1px solid #354257;border-radius:22px;box-shadow:0 35px 120px rgba(0,0,0,.78);display:flex;flex-direction:column;overflow:hidden;}#vw-templates .kc-modal.small{width:min(540px,94vw);}#vw-templates .kc-modal-head{padding:17px 19px;border-bottom:1px solid var(--kc-border);background:#131c2a;display:flex;justify-content:space-between;gap:12px;align-items:center;}#vw-templates .kc-modal-title{font-size:17px;color:#fff;font-weight:950;}#vw-templates .kc-modal-body{padding:18px;overflow:auto;}#vw-templates .kc-modal-foot{padding:14px 18px;border-top:1px solid var(--kc-border);background:#111927;display:flex;justify-content:flex-end;gap:8px;}#vw-templates .kc-form-grid{display:grid;grid-template-columns:1fr 170px 180px;gap:12px;}#vw-templates .kc-field{margin-bottom:14px;}#vw-templates .kc-field label{display:block;color:var(--kc-muted);font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px;}#vw-templates .kc-field textarea{height:auto;min-height:250px;padding:12px;line-height:1.5;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;resize:vertical;}#vw-templates .kc-hint{font-size:11px;color:var(--kc-muted2);line-height:1.45;margin-top:6px;}
      #vw-templates .kc-toast{position:fixed;right:20px;bottom:20px;background:#111927;border:1px solid #36445a;border-radius:14px;color:#fff;padding:12px 15px;font-size:13px;font-weight:850;box-shadow:0 18px 55px rgba(0,0,0,.5);z-index:10000;transform:translateY(22px);opacity:0;transition:all .22s ease;}#vw-templates .kc-toast.show{transform:translateY(0);opacity:1}#vw-templates .kc-toast.ok{border-color:rgba(34,197,94,.42);color:#9bf4ba}#vw-templates .kc-toast.err{border-color:rgba(225,37,27,.48);color:#ffaaa4}
      @media(max-width:1380px){#vw-templates .kc-toolbar{grid-template-columns:1fr 145px 160px 150px auto}#vw-templates .kc-toolbar .kc-objective-filter{display:none}}
      @media(max-width:1240px){#vw-templates .kc-layout{grid-template-columns:1fr}#vw-templates .kc-preview{position:relative}#vw-templates .kc-preview-body{max-height:none}}
      @media(max-width:980px){#vw-templates .kc-hero{grid-template-columns:1fr}#vw-templates .kc-hero-actions{justify-content:flex-start}#vw-templates .kc-metrics{grid-template-columns:repeat(2,1fr)}#vw-templates .kc-toolbar{grid-template-columns:1fr 1fr}#vw-templates .kc-list{grid-template-columns:1fr}#vw-templates .kc-form-grid{grid-template-columns:1fr}}
    `;
    const style = document.createElement('style');
    style.id = 'klinge-template-conversion-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function enhanceTemplates(){
    const root = document.getElementById('vw-templates');
    if (!root || root.dataset.klingeConversionTemplates === '1') return false;
    root.dataset.klingeConversionTemplates = '1';
    injectStyles();
    root.innerHTML = renderShell();
    bindRoot(root);
    loadTemplates(true);
    return true;
  }

  function renderShell(){
    return `
      <div class="kc-page">
        <section class="kc-hero">
          <div>
            <div class="kc-kicker"><i class="ti ti-target-arrow"></i> Plantillas de Conversión · Klinge</div>
            <h2 class="kc-title">Mensajes diseñados para recuperar, cotizar y cerrar ventas</h2>
            <p class="kc-copy">Biblioteca comercial para WhatsApp, Email e Instagram. Cada plantilla se ve con preview real, objetivo de venta, etapa del funnel y acciones rápidas para probar, optimizar o lanzar.</p>
          </div>
          <div class="kc-hero-actions">
            <button class="kc-btn ghost" type="button" data-kc-action="reload"><i class="ti ti-refresh"></i>Actualizar</button>
            <button class="kc-btn" type="button" data-kc-action="open-test"><i class="ti ti-send"></i>Enviar prueba</button>
            <button class="kc-btn primary" type="button" data-kc-action="new"><i class="ti ti-plus"></i>Nueva plantilla</button>
          </div>
        </section>
        <section class="kc-metrics" id="kc-metrics"></section>
        <section class="kc-toolbar">
          <div class="kc-input-wrap"><i class="ti ti-search"></i><input id="kc-search" placeholder="Buscar por venta, carrito, cotización, cierre..."></div>
          <select id="kc-canal"><option value="">Canal</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="instagram">Instagram</option><option value="sms">SMS</option></select>
          <select id="kc-etapa"><option value="">Etapa del funnel</option>${STAGE_OPTIONS.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('')}</select>
          <select id="kc-objetivo" class="kc-objective-filter"><option value="">Objetivo</option>${OBJECTIVE_OPTIONS.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('')}</select>
          <select id="kc-estado"><option value="">Estado</option><option value="activa">Activa</option><option value="pausada">Pausada</option></select>
          <button class="kc-btn" type="button" data-kc-action="reload"><i class="ti ti-reload"></i>Recargar</button>
        </section>
        <section class="kc-layout">
          <div id="kc-list" class="kc-list"><div class="kc-loading"><i class="ti ti-loader"></i>Cargando plantillas comerciales...</div></div>
          <aside id="kc-preview" class="kc-preview"></aside>
        </section>
      </div>`;
  }

  function bindRoot(root){
    root.addEventListener('click', ev => {
      const actionEl = ev.target.closest('[data-kc-action]');
      if (!actionEl) return;
      ev.preventDefault();
      ev.stopPropagation();
      const action = actionEl.dataset.kcAction;
      const id = actionEl.closest('[data-id]')?.dataset.id;
      const t = id ? STATE.templates.find(x => String(x.id) === String(id)) : selectedTemplate();
      if (action === 'reload') loadTemplates(true);
      if (action === 'new') openEditor();
      if (action === 'select' && t) selectTemplate(t.id);
      if (action === 'edit' && t) openEditor(t);
      if (action === 'copy' && t) copyTemplate(t);
      if (action === 'duplicate' && t) duplicateTemplate(t);
      if (action === 'use' && t) useTemplate(t);
      if (action === 'test' && t) openTestModal(t);
      if (action === 'open-test') openTestModal(t);
      if (action === 'toggle' && t) toggleTemplate(t);
      if (action === 'tab') { STATE.tab = actionEl.dataset.tab || 'preview'; renderSelectedPreview(); }
    });
    root.querySelector('#kc-search')?.addEventListener('input', ev => { STATE.query = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kc-canal')?.addEventListener('change', ev => { STATE.canal = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kc-etapa')?.addEventListener('change', ev => { STATE.etapa = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kc-objetivo')?.addEventListener('change', ev => { STATE.objetivo = ev.target.value || ''; applyFilters(); });
    root.querySelector('#kc-estado')?.addEventListener('change', ev => { STATE.estado = ev.target.value || ''; applyFilters(); });
  }

  async function loadTemplates(force){
    const list = document.getElementById('kc-list');
    if (!list) return;
    if (!STATE.loaded || force) list.innerHTML = '<div class="kc-loading"><i class="ti ti-loader"></i>Cargando plantillas comerciales...</div>';
    try{
      const res = await fetch('/api/templates', { headers: { Accept: 'application/json' }});
      if (!res.ok) throw new Error(await res.text());
      STATE.templates = await res.json();
      STATE.loaded = true;
      if (!STATE.selectedId && STATE.templates.length) STATE.selectedId = STATE.templates[0].id;
      applyFilters();
      renderMetrics();
    } catch(err){
      console.error('[templates-conversion]', err);
      list.innerHTML = '<div class="kc-empty"><i class="ti ti-alert-circle"></i><strong>No pude cargar las plantillas</strong><br><span>' + esc(err.message || err) + '</span></div>';
      renderMetrics();
    }
  }

  function renderMetrics(){
    const target = document.getElementById('kc-metrics');
    if (!target) return;
    const total = STATE.templates.length;
    const email = STATE.templates.filter(t => getCanal(t) === 'email').length;
    const active = STATE.templates.filter(isActive).length;
    const high = STATE.templates.filter(t => getScore(t) >= 82).length;
    target.innerHTML = `
      <div class="kc-metric" style="--m:var(--kc-red)"><div class="kc-metric-label"><i class="ti ti-template"></i>Total plantillas</div><div class="kc-metric-value">${money(total)}</div><div class="kc-metric-sub">biblioteca comercial</div></div>
      <div class="kc-metric" style="--m:var(--kc-green)"><div class="kc-metric-label"><i class="ti ti-circle-check"></i>Activas</div><div class="kc-metric-value">${money(active)}</div><div class="kc-metric-sub">listas para usar</div></div>
      <div class="kc-metric" style="--m:var(--kc-blue)"><div class="kc-metric-label"><i class="ti ti-mail"></i>Email</div><div class="kc-metric-value">${money(email)}</div><div class="kc-metric-sub">con preview y prueba</div></div>
      <div class="kc-metric" style="--m:var(--kc-yellow)"><div class="kc-metric-label"><i class="ti ti-flame"></i>Alta conversión</div><div class="kc-metric-value">${money(high)}</div><div class="kc-metric-sub">listas para cierre</div></div>`;
  }

  function applyFilters(){
    const q = normalize(STATE.query);
    STATE.filtered = STATE.templates.filter(t => {
      if (STATE.canal && getCanal(t) !== STATE.canal) return false;
      if (STATE.etapa && inferStage(t) !== STATE.etapa) return false;
      if (STATE.objetivo && inferObjective(t) !== STATE.objetivo) return false;
      if (STATE.estado && getStatus(t) !== STATE.estado) return false;
      if (!q) return true;
      const hay = normalize([t.nombre, getAsunto(t), stripHtml(getCuerpo(t)), getCategoria(t), inferStage(t), inferObjective(t)].join(' '));
      return hay.includes(q);
    });
    if (!STATE.filtered.some(t => String(t.id) === String(STATE.selectedId))) {
      STATE.selectedId = STATE.filtered[0]?.id || null;
    }
    renderList();
    renderSelectedPreview();
  }

  function selectedTemplate(){
    return STATE.templates.find(t => String(t.id) === String(STATE.selectedId)) || null;
  }

  function selectTemplate(id){
    STATE.selectedId = id;
    STATE.tab = 'preview';
    renderList();
    renderSelectedPreview();
  }

  function renderList(){
    const list = document.getElementById('kc-list');
    if (!list) return;
    if (!STATE.filtered.length) {
      list.innerHTML = '<div class="kc-empty"><i class="ti ti-filter-off"></i><strong>No hay plantillas para este filtro</strong><br><span>Cambia canal, etapa u objetivo para encontrar mensajes de cierre.</span></div>';
      return;
    }
    list.innerHTML = STATE.filtered.map(cardHtml).join('');
  }

  function cardHtml(t){
    const canal = getCanal(t);
    const stage = inferStage(t);
    const objective = inferObjective(t);
    const vars = variablesFrom(t);
    const score = getScore(t);
    const snippetSource = hasHtml(t) ? stripHtml(getCuerpo(t)) : getCuerpo(t);
    const active = isActive(t);
    const icon = ICONS[canal] || ICONS.default;
    const activeClass = String(t.id) === String(STATE.selectedId) ? ' active' : '';
    return `
      <article class="kc-card${activeClass}" data-id="${attr(t.id)}" data-kc-action="select">
        <div class="kc-card-head">
          <div class="kc-ico"><i class="ti ${icon}"></i></div>
          <div style="min-width:0;flex:1">
            <h3 class="kc-card-title">${esc(t.nombre || 'Plantilla sin nombre')}</h3>
            <div class="kc-badges">
              <span class="kc-badge ${canal}">${esc(channelLabel(canal))}</span>
              <span class="kc-badge ${active ? 'active' : 'paused'}">${active ? 'Activa' : 'Pausada'}</span>
              <span class="kc-badge close">${esc(label(objective))}</span>
            </div>
          </div>
        </div>
        <div class="kc-objective">
          <div><strong>${esc(label(stage))}</strong><span>${esc(scoreLabel(score))} · enfoque en ${esc(label(objective).toLowerCase())}</span></div>
          <div class="kc-score" style="--score:${score}"><b>${score}</b></div>
        </div>
        ${getAsunto(t) ? '<p class="kc-subject">' + esc(getAsunto(t)) + '</p>' : ''}
        <div class="kc-snippet">${esc(truncate(snippetSource, 220))}</div>
        <div class="kc-vars">${vars.slice(0,5).map(v => '<span class="kc-var">[' + esc(v) + ']</span>').join('')}${vars.length > 5 ? '<span class="kc-var">+' + (vars.length - 5) + '</span>' : ''}</div>
        <div class="kc-card-actions">
          <div class="kc-mini"><span><i class="ti ti-variable"></i> ${vars.length}</span><span><i class="ti ti-click"></i> ${t.usos || 0}</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
            <button class="kc-icon-btn" type="button" data-kc-action="copy" title="Copiar"><i class="ti ti-copy"></i></button>
            <button class="kc-icon-btn" type="button" data-kc-action="edit"><i class="ti ti-edit"></i>Optimizar</button>
            <button class="kc-icon-btn red" type="button" data-kc-action="use"><i class="ti ti-rocket"></i>Usar</button>
          </div>
        </div>
      </article>`;
  }

  function renderSelectedPreview(){
    const target = document.getElementById('kc-preview');
    if (!target) return;
    const t = selectedTemplate();
    if (!t) {
      target.innerHTML = '<div class="kc-preview-head"><div><div class="kc-preview-title">Preview comercial</div><div class="kc-preview-sub">Selecciona una plantilla para revisar mensaje, variables y acciones.</div></div></div><div class="kc-preview-body"><div class="kc-empty"><i class="ti ti-eye"></i>Sin plantilla seleccionada</div></div>';
      return;
    }
    const canal = getCanal(t);
    const stage = inferStage(t);
    const score = getScore(t);
    target.innerHTML = `
      <div class="kc-preview-head">
        <div style="min-width:0">
          <div class="kc-preview-title">${esc(t.nombre || 'Plantilla')}</div>
          <div class="kc-preview-sub">${esc(channelLabel(canal))} · ${esc(label(stage))} · ${scoreLabel(score)} (${score}/100)</div>
        </div>
        <div class="kc-preview-actions">
          ${isEmail(t) ? '<button class="kc-icon-btn red" type="button" data-id="' + attr(t.id) + '" data-kc-action="test"><i class="ti ti-send"></i>Prueba</button>' : ''}
          <button class="kc-icon-btn" type="button" data-id="${attr(t.id)}" data-kc-action="duplicate"><i class="ti ti-copy-plus"></i></button>
          <button class="kc-icon-btn" type="button" data-id="${attr(t.id)}" data-kc-action="edit"><i class="ti ti-edit"></i>Editar</button>
        </div>
      </div>
      <div class="kc-tabs">
        ${tabButton('preview','Vista previa')}
        ${tabButton('content','Contenido')}
        ${tabButton('vars','Variables')}
        ${tabButton('actions','Acciones')}
      </div>
      <div class="kc-preview-body" id="kc-preview-body"></div>`;
    renderPreviewTab(t);
  }

  function tabButton(tab, text){
    return '<button class="kc-tab ' + (STATE.tab === tab ? 'active' : '') + '" type="button" data-kc-action="tab" data-tab="' + tab + '">' + text + '</button>';
  }

  function renderPreviewTab(t){
    const body = document.getElementById('kc-preview-body');
    if (!body) return;
    if (STATE.tab === 'content') {
      body.innerHTML = '<div class="kc-code">' + esc(getCuerpo(t)) + '</div>';
      return;
    }
    if (STATE.tab === 'vars') {
      const vars = variablesFrom(t);
      body.innerHTML = vars.length ? '<div class="kc-var-table">' + vars.map(v => '<div class="kc-var-row"><strong>[' + esc(v) + ']</strong><span>' + esc(SAMPLE[v] || SAMPLE[normalize(v)] || 'Dato dinámico del cliente') + '</span></div>').join('') + '</div>' : '<div class="kc-empty"><i class="ti ti-variable-off"></i>Esta plantilla no tiene variables detectadas.</div>';
      return;
    }
    if (STATE.tab === 'actions') {
      body.innerHTML = `
        <div class="kc-action-grid">
          <div class="kc-action-card"><div><strong>Optimizar mensaje</strong><p>Ajusta el copy para reforzar garantía, entrega, urgencia y CTA.</p></div><button class="kc-btn" type="button" data-id="${attr(t.id)}" data-kc-action="edit">Editar</button></div>
          <div class="kc-action-card"><div><strong>Duplicar variante</strong><p>Crea una versión A/B para probar otro gancho o asunto.</p></div><button class="kc-btn" type="button" data-id="${attr(t.id)}" data-kc-action="duplicate">Duplicar</button></div>
          <div class="kc-action-card"><div><strong>${isActive(t) ? 'Pausar plantilla' : 'Activar plantilla'}</strong><p>Controla si la plantilla queda disponible para uso comercial.</p></div><button class="kc-btn ${isActive(t) ? 'danger' : 'green'}" type="button" data-id="${attr(t.id)}" data-kc-action="toggle">${isActive(t) ? 'Pausar' : 'Activar'}</button></div>
          <div class="kc-action-card"><div><strong>Lanzar plantilla</strong><p>Copia el mensaje con datos de ejemplo y registra el uso.</p></div><button class="kc-btn primary" type="button" data-id="${attr(t.id)}" data-kc-action="use">Usar ahora</button></div>
        </div>`;
      return;
    }
    if (isEmail(t)) renderEmailPreview(t); else renderMessagePreview(t);
  }

  async function renderEmailPreview(t){
    const body = document.getElementById('kc-preview-body');
    if (!body) return;
    body.innerHTML = '<div class="kc-loading"><i class="ti ti-loader"></i>Preparando email comercial...</div>';
    let html = replaceVars(getCuerpo(t), t);
    let asunto = replaceVars(getAsunto(t), t);
    try{
      const res = await fetch('/api/email/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ template_id:t.id, datos:SAMPLE }) });
      if (res.ok) {
        const data = await res.json();
        html = data.html || html;
        asunto = data.asunto || asunto;
      }
    } catch(err){ console.warn('[templates-conversion] email preview fallback', err); }
    if (!/<\s*(html|body|table|div|section|p|h1|h2|img|a|br|span|strong|button)\b/i.test(html)) {
      html = '<div style="font-family:Arial,sans-serif;line-height:1.58;color:#111827;padding:30px;white-space:pre-wrap">' + esc(html) + '</div>';
    }
    body.innerHTML = '<div class="kc-email-shell"><div class="kc-email-label"><span>Preview email Klinge</span><span>' + esc(asunto || 'Sin asunto') + '</span></div><iframe class="kc-email-frame" sandbox srcdoc="' + attr(html) + '"></iframe></div>';
  }

  function renderMessagePreview(t){
    const body = document.getElementById('kc-preview-body');
    if (!body) return;
    const text = replaceVars(hasHtml(t) ? stripHtml(getCuerpo(t)) : getCuerpo(t), t);
    body.innerHTML = `
      <div class="kc-phone">
        <div class="kc-screen">
          <div class="kc-phone-head"><i class="ti ti-brand-whatsapp"></i><span>Klinge · Venta asistida</span></div>
          <div class="kc-phone-spacer"></div>
          <div class="kc-bubble">${esc(text)}<div class="kc-bubble-cta"><i class="ti ti-click"></i> CTA preparado para cerrar</div></div>
          <div class="kc-phone-note">Vista previa con datos reales de ejemplo</div>
        </div>
      </div>`;
  }

  function copyTemplate(t){
    const value = replaceVars(hasHtml(t) ? stripHtml(getCuerpo(t)) : getCuerpo(t), t);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => toast('Mensaje copiado para usar', 'ok')).catch(() => fallbackCopy(value));
    } else fallbackCopy(value);
  }

  function fallbackCopy(value){
    const ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Mensaje copiado para usar', 'ok'); } catch { toast('No pude copiar el mensaje', 'err'); }
    ta.remove();
  }

  async function useTemplate(t){
    copyTemplate(t);
    try { await fetch('/api/templates/' + encodeURIComponent(t.id) + '/usar', { method:'POST' }); } catch {}
  }

  async function toggleTemplate(t){
    try{
      const res = await fetch('/api/templates/' + encodeURIComponent(t.id), { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ activo: !isActive(t) }) });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo actualizar');
      toast(isActive(t) ? 'Plantilla pausada' : 'Plantilla activada', 'ok');
      await loadTemplates(true);
    } catch(err){ toast(err.message || 'Error al actualizar', 'err'); }
  }

  async function duplicateTemplate(t){
    const payload = {
      nombre: (t.nombre || 'Plantilla') + ' · Variante',
      canal: getCanal(t),
      categoria: getCategoria(t),
      asunto: getAsunto(t) || null,
      cuerpo: getCuerpo(t),
      variables: variablesFrom(t)
    };
    try{
      const res = await fetch('/api/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo duplicar');
      const created = await res.json();
      STATE.selectedId = created.id;
      toast('Variante creada para test A/B', 'ok');
      await loadTemplates(true);
    } catch(err){ toast(err.message || 'Error al duplicar', 'err'); }
  }

  function openEditor(t){
    const isEdit = !!t;
    const modal = document.createElement('div');
    modal.className = 'kc-modal-backdrop';
    modal.innerHTML = `
      <div class="kc-modal">
        <div class="kc-modal-head"><div><div class="kc-modal-title">${isEdit ? 'Optimizar plantilla de conversión' : 'Nueva plantilla de conversión'}</div><div class="kc-hint">Usa urgencia, garantía, despacho y CTA claro para aumentar cierre.</div></div><button class="kc-icon-btn" type="button" data-close><i class="ti ti-x"></i></button></div>
        <div class="kc-modal-body">
          <div class="kc-form-grid">
            <div class="kc-field"><label>Nombre comercial</label><input id="kc-f-nombre" value="${attr(t?.nombre || '')}" placeholder="Ej: Carrito abandonado · cierre 1h"></div>
            <div class="kc-field"><label>Canal</label><select id="kc-f-canal"><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="instagram">Instagram</option><option value="sms">SMS</option></select></div>
            <div class="kc-field"><label>Categoría</label><select id="kc-f-categoria">${STAGE_OPTIONS.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('')}</select></div>
          </div>
          <div class="kc-field"><label>Asunto / gancho</label><input id="kc-f-asunto" value="${attr(getAsunto(t || {}))}" placeholder="Ej: Tu panel LED aún está disponible"></div>
          <div class="kc-field"><label>Mensaje / HTML</label><textarea id="kc-f-cuerpo" placeholder="Hola [nombre], tu [producto] sigue disponible. Tenemos despacho 48-72h, 1 año de garantía y puedes abonar 30% para reservar.">${esc(getCuerpo(t || {}))}</textarea><div class="kc-hint">Variables recomendadas: [nombre], [producto], [precio], [cart_url], [empresa]. Para email puedes pegar HTML completo.</div></div>
          <div class="kc-field"><label>Variables</label><input id="kc-f-vars" value="${attr(variablesFrom(t || {}).join(', '))}" placeholder="nombre, producto, precio, cart_url"></div>
        </div>
        <div class="kc-modal-foot"><button class="kc-btn ghost" type="button" data-close>Cancelar</button><button class="kc-btn primary" type="button" data-save><i class="ti ti-device-floppy"></i>${isEdit ? 'Guardar optimización' : 'Crear plantilla'}</button></div>
      </div>`;
    document.body.appendChild(modal);
    const canalEl = modal.querySelector('#kc-f-canal');
    const categoriaEl = modal.querySelector('#kc-f-categoria');
    canalEl.value = getCanal(t || { canal:'whatsapp' });
    categoriaEl.value = inferStage(t || { categoria:'seguimiento' });
    modal.addEventListener('click', async ev => {
      if (ev.target.closest('[data-close]')) modal.remove();
      if (ev.target.closest('[data-save]')) {
        const payload = {
          nombre: modal.querySelector('#kc-f-nombre').value.trim(),
          canal: modal.querySelector('#kc-f-canal').value,
          categoria: modal.querySelector('#kc-f-categoria').value,
          asunto: modal.querySelector('#kc-f-asunto').value.trim() || null,
          cuerpo: modal.querySelector('#kc-f-cuerpo').value,
          variables: modal.querySelector('#kc-f-vars').value.split(',').map(x => x.trim()).filter(Boolean)
        };
        if (!payload.nombre || !payload.cuerpo.trim()) { toast('Nombre y mensaje son obligatorios', 'err'); return; }
        try{
          const res = await fetch(isEdit ? '/api/templates/' + encodeURIComponent(t.id) : '/api/templates', { method:isEdit ? 'PATCH' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar');
          const saved = await res.json();
          STATE.selectedId = saved.id || t?.id || STATE.selectedId;
          modal.remove();
          toast(isEdit ? 'Plantilla optimizada' : 'Plantilla creada', 'ok');
          await loadTemplates(true);
        } catch(err){ toast(err.message || 'Error al guardar', 'err'); }
      }
    });
  }

  function openTestModal(t){
    const selected = t || selectedTemplate();
    if (!selected) { toast('Selecciona una plantilla primero', 'err'); return; }
    if (!isEmail(selected)) { copyTemplate(selected); toast('Para WhatsApp/IG se copia el mensaje listo para usar', 'ok'); return; }
    const modal = document.createElement('div');
    modal.className = 'kc-modal-backdrop';
    modal.innerHTML = `
      <div class="kc-modal small">
        <div class="kc-modal-head"><div><div class="kc-modal-title">Enviar email de prueba</div><div class="kc-hint">Prueba la plantilla antes de lanzarla.</div></div><button class="kc-icon-btn" type="button" data-close><i class="ti ti-x"></i></button></div>
        <div class="kc-modal-body">
          <div class="kc-field"><label>Destinatarios</label><input id="kc-test-to" placeholder="correo@klinge.cl, otro@klinge.cl"><div class="kc-hint">Puedes separar varios correos con coma.</div></div>
          <div class="kc-action-card"><div><strong>${esc(selected.nombre)}</strong><p>${esc(getAsunto(selected) || 'Sin asunto')}</p></div><span class="kc-badge email">Email</span></div>
        </div>
        <div class="kc-modal-foot"><button class="kc-btn ghost" type="button" data-close>Cancelar</button><button class="kc-btn primary" type="button" data-send><i class="ti ti-send"></i>Enviar prueba</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', async ev => {
      if (ev.target.closest('[data-close]')) modal.remove();
      if (ev.target.closest('[data-send]')) {
        const destinatarios = modal.querySelector('#kc-test-to').value.split(',').map(x => x.trim()).filter(Boolean);
        if (!destinatarios.length) { toast('Agrega al menos un destinatario', 'err'); return; }
        try{
          const res = await fetch('/api/email/test', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ template_id:selected.id, destinatarios, datos:SAMPLE }) });
          if (!res.ok) throw new Error((await res.json()).error || 'No se pudo enviar');
          modal.remove();
          toast('Email de prueba enviado', 'ok');
        } catch(err){ toast(err.message || 'Error al enviar prueba', 'err'); }
      }
    });
  }

  function toast(msg, type){
    const old = document.querySelector('.kc-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'kc-toast ' + (type || '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 240); }, 2700);
  }

  function boot(){
    if (enhanceTemplates()) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (enhanceTemplates() || tries > 40) clearInterval(timer);
    }, 250);
    const obs = new MutationObserver(() => enhanceTemplates());
    obs.observe(document.body, { childList:true, subtree:true });
    setTimeout(() => obs.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
