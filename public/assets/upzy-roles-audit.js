(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'loading',
    error: null,
    users: [],
    logs: [],
    auditWarning: null,
  };

  function token() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path, options = {}) {
    const auth = token();
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para revisar roles y auditoría.');

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

  function renderStatus() {
    const target = $('#upzy-roles-audit-status');
    if (!target) return;
    const live = state.status === 'live';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const badge = live ? 'LIVE' : error ? 'ERROR' : 'LOADING';
    const message = live
      ? `Usuarios: ${state.users.length} · Logs auditoría: ${state.logs.length}${state.auditWarning ? ' · Warning auditoría' : ''}`
      : error
        ? `${state.error?.message || 'Error desconocido'} · Requiere rol admin para ver esta pantalla completa.`
        : 'Consultando usuarios, permisos y auditoría...';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Roles, Permisos y Auditoría</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${badge}</span>
      </div>
    `;
  }

  function pill(value) {
    const v = String(value || '').toLowerCase();
    const cls = v === 'admin' || v === 'activo' || v === 'ok' ? 'ok' : v === 'agente' || v === 'warn' ? 'warm' : 'cold';
    return `<span class="upzy-badge ${cls}">${value}</span>`;
  }

  function renderUsers() {
    const target = $('#upzy-users-table');
    if (!target) return;
    if (!state.users.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay usuarios disponibles o el usuario actual no tiene rol admin.</div>';
      return;
    }

    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Activo</th><th>Último login</th><th>Acción</th></tr></thead>
          <tbody>
            ${state.users.map((user) => `
              <tr>
                <td><strong>${user.nombre || 'Sin nombre'}</strong><div class="upzy-list-meta">${user.email || user.id}</div></td>
                <td>${pill(user.rol || 'viewer')}</td>
                <td>${pill(user.activo ? 'activo' : 'inactivo')}</td>
                <td>${user.ultimo_login ? new Date(user.ultimo_login).toLocaleString('es-CL') : 'Sin login'}</td>
                <td>
                  <select class="upzy-form-input" data-role-user="${user.id}">
                    ${['admin','agente','viewer'].map((role) => `<option value="${role}" ${role === user.rol ? 'selected' : ''}>${role}</option>`).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll('[data-role-user]').forEach((select) => {
      select.addEventListener('change', () => updateUserRole(select.dataset.roleUser, select.value));
    });
  }

  async function updateUserRole(id, rol) {
    try {
      await api(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rol }),
      });
      await load();
    } catch (error) {
      state.status = 'error';
      state.error = error;
      renderStatus();
    }
  }

  function renderAudit() {
    const target = $('#upzy-audit-logs');
    if (!target) return;
    if (state.auditWarning) {
      target.innerHTML = `<div class="upzy-live-empty">Auditoría no persistida todavía: ${state.auditWarning}</div>`;
      return;
    }
    if (!state.logs.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay logs de auditoría todavía.</div>';
      return;
    }

    target.innerHTML = state.logs.map((log) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${log.action}</span></div>
          <div class="upzy-list-meta">${log.user_email || 'sistema'} · ${log.user_role || 'sin rol'} · ${log.entity_type || 'entity'} · ${log.entity_id || 'sin entidad'}</div>
        </div>
        <span class="upzy-time">${log.created_at ? new Date(log.created_at).toLocaleTimeString('es-CL') : 'ahora'}</span>
      </div>
    `).join('');
  }

  function renderPermissions() {
    const target = $('#upzy-permissions-matrix');
    if (!target) return;
    const rows = [
      ['CRM Comercial', 'operar', 'operar', 'lectura'],
      ['Captación Web', 'configurar', 'lectura', 'lectura'],
      ['Carritos', 'operar', 'operar', 'lectura'],
      ['Email Marketing', 'configurar', 'lectura', 'lectura'],
      ['Automatizaciones', 'ejecutar/configurar', 'lectura', 'lectura'],
      ['Reportes', 'lectura', 'lectura', 'lectura'],
      ['Usuarios', 'operar', 'sin acceso', 'sin acceso'],
      ['Auditoría', 'lectura completa', 'sin acceso', 'sin acceso'],
    ];
    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead><tr><th>Módulo</th><th>Admin</th><th>Agente</th><th>Viewer</th></tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? `<strong>${cell}</strong>` : cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  function renderAll() {
    renderStatus();
    renderUsers();
    renderAudit();
    renderPermissions();
  }

  async function load() {
    state.status = 'loading';
    renderStatus();
    try {
      const [users, audit] = await Promise.all([
        api('/api/users'),
        api('/api/audit/logs?limit=50'),
      ]);
      state.users = users.users || [];
      state.logs = audit.logs || [];
      state.auditWarning = audit.warning || null;
      state.status = 'live';
      state.error = null;
    } catch (error) {
      state.status = 'error';
      state.error = error;
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', load);
})();
