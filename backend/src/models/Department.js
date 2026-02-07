const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const departmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Azure AD Reference
  azureAdId: String,

  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: String,

  // Hierarchy
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  level: { type: Number, default: 0 }, // 0 = top level
  path: String, // e.g., "/sales/retail/key-accounts"

  // Leadership
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  headName: String, // Denormalized

  // Contact
  email: String,
  phone: String,
  location: String,

  // Budget Information
  costCenter: String,
  budgetCode: String,

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },

  // Sync Information
  source: {
    type: String,
    enum: ['azure_ad', 'manual', 'csv_import', 'api'],
    default: 'manual'
  },
  lastSyncedAt: Date,

  // Statistics (denormalized for performance)
  employeeCount: { type: Number, default: 0 },
  activeEmployeeCount: { type: Number, default: 0 },

  // Custom Fields
  customFields: mongoose.Schema.Types.Mixed,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
departmentSchema.index({ companyId: 1, code: 1 }, { unique: true });
departmentSchema.index({ companyId: 1, name: 1 });
departmentSchema.index({ companyId: 1, parentDepartment: 1 });
departmentSchema.index({ companyId: 1, status: 1 });

// Virtual for child departments
departmentSchema.virtual('childDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Virtual for employees
departmentSchema.virtual('employees', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department'
});

// Pre-save hook to update path
departmentSchema.pre('save', async function (next) {
  if (this.isModified('parentDepartment') || this.isNew) {
    if (this.parentDepartment) {
      const parent = await this.constructor.findById(this.parentDepartment);
      if (parent) {
        this.path = `${parent.path}/${this.code.toLowerCase()}`;
        this.level = parent.level + 1;
      }
    } else {
      this.path = `/${this.code.toLowerCase()}`;
      this.level = 0;
    }
  }
  next();
});

// Method to update employee counts
departmentSchema.methods.updateEmployeeCounts = async function () {
  const Employee = mongoose.model('Employee');

  this.employeeCount = await Employee.countDocuments({
    companyId: this.companyId,
    department: this._id
  });

  this.activeEmployeeCount = await Employee.countDocuments({
    companyId: this.companyId,
    department: this._id,
    status: 'active'
  });

  return this.save();
};

// Static method to get department tree
departmentSchema.statics.getTree = async function (companyId) {
  const departments = await this.find({ companyId, status: 'active' })
    .sort({ level: 1, name: 1 })
    .lean();

  // Build tree structure
  const map = {};
  const roots = [];

  departments.forEach((dept) => {
    map[dept._id.toString()] = { ...dept, children: [] };
  });

  departments.forEach((dept) => {
    if (dept.parentDepartment) {
      const parent = map[dept.parentDepartment.toString()];
      if (parent) {
        parent.children.push(map[dept._id.toString()]);
      }
    } else {
      roots.push(map[dept._id.toString()]);
    }
  });

  return roots;
};

addTenantSupport(departmentSchema);

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

module.exports = Department;
