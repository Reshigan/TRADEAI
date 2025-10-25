const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

/**
 * THREE-WAY MATCHING SERVICE
 * Matches Purchase Orders → Invoices → Payments
 * Implements tolerance checks and exception handling
 */
class ThreeWayMatchingService {
  constructor() {
    // Configurable tolerance thresholds
    this.tolerances = {
      priceVariance: 0.05, // 5%
      quantityVariance: 0.02, // 2%
      amountVariance: 100, // $100
      dateVariance: 30 // 30 days
    };
  }

  /**
   * Match Invoice to Purchase Order (2-way match)
   */
  async matchInvoiceToPO(invoiceId, purchaseOrderId, options = {}) {
    const invoice = await Invoice.findById(invoiceId).populate('lines.productId');
    const po = await PurchaseOrder.findById(purchaseOrderId).populate('lines.productId');

    if (!invoice) throw new Error('Invoice not found');
    if (!po) throw new Error('Purchase Order not found');

    const matchResult = {
      matched: false,
      confidence: 0,
      exceptions: [],
      variances: {
        price: [],
        quantity: [],
        amount: 0
      },
      lineMatches: []
    };

    // Validate basic match criteria
    if (invoice.customerId.toString() !== po.customerId.toString()) {
      matchResult.exceptions.push('Customer mismatch');
      return matchResult;
    }

    // Match lines
    for (const invoiceLine of invoice.lines) {
      const lineMatch = this._matchInvoiceLineToPOLine(invoiceLine, po.lines);
      matchResult.lineMatches.push(lineMatch);

      if (lineMatch.matched) {
        invoiceLine.matched = true;
        invoiceLine.matchedAmount = lineMatch.matchedAmount;
        invoiceLine.poLineNumber = lineMatch.poLine.lineNumber;
      }
    }

    // Calculate overall match confidence
    const matchedLines = matchResult.lineMatches.filter(m => m.matched).length;
    const totalLines = invoice.lines.length;
    matchResult.confidence = Math.round((matchedLines / totalLines) * 100);

    // Check tolerances
    const totalAmountVariance = invoice.total - po.total;
    matchResult.variances.amount = totalAmountVariance;

    if (Math.abs(totalAmountVariance) > this.tolerances.amountVariance) {
      matchResult.exceptions.push(`Amount variance exceeds tolerance: $${totalAmountVariance}`);
    }

    // Determine if matched
    matchResult.matched = matchResult.confidence >= 90 && matchResult.exceptions.length === 0;

    // Update invoice
    if (matchResult.matched) {
      invoice.purchaseOrderId = po._id;
      invoice.poNumber = po.poNumber;
      invoice.matchStatus = '3way_matched';
      invoice.matchedAt = new Date();
      invoice.matchConfidence = matchResult.confidence;
      invoice.matchingDetails = {
        poMatched: true,
        receiptMatched: false,
        amountVariance: totalAmountVariance,
        quantityVariance: 0,
        priceVariance: 0,
        toleranceExceeded: matchResult.exceptions.length > 0,
        exceptions: matchResult.exceptions
      };

      await invoice.save();

      // Update PO lines
      for (const lineMatch of matchResult.lineMatches) {
        if (lineMatch.matched) {
          await po.updateLineInvoiced(
            lineMatch.poLine.lineNumber,
            lineMatch.invoiceLine.quantity,
            lineMatch.invoiceLine.netAmount
          );
        }
      }
    }

    return matchResult;
  }

