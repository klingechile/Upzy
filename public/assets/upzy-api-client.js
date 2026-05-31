window.UPZY_API = (function () {
  const API_BASE = window.location.origin;
  let lastAuthState = 'unknown';

  function getToken() {
    return sessionStorage.getItem('upzy_token');
  }

  function getRefreshToken() {
    return sessionStorage.getItem('upzy_refresh_token');
  }

  function getExpiresAt() {
    return Number(sessionStorage.getItem('upzy_expires_at') || 0);
  }

  function isExpired() {
    const expiresAt = getExpiresAt();
    if (!expiresAt) return false;
    // margen de 60 segundos para evitar carreras con JWT expirando
    return Date.now() / 1000 > (expiresAt - 60);
  }

  function hasSession() {
    const token = getToken();
    const refreshToken = getRefreshToken();
    if (token && !isExpired()) {
      lastAuthState = 'token_valid';
      return true;
    }
    if (refreshToken) {
      lastAuthState = 'refresh_available';
      return true;
    }
    lastAuthState = token ? 'token_expired_without_refresh' : 'no_token';
    return false;
  }

  async function refreshSessionIfNeeded() {
    const token = getToken();
    const refreshToken = getRefreshToken();

    if (token && !isExpired()) {
      lastAuthState = 'token_valid';
      return token;
    }

    if (!refreshToken) {
      const err = new Error(token ? 'Token expirado sin refresh token. Inicia sesión nuevamente.' : 'Sin sesión activa. Inicia sesión para ver datos reales.');
      err.code = token ? 'TOKEN_EXPIRED_NO_REFRESH' : 'NO_TOKEN';
      lastAuthState = err.code;
      throw err;
    }

    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }

    if (!res.ok) {
      sessionStorage.removeItem('upzy_token');
      sessionStorage.removeItem('upzy_refresh_token');
      sessionStorage.removeItem('upzy_expires_at');
      const err = new Error(payload?.error || 'Sesión expirada. Inicia sesión nuevamente.');
      err.code = payload?.code || 'REFRESH_FAILED';
      err.status = res.status;
      lastAuthState = err.code;
      throw err;
    }

    sessionStorage.setItem('upzy_token', payload.token);
    sessionStorage.setItem('upzy_refresh_token', payload.refresh_token);
    sessionStorage.setItem('upzy_expires_at', payload.expires_at);
    lastAuthState = 'token_refreshed';
    return payload.token;
  }

  async function request(path) {
    const token = await refreshSessionIfNeeded();

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }

    if (!res.ok) {
      const err = new Error(payload?.error || `Error API ${res.status}`);
      err.code = payload?.code || `HTTP_${res.status}`;
      err.status = res.status;
      lastAuthState = err.code;
      throw err;
    }

    return payload;
  }

  function getLeads() {
    return request('/api/leads');
  }

  function getLeadStats() {
    return request('/api/leads/estadisticas');
  }

  function getPendingCarts() {
    return request('/api/leads/carritos');
  }

  function getAuthState() {
    return lastAuthState;
  }

  return {
    hasSession,
    getAuthState,
    getLeads,
    getLeadStats,
    getPendingCarts,
  };
})();
