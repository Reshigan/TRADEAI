import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole, requireMinRole } from '../middleware/auth.js';

export const companyRoutes = new Hono();

// PBKDF2 password hashing (consistent with auth.js)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, HASH_LENGTH * 8);
  return `${toHex(salt)}:${toHex(hashBuffer)}`;
}

companyRoutes.use('*', authMiddleware);

// Get all companies (super_admin sees all, admin sees own)
companyRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 50, search, status } = c.req.query();

    const filter = {};
    // Non-super_admin users only see their own company
    if (user.role !== 'super_admin') {
      const companyId = user.companyId || user.company_id;
      if (!companyId) {
        return c.json({ success: true, data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
      filter._id = { $oid: companyId };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const companies = await mongodb.find('companies', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    const total = await mongodb.countDocuments('companies', filter);

    return c.json({
      success: true,
      data: companies,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get companies', error: error.message }, 500);
  }
});

// Get company by ID
companyRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const mongodb = getMongoClient(c);

    // Authorization: super_admin can see any company, others only their own
    if (user.role !== 'super_admin') {
      const userCompanyId = user.companyId || user.company_id;
      if (userCompanyId !== id) {
        return c.json({ success: false, message: 'Insufficient permissions' }, 403);
      }
    }

    const company = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!company) return c.json({ success: false, message: 'Company not found' }, 404);

    return c.json({ success: true, data: company });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get company', error: error.message }, 500);
  }
});

// Get company users
companyRoutes.get('/:id/users', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const mongodb = getMongoClient(c);

    // Authorization: super_admin can see any company's users, others only their own
    if (user.role !== 'super_admin') {
      const userCompanyId = user.companyId || user.company_id;
      if (userCompanyId !== id) {
        return c.json({ success: false, message: 'Insufficient permissions' }, 403);
      }
    }

    const users = await mongodb.find('users', { companyId: id }, {
      sort: { createdAt: -1 },
      limit: 100
    });

    // Strip sensitive fields
    const safeUsers = users.map(u => {
      const { password, refreshToken, refresh_token, ...safe } = u;
      return safe;
    });

    return c.json({ success: true, data: safeUsers });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get company users', error: error.message }, 500);
  }
});

// Get company modules
companyRoutes.get('/:id/modules', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const mongodb = getMongoClient(c);

    // Authorization: super_admin can see any company, others only their own
    if (user.role !== 'super_admin') {
      const userCompanyId = user.companyId || user.company_id;
      if (userCompanyId !== id) {
        return c.json({ success: false, message: 'Insufficient permissions' }, 403);
      }
    }

    const company = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!company) return c.json({ success: false, message: 'Company not found' }, 404);

    // Parse modules from company data or return defaults
    let modules = {};
    try {
      modules = company.modules ? (typeof company.modules === 'string' ? JSON.parse(company.modules) : company.modules) : {};
    } catch (e) {
      modules = {};
    }

    const defaultModules = {
      budgets: true,
      promotions: true,
      tradeSpends: true,
      claims: false,
      deductions: false,
      rebates: false,
      forecasting: false,
      aiPredictions: false,
      sapIntegration: false,
      advancedAnalytics: false,
      workflowApprovals: false,
      documentManagement: false
    };

    return c.json({ success: true, data: { ...defaultModules, ...modules } });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get company modules', error: error.message }, 500);
  }
});

// Create company (super_admin only)
companyRoutes.post('/', requireRole('super_admin'), async (c) => {
  try {
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    if (!data.name) {
      return c.json({ success: false, message: 'Company name is required' }, 400);
    }

    const now = new Date().toISOString();
    const companyData = {
      name: data.name,
      industry: data.industry || 'FMCG',
      region: data.region || '',
      address: data.address || '',
      phone: data.phone || '',
      website: data.website || '',
      currency: data.currency || 'ZAR',
      status: data.status || 'active',
      taxId: data.taxId || '',
      notes: data.notes || '',
      modules: JSON.stringify(data.modules || {
        budgets: true,
        promotions: true,
        tradeSpends: true,
        claims: false,
        deductions: false,
        rebates: false,
        forecasting: false,
        aiPredictions: false,
        sapIntegration: false,
        advancedAnalytics: false,
        workflowApprovals: false,
        documentManagement: false
      }),
      createdAt: now,
      updatedAt: now
    };

    const result = await mongodb.insertOne('companies', companyData);

    return c.json({ success: true, data: { id: result, ...companyData }, message: 'Company created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create company', error: error.message }, 500);
  }
});

