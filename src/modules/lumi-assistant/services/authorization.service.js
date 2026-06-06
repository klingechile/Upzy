function validate(event) {
  if (process.env.LUMI_ASSISTANT_ENABLED !== 'true') {
    return { authorized: false, reason: 'assistant_disabled' };
  }

  const allowed = String(process.env.LUMI_ASSISTANT_ALLOWED_CHANNEL_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!allowed.length) return { authorized: false, reason: 'channels_missing' };
  if (!allowed.includes(event.channelId)) return { authorized: false, reason: 'channel_not_allowed' };

  return { authorized: true, reason: 'ok' };
}

module.exports = { validate };
