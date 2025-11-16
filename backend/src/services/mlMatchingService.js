/**
 * MACHINE LEARNING MATCHING SERVICE
 * AI-powered transaction matching with continuous learning
 *
 * Features:
 * - Fuzzy matching with ML confidence scoring
 * - Pattern learning from historical matches
 * - Anomaly detection
 * - Predictive matching suggestions
 * - Continuous model improvement
 */

class MLMatchingService {
  constructor() {
    this.model = null;
    this.trainingData = [];
    this.matchingHistory = [];
    this.featureWeights = {
      amount: 0.3,
      date: 0.2,
      vendor: 0.25,
      productSimilarity: 0.15,
      quantitySimilarity: 0.1
    };
  }

  /**
   * Initialize ML model
   */
  async initializeModel() {
    // In production, load a trained model (TensorFlow.js, etc.)
    this.model = {
      type: 'ensemble',
      confidence_threshold: 0.85,
      initialized: true
    };

    // Load historical training data
    await this.loadTrainingData();
  }

  /**
   * Predict match score using ML
   */
  async predictMatchScore(invoice, purchaseOrder) {
    if (!this.model?.initialized) {
      await this.initializeModel();
    }

    // Extract features
    const features = this.extractFeatures(invoice, purchaseOrder);

    // Calculate weighted score
    const score = this.calculateWeightedScore(features);

    // Get confidence level
    const confidence = this.calculateConfidence(features, score);

    // Generate explanation
    const explanation = this.generateExplanation(features, score);

    return {
      score: score / 100, // Normalize to 0-1
      confidence,
      features,
      explanation,
      recommendation: score >= 85 ? 'auto_match' : score >= 70 ? 'review' : 'reject'
    };
  }

  /**
   * Extract matching features
   */
  extractFeatures(invoice, po) {
    return {
      // Amount similarity
      amountSimilarity: this.calculateAmountSimilarity(
        invoice.totalAmount,
        po.totalAmount
      ),

      // Date proximity
      dateProximity: this.calculateDateProximity(
        invoice.invoiceDate,
        po.poDate
      ),

      // Vendor match
      vendorMatch: this.calculateVendorMatch(
        invoice.customerId || invoice.vendorId,
        po.customerId || po.vendorId
      ),

      // Line item similarity
      lineItemSimilarity: this.calculateLineItemSimilarity(
        invoice.lines,
        po.lines
      ),

      // Product similarity
      productSimilarity: this.calculateProductSimilarity(
        invoice.lines,
        po.lines
      ),

      // Quantity similarity
      quantitySimilarity: this.calculateQuantitySimilarity(
        invoice.lines,
        po.lines
      ),

      // Historical pattern match
      historicalPattern: this.checkHistoricalPattern(invoice, po),

      // Anomaly score
      anomalyScore: this.detectAnomalies(invoice, po)
    };
  }

  /**
   * Calculate amount similarity
   */
  calculateAmountSimilarity(invoiceAmount, poAmount) {
    if (!invoiceAmount || !poAmount) return 0;

    const diff = Math.abs(invoiceAmount - poAmount);
    const maxAmount = Math.max(invoiceAmount, poAmount);
    const percentDiff = (diff / maxAmount) * 100;

    // Score decreases as difference increases
    if (percentDiff === 0) return 100;
    if (percentDiff <= 1) return 95;
    if (percentDiff <= 2) return 90;
    if (percentDiff <= 5) return 80;
    if (percentDiff <= 10) return 60;
    return Math.max(0, 50 - percentDiff);
  }

  /**
   * Calculate date proximity
   */
  calculateDateProximity(invoiceDate, poDate) {
    if (!invoiceDate || !poDate) return 0;

    const daysDiff = Math.abs(
      (new Date(invoiceDate) - new Date(poDate)) / (1000 * 60 * 60 * 24)
    );

    // Score decreases as time gap increases
    if (daysDiff <= 7) return 100;
    if (daysDiff <= 14) return 90;
    if (daysDiff <= 30) return 80;
    if (daysDiff <= 60) return 70;
    if (daysDiff <= 90) return 60;
    return Math.max(0, 50 - daysDiff / 3);
  }

