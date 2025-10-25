/**
 * Forward Buy Detection Controller
 */

const forwardBuyService = require('../services/forwardBuyService');

exports.detectForwardBuy = async (req, res) => {
  try {
    const {
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      postPromoPeriodWeeks
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!productId || !customerId || !promotionStartDate || !promotionEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, customerId, promotionStartDate, promotionEndDate'
      });
    }

    const result = await forwardBuyService.detectForwardBuy({
      promotionId,
      productId,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId,
      postPromoPeriodWeeks: postPromoPeriodWeeks || 4
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error detecting forward buy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.calculateNetPromotionImpact = async (req, res) => {
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

    const result = await forwardBuyService.calculateNetPromotionImpact({
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
    console.error('Error calculating net promotion impact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.predictForwardBuyRisk = async (req, res) => {
  try {
    const {
      productId,
      customerId,
      plannedDiscountPercent
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!productId || !customerId || plannedDiscountPercent === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, customerId, plannedDiscountPercent'
      });
    }

    const result = await forwardBuyService.predictForwardBuyRisk({
      productId,
      customerId,
      plannedDiscountPercent,
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error predicting forward buy risk:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.analyzeCategoryForwardBuy = async (req, res) => {
  try {
    const {
      category,
      customerId,
      startDate,
      endDate
    } = req.body;

    const tenantId = req.user.tenantId;

    if (!category || !customerId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, customerId, startDate, endDate'
      });
    }

    const result = await forwardBuyService.analyzeCategoryForwardBuy({
      category,
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
    console.error('Error analyzing category forward buy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