  /**
   * Match single invoice line to PO lines
   */
  _matchInvoiceLineToPOLine(invoiceLine, poLines) {
    let bestMatch = {
      matched: false,
      confidence: 0,
      poLine: null,
      invoiceLine: invoiceLine,
      matchedAmount: 0,
      variances: {
        price: 0,
        quantity: 0
      }
    };

    for (const poLine of poLines) {
      // Product must match
      if (invoiceLine.productId.toString() !== poLine.productId.toString()) {
        continue;
      }

      // Check if PO line has remaining quantity
      const remainingQty = poLine.quantity - poLine.quantityInvoiced;
      if (remainingQty <= 0) {
        continue;
      }

      // Calculate variances
      const priceVariance = Math.abs(invoiceLine.unitPrice - poLine.unitPrice) / poLine.unitPrice;
      const quantityVariance = Math.abs(invoiceLine.quantity - poLine.quantity) / poLine.quantity;

      // Check tolerances
      if (priceVariance > this.tolerances.priceVariance) {
        continue;
      }

      if (quantityVariance > this.tolerances.quantityVariance && 
          invoiceLine.quantity > remainingQty) {
        continue;
      }

      // Calculate match confidence
      const priceScore = (1 - priceVariance) * 50;
      const quantityScore = (1 - quantityVariance) * 50;
      const confidence = priceScore + quantityScore;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          matched: true,
          confidence: Math.round(confidence),
          poLine: poLine,
          invoiceLine: invoiceLine,
          matchedAmount: invoiceLine.netAmount,
          variances: {
            price: priceVariance,
            quantity: quantityVariance
          }
        };
      }
    }

    return bestMatch;
  }

  /**
   * Match Payment to Invoice (2-way match)
   */
  async matchPaymentToInvoice(paymentId, invoiceId, amount) {
    const payment = await Payment.findById(paymentId);
    const invoice = await Invoice.findById(invoiceId);

    if (!payment) throw new Error('Payment not found');
    if (!invoice) throw new Error('Invoice not found');

    // Validate
    if (payment.customerId.toString() !== invoice.customerId.toString()) {
      throw new Error('Customer mismatch between payment and invoice');
    }

    if (amount > payment.unappliedAmount) {
      throw new Error('Amount exceeds unapplied payment balance');
    }

    if (amount > invoice.outstandingAmount) {
      throw new Error('Amount exceeds invoice outstanding balance');
    }

    // Apply payment to invoice
    await payment.applyToInvoice(invoice._id, invoice.invoiceNumber, amount);
    await invoice.recordPayment(amount, payment._id);

    return {
      success: true,
      payment,
      invoice,
      appliedAmount: amount,
      paymentOutstanding: payment.unappliedAmount,
      invoiceOutstanding: invoice.outstandingAmount
    };
  }

  /**
   * Complete 3-way match (PO → Invoice → Payment)
   */
  async complete3WayMatch(purchaseOrderId, invoiceId, paymentId) {
    // Step 1: Match Invoice to PO
    const poMatchResult = await this.matchInvoiceToPO(invoiceId, purchaseOrderId);
    
    if (!poMatchResult.matched) {
      return {
        success: false,
        step: 'po_invoice_match',
        error: 'Invoice does not match Purchase Order',
        details: poMatchResult
      };
    }

    // Step 2: Match Payment to Invoice
    const invoice = await Invoice.findById(invoiceId);
    const payment = await Payment.findById(paymentId);

    const paymentAmount = Math.min(payment.unappliedAmount, invoice.outstandingAmount);
    
    const paymentMatchResult = await this.matchPaymentToInvoice(
      paymentId,
      invoiceId,
      paymentAmount
    );

    if (!paymentMatchResult.success) {
      return {
        success: false,
        step: 'invoice_payment_match',
        error: 'Payment does not match Invoice',
        details: paymentMatchResult
      };
    }

    return {
      success: true,
      matched: true,
      purchaseOrder: poMatchResult,
      payment: paymentMatchResult,
      confidence: poMatchResult.confidence,
      fullyMatched: invoice.outstandingAmount === 0
    };
  }

  /**
   * Auto-match payment to open invoices
   */
  async autoMatchPayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    // Find open invoices for customer
    const invoices = await Invoice.find({
      customerId: payment.customerId,
      status: { $in: ['approved', 'pending_payment', 'partially_paid', 'overdue'] },
      outstandingAmount: { $gt: 0 }
    }).sort({ dueDate: 1 }); // Oldest first

    const matches = [];
    let remainingAmount = payment.amount - payment.appliedAmount;

    for (const invoice of invoices) {
      if (remainingAmount <= 0) break;

      const amountToApply = Math.min(remainingAmount, invoice.outstandingAmount);

      try {
        const matchResult = await this.matchPaymentToInvoice(
          payment._id,
          invoice._id,
          amountToApply
        );

        matches.push({
          invoice: invoice.invoiceNumber,
          amount: amountToApply,
          success: true
        });

        remainingAmount -= amountToApply;
      } catch (error) {
        matches.push({
          invoice: invoice.invoiceNumber,
          amount: amountToApply,
          success: false,
          error: error.message
        });
      }
    }

    return {
      paymentNumber: payment.paymentNumber,
      totalAmount: payment.amount,
      appliedAmount: payment.amount - remainingAmount,
      remainingAmount: remainingAmount,
      matches: matches,
      fullyApplied: remainingAmount === 0
    };
  }

  /**
   * Batch match invoices to POs
   */
  async batchMatchInvoices(customerId, options = {}) {
    const unmatchedInvoices = await Invoice.find({
      customerId,
      matchStatus: 'unmatched',
      status: { $nin: ['cancelled', 'paid'] }
    });

    const openPOs = await PurchaseOrder.find({
      customerId,
      status: { $in: ['sent', 'acknowledged', 'partially_received', 'received'] }
    });

    const results = {
      total: unmatchedInvoices.length,
      matched: 0,
      failed: 0,
      exceptions: 0,
      matches: []
    };

    for (const invoice of unmatchedInvoices) {
      let bestMatch = null;
      let bestConfidence = 0;

      // Try to match against all open POs
      for (const po of openPOs) {
        try {
          const matchResult = await this.matchInvoiceToPO(invoice._id, po._id, { dryRun: true });
          
          if (matchResult.confidence > bestConfidence) {
            bestMatch = { po, matchResult };
            bestConfidence = matchResult.confidence;
          }
        } catch (error) {
          // Continue to next PO
        }
      }

      // Apply best match if confidence is high enough
      if (bestMatch && bestConfidence >= 90) {
        try {
          await this.matchInvoiceToPO(invoice._id, bestMatch.po._id);
          results.matched++;
          results.matches.push({
            invoice: invoice.invoiceNumber,
            po: bestMatch.po.poNumber,
            confidence: bestConfidence,
            status: 'matched'
          });
        } catch (error) {
          results.failed++;
          results.matches.push({
            invoice: invoice.invoiceNumber,
            status: 'failed',
            error: error.message
          });
        }
      } else if (bestMatch) {
        results.exceptions++;
        results.matches.push({
          invoice: invoice.invoiceNumber,
          po: bestMatch.po.poNumber,
          confidence: bestConfidence,
          status: 'needs_review'
        });
      } else {
        results.failed++;
        results.matches.push({
          invoice: invoice.invoiceNumber,
          status: 'no_match_found'
        });
      }
    }

    return results;
  }

  /**
   * Get unmatched items for review
   */
  async getUnmatchedItems(customerId) {
    const [unmatchedInvoices, unmatchedPayments] = await Promise.all([
      Invoice.find({
        customerId,
        matchStatus: 'unmatched',
        status: { $nin: ['cancelled'] }
      }).populate('customerId'),
      Payment.find({
        customerId,
        matchStatus: 'unmatched',
        status: { $nin: ['cancelled', 'reversed'] }
      }).populate('customerId')
    ]);

    return {
      invoices: {
        count: unmatchedInvoices.length,
        totalAmount: unmatchedInvoices.reduce((sum, inv) => sum + inv.total, 0),
        items: unmatchedInvoices
      },
      payments: {
        count: unmatchedPayments.length,
        totalAmount: unmatchedPayments.reduce((sum, pmt) => sum + pmt.amount, 0),
        items: unmatchedPayments
      }
    };
  }

  /**
   * Update tolerance thresholds
   */
  updateTolerances(tolerances) {
    this.tolerances = { ...this.tolerances, ...tolerances };
  }
}

module.exports = new ThreeWayMatchingService();
