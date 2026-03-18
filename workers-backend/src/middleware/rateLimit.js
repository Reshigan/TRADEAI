// KV-backed rate limiting for Cloudflare Workers
// Replaces in-memory Map which resets on cold starts

export function rateLimit({ limit = 5, windowMs = 60000 } = {}) {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ||
               c.req.header('X-Forwarded-For') ||
               'unknown';
    const path = c.req.path;
    const key = `ratelimit:${ip}:${path}`;
    const now = Date.now();

    // Use KV if available, otherwise fall back to in-memory (dev only)
    const kv = c.env?.CACHE;

    let count = 0;
    let resetAt = now + windowMs;

    if (kv) {
      try {
        const stored = await kv.get(key, 'json');
        if (stored && now < stored.resetAt) {
          count = stored.count;
          resetAt = stored.resetAt;
        }
        count++;
        await kv.put(key, JSON.stringify({ count, resetAt }), {
          expirationTtl: Math.ceil(windowMs / 1000)
        });
      } catch {
        // KV error - allow request through
        count = 1;
      }
    } else {
      // Fallback to in-memory for local dev
      if (!globalThis._rateLimitStore) globalThis._rateLimitStore = new Map();
      const store = globalThis._rateLimitStore;
      let entry = store.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(key, entry);
      }
      entry.count++;
      count = entry.count;
      resetAt = entry.resetAt;
    }

    const remaining = Math.max(0, limit - count);
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (count > limit) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({
        success: false,
        message: 'Too many requests. Please try again later.'
      }, 429);
    }

    await next();
  };
}

// Pre-configured rate limiters for common endpoints
export const authRateLimit = rateLimit({ limit: 5, windowMs: 60000 });
export const registerRateLimit = rateLimit({ limit: 3, windowMs: 60000 });
export const mutationRateLimit = rateLimit({ limit: 30, windowMs: 60000 });
