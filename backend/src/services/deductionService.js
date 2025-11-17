const Deduction = require('../models/Deduction');
const Claim = require('../models/Claim');
const Invoice = require('../models/Invoice');

class DeductionService {
  async createDeduction(tenantId, deductionData, userId) {
    const deductionId = `DED-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const deduction = new Deduction({
      company: tenantId,
      deductionId,
      deductionType: deductionData.deductionType,
      customer: deductionData.customer,
      invoice: deductionData.invoice,
      deductionDate: deductionData.deductionDate || new Date(),
      deductionAmount: deductionData.deductionAmount,
      currency: deductionData.currency || 'ZAR',
      promotion: deductionData.promotion,
      tradingTerm: deductionData.tradingTerm,
      lineItems: deductionData.lineItems || [],
      supportingDocuments: deductionData.supportingDocuments || [],
      notes: deductionData.notes,
      auditTrail: [{
        action: 'created',
        performedBy: userId,
        details: { amount: deductionData.deductionAmount }
      }]
    });

    await deduction.save();
    return deduction;
  }

  async validateDeduction(deductionId, userId, validatedAmount) {
    const deduction = await Deduction.findById(deductionId);

    if (!deduction) {
      throw new Error('Deduction not found');
    }

    await deduction.validate(userId, validatedAmount);
    return deduction;
  }

  async disputeDeduction(deductionId, userId, reason) {
    const deduction = await Deduction.findById(deductionId);

    if (!deduction) {
      throw new Error('Deduction not found');
    }

    await deduction.dispute(userId, reason);
    return deduction;
  }

  async resolveDeduction(deductionId, userId, resolutionType, finalAmount, notes) {
    const deduction = await Deduction.findById(deductionId);

    if (!deduction) {
      throw new Error('Deduction not found');
    }

    await deduction.resolve(userId, resolutionType, finalAmount, notes);
    return deduction;
  }

  async matchDeductionToClaim(deductionId, claimId, matchedAmount) {
    const deduction = await Deduction.findById(deductionId);

    if (!deduction) {
      throw new Error('Deduction not found');
    }

    await deduction.matchToClaim(claimId, matchedAmount);

    const claim = await Claim.findById(claimId);
    if (claim) {
      await claim.matchToInvoice(deduction.invoice.invoiceId, deduction.invoice.invoiceNumber, matchedAmount);
    }

    return deduction;
  }

  async autoMatchDeductions(tenantId) {
    const unmatchedDeductions = await Deduction.findUnmatched(tenantId);
    const matchResults = [];

    for (const deduction of unmatchedDeductions) {
      const claims = await Claim.find({
        company: tenantId,
        customer: deduction.customer,
        claimType: deduction.deductionType,
        status: { $in: ['approved', 'submitted'] },
        claimDate: {
          $gte: new Date(deduction.deductionDate.getTime() - 90 * 24 * 60 * 60 * 1000),
          $lte: deduction.deductionDate
        }
      });

      for (const claim of claims) {
        const unmatchedClaimAmount = claim.claimAmount -
          (claim.matching.invoices?.reduce((sum, inv) => sum + inv.matchedAmount, 0) || 0);

        if (unmatchedClaimAmount > 0) {
          const matchedAmount = Math.min(deduction.deductionAmount, unmatchedClaimAmount);

          await deduction.matchToClaim(claim._id, matchedAmount);
          await claim.matchToInvoice(deduction.invoice?.invoiceId, deduction.invoice?.invoiceNumber, matchedAmount);

          matchResults.push({
            deductionId: deduction._id,
            claimId: claim._id,
            matchedAmount,
            matchType: 'auto'
          });

          break;
        }
      }
    }

    return matchResults;
  }

  async getUnmatchedDeductions(tenantId) {
    return Deduction.findUnmatched(tenantId);
  }

  async getDisputedDeductions(tenantId) {
    return Deduction.findDisputed(tenantId);
  }

  async getDeductionsByCustomer(tenantId, customerId, startDate, endDate) {
    const query = {
      company: tenantId,
      customer: customerId
    };

    if (startDate || endDate) {
      query.deductionDate = {};
      if (startDate) query.deductionDate.$gte = new Date(startDate);
      if (endDate) query.deductionDate.$lte = new Date(endDate);
    }

    return Deduction.find(query)
      .populate('customer', 'name code')
      .populate('promotion', 'name code')
      .sort({ deductionDate: -1 });
  }

  async getDeductionStatistics(tenantId, startDate, endDate) {
    const match = { company: tenantId };

    if (startDate || endDate) {
      match.deductionDate = {};
      if (startDate) match.deductionDate.$gte = new Date(startDate);
      if (endDate) match.deductionDate.$lte = new Date(endDate);
    }

    const stats = await Deduction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$deductionAmount' },
          validatedAmount: { $sum: { $ifNull: ['$validatedAmount', 0] } }
        }
      }
    ]);

    const disputeStats = await Deduction.aggregate([
      { $match: { ...match, 'dispute.isDisputed': true } },
      {
        $group: {
          _id: '$resolution.resolutionType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$deductionAmount' }
        }
      }
    ]);

    return {
      byStatus: stats,
      disputes: disputeStats
    };
  }

  async reconcileDeductionsWithClaims(tenantId, customerId, startDate, endDate) {
    const deductions = await this.getDeductionsByCustomer(tenantId, customerId, startDate, endDate);
    const claims = await Claim.find({
      company: tenantId,
      customer: customerId,
      claimDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const totalDeductions = deductions.reduce((sum, d) => sum + d.deductionAmount, 0);
    const totalClaims = claims.reduce((sum, c) => sum + c.claimAmount, 0);
    const matchedDeductions = deductions.filter((d) => d.claim?.claimId).length;
    const matchedClaims = claims.filter((c) => c.matching.matchStatus === 'full').length;

    return {
      period: { startDate, endDate },
      customer: customerId,
      deductions: {
        count: deductions.length,
        totalAmount: totalDeductions,
        matched: matchedDeductions,
        unmatched: deductions.length - matchedDeductions
      },
      claims: {
        count: claims.length,
        totalAmount: totalClaims,
        matched: matchedClaims,
        unmatched: claims.length - matchedClaims
      },
      variance: {
        amount: totalDeductions - totalClaims,
        percentage: totalClaims > 0 ? ((totalDeductions - totalClaims) / totalClaims) * 100 : 0
      }
    };
  }
}

module.exports = new DeductionService();
