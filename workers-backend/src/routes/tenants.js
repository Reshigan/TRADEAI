import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

export const tenantRoutes = new Hono();

tenantRoutes.use('*', authMiddleware);

// Get all tenants (super_admin only)
tenantRoutes.get('/', requireRole('super_admin'), async (c) => {
  try {
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 50, search, status } = c.req.query();

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (status && status !== 'all') filter.status = status;

    const tenants = await mongodb.find('companies', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    const total = await mongodb.countDocuments('companies', filter);

    // Enrich with user counts
    const enriched = await Promise.all(tenants.map(async (tenant) => {
      const tenantId = tenant.id || tenant._id;
      const userCount = await mongodb.countDocuments('users', { companyId: tenantId });
      let features = {};
      try {
        features = tenant.modules ? (typeof tenant.modules === 'string' ? JSON.parse(tenant.modules) : tenant.modules) : {};
      } catch (e) {
        features = {};
      }
      return {
        ...tenant,
        userCount,
        features,
        subscription: {
          plan: tenant.plan || 'professional',
          status: tenant.status || 'active'
        },
        limits: {
          maxUsers: tenant.maxUsers || 25,
          maxStorageGB: 10,
          maxCustomers: 2000,
          maxProducts: 5000,
          maxPromotions: 100
        }
      };
    }));

    return c.json({
      success: true,
      data: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get tenants', error: error.message }, 500);
  }
});

// Get tenant stats (super_admin only)
tenantRoutes.get('/stats', requireRole('super_admin'), async (c) => {
  try {
    const mongodb = getMongoClient(c);

    const totalTenants = await mongodb.countDocuments('companies', {});
    const activeTenants = await mongodb.countDocuments('companies', { status: 'active' });
    const totalUsers = await mongodb.countDocuments('users', {});

    return c.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalStorageGB: totalTenants * 0.5
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get stats', error: error.message }, 500);
  }
});

// Get single tenant (super_admin only)
tenantRoutes.get('/:id', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const mongodb = getMongoClient(c);

    const tenant = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!tenant) return c.json({ success: false, message: 'Tenant not found' }, 404);

    const userCount = await mongodb.countDocuments('users', { companyId: id });
    let features = {};
    try {
      features = tenant.modules ? (typeof tenant.modules === 'string' ? JSON.parse(tenant.modules) : tenant.modules) : {};
    } catch (e) {
      features = {};
    }

    return c.json({
      success: true,
      data: {
        ...tenant,
        userCount,
        features,
        subscription: {
          plan: tenant.plan || 'professional',
          status: tenant.status || 'active'
        }
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get tenant', error: error.message }, 500);
  }
});

// Create tenant (super_admin only) - creates a company + optional admin user
tenantRoutes.post('/', requireRole('super_admin'), async (c) => {
  try {
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    if (!data.name) {
      return c.json({ success: false, message: 'Tenant name is required' }, 400);
    }

    const now = new Date().toISOString();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const companyData = {
      name: data.name,
      slug,
      domain: data.domain || '',
      industry: data.companyInfo?.industry || data.industry || 'FMCG',
      region: data.companyInfo?.region || data.region || '',
      address: data.contactInfo?.address ? JSON.stringify(data.contactInfo.address) : '',
      phone: data.contactInfo?.primaryContact?.phone || data.phone || '',
      website: data.domain || '',
      currency: data.settings?.currency || data.currency || 'ZAR',
      status: data.subscription?.status || 'active',
      plan: data.subscription?.plan || 'professional',
      maxUsers: data.limits?.maxUsers || 25,
      taxId: data.companyInfo?.taxId || '',
      notes: '',
      modules: JSON.stringify(data.features || {
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

    const companyId = await mongodb.insertOne('companies', companyData);

    // If contact info has an email, create the admin user
    const adminEmail = data.contactInfo?.primaryContact?.email;
    const adminName = data.contactInfo?.primaryContact?.name;
    if (adminEmail && adminName) {
      const [firstName, ...lastParts] = adminName.split(' ');
      const lastName = lastParts.join(' ') || firstName;
      const defaultPassword = 'Admin123!';

      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(defaultPassword));
      const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      await mongodb.insertOne('users', {
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        companyId: companyId,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
    }

    return c.json({
      success: true,
      data: { id: companyId, ...companyData },
      message: 'Tenant created successfully'
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create tenant', error: error.message }, 500);
  }
});

// Update tenant (super_admin only)
tenantRoutes.put('/:id', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const existing = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!existing) return c.json({ success: false, message: 'Tenant not found' }, 404);

    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.domain) updates.domain = data.domain;
    if (data.companyInfo?.industry) updates.industry = data.companyInfo.industry;
    if (data.subscription?.plan) updates.plan = data.subscription.plan;
    if (data.subscription?.status) updates.status = data.subscription.status;
    if (data.settings?.currency) updates.currency = data.settings.currency;
    if (data.limits?.maxUsers) updates.maxUsers = data.limits.maxUsers;
    if (data.features) updates.modules = JSON.stringify(data.features);
    updates.updatedAt = new Date().toISOString();

    await mongodb.updateOne('companies', { _id: { $oid: id } }, updates);

    return c.json({ success: true, message: 'Tenant updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update tenant', error: error.message }, 500);
  }
});

// Delete tenant (super_admin only) - soft delete
tenantRoutes.delete('/:id', requireRole('super_admin'), async (c) => {
  try {
    const { id } = c.req.param();
    const mongodb = getMongoClient(c);

    const tenant = await mongodb.findOne('companies', { _id: { $oid: id } });
    if (!tenant) return c.json({ success: false, message: 'Tenant not found' }, 404);

    await mongodb.updateOne('companies', { _id: { $oid: id } }, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true, message: `Tenant ${tenant.name} has been deactivated` });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete tenant', error: error.message }, 500);
  }
});
