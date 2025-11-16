const express = require('express');
const router = express.Router();
const { Region, District, Store } = require('../models/StoreHierarchy');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

router.get('/regions', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, isActive } = req.query;
  
  const query = {};
  
  if (req.user.companyId) {
    query.tenantId = req.user.companyId;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  const regions = await Region.find(query)
    .populate('regionalManager', 'firstName lastName email')
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await Region.countDocuments(query);
  
  res.json({
    success: true,
    data: regions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

router.get('/regions/:id', protect, asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id)
    .populate('regionalManager', 'firstName lastName email');
  
  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found'
    });
  }
  
  const districtCount = await region.getDistrictCount();
  const storeCount = await region.getStoreCount();
  
  res.json({
    success: true,
    data: {
      ...region.toObject(),
      districtCount,
      storeCount
    }
  });
}));

router.post('/regions', protect, asyncHandler(async (req, res) => {
  const regionData = {
    ...req.body,
    tenantId: req.user.companyId
  };
  
  const region = await Region.create(regionData);
  
  res.status(201).json({
    success: true,
    data: region
  });
}));

router.put('/regions/:id', protect, asyncHandler(async (req, res) => {
  let region = await Region.findById(req.params.id);
  
  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found'
    });
  }
  
  region = await Region.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    data: region
  });
}));

router.delete('/regions/:id', protect, asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id);
  
  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found'
    });
  }
  
  const districtCount = await region.getDistrictCount();
  if (districtCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete region with ${districtCount} districts. Delete districts first.`
    });
  }
  
  await region.deleteOne();
  
  res.json({
    success: true,
    message: 'Region deleted successfully'
  });
}));

router.get('/districts', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, regionId, isActive } = req.query;
  
  const query = {};
  
  if (req.user.companyId) {
    query.tenantId = req.user.companyId;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (regionId) {
    query.region = regionId;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  const districts = await District.find(query)
    .populate('region', 'name code')
    .populate('districtManager', 'firstName lastName email')
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await District.countDocuments(query);
  
  res.json({
    success: true,
    data: districts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

router.get('/districts/:id', protect, asyncHandler(async (req, res) => {
  const district = await District.findById(req.params.id)
    .populate('region', 'name code')
    .populate('districtManager', 'firstName lastName email');
  
  if (!district) {
    return res.status(404).json({
      success: false,
      message: 'District not found'
    });
  }
  
  const storeCount = await district.getStoreCount();
  
  res.json({
    success: true,
    data: {
      ...district.toObject(),
      storeCount
    }
  });
}));

router.post('/districts', protect, asyncHandler(async (req, res) => {
  const districtData = {
    ...req.body,
    tenantId: req.user.companyId
  };
  
  const district = await District.create(districtData);
  await district.populate('region', 'name code');
  
  res.status(201).json({
    success: true,
    data: district
  });
}));

router.put('/districts/:id', protect, asyncHandler(async (req, res) => {
  let district = await District.findById(req.params.id);
  
  if (!district) {
    return res.status(404).json({
      success: false,
      message: 'District not found'
    });
  }
  
  district = await District.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('region', 'name code');
  
  res.json({
    success: true,
    data: district
  });
}));

router.delete('/districts/:id', protect, asyncHandler(async (req, res) => {
  const district = await District.findById(req.params.id);
  
  if (!district) {
    return res.status(404).json({
      success: false,
      message: 'District not found'
    });
  }
  
  const storeCount = await district.getStoreCount();
  if (storeCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete district with ${storeCount} stores. Delete stores first.`
    });
  }
  
  await district.deleteOne();
  
  res.json({
    success: true,
    message: 'District deleted successfully'
  });
}));

router.get('/stores', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, regionId, districtId, isActive, storeType } = req.query;
  
  const query = {};
  
  if (req.user.companyId) {
    query.tenantId = req.user.companyId;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { storeCode: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (regionId) {
    query.region = regionId;
  }
  
  if (districtId) {
    query.district = districtId;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (storeType) {
    query.storeType = storeType;
  }
  
  const stores = await Store.find(query)
    .populate('region', 'name code')
    .populate('district', 'name code')
    .populate('storeManager', 'firstName lastName email')
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await Store.countDocuments(query);
  
  res.json({
    success: true,
    data: stores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

router.get('/stores/:id', protect, asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id)
    .populate('region', 'name code')
    .populate('district', 'name code')
    .populate('storeManager', 'firstName lastName email');
  
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }
  
  res.json({
    success: true,
    data: store
  });
}));

router.post('/stores', protect, asyncHandler(async (req, res) => {
  const storeData = {
    ...req.body,
    tenantId: req.user.companyId
  };
  
  const store = await Store.create(storeData);
  await store.populate(['region', 'district']);
  
  res.status(201).json({
    success: true,
    data: store
  });
}));

router.put('/stores/:id', protect, asyncHandler(async (req, res) => {
  let store = await Store.findById(req.params.id);
  
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }
  
  store = await Store.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(['region', 'district']);
  
  res.json({
    success: true,
    data: store
  });
}));

router.delete('/stores/:id', protect, asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  
  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }
  
  await store.deleteOne();
  
  res.json({
    success: true,
    message: 'Store deleted successfully'
  });
}));

router.get('/tree', protect, asyncHandler(async (req, res) => {
  const query = {};
  
  if (req.user.companyId) {
    query.tenantId = req.user.companyId;
  }
  
  const regions = await Region.find({ ...query, isActive: true }).sort({ name: 1 });
  
  const tree = await Promise.all(regions.map(async (region) => {
    const districts = await District.find({ 
      region: region._id, 
      isActive: true 
    }).sort({ name: 1 });
    
    const districtsWithStores = await Promise.all(districts.map(async (district) => {
      const stores = await Store.find({ 
        district: district._id, 
        isActive: true 
      }).sort({ name: 1 });
      
      return {
        ...district.toObject(),
        stores
      };
    }));
    
    return {
      ...region.toObject(),
      districts: districtsWithStores
    };
  }));
  
  res.json({
    success: true,
    data: tree
  });
}));

module.exports = router;
