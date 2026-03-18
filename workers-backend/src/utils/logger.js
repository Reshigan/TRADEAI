// D-12: Structured logging with request context
// Outputs JSON logs with requestId, tenantId, userId

export function createLogger(c) {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const user = c.get('user');
  const tenantId = user?.companyId || c.req.header('X-Tenant-Id') || 'unknown';
  const userId = user?.id || user?._id || 'anonymous';

  const base = { requestId, tenantId, userId };

  return {
    info(message, data = {}) {
      console.log(JSON.stringify({ ...base, level: 'info', message, ...data, timestamp: new Date().toISOString() }));
    },
    warn(message, data = {}) {
      console.warn(JSON.stringify({ ...base, level: 'warn', message, ...data, timestamp: new Date().toISOString() }));
    },
    error(message, data = {}) {
      console.error(JSON.stringify({ ...base, level: 'error', message, ...data, timestamp: new Date().toISOString() }));
    },
    debug(message, data = {}) {
      console.log(JSON.stringify({ ...base, level: 'debug', message, ...data, timestamp: new Date().toISOString() }));
    }
  };
}

// Middleware to add requestId to every request
export function requestIdMiddleware() {
  return async (c, next) => {
    const requestId = c.req.header('X-Request-Id') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  };
}