  /**
   * Calculate vendor match
   */
  calculateVendorMatch(invoiceVendor, poVendor) {
    if (!invoiceVendor || !poVendor) return 0;

    // Exact match
    if (invoiceVendor.toString() === poVendor.toString()) {
      return 100;
    }

    // Fuzzy match (if vendor names available)
    return 0;
  }

  /**
   * Calculate line item similarity
   */
  calculateLineItemSimilarity(invoiceLines, poLines) {
    if (!invoiceLines?.length || !poLines?.length) return 0;

    let matchedLines = 0;
    const totalLines = Math.max(invoiceLines.length, poLines.length);

    for (const invLine of invoiceLines) {
      for (const poLine of poLines) {
        if (this.linesMatch(invLine, poLine)) {
          matchedLines++;
          break;
        }
      }
    }

    return (matchedLines / totalLines) * 100;
  }

  /**
   * Check if two lines match
   */
  linesMatch(invLine, poLine) {
    // Check product match
    const productMatch = invLine.productId?.toString() === poLine.productId?.toString();

    // Check quantity similarity (within 5%)
    const qtyDiff = Math.abs(invLine.quantity - poLine.quantity);
    const qtyMatch = qtyDiff / poLine.quantity <= 0.05;

    // Check price similarity (within 5%)
    const priceDiff = Math.abs(invLine.unitPrice - poLine.unitPrice);
    const priceMatch = priceDiff / poLine.unitPrice <= 0.05;

    return productMatch && qtyMatch && priceMatch;
  }

  /**
   * Calculate product similarity
   */
  calculateProductSimilarity(invoiceLines, poLines) {
    if (!invoiceLines?.length || !poLines?.length) return 0;

    const invProducts = new Set(invoiceLines.map((l) => l.productId?.toString()));
    const poProducts = new Set(poLines.map((l) => l.productId?.toString()));

    const intersection = new Set([...invProducts].filter((p) => poProducts.has(p)));
    const union = new Set([...invProducts, ...poProducts]);

    return (intersection.size / union.size) * 100;
  }

  /**
   * Calculate quantity similarity
   */
  calculateQuantitySimilarity(invoiceLines, poLines) {
    if (!invoiceLines?.length || !poLines?.length) return 0;

    const invQty = invoiceLines.reduce((sum, l) => sum + (l.quantity || 0), 0);
    const poQty = poLines.reduce((sum, l) => sum + (l.quantity || 0), 0);

    return this.calculateAmountSimilarity(invQty, poQty);
  }

