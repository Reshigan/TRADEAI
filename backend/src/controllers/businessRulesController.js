const { asyncHandler } = require('../middleware/errorHandler');
const BusinessRulesConfig = require('../models/BusinessRulesConfig');

exports.getConfig = asyncHandler(async (req, res) => {
  const companyId = req.tenant?.id || req.tenant?._id || req.user?.companyId || req.user?.tenantId;
  if (!companyId) {
    return res.status(400).json({ message: 'Missing tenant/company context' });
  }
  const config = await BusinessRulesConfig.getOrCreate(companyId);
  res.json(config);
});

exports.updateConfig = asyncHandler(async (req, res) => {
  const companyId = req.tenant?.id || req.tenant?._id || req.user?.companyId || req.user?.tenantId;
  if (!companyId) {
    return res.status(400).json({ message: 'Missing tenant/company context' });
  }

  const update = { ...req.body, companyId, updatedBy: req.user?._id };
  const options = { new: true, upsert: true, setDefaultsOnInsert: true };

  const config = await BusinessRulesConfig.findOneAndUpdate({ companyId }, update, options);
  res.json(config);
});
