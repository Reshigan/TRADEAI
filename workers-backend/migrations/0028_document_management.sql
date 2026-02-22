-- Feature 14: Document Management (Phase 3)
-- Tables for document storage, versioning, and sharing

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'active',
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  file_url TEXT,
  storage_key TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  version INTEGER DEFAULT 1,
  is_latest INTEGER NOT NULL DEFAULT 1,
  parent_id TEXT,
  tags TEXT,
  access_level TEXT NOT NULL DEFAULT 'private',
  shared_with TEXT,
  download_count INTEGER DEFAULT 0,
  last_accessed_at TEXT,
  uploaded_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  expires_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_folders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  path TEXT,
  level INTEGER DEFAULT 0,
  color TEXT,
  icon TEXT,
  access_level TEXT NOT NULL DEFAULT 'private',
  shared_with TEXT,
  document_count INTEGER DEFAULT 0,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_comments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  content TEXT NOT NULL,
  parent_id TEXT,
  is_resolved INTEGER DEFAULT 0,
  resolved_by TEXT,
  resolved_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(company_id, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_folders_company ON document_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent ON document_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_company ON document_comments(company_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id);
