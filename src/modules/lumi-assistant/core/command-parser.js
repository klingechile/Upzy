const COMMANDS = {
  '/cotklinge': 'cotizacion',
  '/cotizacion': 'cotizacion',
  '/factura': 'factura',
  '/facturar': 'factura',
};

function parse(messageText = '') {
  const text = String(messageText).trim().toLowerCase();

  if (COMMANDS[text]) {
    return {
      isCommand: true,
      command: COMMANDS[text],
      rawCommand: text,
      confidence: 1,
    };
  }

  if (text.includes('lumi') && text.includes('cotiz')) {
    return {
      isCommand: true,
      command: 'cotizacion',
      rawCommand: text,
      confidence: 0.8,
    };
  }

  if (text.includes('lumi') && text.includes('factur')) {
    return {
      isCommand: true,
      command: 'factura',
      rawCommand: text,
      confidence: 0.8,
    };
  }

  return {
    isCommand: false,
    command: null,
    rawCommand: text,
    confidence: 0,
  };
}

module.exports = {
  parse,
};
