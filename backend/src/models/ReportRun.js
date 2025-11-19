const mongoose = require('mongoose');

const reportRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reportDefinitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportDefinition',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  startedAt: {
    type: Date,
    index: true
  },
  completedAt: Date,
  duration: Number,

  parameters: {
    filters: mongoose.Schema.Types.Mixed,
    dateRange: {
      start: Date,
      end: Date
    },
    outputFormat: {
      type: String,
      enum: ['csv', 'xlsx', 'pdf', 'json']
    }
  },

  rowCount: Number,
  fileSize: Number,
  filePath: String,
  downloadUrl: String,

  error: {
    message: String,
    stack: String
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
reportRunSchema.index({ reportDefinitionId: 1, status: 1, createdAt: -1 });
reportRunSchema.index({ requestedBy: 1, createdAt: -1 });

reportRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ReportRun = mongoose.model('ReportRun', reportRunSchema);

module.exports = ReportRun;
