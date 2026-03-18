// GAP-08: KV Cache Layer Service

export class CacheService {
  constructor(kv) {
    this.kv = kv;
  }

  async get(key) {
    if (!this.kv) return null;
    try {
      const val = await this.kv.get(key);
      if (!val) return null;
      return JSON.parse(val);
    } catch { return null; }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.kv) return;
    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    } catch { /* best effort */ }
  }

  async invalidate(key) {
    if (!this.kv) return;
    try { await this.kv.delete(key); } catch { /* best effort */ }
  }

  async invalidatePrefix(prefix) {
    if (!this.kv) return;
    try {
      const list = await this.kv.list({ prefix });
      for (const key of list.keys) {
        await this.kv.delete(key.name);
      }
    } catch { /* best effort */ }
  }

  static dashboardKey(companyId) { return `cache:dashboard:${companyId}`; }
  static customerListKey(companyId) { return `cache:customers:${companyId}`; }
  static productListKey(companyId) { return `cache:products:${companyId}`; }
  static promotionListKey(companyId) { return `cache:promotions:${companyId}`; }
  static budgetListKey(companyId) { return `cache:budgets:${companyId}`; }
}
