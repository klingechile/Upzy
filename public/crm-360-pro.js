(function(){
  'use strict';

  const STATE = { leads: [], tasks: [], selected: null, loading: false, taskFilter: 'pendiente' };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const date = (v) => { if(!v) return 'Sin fecha'; try { return new Date(v).toLocaleString('es-CL',{dateStyle:'short',timeStyle:'short'}); } catch { return v; } };
  const token = () => window._upzyToken || sessionStorage.getItem('upzy_token') || '';

  async function api(path, options = {}){
    const headers = { Accept:'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}) };
    const t = token(); if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) }});
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if(!res.ok) throw new Error(body?.error || body?.message || `${path} respondió ${res.status}`);
    return body;
  }

  const leadId = (l) => String(l?.id || l?.lead_id || l?.telefono || l?.email || '');
  const leadName = (l) => l?.nombre || l?.name || l?.full_name || l?.telefono || l?.email || 'Cliente sin nombre';
  const leadCompany = (l) => l?.empresa || l?.company || l?.negocio || l?.tipo_negocio || 'Sin empresa';
  const leadStage = (l) => l?.etapa || l?.stage || 'nuevo';
  const leadScore = (l) => Number(l?.score || l?.puntaje || 0);
  const leadSegment = (l) => l?.segmento || l?.segment || (leadScore(l) >= 80 ? 'hot' : leadScore(l) >= 45 ? 'warm' : 'cold');
  const leadChannel = (l) => l?.canal || l?.channel || l?.origen || l?.source || 'manual';

  function injectStyles(){
    if(document.getElementById('crm360-pro-style')) return;
    const s = document.createElement('style');
    s.id = 'crm360-pro-style';
    s.textContent = `
      #vw-crm360{--r:#C0392B;--r2:#E1251B;--bg:#0B0F16;--p:#111722;--p2:#151D2A;--b:#283344;--t:#F8FAFC;--m:#94A3B8;--g:#22C55E;--y:#F59E0B;--bl:#3B82F6}.crm360-page{display:flex;flex-direction:column;gap:16px}.crm360-hero{border:1px solid rgba(192,57,43,.32);border-radius:22px;background:radial-gradient(circle at 90% 0%,rgba(192,57,43,.26),transparent 30%),linear-gradient(135deg,#121A27,#080B11 60%,#1D0B0B);padding:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;box-shadow:0 22px 70px rgba(0,0,0,.34)}.crm360-kicker{font-size:11px;color:#ffb3ad;font-weight:900;letter-spacing:.13em;text-transform:uppercase;display:flex;gap:8px;align-items:center;margin-bottom:8px}.crm360-title{font-size:27px;line-height:1.08;font-weight:950;color:var(--t);letter-spacing:-.035em;margin-bottom:8px}.crm360-copy{font-size:13px;color:var(--m);line-height:1.6;max-width:860px}.crm360-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.crm360-btn{height:38px;border-radius:12px;border:1px solid var(--b);background:#151D2A;color:var(--t);padding:0 13px;font-size:12px;font-weight:850;display:inline-flex;gap:7px;align-items:center;cursor:pointer}.crm360-btn.primary{background:linear-gradient(135deg,var(--r),var(--r2));border-color:var(--r);box-shadow:0 12px 32px rgba(192,57,43,.3)}.crm360-btn.ghost{background:rgba(255,255,255,.03)}.crm360-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.crm360-metric{border:1px solid var(--b);background:linear-gradient(180deg,#121A27,#0E1520);border-radius:17px;padding:15px;position:relative;overflow:hidden}.crm360-metric:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c,var(--r))}.crm360-label{font-size:11px;color:var(--m);font-weight:900;text-transform:uppercase;letter-spacing:.08em;display:flex;gap:6px;align-items:center;margin-bottom:6px}.crm360-value{font-size:27px;font-weight:950;color:var(--t);letter-spacing:-.04em}.crm360-sub{font-size:11px;color:#64748B;margin-top:2px}.crm360-grid{display:grid;grid-template-columns:360px minmax(0,1fr) 370px;gap:16px;align-items:start}.crm360-panel{border:1px solid var(--b);border-radius:18px;background:linear-gradient(180deg,#111722,#0D131D);box-shadow:0 12px 40px rgba(0,0,0,.18);overflow:hidden}.crm360-panel-head{padding:14px 15px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;gap:10px;background:#121A27}.crm360-panel-title{font-size:12px;font-weight:950;color:var(--t);text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:7px}.crm360-panel-body{padding:14px}.crm360-search{position:relative;margin-bottom:12px}.crm360-search i{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#64748B}.crm360-search input{padding-left:34px}.crm360-lead-list{display:flex;flex-direction:column;gap:8px;max-height:650px;overflow:auto}.crm360-lead-card{border:1px solid var(--b);border-radius:14px;background:#0A1018;padding:12px;cursor:pointer}.crm360-lead-card:hover,.crm360-lead-card.active{border-color:var(--r);box-shadow:0 0 0 3px rgba(192,57,43,.12)}.crm360-lead-top{display:flex;gap:10px;align-items:center;margin-bottom:8px}.crm360-avatar{width:38px;height:38px;border-radius:12px;background:#111;border:1px solid rgba(192,57,43,.5);display:grid;place-items:center;font-weight:950;color:#fff;flex:0 0 auto}.crm360-lead-name{font-size:13px;font-weight:950;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crm360-lead-company{font-size:11px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crm360-badges{display:flex;gap:5px;flex-wrap:wrap}.crm360-badge{height:21px;padding:0 7px;border-radius:999px;font-size:10px;font-weight:900;display:inline-flex;align-items:center;text-transform:uppercase;letter-spacing:.03em;border:1px solid #334052;background:#0B111A;color:#CBD5E1}.crm360-badge.hot{border-color:rgba(192,57,43,.42);background:rgba(192,57,43,.13);color:#ffaaa4}.crm360-badge.warm{border-color:rgba(245,158,11,.36);background:rgba(245,158,11,.12);color:#ffd18a}.crm360-badge.cold{border-color:rgba(59,130,246,.36);background:rgba(59,130,246,.11);color:#9bc1ff}.crm360-badge.ok{border-color:rgba(34,197,94,.36);background:rgba(34,197,94,.11);color:#9bf4ba}.crm360-profile{display:grid;gap:14px}.crm360-profile-head{border:1px solid rgba(192,57,43,.25);border-radius:18px;background:radial-gradient(circle at right top,rgba(192,57,43,.16),transparent 28%),#0A1018;padding:18px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center}.crm360-profile-avatar{width:58px;height:58px;border-radius:18px;background:#111;border:1px solid var(--r);display:grid;place-items:center;font-size:22px;font-weight:950;color:#fff}.crm360-profile-name{font-size:20px;font-weight:950;color:#fff;letter-spacing:-.025em}.crm360-profile-meta{font-size:12px;color:var(--m);margin-top:4px}.crm360-score{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--r) calc(var(--score)*1%),#263244 0);position:relative}.crm360-score:after{content:'';position:absolute;inset:6px;border-radius:50%;background:#111722}.crm360-score b{position:relative;z-index:1;color:#fff;font-weight:950}.crm360-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.crm360-info{border:1px solid var(--b);border-radius:14px;background:#0A1018;padding:11px}.crm360-info-label{font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:.08em;font-weight:900;margin-bottom:4px}.crm360-info-value{font-size:13px;color:#fff;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crm360-event{display:grid;grid-template-columns:28px 1fr;gap:9px;margin-bottom:9px}.crm360-event-ico{width:28px;height:28px;border-radius:999px;background:rgba(192,57,43,.14);border:1px solid rgba(192,57,43,.34);color:#ffaaa4;display:grid;place-items:center}.crm360-event-body{border:1px solid var(--b);border-radius:13px;background:#0A1018;padding:10px}.crm360-event-title{font-size:12px;font-weight:900;color:#fff}.crm360-event-time{font-size:10px;color:#64748B;margin-top:3px}.crm360-task{border:1px solid var(--b);border-radius:14px;background:#0A1018;padding:11px;margin-bottom:9px}.crm360-task.done{opacity:.58}.crm360-task-title{font-size:13px;font-weight:950;color:#fff;margin-bottom:6px}.crm360-task-meta{font-size:11px;color:var(--m);display:flex;gap:8px;flex-wrap:wrap}.crm360-task-actions{display:flex;gap:6px;margin-top:9px}.crm360-mini{height:28px;border-radius:9px;border:1px solid var(--b);background:#111927;color:#fff;font-size:11px;font-weight:850;padding:0 8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.crm360-mini.red{border-color:rgba(192,57,43,.42);color:#ffaaa4}.crm360-mini.green{border-color:rgba(34,197,94,.36);color:#9bf4ba}.crm360-empty{border:1px dashed #314056;background:#0A1018;border-radius:16px;padding:36px 20px;text-align:center;color:var(--m)}.crm360-empty i{display:block;font-size:34px;color:#4F5F75;margin-bottom:8px}.crm360-form{display:grid;gap:10px}.crm360-form input,.crm360-form select,.crm360-form textarea{height:38px;border-radius:12px;border:1px solid var(--b);background:#080D14;color:#fff;padding:0 11px;outline:none}.crm360-form textarea{height:auto;min-height:80px;padding:10px;resize:vertical}.crm360-form label{font-size:10px;color:#64748B;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:-3px}.crm360-toast{position:fixed;right:20px;bottom:128px;background:#111927;border:1px solid #36445A;border-radius:14px;color:#fff;padding:12px 15px;font-size:13px;font-weight:850;box-shadow:0 18px 55px rgba(0,0,0,.5);z-index:10000;transform:translateY(22px);opacity:0;transition:all .22s ease}.crm360-toast.show{transform:translateY(0);opacity:1}.crm360-toast.ok{border-color:rgba(34,197,94,.42);color:#9bf4ba}.crm360-toast.err{border-color:rgba(192,57,43,.48);color:#ffaaa4}@media(max-width:1340px){.crm360-grid{grid-template-columns:320px minmax(0,1fr)}.crm360-grid>.crm360-panel:last-child{grid-column:1/-1}.crm360-metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:860px){.crm360-hero{grid-template-columns:1fr}.crm360-actions{justify-content:flex-start}.crm360-grid{grid-template-columns:1fr}.crm360-info-grid{grid-template-columns:1fr}.crm360-metrics{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function addNav(){
    if(document.querySelector('[data-crm360-nav]')) return;
    const nav = document.querySelector('nav'); if(!nav) return;
    const btn = document.createElement('button');
    btn.className = 'ni'; btn.dataset.crm360Nav = '1';
    btn.innerHTML = '<i class="ti ti-user-star"></i>CRM 360<span class="nbadge nr" id="crm360-nav-badge" style="display:none">0</span>';
    btn.onclick = () => window.showView ? window.showView('crm360', btn) : showCrm360();
    const leadsBtn = Array.from(nav.querySelectorAll('.ni')).find(b => /Leads/i.test(b.textContent || ''));
    if(leadsBtn && leadsBtn.nextSibling) nav.insertBefore(btn, leadsBtn.nextSibling); else nav.appendChild(btn);
  }

  function addView(){
    if(document.getElementById('vw-crm360')) return;
    const content = document.querySelector('.content'); if(!content) return;
    const view = document.createElement('div'); view.id = 'vw-crm360'; view.className = 'view'; content.appendChild(view);
  }

  function patchShowView(){
    if(window.__crm360ProPatched) return; window.__crm360ProPatched = true;
    // showView hook removed — uses dashboard's native showView
;
  }

  function showCrm360(btn){
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('vw-crm360')?.classList.add('active');
    document.querySelectorAll('.ni').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const title = document.getElementById('vt'); if(title) title.textContent = 'CRM 360';
    render(); loadAll();
  }

  function render(){
    const root = document.getElementById('vw-crm360'); if(!root) return;
    root.innerHTML = `<div class="crm360-page"><section class="crm360-hero"><div><div class="crm360-kicker"><i class="ti ti-user-star"></i> CRM 360 · Funnel multicanal</div><div class="crm360-title">Cliente, tareas y seguimiento en una sola vista</div><div class="crm360-copy">Vista comercial para convertir leads en ventas: historial multicanal, score, próxima acción y tareas persistentes en Supabase. Cotizaciones quedan fuera por ahora.</div></div><div class="crm360-actions"><button class="crm360-btn ghost" data-crm360-action="reload"><i class="ti ti-refresh"></i>Actualizar</button><button class="crm360-btn primary" data-crm360-action="new-task"><i class="ti ti-calendar-plus"></i>Nueva tarea</button></div></section>${metrics()}<section class="crm360-grid">${leadList()}${STATE.selected ? profile(STATE.selected) : noLead()}${tasksPanel()}</section></div>`;
  }

  function metrics(){
    const hot = STATE.leads.filter(l => leadSegment(l) === 'hot').length;
    const pending = STATE.tasks.filter(t => t.estado !== 'hecha' && t.estado !== 'cancelada').length;
    const overdue = STATE.tasks.filter(t => t.estado !== 'hecha' && t.estado !== 'cancelada' && t.fecha && new Date(t.fecha) < new Date()).length;
    const channels = new Set(STATE.leads.map(leadChannel).filter(Boolean)).size;
    const badge = document.getElementById('crm360-nav-badge'); if(badge){ badge.style.display = overdue ? 'inline-block' : 'none'; badge.textContent = overdue; }
    return `<section class="crm360-metrics"><div class="crm360-metric" style="--c:var(--r)"><div class="crm360-label"><i class="ti ti-users"></i>Leads</div><div class="crm360-value">${STATE.leads.length}</div><div class="crm360-sub">base comercial</div></div><div class="crm360-metric" style="--c:var(--r2)"><div class="crm360-label"><i class="ti ti-flame"></i>HOT</div><div class="crm360-value">${hot}</div><div class="crm360-sub">prioridad de cierre</div></div><div class="crm360-metric" style="--c:var(--y)"><div class="crm360-label"><i class="ti ti-calendar-check"></i>Tareas</div><div class="crm360-value">${pending}</div><div class="crm360-sub">${overdue} vencidas</div></div><div class="crm360-metric" style="--c:var(--bl)"><div class="crm360-label"><i class="ti ti-route"></i>Canales</div><div class="crm360-value">${channels}</div><div class="crm360-sub">fuentes detectadas</div></div></section>`;
  }

  function leadList(){
    const search = document.getElementById('crm360-search')?.value || '';
    const q = norm(search);
    const list = STATE.leads.filter(l => !q || norm([leadName(l),leadCompany(l),l.email,l.telefono,leadChannel(l)].join(' ')).includes(q));
    return `<aside class="crm360-panel"><div class="crm360-panel-head"><div class="crm360-panel-title"><i class="ti ti-users"></i>Clientes / Leads</div><button class="crm360-mini" data-crm360-action="reload"><i class="ti ti-refresh"></i></button></div><div class="crm360-panel-body"><div class="crm360-search"><i class="ti ti-search"></i><input id="crm360-search" data-crm360-search placeholder="Buscar cliente, empresa o canal" value="${esc(search)}"></div><div class="crm360-lead-list">${STATE.loading ? '<div class="crm360-empty"><i class="ti ti-loader"></i>Cargando...</div>' : ''}${!STATE.loading && !list.length ? '<div class="crm360-empty"><i class="ti ti-user-off"></i>No hay leads.</div>' : ''}${list.map(leadCard).join('')}</div></div></aside>`;
  }

  function leadCard(l){
    const id = leadId(l), active = STATE.selected && leadId(STATE.selected) === id, seg = leadSegment(l);
    return `<article class="crm360-lead-card ${active?'active':''}" data-lead-id="${esc(id)}" data-crm360-action="select-lead"><div class="crm360-lead-top"><div class="crm360-avatar">${esc(leadName(l).slice(0,1).toUpperCase())}</div><div style="min-width:0"><div class="crm360-lead-name">${esc(leadName(l))}</div><div class="crm360-lead-company">${esc(leadCompany(l))}</div></div></div><div class="crm360-badges"><span class="crm360-badge ${seg}">${esc(seg)}</span><span class="crm360-badge">${esc(leadStage(l))}</span><span class="crm360-badge ok">${esc(leadChannel(l))}</span></div></article>`;
  }

  function noLead(){ return `<main class="crm360-panel"><div class="crm360-panel-head"><div class="crm360-panel-title"><i class="ti ti-id"></i>Ficha 360</div></div><div class="crm360-panel-body"><div class="crm360-empty"><i class="ti ti-user-search"></i>Selecciona un lead para ver su ficha comercial.</div></div></main>`; }

  function profile(l){
    const id = leadId(l), score = Math.max(0, Math.min(100, leadScore(l)));
    const leadTasks = STATE.tasks.filter(t => String(t.lead_id) === id && t.estado !== 'hecha' && t.estado !== 'cancelada');
    return `<main class="crm360-panel"><div class="crm360-panel-head"><div class="crm360-panel-title"><i class="ti ti-id"></i>Ficha 360</div><button class="crm360-mini green" data-crm360-action="new-task"><i class="ti ti-calendar-plus"></i>Tarea</button></div><div class="crm360-panel-body crm360-profile"><div class="crm360-profile-head"><div class="crm360-profile-avatar">${esc(leadName(l).slice(0,1).toUpperCase())}</div><div style="min-width:0"><div class="crm360-profile-name">${esc(leadName(l))}</div><div class="crm360-profile-meta">${esc(leadCompany(l))} · ${esc(leadChannel(l))} · ${esc(leadStage(l))}</div><div class="crm360-badges" style="margin-top:8px"><span class="crm360-badge ${leadSegment(l)}">${esc(leadSegment(l))}</span><span class="crm360-badge">${leadTasks.length} tareas pendientes</span></div></div><div class="crm360-score" style="--score:${score}"><b>${score}</b></div></div><div class="crm360-info-grid"><div class="crm360-info"><div class="crm360-info-label">Teléfono</div><div class="crm360-info-value">${esc(l.telefono || l.phone || 'Sin teléfono')}</div></div><div class="crm360-info"><div class="crm360-info-label">Email</div><div class="crm360-info-value">${esc(l.email || 'Sin email')}</div></div><div class="crm360-info"><div class="crm360-info-label">Ciudad</div><div class="crm360-info-value">${esc(l.ciudad || l.city || 'Sin ciudad')}</div></div><div class="crm360-info"><div class="crm360-info-label">Última interacción</div><div class="crm360-info-value">${esc(date(l.ultima_interaccion || l.updated_at || l.created_at))}</div></div></div><section class="crm360-panel" style="box-shadow:none"><div class="crm360-panel-head"><div class="crm360-panel-title"><i class="ti ti-timeline"></i>Timeline comercial</div></div><div class="crm360-panel-body">${timeline(l)}</div></section></div></main>`;
  }

  function timeline(l){
    const events = [{icon:'ti-user-plus',title:'Lead creado',time:l.created_at},{icon:'ti-route',title:'Origen: '+leadChannel(l),time:l.created_at},{icon:'ti-target-arrow',title:'Etapa actual: '+leadStage(l),time:l.updated_at || l.created_at}];
    return events.map(e => `<div class="crm360-event"><div class="crm360-event-ico"><i class="ti ${e.icon}"></i></div><div class="crm360-event-body"><div class="crm360-event-title">${esc(e.title)}</div><div class="crm360-event-time">${esc(date(e.time))}</div></div></div>`).join('');
  }

  function tasksPanel(){
    const selectedId = STATE.selected ? leadId(STATE.selected) : '';
    const filtered = STATE.tasks.filter(t => {
      if(selectedId && String(t.lead_id) !== selectedId) return false;
      if(STATE.taskFilter === 'pendiente') return t.estado !== 'hecha' && t.estado !== 'cancelada';
      if(STATE.taskFilter === 'hecha') return t.estado === 'hecha';
      return true;
    }).sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||'')));
    return `<aside class="crm360-panel"><div class="crm360-panel-head"><div class="crm360-panel-title"><i class="ti ti-calendar-check"></i>Seguimientos</div><button class="crm360-mini green" data-crm360-action="new-task"><i class="ti ti-plus"></i></button></div><div class="crm360-panel-body"><div class="crm360-badges" style="margin-bottom:12px"><button class="crm360-mini ${STATE.taskFilter==='pendiente'?'red':''}" data-crm360-action="task-filter" data-filter="pendiente">Pendientes</button><button class="crm360-mini ${STATE.taskFilter==='hecha'?'green':''}" data-crm360-action="task-filter" data-filter="hecha">Hechas</button><button class="crm360-mini" data-crm360-action="task-filter" data-filter="todas">Todas</button></div>${filtered.length ? filtered.map(taskCard).join('') : '<div class="crm360-empty"><i class="ti ti-calendar-plus"></i>No hay tareas en este filtro.</div>'}</div></aside>`;
  }

  function taskCard(t){
    const lead = t.lead || STATE.leads.find(l => leadId(l) === String(t.lead_id));
    const overdue = t.estado !== 'hecha' && t.estado !== 'cancelada' && t.fecha && new Date(t.fecha) < new Date();
    return `<article class="crm360-task ${t.estado === 'hecha' ? 'done' : ''}"><div class="crm360-task-title">${esc(t.titulo)}</div><div class="crm360-task-meta"><span><i class="ti ti-user"></i> ${esc(lead ? leadName(lead) : 'Lead')}</span><span><i class="ti ti-clock"></i> ${esc(date(t.fecha))}</span><span><i class="ti ti-flag"></i> ${esc(t.prioridad || 'media')}</span>${overdue ? '<span style="color:#ffaaa4"><i class="ti ti-alert-triangle"></i> Vencida</span>' : ''}</div>${t.nota ? `<div style="font-size:12px;color:#94A3B8;line-height:1.45;margin-top:7px">${esc(t.nota)}</div>` : ''}<div class="crm360-task-actions">${t.estado !== 'hecha' ? `<button class="crm360-mini green" data-crm360-action="done-task" data-task-id="${esc(t.id)}"><i class="ti ti-check"></i>Hecha</button>` : ''}<button class="crm360-mini red" data-crm360-action="delete-task" data-task-id="${esc(t.id)}"><i class="ti ti-trash"></i>Eliminar</button></div></article>`;
  }

  async function loadAll(){
    if(STATE.loading) return; STATE.loading = true; render();
    try{
      const [leads, tasks] = await Promise.all([api('/api/leads'), api('/api/tasks?limit=250')]);
      STATE.leads = Array.isArray(leads) ? leads : (leads.leads || leads.data || leads.items || []);
      STATE.tasks = Array.isArray(tasks) ? tasks : (tasks.tasks || tasks.data || []);
      if(!STATE.selected && STATE.leads.length) STATE.selected = STATE.leads[0];
    }catch(err){ toast(err.message || 'No pude cargar CRM 360', 'err'); }
    finally{ STATE.loading = false; render(); }
  }

  function openTaskModal(){
    const lead = STATE.selected; if(!lead){ toast('Selecciona un lead primero','err'); return; }
    const wrap = document.createElement('div'); wrap.className = 'overlay';
    const tomorrow = new Date(Date.now()+24*60*60*1000).toISOString().slice(0,16);
    wrap.innerHTML = `<div class="modal"><div class="mhdr"><div class="mtitle">Nueva tarea comercial</div><button class="btn bti btg" data-close><i class="ti ti-x"></i></button></div><div class="mbody"><div class="crm360-form"><label>Lead</label><input value="${esc(leadName(lead))}" disabled><label>Tarea</label><input id="crm360-task-title" placeholder="Ej: llamar para seguimiento"><label>Prioridad</label><select id="crm360-task-priority"><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option><option value="baja">Baja</option></select><label>Fecha</label><input id="crm360-task-date" type="datetime-local" value="${tomorrow}"><label>Nota</label><textarea id="crm360-task-note" placeholder="Contexto comercial, objeción o próximo paso"></textarea></div></div><div class="mfoot"><button class="btn btg" data-close>Cancelar</button><button class="btn btp" data-save-task><i class="ti ti-check"></i>Crear tarea</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', async ev => {
      if(ev.target.closest('[data-close]')) wrap.remove();
      if(ev.target.closest('[data-save-task]')){
        const title = wrap.querySelector('#crm360-task-title').value.trim();
        if(!title){ toast('La tarea necesita título','err'); return; }
        try{
          await api('/api/tasks', { method:'POST', body: JSON.stringify({ lead_id: leadId(lead), titulo:title, prioridad:wrap.querySelector('#crm360-task-priority').value, fecha:wrap.querySelector('#crm360-task-date').value || null, nota:wrap.querySelector('#crm360-task-note').value.trim() }) });
          wrap.remove(); toast('Tarea creada en CRM','ok'); await loadAll();
        }catch(err){ toast(err.message || 'No se pudo crear tarea','err'); }
      }
    });
  }

  function toast(msg,type){
    const old = document.querySelector('.crm360-toast'); if(old) old.remove();
    const el = document.createElement('div'); el.className='crm360-toast '+(type||''); el.textContent=msg; document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),240);},2600);
  }

  function bind(){
    if(window.__crm360ProBound) return; window.__crm360ProBound = true;
    document.addEventListener('click', async ev => {
      const el = ev.target.closest('[data-crm360-action]'); if(!el) return;
      const action = el.dataset.crm360Action;
      if(action === 'reload') loadAll();
      if(action === 'select-lead'){ STATE.selected = STATE.leads.find(l => leadId(l) === el.dataset.leadId) || STATE.selected; render(); }
      if(action === 'new-task') openTaskModal();
      if(action === 'task-filter'){ STATE.taskFilter = el.dataset.filter || 'pendiente'; render(); }
      if(action === 'done-task'){
        try{ await api('/api/tasks/'+encodeURIComponent(el.dataset.taskId)+'/complete', { method:'POST' }); toast('Tarea marcada como hecha','ok'); await loadAll(); } catch(err){ toast(err.message || 'No se pudo completar','err'); }
      }
      if(action === 'delete-task'){
        try{ await api('/api/tasks/'+encodeURIComponent(el.dataset.taskId), { method:'DELETE' }); toast('Tarea eliminada','ok'); await loadAll(); } catch(err){ toast(err.message || 'No se pudo eliminar','err'); }
      }
    });
    document.addEventListener('input', ev => { if(ev.target.matches('[data-crm360-search]')) render(); });
  }

  function boot(){ injectStyles(); addView(); addNav(); patchShowView(); bind(); render(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
