import { Hono } from 'hono';
import { serve } from 'bun';
import { createD1Adapter } from './d1-adapter.js';
import fs from 'fs';

const DB = createD1Adapter(process.env.DB_PATH || '/data/tradeai.db');

// KV adapter backed by simple in-memory Map (Redis can be added later)
const kvStore = new Map();
const CACHE = {
  async get(key) { return kvStore.get(key) || null; },
  async put(key, value, opts) { kvStore.set(key, value); },
  async delete(key) { kvStore.delete(key); },
};

// R2 adapter backed by local filesystem
const storagePath = process.env.STORAGE_PATH || '/data/files';
if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });
const STORAGE = {
  async put(key, body) {
    const filePath = `${storagePath}/${key}`;
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(await body.arrayBuffer()));
    return { key };
  },
  async get(key) {
    const filePath = `${storagePath}/${key}`;
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath);
    return { body: new ReadableStream({ start(c) { c.enqueue(data); c.close(); } }), key };
  },
  async delete(key) {
    const filePath = `${storagePath}/${key}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  },
};

// Run migrations on startup
const migrationsDir = './migrations';
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of migrations) {
    const sql = fs.readFileSync(`${migrationsDir}/${file}`, 'utf8');
    for (const stmt of sql.split(';').filter(s => s.trim())) {
      try { await DB.prepare(stmt).run(); } catch (e) { /* table may already exist */ }
    }
  }
}

// Import and configure the Hono app with injected env
const app = (await import('./src/index.js')).default;

serve({
  port: 8787,
  fetch(req) {
    const env = {
      DB,
      CACHE,
      STORAGE,
      JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
      ENVIRONMENT: 'on-premise',
      CORS_ORIGINS: process.env.CORS_ORIGINS || '',
    };
    return app.fetch(req, env);
  }
});
console.log('TradeAI on-premise API running on port 8787');
