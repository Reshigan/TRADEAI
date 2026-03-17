import cron from 'node-cron';
import { createD1Adapter } from './d1-adapter.js';

const DB = createD1Adapter(process.env.DB_PATH || '/data/tradeai.db');
const env = { DB };

// Dynamically import scheduled jobs if they exist
let scheduledJobs;
try {
  const mod = await import('./src/jobs/scheduled.js');
  scheduledJobs = mod.scheduledJobs || mod.default;
} catch (e) {
  // Fallback: import promotion lifecycle and budget enforcement
  const { syncPromotionLifecycle } = await import('./src/services/promotionLifecycle.js');
  const { checkBudgetAlerts } = await import('./src/services/budgetEnforcement.js');
  
  scheduledJobs = async (event, env) => {
    const db = env.DB;
    const companies = await db.prepare('SELECT id FROM companies').all();
    for (const company of (companies.results || [])) {
      if (event.cron === '0 1 * * *') {
        await syncPromotionLifecycle(db, company.id);
      }
      if (event.cron === '0 */4 * * *') {
        await checkBudgetAlerts(db, company.id);
      }
    }
  };
}

const waitUntil = (p) => p.catch(e => console.error('Cron job error:', e));

// Mirror wrangler.toml cron triggers
cron.schedule('0 1 * * *', () => scheduledJobs({ cron: '0 1 * * *' }, env, { waitUntil }));
cron.schedule('0 2 * * *', () => scheduledJobs({ cron: '0 2 * * *' }, env, { waitUntil }));
cron.schedule('0 */4 * * *', () => scheduledJobs({ cron: '0 */4 * * *' }, env, { waitUntil }));
cron.schedule('0 * * * *', () => scheduledJobs({ cron: '0 * * * *' }, env, { waitUntil }));
cron.schedule('0 4 1 * *', () => scheduledJobs({ cron: '0 4 1 * *' }, env, { waitUntil }));

console.log('TradeAI cron runner started');
