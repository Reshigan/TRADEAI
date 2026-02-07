const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const mlTrainingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  modelName: {
    type: String,
    required: true,
    enum: ['customerBehavior', 'demandForecasting', 'promotionOptimization', 'churnPrediction', 'priceOptimization'],
    index: true
  },

  status: {
    type: String,
    required: true,
    enum: ['queued', 'training', 'completed', 'failed', 'cancelled', 'scheduled'],
    default: 'queued',
    index: true
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  accuracy: {
    type: Number,
    min: 0,
    max: 1
  },

  metrics: {
    precision: Number,
    recall: Number,
    f1Score: Number,
    auc: Number,
    mse: Number,
    mae: Number,
    rmse: Number,
    customMetrics: mongoose.Schema.Types.Mixed
  },

  hyperparameters: {
    learningRate: Number,
    epochs: Number,
    batchSize: Number,
    customParams: mongoose.Schema.Types.Mixed
  },

  datasetInfo: {
    trainingSize: Number,
    validationSize: Number,
    testSize: Number,
    features: [String],
    targetVariable: String
  },

  queuedAt: Date,
  startedAt: Date,
  completedAt: Date,
  scheduledStart: Date,
  nextTraining: Date,
  estimatedDuration: Number,
  actualDuration: Number,

  error: {
    message: String,
    stack: String,
    code: String
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  force: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(mlTrainingJobSchema);

mlTrainingJobSchema.index({ tenantId: 1, modelName: 1, status: 1 });
mlTrainingJobSchema.index({ companyId: 1, modelName: 1, createdAt: -1 });

mlTrainingJobSchema.statics.getTrainingStatus = async function (companyId) {
  const models = ['customerBehavior', 'demandForecasting', 'promotionOptimization', 'churnPrediction', 'priceOptimization'];
  const status = {};

  for (const modelName of models) {
    const latestJob = await this.findOne({ companyId, modelName })
      .sort({ createdAt: -1 });

    if (latestJob) {
      status[modelName] = {
        status: latestJob.status,
        accuracy: latestJob.accuracy,
        progress: latestJob.progress,
        lastTrained: latestJob.completedAt?.toISOString(),
        nextTraining: latestJob.nextTraining?.toISOString(),
        estimatedCompletion: latestJob.status === 'training'
          ? new Date(Date.now() + (latestJob.estimatedDuration || 60) * 60 * 1000).toISOString()
          : null,
        scheduledStart: latestJob.scheduledStart?.toISOString()
      };
    } else {
      status[modelName] = {
        status: 'not_trained',
        accuracy: null,
        lastTrained: null,
        nextTraining: null
      };
    }
  }

  return status;
};

mlTrainingJobSchema.statics.queueRetraining = async function (companyId, modelNames, userId, force = false) {
  const jobs = [];
  const availableModels = ['customerBehavior', 'demandForecasting', 'promotionOptimization', 'churnPrediction', 'priceOptimization'];
  const modelsToRetrain = modelNames.length > 0 ? modelNames.filter((m) => availableModels.includes(m)) : availableModels;

  for (const modelName of modelsToRetrain) {
    const existingJob = await this.findOne({
      companyId,
      modelName,
      status: { $in: ['queued', 'training'] }
    });

    if (existingJob && !force) {
      jobs.push({
        modelName,
        jobId: existingJob.jobId,
        status: 'already_queued',
        message: 'A training job is already in progress for this model'
      });
      continue;
    }

    const job = new this({
      jobId: `retrain_${modelName}_${Date.now()}`,
      modelName,
      status: 'queued',
      queuedAt: new Date(),
      estimatedDuration: Math.floor(Math.random() * 120) + 30,
      companyId,
      initiatedBy: userId,
      force
    });

    await job.save();
    jobs.push({
      modelName: job.modelName,
      jobId: job.jobId,
      status: job.status,
      queuedAt: job.queuedAt.toISOString(),
      estimatedDuration: job.estimatedDuration
    });
  }

  return jobs;
};

mlTrainingJobSchema.methods.start = function () {
  this.status = 'training';
  this.startedAt = new Date();
  this.progress = 0;
  return this.save();
};

mlTrainingJobSchema.methods.updateProgress = function (progress) {
  this.progress = Math.min(100, Math.max(0, progress));
  return this.save();
};

mlTrainingJobSchema.methods.complete = function (accuracy, metrics) {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  this.accuracy = accuracy;
  if (metrics) this.metrics = metrics;
  if (this.startedAt) {
    this.actualDuration = Math.round((this.completedAt - this.startedAt) / 60000);
  }
  this.nextTraining = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return this.save();
};

mlTrainingJobSchema.methods.fail = function (error) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (error) {
    this.error = {
      message: error.message || error,
      stack: error.stack
    };
  }
  return this.save();
};

const MLTrainingJob = mongoose.model('MLTrainingJob', mlTrainingJobSchema);

module.exports = MLTrainingJob;
