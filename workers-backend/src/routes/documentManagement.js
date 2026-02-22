import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const documentManagement = new Hono();

documentManagement.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();

const getCompanyId = (c) => {
  return c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || null;
};

// ═══════════════════════════════════════════════════════════════════════
// OPTIONS
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      documentTypes: [
        { value: 'contract', label: 'Contract' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'proof_of_delivery', label: 'Proof of Delivery' },
        { value: 'credit_note', label: 'Credit Note' },
        { value: 'claim_support', label: 'Claim Supporting Document' },
        { value: 'promotion_brief', label: 'Promotion Brief' },
        { value: 'trading_terms', label: 'Trading Terms Agreement' },
        { value: 'budget_approval', label: 'Budget Approval' },
        { value: 'settlement_proof', label: 'Settlement Proof' },
        { value: 'audit_report', label: 'Audit Report' },
        { value: 'compliance_cert', label: 'Compliance Certificate' },
        { value: 'general', label: 'General Document' }
      ],
      categories: [
        { value: 'financial', label: 'Financial' },
        { value: 'legal', label: 'Legal' },
        { value: 'operational', label: 'Operational' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' },
        { value: 'other', label: 'Other' }
      ],
      accessLevels: [
        { value: 'private', label: 'Private (Owner Only)' },
        { value: 'team', label: 'Team Access' },
        { value: 'department', label: 'Department Access' },
        { value: 'company', label: 'Company-Wide' },
        { value: 'public', label: 'Public' }
      ],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending_approval', label: 'Pending Approval' },
        { value: 'expired', label: 'Expired' },
        { value: 'deleted', label: 'Deleted' }
      ],
      entityTypes: [
        { value: 'promotion', label: 'Promotion' },
        { value: 'budget', label: 'Budget' },
        { value: 'claim', label: 'Claim' },
        { value: 'deduction', label: 'Deduction' },
        { value: 'settlement', label: 'Settlement' },
        { value: 'customer', label: 'Customer' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'product', label: 'Product' },
        { value: 'trading_term', label: 'Trading Term' },
        { value: 'accrual', label: 'Accrual' }
      ]
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/summary', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;

  try {
    const [totalDocs, activeDocs, folders, recentDocs, commentCount] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM documents WHERE company_id = ?').bind(companyId).first(),
      db.prepare("SELECT COUNT(*) as count FROM documents WHERE company_id = ? AND status = 'active'").bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as count FROM document_folders WHERE company_id = ?').bind(companyId).first(),
      db.prepare("SELECT COUNT(*) as count FROM documents WHERE company_id = ? AND created_at >= datetime('now', '-7 days')").bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as count FROM document_comments WHERE company_id = ?').bind(companyId).first()
    ]);

    const byType = await db.prepare(
      'SELECT document_type, COUNT(*) as count FROM documents WHERE company_id = ? GROUP BY document_type ORDER BY count DESC'
    ).bind(companyId).all();

    const byCategory = await db.prepare(
      'SELECT category, COUNT(*) as count FROM documents WHERE company_id = ? GROUP BY category ORDER BY count DESC'
    ).bind(companyId).all();

    const byStatus = await db.prepare(
      'SELECT status, COUNT(*) as count FROM documents WHERE company_id = ? GROUP BY status ORDER BY count DESC'
    ).bind(companyId).all();

    return c.json({
      success: true,
      data: {
        totalDocuments: totalDocs?.count || 0,
        activeDocuments: activeDocs?.count || 0,
        totalFolders: folders?.count || 0,
        recentUploads: recentDocs?.count || 0,
        totalComments: commentCount?.count || 0,
        byType: byType?.results || [],
        byCategory: byCategory?.results || [],
        byStatus: byStatus?.results || []
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - LIST
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/list', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const { status, document_type, category, entity_type, entity_id, parent_id, search, page = '1', limit = '20' } = c.req.query();

  try {
    let where = 'WHERE company_id = ?';
    const params = [companyId];

    if (status) { where += ' AND status = ?'; params.push(status); }
    if (document_type) { where += ' AND document_type = ?'; params.push(document_type); }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
    if (entity_id) { where += ' AND entity_id = ?'; params.push(entity_id); }
    if (parent_id) { where += ' AND parent_id = ?'; params.push(parent_id); }
    if (search) { where += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countResult = await db.prepare(`SELECT COUNT(*) as count FROM documents ${where}`).bind(...params).first();

    const results = await db.prepare(
      `SELECT * FROM documents ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, parseInt(limit), offset).all();

    return c.json({
      success: true,
      data: (results?.results || []).map(rowToDocument),
      pagination: {
        total: countResult?.count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((countResult?.count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - GET BY ID
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const doc = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!doc) return c.json({ success: false, message: 'Document not found' }, 404);

    const comments = await db.prepare(
      'SELECT * FROM document_comments WHERE document_id = ? AND company_id = ? ORDER BY created_at DESC'
    ).bind(id, companyId).all();

    const versions = await db.prepare(
      'SELECT id, version, file_name, file_size, uploaded_by, created_at FROM documents WHERE company_id = ? AND (id = ? OR parent_id = ?) ORDER BY version DESC'
    ).bind(companyId, id, id).all();

    return c.json({
      success: true,
      data: {
        ...rowToDocument(doc),
        comments: (comments?.results || []).map(rowToDocument),
        versions: (versions?.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - CREATE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.post('/', async (c) => {
  const companyId = getCompanyId(c);
  const userId = getUserId(c);
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO documents (id, company_id, name, description, document_type, category, status, file_name, file_type, file_size, file_url, storage_key, entity_type, entity_id, entity_name, version, is_latest, parent_id, tags, access_level, shared_with, uploaded_by, expires_at, notes, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.name, body.description || null, body.documentType || 'general',
      body.category || 'other', body.status || 'active', body.fileName || null,
      body.fileType || null, body.fileSize || 0, body.fileUrl || null, body.storageKey || null,
      body.entityType || null, body.entityId || null, body.entityName || null,
      body.version || 1, 1, body.parentId || null, body.tags || null,
      body.accessLevel || 'private', body.sharedWith || null, userId,
      body.expiresAt || null, body.notes || null, JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - UPDATE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.put('/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Document not found' }, 404);

    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE documents SET name = ?, description = ?, document_type = ?, category = ?, status = ?, file_name = ?, file_type = ?, file_size = ?, file_url = ?, entity_type = ?, entity_id = ?, entity_name = ?, tags = ?, access_level = ?, shared_with = ?, expires_at = ?, notes = ?, data = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.name ?? existing.name, body.description ?? existing.description,
      body.documentType ?? existing.document_type, body.category ?? existing.category,
      body.status ?? existing.status, body.fileName ?? existing.file_name,
      body.fileType ?? existing.file_type, body.fileSize ?? existing.file_size,
      body.fileUrl ?? existing.file_url, body.entityType ?? existing.entity_type,
      body.entityId ?? existing.entity_id, body.entityName ?? existing.entity_name,
      body.tags ?? existing.tags, body.accessLevel ?? existing.access_level,
      body.sharedWith ?? existing.shared_with, body.expiresAt ?? existing.expires_at,
      body.notes ?? existing.notes, JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id, companyId
    ).run();

    const updated = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - DELETE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.delete('/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Document not found' }, 404);

    await db.prepare('DELETE FROM document_comments WHERE document_id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM documents WHERE id = ? AND company_id = ?').bind(id, companyId).run();

    return c.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// FOLDERS - LIST
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/folders/list', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const { parent_id } = c.req.query();

  try {
    let where = 'WHERE company_id = ?';
    const params = [companyId];

    if (parent_id) { where += ' AND parent_id = ?'; params.push(parent_id); }
    else { where += ' AND (parent_id IS NULL OR parent_id = \'\')'; }

    const results = await db.prepare(
      `SELECT * FROM document_folders ${where} ORDER BY name ASC`
    ).bind(...params).all();

    return c.json({
      success: true,
      data: (results?.results || []).map(rowToDocument)
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// FOLDERS - CREATE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.post('/folders', async (c) => {
  const companyId = getCompanyId(c);
  const userId = getUserId(c);
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    let path = body.name;
    let level = 0;
    if (body.parentId) {
      const parent = await db.prepare('SELECT path, level FROM document_folders WHERE id = ? AND company_id = ?').bind(body.parentId, companyId).first();
      if (parent) {
        path = `${parent.path}/${body.name}`;
        level = (parent.level || 0) + 1;
      }
    }

    await db.prepare(`INSERT INTO document_folders (id, company_id, name, description, parent_id, path, level, color, icon, access_level, shared_with, created_by, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId, body.name, body.description || null, body.parentId || null,
      path, level, body.color || null, body.icon || null,
      body.accessLevel || 'private', body.sharedWith || null, userId,
      JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM document_folders WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// FOLDERS - UPDATE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.put('/folders/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM document_folders WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Folder not found' }, 404);

    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`UPDATE document_folders SET name = ?, description = ?, color = ?, icon = ?, access_level = ?, shared_with = ?, data = ?, updated_at = ? WHERE id = ? AND company_id = ?`).bind(
      body.name ?? existing.name, body.description ?? existing.description,
      body.color ?? existing.color, body.icon ?? existing.icon,
      body.accessLevel ?? existing.access_level, body.sharedWith ?? existing.shared_with,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')), now, id, companyId
    ).run();

    const updated = await db.prepare('SELECT * FROM document_folders WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// FOLDERS - DELETE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.delete('/folders/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM document_folders WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Folder not found' }, 404);

    const childDocs = await db.prepare('SELECT COUNT(*) as count FROM documents WHERE parent_id = ? AND company_id = ?').bind(id, companyId).first();
    const childFolders = await db.prepare('SELECT COUNT(*) as count FROM document_folders WHERE parent_id = ? AND company_id = ?').bind(id, companyId).first();

    if ((childDocs?.count || 0) > 0 || (childFolders?.count || 0) > 0) {
      return c.json({ success: false, message: 'Folder is not empty. Move or delete contents first.' }, 400);
    }

    await db.prepare('DELETE FROM document_folders WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// COMMENTS - LIST BY DOCUMENT
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/:documentId/comments', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const documentId = c.req.param('documentId');

  try {
    const results = await db.prepare(
      'SELECT * FROM document_comments WHERE document_id = ? AND company_id = ? ORDER BY created_at ASC'
    ).bind(documentId, companyId).all();

    return c.json({
      success: true,
      data: (results?.results || []).map(rowToDocument)
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// COMMENTS - CREATE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.post('/:documentId/comments', async (c) => {
  const companyId = getCompanyId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const documentId = c.req.param('documentId');

  try {
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`INSERT INTO document_comments (id, company_id, document_id, user_id, user_name, content, parent_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      id, companyId, documentId, userId, body.userName || null,
      body.content, body.parentId || null, JSON.stringify(body.data || {}), now, now
    ).run();

    const created = await db.prepare('SELECT * FROM document_comments WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// COMMENTS - RESOLVE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.post('/comments/:id/resolve', async (c) => {
  const companyId = getCompanyId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM document_comments WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Comment not found' }, 404);

    const now = new Date().toISOString();
    await db.prepare('UPDATE document_comments SET is_resolved = 1, resolved_by = ?, resolved_at = ?, updated_at = ? WHERE id = ?').bind(userId, now, now, id).run();

    const updated = await db.prepare('SELECT * FROM document_comments WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// COMMENTS - DELETE
// ═══════════════════════════════════════════════════════════════════════

documentManagement.delete('/comments/:id', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    const existing = await db.prepare('SELECT * FROM document_comments WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Comment not found' }, 404);

    await db.prepare('DELETE FROM document_comments WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DOCUMENTS - BY ENTITY (get all docs linked to a specific entity)
// ═══════════════════════════════════════════════════════════════════════

documentManagement.get('/entity/:entityType/:entityId', async (c) => {
  const companyId = getCompanyId(c);
  const db = c.env.DB;
  const entityType = c.req.param('entityType');
  const entityId = c.req.param('entityId');

  try {
    const results = await db.prepare(
      'SELECT * FROM documents WHERE company_id = ? AND entity_type = ? AND entity_id = ? ORDER BY updated_at DESC'
    ).bind(companyId, entityType, entityId).all();

    return c.json({
      success: true,
      data: (results?.results || []).map(rowToDocument)
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const documentManagementRoutes = documentManagement;
