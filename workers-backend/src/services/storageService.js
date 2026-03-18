// GAP-03: R2 File Storage Service

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  constructor(env) {
    this.bucket = env.STORAGE;
  }

  async upload(companyId, entityType, entityId, filename, body, contentType) {
    if (!this.bucket) throw new Error('R2 storage not configured');
    if (body.byteLength > MAX_SIZE) throw new Error('File exceeds 10MB limit');

    const key = `${companyId}/${entityType}/${entityId}/${Date.now()}-${filename}`;
    await this.bucket.put(key, body, {
      httpMetadata: { contentType },
      customMetadata: { companyId, entityType, entityId, originalName: filename }
    });
    return { key, size: body.byteLength, contentType, filename };
  }

  async download(key) {
    if (!this.bucket) throw new Error('R2 storage not configured');
    const object = await this.bucket.get(key);
    if (!object) throw new Error('File not found');
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || 'application/octet-stream',
      size: object.size,
      metadata: object.customMetadata
    };
  }

  async delete(key) {
    if (!this.bucket) throw new Error('R2 storage not configured');
    await this.bucket.delete(key);
  }

  async list(prefix, limit = 100) {
    if (!this.bucket) return { objects: [] };
    const listed = await this.bucket.list({ prefix, limit });
    return {
      objects: listed.objects.map(o => ({
        key: o.key,
        size: o.size,
        uploaded: o.uploaded,
        contentType: o.httpMetadata?.contentType
      }))
    };
  }

  validateFile(contentType, size) {
    if (!ALLOWED_TYPES.includes(contentType)) {
      return { valid: false, error: `File type ${contentType} not allowed. Allowed: pdf, xlsx, csv, docx, png, jpg` };
    }
    if (size > MAX_SIZE) {
      return { valid: false, error: 'File exceeds 10MB limit' };
    }
    return { valid: true };
  }
}
