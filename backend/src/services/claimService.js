const Claim = require('../models/Claim');
const _Deduction = require('../models/Deduction');
const Invoice = require('../models/Invoice');

class ClaimService {
  async createClaim(tenantId, claimData, userId) {
    const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const claim = new Claim({
      company: tenantId,
      claimId,
      claimType: claimData.claimType,
      customer: claimData.customer,
      promotion: claimData.promotion,
      tradingTerm: claimData.tradingTerm,
      claimDate: claimData.claimDate || new Date(),
      claimPeriod: claimData.claimPeriod,
      claimAmount: claimData.claimAmount,
      currency: claimData.currency || 'ZAR',
      lineItems: claimData.lineItems || [],
      supportingDocuments: claimData.supportingDocuments || [],
      notes: claimData.notes,
      auditTrail: [{
        action: 'created',
        performedBy: userId,
        details: { amount: claimData.claimAmount }
      }]
    });

    await claim.save();
    return claim;
  }

  async submitClaim(claimId, userId) {
    const claim = await Claim.findById(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    await claim.submit(userId);
    return claim;
  }

  async approveClaim(claimId, userId, approvedAmount) {
    const claim = await Claim.findById(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    await claim.approve(userId, approvedAmount);
    return claim;
  }

  async rejectClaim(claimId, userId, reason) {
    const claim = await Claim.findById(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    await claim.reject(userId, reason);
    return claim;
  }

  async matchClaimToInvoice(claimId, invoiceId, invoiceNumber, matchedAmount) {
    const claim = await Claim.findById(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    await claim.matchToInvoice(invoiceId, invoiceNumber, matchedAmount);
    return claim;
  }

  async autoMatchClaims(tenantId) {
    const unmatchedClaims = await Claim.findUnmatched(tenantId);
    const matchResults = [];

    for (const claim of unmatchedClaims) {
      const invoices = await Invoice.find({
        company: tenantId,
        customer: claim.customer,
        invoiceDate: {
          $gte: claim.claimPeriod?.start || new Date(claim.claimDate.getTime() - 90 * 24 * 60 * 60 * 1000),
          $lte: claim.claimPeriod?.end || claim.claimDate
        }
      });

      for (const invoice of invoices) {
        const matchedAmount = Math.min(claim.claimAmount, invoice.totalAmount);

        if (matchedAmount > 0) {
          await claim.matchToInvoice(invoice._id, invoice.invoiceNumber, matchedAmount);
          matchResults.push({
            claimId: claim._id,
            invoiceId: invoice._id,
            matchedAmount,
            matchType: 'auto'
          });

          if (claim.matching.matchStatus === 'full') {
            break;
          }
        }
      }
    }

    return matchResults;
  }

  getUnmatchedClaims(tenantId) {
    return Claim.findUnmatched(tenantId);
  }

  getPendingApprovalClaims(tenantId) {
    return Claim.findPendingApproval(tenantId);
  }

  getClaimsByCustomer(tenantId, customerId, startDate, endDate) {
    const query = {
      company: tenantId,
      customer: customerId
    };

    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) query.claimDate.$gte = new Date(startDate);
      if (endDate) query.claimDate.$lte = new Date(endDate);
    }

    return Claim.find(query)
      .populate('customer', 'name code')
      .populate('promotion', 'name code')
      .sort({ claimDate: -1 });
  }

  async getClaimStatistics(tenantId, startDate, endDate) {
    const match = { company: tenantId };

    if (startDate || endDate) {
      match.claimDate = {};
      if (startDate) match.claimDate.$gte = new Date(startDate);
      if (endDate) match.claimDate.$lte = new Date(endDate);
    }

    const stats = await Claim.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$claimAmount' },
          approvedAmount: { $sum: { $ifNull: ['$approvedAmount', 0] } }
        }
      }
    ]);

    const matchingStats = await Claim.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$matching.matchStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      byStatus: stats,
      byMatchingStatus: matchingStats
    };
  }
}

module.exports = new ClaimService();
