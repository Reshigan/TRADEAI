const mongoose = require('mongoose');
const Accrual = require('../models/Accrual');
const Claim = require('../models/Claim');
const Deduction = require('../models/Deduction');
const Settlement = require('../models/Settlement');

class ReconciliationService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async getReconciliationDashboard(period = {}) {
    const startDate = period.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = period.endDate || new Date();

    const [accrualSummary, claimSummary, deductionSummary, settlementSummary] = await Promise.all([
      this.getAccrualSummary(startDate, endDate),
      this.getClaimSummary(startDate, endDate),
      this.getDeductionSummary(startDate, endDate),
      this.getSettlementSummary(startDate, endDate)
    ]);

    const openExposure = this.calculateOpenExposure(accrualSummary, claimSummary, deductionSummary);

    const agingAnalysis = await this.getAgingAnalysis();

    return {
      period: { startDate, endDate },
      accruals: accrualSummary,
      claims: claimSummary,
      deductions: deductionSummary,
      settlements: settlementSummary,
      openExposure,
      agingAnalysis,
      generatedAt: new Date()
    };
  }

  async getAccrualSummary(startDate, endDate) {
    const accruals = await Accrual.aggregate([
      {
        $match: {
          accrualDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAccrual: { $sum: '$totalAccrual' },
          totalActual: { $sum: '$totalActual' },
          totalVariance: { $sum: '$totalVariance' }
        }
      }
    ]);

    const byType = await Accrual.aggregate([
      {
        $match: {
          accrualDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$accrualType',
          count: { $sum: 1 },
          totalAccrual: { $sum: '$totalAccrual' }
        }
      }
    ]);

    const unreconciledCount = await Accrual.countDocuments({
      accrualDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['posted', 'adjusted'] },
      reconciled: false
    });

    return {
      byStatus: accruals,
      byType,
      unreconciledCount,
      totalAccrued: accruals.reduce((sum, a) => sum + a.totalAccrual, 0),
      totalActual: accruals.reduce((sum, a) => sum + a.totalActual, 0),
      totalVariance: accruals.reduce((sum, a) => sum + a.totalVariance, 0)
    };
  }

  async getClaimSummary(startDate, endDate) {
    const claims = await Claim.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(this.tenantId),
          claimDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalClaimed: { $sum: '$claimAmount' },
          totalApproved: { $sum: '$approvedAmount' }
        }
      }
    ]);

    const byType = await Claim.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(this.tenantId),
          claimDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$claimType',
          count: { $sum: 1 },
          totalClaimed: { $sum: '$claimAmount' }
        }
      }
    ]);

    const unmatchedCount = await Claim.countDocuments({
      company: this.tenantId,
      claimDate: { $gte: startDate, $lte: endDate },
      'matching.matchStatus': { $in: ['unmatched', 'partial'] }
    });

    return {
      byStatus: claims,
      byType,
      unmatchedCount,
      totalClaimed: claims.reduce((sum, c) => sum + (c.totalClaimed || 0), 0),
      totalApproved: claims.reduce((sum, c) => sum + (c.totalApproved || 0), 0)
    };
  }

  async getDeductionSummary(startDate, endDate) {
    const deductions = await Deduction.aggregate([
      {
        $match: {
          deductionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalApproved: { $sum: '$approvedAmount' }
        }
      }
    ]);

    const byCategory = await Deduction.aggregate([
      {
        $match: {
          deductionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const pendingCount = await Deduction.countDocuments({
      deductionDate: { $gte: startDate, $lte: endDate },
      status: 'pending'
    });

    return {
      byStatus: deductions,
      byCategory,
      pendingCount,
      totalDeductions: deductions.reduce((sum, d) => sum + (d.totalAmount || 0), 0),
      totalApproved: deductions.reduce((sum, d) => sum + (d.totalApproved || 0), 0)
    };
  }

  async getSettlementSummary(startDate, endDate) {
    const settlements = await Settlement.aggregate([
      {
        $match: {
          settlementDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalNet: { $sum: '$netSettlement' }
        }
      }
    ]);

    const unreconciledCount = await Settlement.countDocuments({
      settlementDate: { $gte: startDate, $lte: endDate },
      status: 'completed',
      reconciled: false
    });

    return {
      byStatus: settlements,
      unreconciledCount,
      totalSettled: settlements
        .filter((s) => s._id === 'completed')
        .reduce((sum, s) => sum + (s.totalNet || 0), 0)
    };
  }

  calculateOpenExposure(accruals, claims, deductions) {
    const accrualExposure = accruals.totalAccrued - accruals.totalActual;
    const claimExposure = claims.totalClaimed - claims.totalApproved;
    const deductionExposure = deductions.totalDeductions - deductions.totalApproved;

    return {
      accrualExposure,
      claimExposure,
      deductionExposure,
      totalExposure: accrualExposure + claimExposure + deductionExposure,
      breakdown: {
        unreconciledAccruals: accruals.unreconciledCount,
        unmatchedClaims: claims.unmatchedCount,
        pendingDeductions: deductions.pendingCount
      }
    };
  }

  async getAgingAnalysis() {
    const now = new Date();
    const buckets = [
      { name: '0-30 days', min: 0, max: 30 },
      { name: '31-60 days', min: 31, max: 60 },
      { name: '61-90 days', min: 61, max: 90 },
      { name: '90+ days', min: 91, max: 9999 }
    ];

    const claimAging = await Promise.all(buckets.map(async (bucket) => {
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() - bucket.max);
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() - bucket.min);

      const count = await Claim.countDocuments({
        company: this.tenantId,
        status: { $in: ['submitted', 'under_review'] },
        claimDate: { $gte: minDate, $lte: maxDate }
      });

      const total = await Claim.aggregate([
        {
          $match: {
            company: mongoose.Types.ObjectId(this.tenantId),
            status: { $in: ['submitted', 'under_review'] },
            claimDate: { $gte: minDate, $lte: maxDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$claimAmount' }
          }
        }
      ]);

      return {
        bucket: bucket.name,
        count,
        amount: total[0]?.total || 0
      };
    }));

    const deductionAging = await Promise.all(buckets.map(async (bucket) => {
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() - bucket.max);
      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() - bucket.min);

      const count = await Deduction.countDocuments({
        status: 'pending',
        deductionDate: { $gte: minDate, $lte: maxDate }
      });

      const total = await Deduction.aggregate([
        {
          $match: {
            status: 'pending',
            deductionDate: { $gte: minDate, $lte: maxDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return {
        bucket: bucket.name,
        count,
        amount: total[0]?.total || 0
      };
    }));

    return {
      claims: claimAging,
      deductions: deductionAging
    };
  }

  async matchDeductionToClaim(deductionId, claimId, matchedAmount, userId) {
    const deduction = await Deduction.findById(deductionId);
    const claim = await Claim.findById(claimId);

    if (!deduction || !claim) {
      throw new Error('Deduction or claim not found');
    }

    await claim.matchToInvoice(null, deduction.deductionNumber, matchedAmount);

    deduction.status = 'matched';
    deduction.updatedBy = userId;
    await deduction.save();

    return {
      success: true,
      deduction: deduction._id,
      claim: claim._id,
      matchedAmount
    };
  }

  async autoMatchDeductions(options = {}) {
    const pendingDeductions = await Deduction.find({
      status: 'pending',
      ...options.filter
    });

    const results = {
      processed: 0,
      matched: 0,
      unmatched: 0,
      errors: []
    };

    for (const deduction of pendingDeductions) {
      results.processed++;

      try {
        const potentialMatches = await Claim.find({
          company: this.tenantId,
          customer: deduction.customerId,
          status: { $in: ['approved', 'submitted'] },
          'matching.matchStatus': { $in: ['unmatched', 'partial'] },
          claimAmount: {
            $gte: deduction.amount * 0.95,
            $lte: deduction.amount * 1.05
          }
        });

        if (potentialMatches.length === 1) {
          const claim = potentialMatches[0];
          await claim.matchToInvoice(null, deduction.deductionNumber, deduction.amount);
          deduction.status = 'matched';
          await deduction.save();
          results.matched++;
        } else {
          results.unmatched++;
        }
      } catch (error) {
        results.errors.push({
          deductionId: deduction._id,
          error: error.message
        });
      }
    }

    return results;
  }

  async createSettlement(customerId, periodStart, periodEnd, userId) {
    const claims = await Claim.find({
      company: this.tenantId,
      customer: customerId,
      status: 'approved',
      claimDate: { $gte: periodStart, $lte: periodEnd }
    });

    const deductions = await Deduction.find({
      customerId,
      status: { $in: ['approved', 'matched'] },
      deductionDate: { $gte: periodStart, $lte: periodEnd }
    });

    const items = [];

    claims.forEach((claim) => {
      items.push({
        itemType: 'credit_memo',
        referenceId: claim._id,
        referenceModel: 'Claim',
        referenceNumber: claim.claimId,
        amount: claim.approvedAmount || claim.claimAmount
      });
    });

    deductions.forEach((deduction) => {
      items.push({
        itemType: 'deduction',
        referenceId: deduction._id,
        referenceModel: 'Deduction',
        referenceNumber: deduction.deductionNumber,
        amount: deduction.approvedAmount || deduction.amount
      });
    });

    const settlementNumber = `SET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const settlement = new Settlement({
      settlementNumber,
      customerId,
      settlementDate: new Date(),
      periodStart,
      periodEnd,
      items,
      settlementType: 'periodic',
      createdBy: userId
    });

    await settlement.save();

    return settlement;
  }

  async exportReconciliationReport(period, format = 'csv') {
    const dashboard = await this.getReconciliationDashboard(period);

    if (format === 'csv') {
      return this.generateCSVReport(dashboard);
    }

    return dashboard;
  }

  generateCSVReport(dashboard) {
    const lines = [];

    lines.push('RECONCILIATION REPORT');
    lines.push(`Period: ${dashboard.period.startDate.toISOString().split('T')[0]} to ${dashboard.period.endDate.toISOString().split('T')[0]}`);
    lines.push(`Generated: ${dashboard.generatedAt.toISOString()}`);
    lines.push('');

    lines.push('OPEN EXPOSURE SUMMARY');
    lines.push('Category,Amount');
    lines.push(`Accrual Exposure,${dashboard.openExposure.accrualExposure}`);
    lines.push(`Claim Exposure,${dashboard.openExposure.claimExposure}`);
    lines.push(`Deduction Exposure,${dashboard.openExposure.deductionExposure}`);
    lines.push(`Total Exposure,${dashboard.openExposure.totalExposure}`);
    lines.push('');

    lines.push('ACCRUALS BY STATUS');
    lines.push('Status,Count,Total Accrual,Total Actual,Variance');
    dashboard.accruals.byStatus.forEach((a) => {
      lines.push(`${a._id},${a.count},${a.totalAccrual},${a.totalActual},${a.totalVariance}`);
    });
    lines.push('');

    lines.push('CLAIMS BY STATUS');
    lines.push('Status,Count,Total Claimed,Total Approved');
    dashboard.claims.byStatus.forEach((c) => {
      lines.push(`${c._id},${c.count},${c.totalClaimed},${c.totalApproved}`);
    });
    lines.push('');

    lines.push('DEDUCTIONS BY STATUS');
    lines.push('Status,Count,Total Amount,Total Approved');
    dashboard.deductions.byStatus.forEach((d) => {
      lines.push(`${d._id},${d.count},${d.totalAmount},${d.totalApproved}`);
    });
    lines.push('');

    lines.push('CLAIMS AGING');
    lines.push('Bucket,Count,Amount');
    dashboard.agingAnalysis.claims.forEach((a) => {
      lines.push(`${a.bucket},${a.count},${a.amount}`);
    });
    lines.push('');

    lines.push('DEDUCTIONS AGING');
    lines.push('Bucket,Count,Amount');
    dashboard.agingAnalysis.deductions.forEach((a) => {
      lines.push(`${a.bucket},${a.count},${a.amount}`);
    });

    return lines.join('\n');
  }
}

module.exports = ReconciliationService;
