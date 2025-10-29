/**
 * Background Job Processing Service
 * Phase 4 - Performance & Scalability
 * 
 * Features:
 * - Async job processing
 * - Scheduled job execution
 * - Job queue management
 * - Progress tracking
 * - Retry logic
 * - Job prioritization
 * 
 * Uses in-memory queue (production: use Bull/Redis)
 */

const EventEmitter = require('events');
const logger = require('../../utils/logger');

class BackgroundJobService extends EventEmitter {
  
  constructor() {
    super();
    this.jobs = new Map(); // jobId -> job data
    this.queue = []; // Priority queue
    this.workers = [];
    this.maxWorkers = 5;
    this.isProcessing = false;
    
    // Start workers
    this.startWorkers();
  }
  
  /**
   * Add job to queue
   */
  async addJob(jobData) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...jobData,
      status: 'pending',
      progress: 0,
      attempts: 0,
      maxAttempts: jobData.maxAttempts || 3,
      priority: jobData.priority || 0, // Higher = more priority
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null
    };
    
    this.jobs.set(job.id, job);
    
    // Add to priority queue
    this.queue.push(job.id);
    this.queue.sort((a, b) => {
      const jobA = this.jobs.get(a);
      const jobB = this.jobs.get(b);
      return jobB.priority - jobA.priority; // Descending priority
    });
    
    logger.info('Job added to queue', { 
      jobId: job.id, 
      type: job.type, 
      priority: job.priority 
    });
    
    // Trigger processing
    this.processQueue();
    
    return job;
  }
  
  /**
   * Start background workers
   */
  startWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workers.push({
        id: i,
        busy: false,
        currentJob: null
      });
    }
    
    logger.info('Background workers started', { count: this.maxWorkers });
  }
  
  /**
   * Process job queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const jobId = this.queue.shift();
      const job = this.jobs.get(jobId);
      
      if (!job || job.status !== 'pending') continue;
      
      // Find available worker
      const worker = this.workers.find(w => !w.busy);
      
      if (!worker) {
        // No workers available, put job back
        this.queue.unshift(jobId);
        break;
      }
      
      // Assign job to worker
      worker.busy = true;
      worker.currentJob = jobId;
      
      // Process job
      this.processJob(job, worker);
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Process individual job
   */
  async processJob(job, worker) {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.attempts++;
      
      logger.info('Processing job', { 
        jobId: job.id, 
        type: job.type, 
        attempt: job.attempts 
      });
      
      // Execute job based on type
      let result;
      
      switch (job.type) {
        case 'accrual_calculation':
          result = await this.executeAccrualCalculation(job);
          break;
          
        case 'budget_variance_analysis':
          result = await this.executeBudgetVarianceAnalysis(job);
          break;
          
        case 'customer_segmentation':
          result = await this.executeCustomerSegmentation(job);
          break;
          
        case 'report_generation':
          result = await this.executeReportGeneration(job);
          break;
          
        case 'data_export':
          result = await this.executeDataExport(job);
          break;
          
        case 'notification_batch':
          result = await this.executeNotificationBatch(job);
          break;
          
        case 'data_sync':
          result = await this.executeDataSync(job);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      job.progress = 100;
      
      logger.info('Job completed', { 
        jobId: job.id, 
        type: job.type,
        duration: job.completedAt - job.startedAt
      });
      
      this.emit('job:completed', job);
      
    } catch (error) {
      logger.error('Job failed', { 
        jobId: job.id, 
        type: job.type, 
        error: error.message,
        attempt: job.attempts
      });
      
      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'pending';
        job.error = error.message;
        this.queue.push(job.id);
        
        logger.info('Job will be retried', { 
          jobId: job.id, 
          attempt: job.attempts + 1,
          maxAttempts: job.maxAttempts
        });
        
      } else {
        // Max attempts reached
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = error.message;
        
        this.emit('job:failed', job);
      }
    } finally {
      // Free worker
      worker.busy = false;
      worker.currentJob = null;
      
      // Continue processing queue
      this.processQueue();
    }
  }
  
  /**
   * Execute accrual calculation job
   */
  async executeAccrualCalculation(job) {
    const { year, month, tenant } = job.data;
    
    // Import service lazily to avoid circular dependencies
    const advancedAccrualService = require('./advancedAccrualService');
    
    job.progress = 10;
    const results = await advancedAccrualService.calculateMonthlyAccruals({
      year,
      month,
      tenant,
      calculateBy: 'all',
      userId: job.userId
    });
    
    job.progress = 100;
    return results;
  }
  
  /**
   * Execute budget variance analysis job
   */
  async executeBudgetVarianceAnalysis(job) {
    const advancedBudgetService = require('./advancedBudgetService');
    
    job.progress = 10;
    const analysis = await advancedBudgetService.calculateVarianceAnalysis(job.data);
    
    job.progress = 100;
    return analysis;
  }
  
  /**
   * Execute customer segmentation job
   */
  async executeCustomerSegmentation(job) {
    const customerSegmentationService = require('./customerSegmentationService');
    
    job.progress = 20;
    const abcAnalysis = await customerSegmentationService.performABCAnalysis(job.data);
    
    job.progress = 60;
    const rfmAnalysis = await customerSegmentationService.performRFMAnalysis(job.data);
    
    job.progress = 100;
    return { abc: abcAnalysis, rfm: rfmAnalysis };
  }
  
  /**
   * Execute report generation job
   */
  async executeReportGeneration(job) {
    const advancedReportingService = require('./advancedReportingService');
    
    const { reportData, format, options } = job.data;
    
    job.progress = 20;
    
    let report;
    if (format === 'xlsx' || format === 'excel') {
      report = await advancedReportingService.generateExcelReport(reportData, options);
    } else if (format === 'csv') {
      report = await advancedReportingService.generateCSVReport(reportData, options);
    } else if (format === 'pdf') {
      report = await advancedReportingService.generatePDFReport(reportData, options);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    job.progress = 100;
    return report;
  }
  
  /**
   * Execute data export job
   */
  async executeDataExport(job) {
    // Simulate data export
    const { model, query, format } = job.data;
    
    job.progress = 10;
    
    // This would query the database and export
    // For now, just simulate with delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    job.progress = 100;
    
    return {
      model,
      recordCount: 1000,
      format,
      filename: `export_${Date.now()}.${format}`
    };
  }
  
  /**
   * Execute notification batch job
   */
  async executeNotificationBatch(job) {
    const notificationService = require('./notificationService');
    
    const { userIds, notification } = job.data;
    
    job.progress = 10;
    
    let sent = 0;
    for (const userId of userIds) {
      notificationService.sendNotification(userId, notification);
      sent++;
      job.progress = 10 + (sent / userIds.length) * 90;
    }
    
    return { sent };
  }
  
  /**
   * Execute data sync job
   */
  async executeDataSync(job) {
    const { source, target, syncType } = job.data;
    
    job.progress = 10;
    
    // Simulate data sync
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    job.progress = 100;
    
    return {
      source,
      target,
      syncType,
      recordsSynced: 500
    };
  }
  
  /**
   * Get job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }
  
  /**
   * Cancel job
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status === 'processing') {
      throw new Error('Cannot cancel job that is currently processing');
    }
    
    if (job.status === 'pending') {
      // Remove from queue
      const index = this.queue.indexOf(jobId);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
      
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      logger.info('Job cancelled', { jobId });
      
      return job;
    }
    
    return job;
  }
  
  /**
   * Get queue statistics
   */
  getQueueStats() {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      totalJobs: this.jobs.size,
      queueLength: this.queue.length,
      workers: {
        total: this.workers.length,
        busy: this.workers.filter(w => w.busy).length,
        idle: this.workers.filter(w => !w.busy).length
      },
      byType: {}
    };
    
    for (const [jobId, job] of this.jobs) {
      stats[job.status]++;
      
      if (!stats.byType[job.type]) {
        stats.byType[job.type] = { pending: 0, processing: 0, completed: 0, failed: 0 };
      }
      stats.byType[job.type][job.status]++;
    }
    
    return stats;
  }
  
  /**
   * Get recent jobs
   */
  getRecentJobs(limit = 50) {
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    
    return jobs;
  }
  
  /**
   * Clean up old completed jobs
   */
  cleanup(olderThanHours = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [jobId, job] of this.jobs) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.completedAt < cutoff) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }
    
    logger.info('Job cleanup complete', { cleaned, olderThanHours });
    
    return { cleaned };
  }
}

// Export singleton instance
module.exports = new BackgroundJobService();
