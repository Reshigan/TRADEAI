const Tenant = require('../models/Tenant');

const validateTenant = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.params.tenantId;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required' });
  }

  try {
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant.isActive) {
      return res.status(403).json({ message: 'Tenant is inactive' });
    }

    if (tenant.isSuspended) {
      return res.status(403).json({ message: 'Tenant is suspended' });
    }

    if (tenant.subscription.plan === 'trial' && tenant.isTrialExpired) {
      return res.status(403).json({ message: 'Trial has expired' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating tenant', error: error.message });
  }
};

module.exports = { validateTenant };