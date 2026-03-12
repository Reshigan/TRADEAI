export async function createNotification(db, { companyId, userId, title, message, type = 'info', category = 'system', priority = 'normal', entityType, entityId, entityName, actionUrl }) {
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO notifications (id, company_id, user_id, title, message, notification_type, category, priority, source_entity_type, source_entity_id, source_entity_name, action_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(id, companyId, userId, title, message, type, category, priority, entityType || null, entityId || null, entityName || null, actionUrl || null).run();
  return id;
}
