const sessions = new Map();

function key(event) {
  return `${event.channelId}:${event.userId}`;
}

async function findActive(event) {
  return sessions.get(key(event)) || null;
}

async function create(event, command, currentStep, payload = {}) {
  const session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel_id: event.channelId,
    user_id: event.userId,
    command,
    status: 'active',
    current_step: currentStep,
    payload_json: payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  sessions.set(key(event), session);
  return session;
}

async function update(id, patch = {}) {
  for (const [sessionKey, session] of sessions.entries()) {
    if (session.id === id) {
      const next = { ...session, ...patch, updated_at: new Date().toISOString() };
      sessions.set(sessionKey, next);
      return next;
    }
  }

  throw new Error('session_not_found');
}

async function close(id, status = 'completed', patch = {}) {
  for (const [sessionKey, session] of sessions.entries()) {
    if (session.id === id) {
      const next = { ...session, ...patch, status, updated_at: new Date().toISOString() };
      sessions.delete(sessionKey);
      return next;
    }
  }

  return null;
}

module.exports = { findActive, create, update, close };
