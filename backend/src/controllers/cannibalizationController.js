/**
 * Cannibalization Analysis Controller
 */

const cannibalizationService = require('../services/cannibalizationService');

exports.analyzePromotion = async (req, res) => {
  try {
    const {
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!productId || !customerId || !promotionStartDate || !promotionEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, customerId, promotionStartDate, promotionEndDate'
      });
    }

    const result = await cannibalizationService.analyzePromotion({
      promotionId,
      productId,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing cannibalization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.calculateSubstitutionMatrix = async (req, res) => {
  try {
    const {
      categoryId,
      customerId,
      startDate,
      endDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!categoryId || !customerId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: categoryId, customerId, startDate, endDate'
      });
    }

    const result = await cannibalizationService.calculateSubstitutionMatrix({
      categoryId,
      customerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating substitution matrix:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.analyzeCategoryImpact = async (req, res) => {
  try {
    const {
      promotedCategory,
      customerId,
      promotionStartDate,
      promotionEndDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!promotedCategory || !customerId || !promotionStartDate || !promotionEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: promotedCategory, customerId, promotionStartDate, promotionEndDate'
      });
    }

    const result = await cannibalizationService.analyzeCategoryImpact({
      promotedCategory,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing category impact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.calculateNetIncremental = async (req, res) => {
  try {
    const {
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!productId || !customerId || !promotionStartDate || !promotionEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, customerId, promotionStartDate, promotionEndDate'
      });
    }

    const result = await cannibalizationService.calculateNetIncremental({
      promotionId,
      productId,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating net incremental:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.predictCannibalization = async (req, res) => {
  try {
    const {
      productId,
      customerId,
      plannedStartDate,
      plannedEndDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!productId || !customerId || !plannedStartDate || !plannedEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, customerId, plannedStartDate, plannedEndDate'
      });
    }

    const result = await cannibalizationService.predictCannibalization({
      productId,
      customerId,
      plannedStartDate: new Date(plannedStartDate),
      plannedEndDate: new Date(plannedEndDate),
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error predicting cannibalization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
