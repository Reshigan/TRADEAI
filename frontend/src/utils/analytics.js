const ANALYTICS_ENABLED = process.env.REACT_APP_ANALYTICS_ENABLED === 'true';
const ANALYTICS_ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.tenantId = null;
    this.eventQueue = [];
    this.flushInterval = 30000;
    this.maxQueueSize = 50;

    if (ANALYTICS_ENABLED) {
      this.startFlushTimer();
    }

    if (typeof window !== 'undefined') {
      window.trackEvent = this.trackEvent.bind(this);
      window.trackError = this.trackError.bind(this);
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId, tenantId) {
    this.userId = userId;
    this.tenantId = tenantId;
  }

  trackEvent(eventName, properties = {}) {
    if (!ANALYTICS_ENABLED) {
      console.log('[Analytics]', eventName, properties);
      return;
    }

    const event = {
      eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        tenantId: this.tenantId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  trackError(errorType, errorDetails = {}) {
    this.trackEvent('error_occurred', {
      errorType,
      ...errorDetails
    });
  }

  trackPageView(pageName, properties = {}) {
    this.trackEvent('page_view', {
      pageName,
      ...properties
    });
  }

  trackCommandBarUsage(intent, query) {
    this.trackEvent('command_bar_used', {
      intent,
      query: query.substring(0, 100)
    });
  }

  trackAIRecommendationAction(action, recommendationType, accepted) {
    this.trackEvent('ai_recommendation_action', {
      action,
      recommendationType,
      accepted
    });
  }

  trackSimulationRun(scenarioCount, duration) {
    this.trackEvent('simulation_run', {
      scenarioCount,
      duration
    });
  }

  trackPromotionCreated(promotionType, budget, roi) {
    this.trackEvent('promotion_created', {
      promotionType,
      budget,
      roi
    });
  }

  trackBudgetReallocation(fromHierarchy, toHierarchy, amount) {
    this.trackEvent('budget_reallocation', {
      fromHierarchy,
      toHierarchy,
      amount
    });
  }

  trackConflictResolution(conflictType, resolutionMethod) {
    this.trackEvent('conflict_resolution', {
      conflictType,
      resolutionMethod
    });
  }

  async flush() {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${ANALYTICS_ENDPOINT}/api/analytics/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      this.eventQueue.unshift(...events);
    }
  }

  startFlushTimer() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  getSessionMetrics() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      tenantId: this.tenantId,
      eventsQueued: this.eventQueue.length
    };
  }
}

const analytics = new Analytics();

export default analytics;

export const {
  trackEvent,
  trackError,
  trackPageView,
  trackCommandBarUsage,
  trackAIRecommendationAction,
  trackSimulationRun,
  trackPromotionCreated,
  trackBudgetReallocation,
  trackConflictResolution,
  setUser
} = analytics;