// Update company
companyRoutes.put('/:id', requireMinRole('admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    // Non-super_admin can only update their own company
    const user = c.get('user');
    if (user.role !== 'super_admin') {
      const userCompanyId = user.companyId || user.company_id;
      if (userCompanyId !== id) {
        return c.json({ success: false, message: 'You can only update your own company' }, 403);
      }
    }

    // Fetch existing company to preserve all data fields
    const existing = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!existing) {
      return c.json({ success: false, message: 'Company not found' }, 404);
    }

    // Build full update by merging existing fields with incoming updates
    const preservedFields = {};
    const allDataFields = ['name', 'slug', 'domain', 'industry', 'region', 'address', 'phone', 'website', 'currency', 'status', 'plan', 'maxUsers', 'taxId', 'notes', 'modules'];
    for (const field of allDataFields) {
      if (existing[field] !== undefined) {
        preservedFields[field] = existing[field];
      }
    }

    // If modules is an object, stringify it
    if (updates.modules && typeof updates.modules === 'object') {
      updates.modules = JSON.stringify(updates.modules);
    }

    const mergedUpdate = { ...preservedFields, ...updates, updatedAt: new Date().toISOString() };
    await mongodb.updateOne('companies', { _id: { $oid: id } }, mergedUpdate);

    return c.json({ success: true, message: 'Company updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update company', error: error.message }, 500);
  }
});

// Update company modules (super_admin only)
companyRoutes.put('/:id/modules', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const { modules } = await c.req.json();
    const mongodb = getMongoClient(c);

    if (!modules || typeof modules !== 'object') {
      return c.json({ success: false, message: 'modules object is required' }, 400);
    }

    // Fetch existing company to preserve all data fields
    const existing = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!existing) {
      return c.json({ success: false, message: 'Company not found' }, 404);
    }

    // Build full update preserving all existing fields, only changing modules
    const preservedFields = {};
    const fieldsToPreserve = ['name', 'slug', 'domain', 'industry', 'region', 'address', 'phone', 'website', 'currency', 'status', 'plan', 'maxUsers', 'taxId', 'notes'];
    for (const field of fieldsToPreserve) {
      if (existing[field] !== undefined) {
        preservedFields[field] = existing[field];
      }
    }

    await mongodb.updateOne('companies', { _id: { $oid: id } }, {
      ...preservedFields,
      modules: JSON.stringify(modules),
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true, message: 'Company modules updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update modules', error: error.message }, 500);
  }
});

// Assign admin user to company (super_admin only)
companyRoutes.post('/:id/assign-admin', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const { email, firstName, lastName, password } = await c.req.json();
    const mongodb = getMongoClient(c);

    // Verify company exists
    const company = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!company) return c.json({ success: false, message: 'Company not found' }, 404);

    if (!email || !firstName || !lastName || !password) {
      return c.json({ success: false, message: 'email, firstName, lastName, and password are required' }, 400);
    }

    // Check if user with this email already exists
    const existing = await mongodb.findOne('users', { email: email.toLowerCase() });
    if (existing) {
      // Update existing user to admin of this company
      const existingId = existing._id?.$oid || existing._id || existing.id;
      await mongodb.updateOne('users', { _id: { $oid: existingId } }, {
        role: 'admin',
        companyId: id,
        updatedAt: new Date().toISOString()
      });
      return c.json({ success: true, message: 'Existing user promoted to admin for this company' });
    }

    // Hash password using PBKDF2 (consistent with auth system)
    const hashedPassword = await hashPasswordPBKDF2(password);

    const now = new Date().toISOString();
    const newAdmin = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      companyId: id,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const userId = await mongodb.insertOne('users', newAdmin);

    return c.json({
      success: true,
      data: { userId, email: newAdmin.email, role: 'admin', companyId: id },
      message: `Admin user ${email} created and assigned to ${company.name}`
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to assign admin', error: error.message }, 500);
  }
});

// Delete company (super_admin only) - soft delete by setting status to cancelled
companyRoutes.delete('/:id', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const mongodb = getMongoClient(c);

    const company = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!company) return c.json({ success: false, message: 'Company not found' }, 404);

    // Soft delete - set status to cancelled
    await mongodb.updateOne('companies', { _id: { $oid: id } }, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true, message: `Company ${company.name} has been deactivated` });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete company', error: error.message }, 500);
  }
});
