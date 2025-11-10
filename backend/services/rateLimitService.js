/**
 * Rate Limiting Service
 * Protects API from abuse and ensures fair usage
 */

class RateLimitService {
  constructor() {
    this.requests = new Map(); // userId -> { count, resetTime }
    this.ipRequests = new Map(); // IP -> { count, resetTime }
    
    // Default limits
    this.limits = {
      authenticated: {
        requests: 1000,
        window: 60000 // 1 minute
      },
      unauthenticated: {
        requests: 100,
        window: 60000 // 1 minute
      },
      ai: {
        requests: 50,
        window: 60000 // 1 minute (AI endpoints are more expensive)
      }
    };

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   * @param {string} identifier - User ID or IP address
   * @param {string} type - Rate limit type (authenticated, unauthenticated, ai)
   * @returns {object} { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(identifier, type = 'authenticated') {
    const limit = this.limits[type];
    const now = Date.now();
    
    // Get or create request tracking
    const tracking = this.getTracking(identifier, type);
    
    // Reset if window has passed
    if (now > tracking.resetTime) {
      tracking.count = 0;
      tracking.resetTime = now + limit.window;
    }

    // Check if limit exceeded
    if (tracking.count >= limit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracking.resetTime,
        retryAfter: Math.ceil((tracking.resetTime - now) / 1000)
      };
    }

    // Increment counter
    tracking.count++;
    
    return {
      allowed: true,
      remaining: limit.requests - tracking.count,
      resetTime: tracking.resetTime,
      limit: limit.requests
    };
  }

  /**
   * Get or create tracking for identifier
   * @param {string} identifier - User ID or IP
   * @param {string} type - Rate limit type
   * @returns {object} Tracking object
   */
  getTracking(identifier, type) {
    const map = type === 'unauthenticated' ? this.ipRequests : this.requests;
    
    if (!map.has(identifier)) {
      const limit = this.limits[type];
      map.set(identifier, {
        count: 0,
        resetTime: Date.now() + limit.window
      });
    }
    
    return map.get(identifier);
  }

  /**
   * Express middleware for rate limiting
   * @param {string} type - Rate limit type
   * @returns {Function} Express middleware
   */
  middleware(type = 'authenticated') {
    return (req, res, next) => {
      // Get identifier (user ID or IP)
      const identifier = req.user?.id || req.ip || 'unknown';
      
      // Check rate limit
      const result = this.checkLimit(identifier, type);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
          limit: this.limits[type].requests,
          window: this.limits[type].window / 1000
        });
      }

      next();
    };
  }

  /**
   * Clean up expired tracking entries
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up authenticated requests
    for (const [identifier, tracking] of this.requests.entries()) {
      if (now > tracking.resetTime + 60000) { // Keep for 1 minute after reset
        this.requests.delete(identifier);
      }
    }

    // Clean up IP requests
    for (const [ip, tracking] of this.ipRequests.entries()) {
      if (now > tracking.resetTime + 60000) {
        this.ipRequests.delete(ip);
      }
    }
  }

  /**
   * Reset rate limit for identifier
   * @param {string} identifier - User ID or IP
   */
  reset(identifier) {
    this.requests.delete(identifier);
    this.ipRequests.delete(identifier);
  }

  /**
   * Get current rate limit status
   * @param {string} identifier - User ID or IP
   * @param {string} type - Rate limit type
   * @returns {object} Status information
   */
  getStatus(identifier, type = 'authenticated') {
    const tracking = this.getTracking(identifier, type);
    const limit = this.limits[type];
    const now = Date.now();
    
    return {
      identifier,
      type,
      current: tracking.count,
      limit: limit.requests,
      remaining: Math.max(0, limit.requests - tracking.count),
      resetTime: tracking.resetTime,
      resetIn: Math.max(0, Math.ceil((tracking.resetTime - now) / 1000))
    };
  }

  /**
   * Update rate limits
   * @param {string} type - Rate limit type
   * @param {object} config - New configuration
   */
  updateLimits(type, config) {
    if (this.limits[type]) {
      this.limits[type] = { ...this.limits[type], ...config };
    }
  }

  /**
   * Get statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      trackedUsers: this.requests.size,
      trackedIPs: this.ipRequests.size,
      limits: this.limits
    };
  }
}

module.exports = new RateLimitService();
