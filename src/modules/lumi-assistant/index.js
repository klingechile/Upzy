const eventNormalizer = require('./core/event-normalizer');
const router = require('./core/router');

async function handleInbound(rawEvent) {
  const event = eventNormalizer.normalize(rawEvent);
  return router.handle(event);
}

module.exports = {
  handleInbound,
};