  /**
   * Check historical pattern match
   */
  checkHistoricalPattern(invoice, po) {
    // Check if this vendor-product combination has been matched before
    const historicalMatches = this.matchingHistory.filter((h) =>
      h.vendorId === invoice.customerId &&
      h.productIds.some((p) => po.lines.some((l) => l.productId?.toString() === p))
    );

    if (historicalMatches.length > 0) {
      const avgConfidence = historicalMatches.reduce((sum, m) => sum + m.confidence, 0) / historicalMatches.length;
      return avgConfidence * 100;
    }

    return 50; // Neutral score if no history
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(invoice, po) {
    let anomalyScore = 100; // Start with perfect score

    // Check for unusual amount differences
    const amountDiff = Math.abs(invoice.totalAmount - po.totalAmount);
    const avgAmount = (invoice.totalAmount + po.totalAmount) / 2;
    if (amountDiff / avgAmount > 0.2) {
      anomalyScore -= 30;
    }

    // Check for unusual time gaps
    const daysDiff = Math.abs(
      (new Date(invoice.invoiceDate) - new Date(po.poDate)) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 120) {
      anomalyScore -= 20;
    }

    // Check for quantity mismatches
    const invTotalQty = invoice.lines?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0;
    const poTotalQty = po.lines?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0;
    const qtyDiff = Math.abs(invTotalQty - poTotalQty);
    if (qtyDiff / poTotalQty > 0.2) {
      anomalyScore -= 25;
    }

    return Math.max(0, anomalyScore);
  }

  /**
   * Calculate weighted score
   */
  calculateWeightedScore(features) {
    return (
      features.amountSimilarity * this.featureWeights.amount +
      features.dateProximity * this.featureWeights.date +
      features.vendorMatch * this.featureWeights.vendor +
      features.productSimilarity * this.featureWeights.productSimilarity +
      features.quantitySimilarity * this.featureWeights.quantitySimilarity
    );
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(features, score) {
    // Base confidence on score consistency across features
    const featureScores = [
      features.amountSimilarity,
      features.dateProximity,
      features.vendorMatch,
      features.productSimilarity,
      features.quantitySimilarity
    ];

    const variance = this.calculateVariance(featureScores);
    const consistency = Math.max(0, 100 - variance);

    // Combine score and consistency
    const confidence = (score * 0.7 + consistency * 0.3) / 100;

    return Math.min(0.99, Math.max(0.01, confidence));
  }

  /**
   * Calculate variance
   */
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Generate explanation
   */
  generateExplanation(features, score) {
    const reasons = [];

    if (features.amountSimilarity >= 90) {
      reasons.push('Amount matches closely');
    } else if (features.amountSimilarity < 70) {
      reasons.push('Significant amount difference');
    }

    if (features.vendorMatch === 100) {
      reasons.push('Vendor IDs match exactly');
    } else {
      reasons.push('Vendor mismatch');
    }

    if (features.productSimilarity >= 90) {
      reasons.push('Products match well');
    } else if (features.productSimilarity < 70) {
      reasons.push('Product differences detected');
    }

    if (features.dateProximity < 70) {
      reasons.push('Large time gap between documents');
    }

    if (features.anomalyScore < 70) {
      reasons.push('Unusual patterns detected');
    }

    return reasons;
  }

  /**
   * Train model with feedback
   */
  async trainModel(matchData) {
    // Add to training data
    this.trainingData.push({
      features: matchData.features,
      actualMatch: matchData.actualMatch,
      userFeedback: matchData.userFeedback,
      timestamp: new Date()
    });

    // Adjust feature weights based on feedback
    if (this.trainingData.length >= 100) {
      await this.adjustFeatureWeights();
    }

    // Store in matching history
    this.matchingHistory.push({
      vendorId: matchData.vendorId,
      productIds: matchData.productIds,
      confidence: matchData.confidence,
      matched: matchData.actualMatch,
      timestamp: new Date()
    });
  }

  /**
   * Adjust feature weights based on performance
   */
  async adjustFeatureWeights() {
    // Analyze which features correlated best with successful matches
    const recentData = this.trainingData.slice(-100);

    // Calculate correlation for each feature
    const correlations = {};
    for (const feature of Object.keys(this.featureWeights)) {
      correlations[feature] = this.calculateCorrelation(
        recentData.map((d) => d.features[feature] || 0),
        recentData.map((d) => d.actualMatch ? 100 : 0)
      );
    }

    // Adjust weights (simple approach - normalize correlations)
    const totalCorrelation = Object.values(correlations).reduce((a, b) => a + Math.abs(b), 0);
    for (const feature of Object.keys(this.featureWeights)) {
      this.featureWeights[feature] = Math.abs(correlations[feature]) / totalCorrelation;
    }

    console.log('Updated feature weights:', this.featureWeights);
  }

  /**
   * Calculate correlation
   */
  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Load training data from database
   */
  async loadTrainingData() {
    // In production, load from database
    // For now, initialize with empty array
    this.trainingData = [];
    this.matchingHistory = [];
  }

  /**
   * Get model statistics
   */
  getStatistics() {
    return {
      trainingDataSize: this.trainingData.length,
      matchingHistorySize: this.matchingHistory.length,
      featureWeights: this.featureWeights,
      modelInitialized: this.model?.initialized || false,
      accuracy: this.calculateAccuracy()
    };
  }

  /**
   * Calculate model accuracy
   */
  calculateAccuracy() {
    if (this.trainingData.length < 10) return null;

    const recent = this.trainingData.slice(-100);
    const correct = recent.filter((d) => {
      const predicted = d.features.score >= 0.85;
      return predicted === d.actualMatch;
    }).length;

    return correct / recent.length;
  }

  /**
   * Suggest matches for an invoice
   */
  async suggestMatches(invoice, potentialPOs, limit = 5) {
    const suggestions = [];

    for (const po of potentialPOs) {
      const prediction = await this.predictMatchScore(invoice, po);
      suggestions.push({
        purchaseOrder: po,
        ...prediction
      });
    }

    // Sort by score descending
    suggestions.sort((a, b) => b.score - a.score);

    return suggestions.slice(0, limit);
  }
}

module.exports = new MLMatchingService();
