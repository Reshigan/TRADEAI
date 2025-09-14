const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

// Import job processors
const sapSyncJob = require('./sapSync');
const reportGenerationJob = require('./reportGeneration');
const budgetAlertJob = require('./budgetAlert');
const dataCleanupJob = require('./dataCleanup');
const mlTrainingJob = require('./mlTraining');
const anomalyDetectionJob = require('./anomalyDetection');

// Create queues
const queues = {
  sapSync: new Queue('sap-sync', {
    redis: config.jobs.redis
  }),
  reportGeneration: new Queue('report-generation', {
    redis: config.jobs.redis
  }),
  budgetAlert: new Queue('budget-alert', {
    redis: config.jobs.redis
  }),
  dataCleanup: new Queue('data-cleanup', {
    redis: config.jobs.redis
  }),
  mlTraining: new Queue('ml-training', {
    redis: config.jobs.redis
  }),
  anomalyDetection: new Queue('anomaly-detection', {
    redis: config.jobs.redis
  })
};

// Initialize jobs
const initializeJobs = async () => {
  try {
    // SAP Sync - Daily at 2 AM
    await queues.sapSync.add(
      'daily-sync',
      {},
      {
        repeat: { cron: config.sap.syncInterval },
        ...config.jobs.defaultJobOptions
      }
    );
    
    // Budget Alerts - Every hour
    await queues.budgetAlert.add(
      'check-budgets',
      {},
      {
        repeat: { cron: '0 * * * *' },
        ...config.jobs.defaultJobOptions
      }
    );
    
    // Data Cleanup - Daily at 3 AM
    await queues.dataCleanup.add(
      'cleanup',
      {},
      {
        repeat: { cron: '0 3 * * *' },
        ...config.jobs.defaultJobOptions
      }
    );
    
    // ML Training - Weekly on Sunday at 1 AM
    await queues.mlTraining.add(
      'weekly-training',
      {},
      {
        repeat: { cron: '0 1 * * 0' },
        ...config.jobs.defaultJobOptions
      }
    );
    
    // Anomaly Detection - Every 30 minutes
    await queues.anomalyDetection.add(
      'detect-anomalies',
      {},
      {
        repeat: { cron: '*/30 * * * *' },
        ...config.jobs.defaultJobOptions
      }
    );
    
    // Process jobs with error handling
    try {
      if (sapSyncJob && sapSyncJob.process) {
        queues.sapSync.process(sapSyncJob.process);
      } else {
        logger.warn('sapSyncJob.process is not available');
      }
      
      if (reportGenerationJob && reportGenerationJob.process) {
        queues.reportGeneration.process(reportGenerationJob.process);
      } else {
        logger.warn('reportGenerationJob.process is not available');
      }
      
      if (budgetAlertJob && budgetAlertJob.process) {
        queues.budgetAlert.process(budgetAlertJob.process);
      } else {
        logger.warn('budgetAlertJob.process is not available');
      }
      
      if (dataCleanupJob && dataCleanupJob.process) {
        queues.dataCleanup.process(dataCleanupJob.process);
      } else {
        logger.warn('dataCleanupJob.process is not available');
      }
      
      if (mlTrainingJob && mlTrainingJob.process) {
        queues.mlTraining.process(mlTrainingJob.process);
      } else {
        logger.warn('mlTrainingJob.process is not available');
      }
      
      if (anomalyDetectionJob && anomalyDetectionJob.process) {
        queues.anomalyDetection.process(anomalyDetectionJob.process);
      } else {
        logger.warn('anomalyDetectionJob.process is not available');
      }
    } catch (error) {
      logger.error('Error setting up job processors:', error);
      throw error;
    }
    
    // Event handlers
    Object.entries(queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        logger.info(`Job completed: ${name}`, {
          jobId: job.id,
          data: job.data,
          result
        });
      });
      
      queue.on('failed', (job, err) => {
        logger.error(`Job failed: ${name}`, {
          jobId: job.id,
          data: job.data,
          error: err.message,
          stack: err.stack
        });
      });
      
      queue.on('stalled', (job) => {
        logger.warn(`Job stalled: ${name}`, {
          jobId: job.id,
          data: job.data
        });
      });
    });
    
    logger.info('Background jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize jobs:', error);
    throw error;
  }
};

// Add job to queue
const addJob = async (queueName, jobName, data, options = {}) => {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  const job = await queues[queueName].add(jobName, data, {
    ...config.jobs.defaultJobOptions,
    ...options
  });
  
  logger.info(`Job added to queue: ${queueName}`, {
    jobId: job.id,
    jobName,
    data
  });
  
  return job;
};

// Get queue status
const getQueueStatus = async (queueName) => {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  const queue = queues[queueName];
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);
  
  return {
    name: queueName,
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed
    }
  };
};

// Get all queues status
const getAllQueuesStatus = async () => {
  const statuses = await Promise.all(
    Object.keys(queues).map(name => getQueueStatus(name))
  );
  
  return statuses;
};

// Clean queue
const cleanQueue = async (queueName, grace = 0) => {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  await queues[queueName].clean(grace);
  logger.info(`Queue cleaned: ${queueName}`);
};

// Pause/Resume queue
const pauseQueue = async (queueName) => {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  await queues[queueName].pause();
  logger.info(`Queue paused: ${queueName}`);
};

const resumeQueue = async (queueName) => {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  await queues[queueName].resume();
  logger.info(`Queue resumed: ${queueName}`);
};

module.exports = {
  initializeJobs,
  addJob,
  getQueueStatus,
  getAllQueuesStatus,
  cleanQueue,
  pauseQueue,
  resumeQueue,
  queues
};