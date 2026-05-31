window.UPZY_API = (function () {
  const API_BASE = window.location.origin;

  function getToken() {
    return sessionStorage.getItem('upzy_token');
  }

  function hasSession() {
    const token = getToken();
    const expiresAt = Number(sessionStorage.getItem('upzy_expires_at') || 0);
    if (!token) return false;
    if (!expiresAt) return true;
    return Date.now() / 1000 < expiresAt;
  }

  async function request(path) {
    const token = getToken();
    if (!token) {
      const err = new Error('Sin sesión activa. Mostrando datos mock.');
      err.code = 'NO_TOKEN';
      throw err;
    }

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

  return {
    hasSession,
    getLeads,
    getLeadStats,
    getPendingCarts,
  };
})();
