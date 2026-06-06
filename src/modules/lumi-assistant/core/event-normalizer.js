function normalize(raw = {}) {
  return {
    channelId: raw.channelId || raw.channel_id || raw.chat_id || raw.conversation_id || '',
    channelType: raw.channelType || raw.channel_type || 'unknown',
    messageId: raw.messageId || raw.message_id || raw.id || '',
    userId: raw.userId || raw.from || raw.sender_id || '',
    userName: raw.userName || raw.sender_name || raw.name || '',
    messageText: String(raw.messageText || raw.text || raw.body || '').trim(),
    timestamp: raw.timestamp || new Date().toISOString(),
    metadata: {
      provider: raw.provider || 'unknown',
      raw,
    },
  };
}

module.exports = {
  normalize,
};
