const rateLimitStore = new Map();

const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

export function rateLimit({ limit = 5, windowMs = 60000 } = {}) {
  return async (c, next) => {
    cleanup();

    const ip = c.req.header('CF-Connecting-IP') ||
               c.req.header('X-Forwarded-For') ||
               'unknown';
    const path = c.req.path;
    const key = `${ip}:${path}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, limit - entry.count);
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({
        success: false,
        message: 'Too many requests. Please try again later.'
      }, 429);
    }

    await next();
  };
}
