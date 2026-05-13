const isDev = process.env.NODE_ENV !== 'production';

function formatMessage(level, module, message) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${module}] ${message}`;
}

export function createLogger(module = 'app') {
  return {
    debug(message, ...args) {
      if (!isDev) return;
      console.debug(formatMessage('debug', module, message), ...args);
    },
    info(message, ...args) {
      console.info(formatMessage('info', module, message), ...args);
    },
    warn(message, ...args) {
      console.warn(formatMessage('warn', module, message), ...args);
    },
    error(message, ...args) {
      console.error(formatMessage('error', module, message), ...args);
    },
  };
}
