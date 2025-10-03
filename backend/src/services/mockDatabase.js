const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// Mock roles data
const mockRoles = [
  {
    _id: '507f1f77bcf86cd799439001',
    name: 'admin',
    description: 'Administrator with full access',
    permissions: ['*:*'], // All permissions
    isActive: true
  },
  {
    _id: '507f1f77bcf86cd799439002',
    name: 'manager',
    description: 'Manager with limited access',
    permissions: ['budget:*', 'promotion:*', 'customer:read', 'report:read'],
    isActive: true
  },
  {
    _id: '507f1f77bcf86cd799439003',
    name: 'kam',
    description: 'Key Account Manager',
    permissions: ['promotion:read', 'customer:read', 'report:read'],
    isActive: true
  }
];

// Mock users data
// Note: admin password is "admin123", others use "password123"
const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@tradeai.com',
    password: '$2a$10$xayyn2PQxec836W85yTmGumh2I5s9VBKk97einayKUHGPMzVsikVm', // password: admin123
    firstName: 'Admin',
    lastName: 'User',
    employeeId: 'EMP001',
    role: 'admin',
    roles: ['507f1f77bcf86cd799439001'], // Reference to admin role
    permissions: [], // Direct permissions
    department: 'IT',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439012',
    email: 'manager@tradeai.com',
    password: '$2a$10$6sTGUBPSSz/Wh079m/u.WuHq/0kLe1OXLxWuxWdmp9hI80RANh1Ge', // password: password123
    firstName: 'Manager',
    lastName: 'User',
    employeeId: 'EMP002',
    role: 'manager',
    roles: ['507f1f77bcf86cd799439002'], // Reference to manager role
    permissions: [], // Direct permissions
    department: 'Sales',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439013',
    email: 'kam@tradeai.com',
    password: '$2a$10$6sTGUBPSSz/Wh079m/u.WuHq/0kLe1OXLxWuxWdmp9hI80RANh1Ge', // password: password123
    firstName: 'KAM',
    lastName: 'User',
    employeeId: 'EMP003',
    role: 'kam',
    roles: ['507f1f77bcf86cd799439003'], // Reference to kam role
    permissions: [], // Direct permissions
    department: 'Sales',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock database operations
class MockDatabase {
  constructor() {
    this.users = [...mockUsers];
    this.sessions = new Map();
  }

  // User operations
  async findUserById(id) {
    return this.users.find(user => user._id === id);
  }

  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findUserByEmployeeId(employeeId) {
    return this.users.find(user => user.employeeId === employeeId);
  }

  async findUser(query) {
    if (query._id) return this.findUserById(query._id);
    if (query.email) return this.findUserByEmail(query.email);
    if (query.employeeId) return this.findUserByEmployeeId(query.employeeId);
    
    // Handle $or queries
    if (query.$or) {
      for (const condition of query.$or) {
        const user = await this.findUser(condition);
        if (user) return user;
      }
    }
    
    return null;
  }

  // Populate roles and permissions for a user
  populateUserRolesAndPermissions(user) {
    if (!user) return null;
    
    const populatedUser = { ...user };
    
    // Populate roles (array of role IDs becomes array of role objects)
    if (user.roles && Array.isArray(user.roles)) {
      populatedUser.roles = user.roles.map(roleId => {
        return mockRoles.find(r => r._id === roleId) || roleId;
      }).filter(Boolean);
    } else {
      populatedUser.roles = [];
    }
    
    // Permissions are directly on the user
    if (!populatedUser.permissions) {
      populatedUser.permissions = [];
    }
    
    return populatedUser;
  }

  async createUser(userData) {
    const newUser = {
      _id: Date.now().toString(),
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
      isActive: true,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id, updates) {
    const index = this.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  async deleteUser(id) {
    const index = this.users.findIndex(user => user._id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }

  // Session operations
  async createSession(userId, token) {
    this.sessions.set(token, {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  }

  async getSession(token) {
    const session = this.sessions.get(token);
    if (!session) return null;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    
    return session;
  }

  async deleteSession(token) {
    return this.sessions.delete(token);
  }

  // Helper methods
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Mock model methods
  createUserModel(userData) {
    const user = { ...userData };
    
    // Add model methods
    user.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    
    user.select = function(fields) {
      // Mock select method - just return the user
      return this;
    };
    
    user.changedPasswordAfter = function(JWTTimestamp) {
      // Mock method - always return false (password not changed)
      return false;
    };
    
    user.generateAuthToken = function() {
      const jwt = require('jsonwebtoken');
      const config = require('../config');
      
      return jwt.sign(
        { 
          _id: this._id,
          email: this.email,
          role: this.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
    };
    
    user.save = async function() {
      // In mock mode, just update the user in the array
      const index = mockUsers.findIndex(u => u._id === this._id);
      if (index !== -1) {
        mockUsers[index] = { ...this };
      }
      return this;
    };
    
    user.toJSON = function() {
      const obj = { ...this };
      delete obj.password;
      delete obj.twoFactorSecret;
      return obj;
    };

    user.hasPermission = function(module, action) {
      // Super admin and admin have all permissions
      if (this.role === 'super_admin' || this.role === 'admin') return true;

      // Check specific permissions from populated roles
      if (this.roles && Array.isArray(this.roles)) {
        for (const role of this.roles) {
          // If role is populated (object with permissions)
          if (role.permissions && Array.isArray(role.permissions)) {
            const requiredPermission = `${module}:${action}`;
            const hasMatch = role.permissions.some(permission => {
              // Exact match
              if (permission === requiredPermission) return true;
              // Wildcard match (e.g., "budget:*" matches "budget:read")
              if (permission.endsWith(':*')) {
                const resourcePart = permission.split(':')[0];
                return requiredPermission.startsWith(`${resourcePart}:`);
              }
              // Global wildcard
              if (permission === '*:*') return true;
              return false;
            });
            if (hasMatch) return true;
          }
        }
      }

      // Check direct permissions (legacy format: array of { module, actions })
      if (this.permissions && Array.isArray(this.permissions)) {
        const permission = this.permissions.find(p => p.module === module);
        if (permission && permission.actions && permission.actions.includes(action)) {
          return true;
        }
      }

      return false;
    };
    
    return user;
  }
}

// Create singleton instance
const mockDatabase = new MockDatabase();

// Export mock User model interface
const MockUser = {
  findOne(query) {
    // Create a chainable mock query object that can be used with .populate() and await
    const mockQuery = {
      _query: query,
      _populateFields: [],
      _selectFields: null,
      
      select: function(fields) {
        this._selectFields = fields;
        return this;
      },
      
      populate: function(field, select) {
        // Handle space-separated fields like 'roles permissions'
        if (typeof field === 'string' && field.includes(' ')) {
          const fields = field.split(' ');
          fields.forEach(f => this._populateFields.push({ field: f.trim(), select }));
        } else {
          this._populateFields.push({ field, select });
        }
        return this;
      },
      
      then: async function(resolve, reject) {
        try {
          // Execute the actual query when awaited
          const user = await mockDatabase.findUser(this._query);
          if (!user) {
            resolve(null);
            return;
          }
          
          // Apply populate if requested
          let userData = user;
          if (this._populateFields.length > 0) {
            // Check if roles or permissions are requested
            const hasRolesOrPermissions = this._populateFields.some(p => 
              p.field === 'roles' || p.field === 'permissions'
            );
            
            if (hasRolesOrPermissions) {
              userData = mockDatabase.populateUserRolesAndPermissions(user);
            }
          }
          
          const userModel = mockDatabase.createUserModel(userData);
          resolve(userModel);
        } catch (error) {
          reject(error);
        }
      },
      
      catch: function(reject) {
        return this.then(undefined, reject);
      }
    };
    
    return mockQuery;
  },
  
  findById(id) {
    // Create a chainable mock query object that can be used with .populate() and await
    const mockQuery = {
      _userId: id,
      _populateFields: [],
      _selectFields: null,
      
      select: function(fields) {
        this._selectFields = fields;
        return this;
      },
      
      populate: function(field, select) {
        // Handle space-separated fields like 'roles permissions'
        if (typeof field === 'string' && field.includes(' ')) {
          const fields = field.split(' ');
          fields.forEach(f => this._populateFields.push({ field: f.trim(), select }));
        } else {
          this._populateFields.push({ field, select });
        }
        return this;
      },
      
      then: async function(resolve, reject) {
        try {
          // Execute the actual query when awaited
          const user = await mockDatabase.findUserById(this._userId);
          if (!user) {
            resolve(null);
            return;
          }
          
          // Apply populate if requested
          let userData = user;
          if (this._populateFields.length > 0) {
            // Check if roles or permissions are requested
            const hasRolesOrPermissions = this._populateFields.some(p => 
              p.field === 'roles' || p.field === 'permissions'
            );
            
            if (hasRolesOrPermissions) {
              userData = mockDatabase.populateUserRolesAndPermissions(user);
            }
          }
          
          const userModel = mockDatabase.createUserModel(userData);
          resolve(userModel);
        } catch (error) {
          reject(error);
        }
      },
      
      catch: function(reject) {
        return this;
      }
    };
    
    // Return the mock query object that can be chained
    return mockQuery;
  },
  
  async create(userData) {
    const user = await mockDatabase.createUser(userData);
    return mockDatabase.createUserModel(user);
  },
  
  async findByIdAndUpdate(id, updates, options = {}) {
    const user = await mockDatabase.updateUser(id, updates);
    return user ? mockDatabase.createUserModel(user) : null;
  },
  
  async findByIdAndDelete(id) {
    const success = await mockDatabase.deleteUser(id);
    return success;
  },
  
  async findByCredentials(email, password) {
    const user = await mockDatabase.findUserByEmail(email);
    if (!user || !user.isActive) {
      throw new Error('Invalid login credentials');
    }
    
    const userModel = mockDatabase.createUserModel(user);
    const isMatch = await userModel.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid login credentials');
    }
    
    return userModel;
  },
  
  // Add find method for querying multiple users
  find(query = {}) {
    // Create a chainable mock query object
    const mockQuery = {
      _query: query,
      _populateFields: [],
      _selectFields: null,
      _sortFields: null,
      _limit: null,
      _skip: null,
      
      select: function(fields) {
        this._selectFields = fields;
        return this;
      },
      
      populate: function(field, select) {
        // Handle space-separated fields like 'roles permissions'
        if (typeof field === 'string' && field.includes(' ')) {
          const fields = field.split(' ');
          fields.forEach(f => this._populateFields.push({ field: f.trim(), select }));
        } else {
          this._populateFields.push({ field, select });
        }
        return this;
      },
      
      sort: function(fields) {
        this._sortFields = fields;
        return this;
      },
      
      limit: function(num) {
        this._limit = num;
        return this;
      },
      
      skip: function(num) {
        this._skip = num;
        return this;
      },
      
      then: async function(resolve, reject) {
        try {
          // Execute the actual query when awaited
          let users = mockDatabase.users;
          
          // Apply query filter (simple implementation)
          if (this._query && Object.keys(this._query).length > 0) {
            users = users.filter(user => {
              for (const [key, value] of Object.entries(this._query)) {
                if (user[key] !== value) return false;
              }
              return true;
            });
          }
          
          // Apply skip
          if (this._skip) {
            users = users.slice(this._skip);
          }
          
          // Apply limit
          if (this._limit) {
            users = users.slice(0, this._limit);
          }
          
          // Apply populate if requested
          if (this._populateFields.length > 0) {
            const hasRolesOrPermissions = this._populateFields.some(p => 
              p.field === 'roles' || p.field === 'permissions'
            );
            
            if (hasRolesOrPermissions) {
              users = users.map(u => mockDatabase.populateUserRolesAndPermissions(u));
            }
          }
          
          // Convert to models
          const userModels = users.map(u => mockDatabase.createUserModel(u));
          resolve(userModels);
        } catch (error) {
          reject(error);
        }
      },
      
      catch: function(reject) {
        return this;
      }
    };
    
    return mockQuery;
  },
  
  // Add countDocuments method
  async countDocuments(query = {}) {
    let users = mockDatabase.users;
    
    if (query && Object.keys(query).length > 0) {
      users = users.filter(user => {
        for (const [key, value] of Object.entries(query)) {
          if (user[key] !== value) return false;
        }
        return true;
      });
    }
    
    return users.length;
  }
};

// Mock customers data
const mockCustomers = [
  {
    _id: '507f1f77bcf86cd799439031',
    name: 'Walmart',
    code: 'CUST001',
    type: 'retail',
    status: 'active',
    contact: {
      name: 'John Smith',
      email: 'john.smith@walmart.com',
      phone: '+1-555-0001'
    },
    address: {
      street: '702 SW 8th Street',
      city: 'Bentonville',
      state: 'AR',
      postalCode: '72716',
      country: 'USA'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439032',
    name: 'Target',
    code: 'CUST002',
    type: 'retail',
    status: 'active',
    contact: {
      name: 'Jane Doe',
      email: 'jane.doe@target.com',
      phone: '+1-555-0002'
    },
    address: {
      street: '1000 Nicollet Mall',
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55403',
      country: 'USA'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock products data
const mockProducts = [
  {
    _id: '507f1f77bcf86cd799439041',
    name: 'Premium Widget A',
    sku: 'PROD001',
    category: {
      primary: 'Electronics',
      secondary: 'Consumer Electronics'
    },
    barcode: '1234567890123',
    pricing: {
      listPrice: 99.99,
      cost: 50.00,
      margin: 49.99
    },
    price: 99.99, // Keep for backward compatibility
    cost: 50.00,  // Keep for backward compatibility
    status: 'active',
    description: 'High-quality premium widget',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439042',
    name: 'Standard Widget B',
    sku: 'PROD002',
    category: {
      primary: 'Electronics',
      secondary: 'Consumer Electronics'
    },
    barcode: '1234567890124',
    pricing: {
      listPrice: 49.99,
      cost: 25.00,
      margin: 24.99
    },
    price: 49.99, // Keep for backward compatibility
    cost: 25.00,  // Keep for backward compatibility
    status: 'active',
    description: 'Standard quality widget',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock promotions data
const mockPromotions = [
  {
    _id: '507f1f77bcf86cd799439051',
    name: 'Summer Sale 2025',
    code: 'PROMO001',
    type: 'discount',
    customer: '507f1f77bcf86cd799439031', // Walmart
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-08-31'),
    status: 'planned',
    budget: 50000,
    actualSpend: 0,
    products: ['507f1f77bcf86cd799439041'],
    discount: {
      type: 'percentage',
      value: 15
    },
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439052',
    name: 'Holiday Campaign 2024',
    code: 'PROMO002',
    type: 'discount',
    customer: '507f1f77bcf86cd799439032', // Target
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-12-31'),
    status: 'active',
    budget: 75000,
    actualSpend: 45000,
    products: ['507f1f77bcf86cd799439042'],
    discount: {
      type: 'percentage',
      value: 20
    },
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock trade spends data
const mockTradeSpends = [
  {
    _id: '507f1f77bcf86cd799439061',
    company: '507f1f77bcf86cd799439001',
    spendId: 'TS-2025-001',
    spendType: 'marketing',
    category: 'Digital Advertising',
    customer: '507f1f77bcf86cd799439031', // Walmart
    description: 'Q1 Digital Marketing Campaign',
    amount: {
      requested: 50000,
      approved: 50000,
      spent: 35000,
      remaining: 15000
    },
    period: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31')
    },
    status: 'active',
    approvalStatus: 'approved',
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439062',
    company: '507f1f77bcf86cd799439001',
    spendId: 'TS-2025-002',
    spendType: 'cash_coop',
    category: 'In-Store Display',
    customer: '507f1f77bcf86cd799439032', // Target
    description: 'End Cap Display Program',
    cashCoopDetails: {
      reason: 'end_cap_display',
      criteria: {
        duration: '3 months',
        locations: ['All major stores'],
        requirements: 'Premium placement'
      },
      fundingSource: 'marketing_budget',
      fundingPercentage: 75
    },
    amount: {
      requested: 30000,
      approved: 25000,
      spent: 12000,
      remaining: 13000
    },
    period: {
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30')
    },
    status: 'active',
    approvalStatus: 'approved',
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  },
  {
    _id: '507f1f77bcf86cd799439063',
    company: '507f1f77bcf86cd799439001',
    spendId: 'TS-2025-003',
    spendType: 'promotion',
    category: 'Price Promotion',
    customer: '507f1f77bcf86cd799439031', // Walmart
    description: 'Summer Clearance Event',
    amount: {
      requested: 100000,
      approved: 0,
      spent: 0,
      remaining: 0
    },
    period: {
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30')
    },
    status: 'pending',
    approvalStatus: 'pending',
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01')
  }
];

// Mock budgets data
const mockBudgets = [
  {
    _id: '507f1f77bcf86cd799439021',
    year: 2025,
    budgetType: 'annual',
    scope: {
      customers: [],
      products: [],
      channels: []
    },
    status: 'approved',
    totalBudget: 1000000,
    budgetLines: [
      {
        month: 1,
        sales: { units: 1000, value: 50000 },
        tradeSpend: {
          marketing: { budget: 5000, actual: 0, variance: 5000 },
          cashCoop: { budget: 3000, actual: 0, variance: 3000 },
          tradingTerms: { budget: 2000, actual: 0, variance: 2000 },
          promotions: { budget: 4000, actual: 0, variance: 4000 }
        }
      },
      {
        month: 2,
        sales: { units: 1100, value: 55000 },
        tradeSpend: {
          marketing: { budget: 5500, actual: 0, variance: 5500 },
          cashCoop: { budget: 3300, actual: 0, variance: 3300 },
          tradingTerms: { budget: 2200, actual: 0, variance: 2200 },
          promotions: { budget: 4400, actual: 0, variance: 4400 }
        }
      }
    ],
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: '507f1f77bcf86cd799439022',
    year: 2024,
    budgetType: 'quarterly',
    scope: {
      customers: [],
      products: [],
      channels: []
    },
    status: 'approved',
    totalBudget: 250000,
    budgetLines: [
      {
        month: 1,
        sales: { units: 800, value: 40000 },
        tradeSpend: {
          marketing: { budget: 4000, actual: 3800, variance: 200 },
          cashCoop: { budget: 2500, actual: 2400, variance: 100 },
          tradingTerms: { budget: 1500, actual: 1500, variance: 0 },
          promotions: { budget: 3500, actual: 3400, variance: 100 }
        }
      }
    ],
    createdBy: '507f1f77bcf86cd799439011',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Export mock Budget model interface
const MockBudget = {
  find(query = {}) {
    const mockQuery = {
      _query: query,
      _sortOptions: null,
      _limitValue: null,
      _skipValue: 0,
      _populateFields: [],
      _selectFields: null,

      sort: function(sortOptions) {
        this._sortOptions = sortOptions;
        return this;
      },

      limit: function(limitValue) {
        this._limitValue = limitValue;
        return this;
      },

      skip: function(skipValue) {
        this._skipValue = skipValue;
        return this;
      },

      populate: function(field, select) {
        this._populateFields.push({ field, select });
        return this;
      },

      select: function(fields) {
        this._selectFields = fields;
        return this;
      },

      then: function(resolve, reject) {
        try {
          let budgets = [...mockBudgets];

          // Apply query filter
          if (this._query._id) {
            budgets = budgets.filter(b => b._id === this._query._id);
          }
          if (this._query.year) {
            budgets = budgets.filter(b => b.year === this._query.year);
          }
          if (this._query.status) {
            budgets = budgets.filter(b => b.status === this._query.status);
          }

          // Apply sorting
          if (this._sortOptions) {
            const sortKey = Object.keys(this._sortOptions)[0];
            const sortOrder = this._sortOptions[sortKey];
            budgets.sort((a, b) => {
              if (a[sortKey] > b[sortKey]) return sortOrder === 1 ? 1 : -1;
              if (a[sortKey] < b[sortKey]) return sortOrder === 1 ? -1 : 1;
              return 0;
            });
          }

          // Apply skip and limit
          if (this._skipValue > 0) {
            budgets = budgets.slice(this._skipValue);
          }
          if (this._limitValue) {
            budgets = budgets.slice(0, this._limitValue);
          }

          resolve(budgets);
        } catch (error) {
          reject(error);
        }
      },

      catch: function(reject) {
        return this.then(null, reject);
      }
    };

    return mockQuery;
  },

  findById(id) {
    const mockQuery = {
      _id: id,
      _populateFields: [],
      _selectFields: null,

      populate: function(field, select) {
        this._populateFields.push({ field, select });
        return this;
      },

      select: function(fields) {
        this._selectFields = fields;
        return this;
      },

      then: function(resolve, reject) {
        try {
          const budget = mockBudgets.find(b => b._id === this._id);
          resolve(budget || null);
        } catch (error) {
          reject(error);
        }
      },

      catch: function(reject) {
        return this.then(null, reject);
      }
    };

    return mockQuery;
  },

  findOne(query) {
    const mockQuery = {
      _query: query,
      _populateFields: [],
      _selectFields: null,

      populate: function(field, select) {
        this._populateFields.push({ field, select });
        return this;
      },

      select: function(fields) {
        this._selectFields = fields;
        return this;
      },

      then: function(resolve, reject) {
        try {
          let budget = null;

          if (this._query._id) {
            budget = mockBudgets.find(b => b._id === this._query._id);
          } else if (this._query.year) {
            budget = mockBudgets.find(b => b.year === this._query.year);
          }

          resolve(budget);
        } catch (error) {
          reject(error);
        }
      },

      catch: function(reject) {
        return this.then(null, reject);
      }
    };

    return mockQuery;
  },

  async create(budgetData) {
    const newBudget = {
      _id: `507f1f77bcf86cd799439${Date.now().toString().slice(-3)}`,
      ...budgetData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockBudgets.push(newBudget);
    return newBudget;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockBudgets.findIndex(b => b._id === id);
    if (index === -1) return null;

    mockBudgets[index] = {
      ...mockBudgets[index],
      ...update,
      updatedAt: new Date()
    };

    return options.new ? mockBudgets[index] : mockBudgets[index];
  },

  async findByIdAndDelete(id) {
    const index = mockBudgets.findIndex(b => b._id === id);
    if (index === -1) return null;

    const deleted = mockBudgets[index];
    mockBudgets.splice(index, 1);
    return deleted;
  },

  async countDocuments(query = {}) {
    let budgets = [...mockBudgets];

    if (query.year) {
      budgets = budgets.filter(b => b.year === query.year);
    }
    if (query.status) {
      budgets = budgets.filter(b => b.status === query.status);
    }

    return budgets.length;
  }
};

// Helper function to create a standard mock query
function createMockQuery(dataArray, query = {}) {
  return {
    _query: query,
    _sortOptions: null,
    _limitValue: null,
    _skipValue: 0,
    _populateFields: [],
    _selectFields: null,

    sort: function(sortOptions) {
      this._sortOptions = sortOptions;
      return this;
    },

    limit: function(limitValue) {
      this._limitValue = limitValue;
      return this;
    },

    skip: function(skipValue) {
      this._skipValue = skipValue;
      return this;
    },

    populate: function(field, select) {
      this._populateFields.push({ field, select });
      return this;
    },

    select: function(fields) {
      this._selectFields = fields;
      return this;
    },

    then: function(resolve, reject) {
      try {
        let items = [...dataArray];

        // Apply basic filters
        if (this._query._id) {
          items = items.filter(item => item._id === this._query._id);
        }
        if (this._query.name) {
          items = items.filter(item => item.name && item.name.toLowerCase().includes(this._query.name.toLowerCase()));
        }
        if (this._query.status) {
          items = items.filter(item => item.status === this._query.status);
        }

        // Apply sorting
        if (this._sortOptions) {
          const sortKey = Object.keys(this._sortOptions)[0];
          const sortOrder = this._sortOptions[sortKey];
          items.sort((a, b) => {
            if (a[sortKey] > b[sortKey]) return sortOrder === 1 ? 1 : -1;
            if (a[sortKey] < b[sortKey]) return sortOrder === 1 ? -1 : 1;
            return 0;
          });
        }

        // Apply skip and limit
        if (this._skipValue > 0) {
          items = items.slice(this._skipValue);
        }
        if (this._limitValue) {
          items = items.slice(0, this._limitValue);
        }

        resolve(items);
      } catch (error) {
        reject(error);
      }
    },

    catch: function(reject) {
      return this.then(null, reject);
    }
  };
}

// Export mock Customer model
const MockCustomer = {
  find(query = {}) {
    return createMockQuery(mockCustomers, query);
  },

  findById(id) {
    const mockQuery = createMockQuery(mockCustomers, { _id: id });
    mockQuery.then = function(resolve, reject) {
      try {
        const customer = mockCustomers.find(c => c._id === id);
        resolve(customer || null);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  findOne(query) {
    const mockQuery = createMockQuery(mockCustomers, query);
    mockQuery.then = function(resolve, reject) {
      try {
        let customer = null;
        if (query._id) {
          customer = mockCustomers.find(c => c._id === query._id);
        } else if (query.code) {
          customer = mockCustomers.find(c => c.code === query.code);
        }
        resolve(customer);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  async create(customerData) {
    const newCustomer = {
      _id: `507f1f77bcf86cd799439${Date.now().toString().slice(-3)}`,
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockCustomers.findIndex(c => c._id === id);
    if (index === -1) return null;
    mockCustomers[index] = { ...mockCustomers[index], ...update, updatedAt: new Date() };
    return mockCustomers[index];
  },

  async findByIdAndDelete(id) {
    const index = mockCustomers.findIndex(c => c._id === id);
    if (index === -1) return null;
    const deleted = mockCustomers[index];
    mockCustomers.splice(index, 1);
    return deleted;
  },

  async countDocuments(query = {}) {
    let items = [...mockCustomers];
    if (query.status) {
      items = items.filter(c => c.status === query.status);
    }
    return items.length;
  }
};

// Export mock Product model
const MockProduct = {
  find(query = {}) {
    return createMockQuery(mockProducts, query);
  },

  findById(id) {
    const mockQuery = createMockQuery(mockProducts, { _id: id });
    mockQuery.then = function(resolve, reject) {
      try {
        const product = mockProducts.find(p => p._id === id);
        resolve(product || null);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  findOne(query) {
    const mockQuery = createMockQuery(mockProducts, query);
    mockQuery.then = function(resolve, reject) {
      try {
        let product = null;
        if (query._id) {
          product = mockProducts.find(p => p._id === query._id);
        } else if (query.sku) {
          product = mockProducts.find(p => p.sku === query.sku);
        }
        resolve(product);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  async create(productData) {
    const newProduct = {
      _id: `507f1f77bcf86cd799439${Date.now().toString().slice(-3)}`,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockProducts.findIndex(p => p._id === id);
    if (index === -1) return null;
    mockProducts[index] = { ...mockProducts[index], ...update, updatedAt: new Date() };
    return mockProducts[index];
  },

  async findByIdAndDelete(id) {
    const index = mockProducts.findIndex(p => p._id === id);
    if (index === -1) return null;
    const deleted = mockProducts[index];
    mockProducts.splice(index, 1);
    return deleted;
  },

  async countDocuments(query = {}) {
    let items = [...mockProducts];
    if (query.status) {
      items = items.filter(p => p.status === query.status);
    }
    return items.length;
  }
};

// Export mock Promotion model
const MockPromotion = {
  find(query = {}) {
    return createMockQuery(mockPromotions, query);
  },

  findById(id) {
    const mockQuery = createMockQuery(mockPromotions, { _id: id });
    mockQuery.then = function(resolve, reject) {
      try {
        const promotion = mockPromotions.find(p => p._id === id);
        resolve(promotion || null);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  findOne(query) {
    const mockQuery = createMockQuery(mockPromotions, query);
    mockQuery.then = function(resolve, reject) {
      try {
        let promotion = null;
        if (query._id) {
          promotion = mockPromotions.find(p => p._id === query._id);
        } else if (query.code) {
          promotion = mockPromotions.find(p => p.code === query.code);
        }
        resolve(promotion);
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  async create(promotionData) {
    const newPromotion = {
      _id: `507f1f77bcf86cd799439${Date.now().toString().slice(-3)}`,
      ...promotionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockPromotions.push(newPromotion);
    return newPromotion;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockPromotions.findIndex(p => p._id === id);
    if (index === -1) return null;
    mockPromotions[index] = { ...mockPromotions[index], ...update, updatedAt: new Date() };
    return mockPromotions[index];
  },

  async findByIdAndDelete(id) {
    const index = mockPromotions.findIndex(p => p._id === id);
    if (index === -1) return null;
    const deleted = mockPromotions[index];
    mockPromotions.splice(index, 1);
    return deleted;
  },

  async countDocuments(query = {}) {
    let items = [...mockPromotions];
    if (query.status) {
      items = items.filter(p => p.status === query.status);
    }
    return items.length;
  }
};

// Mock TradeSpend Model
const MockTradeSpend = {
  find(query = {}) {
    let shouldPopulate = false;
    const mockQuery = {
      async exec() {
        let items = [...mockTradeSpends];
        if (query.company) {
          items = items.filter(t => t.company === query.company);
        }
        if (query.customer) {
          items = items.filter(t => t.customer === query.customer);
        }
        if (query.spendType) {
          items = items.filter(t => t.spendType === query.spendType);
        }
        if (query.status) {
          items = items.filter(t => t.status === query.status);
        }
        
        // Populate customer if requested
        if (shouldPopulate) {
          items = items.map(item => ({
            ...item,
            customer: mockCustomers.find(c => c._id === item.customer) || item.customer
          }));
        }
        
        return items;
      },
      populate: function() { 
        shouldPopulate = true;
        return this; 
      },
      sort: function() { return this; },
      limit: function() { return this; },
      skip: function() { return this; },
      select: function() { return this; },
      lean: function() { return this; }
    };
    mockQuery.then = function(resolve, reject) {
      try {
        resolve(this.exec());
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  findById(id) {
    const mockQuery = {
      async exec() {
        return mockTradeSpends.find(t => t._id === id) || null;
      },
      populate: function() { return this; },
      lean: function() { return this; }
    };
    mockQuery.then = function(resolve, reject) {
      try {
        resolve(this.exec());
      } catch (error) {
        reject(error);
      }
    };
    return mockQuery;
  },

  async create(tradeSpendData) {
    const newTradeSpend = {
      _id: `507f1f77bcf86cd799439${Date.now().toString().slice(-3)}`,
      ...tradeSpendData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockTradeSpends.push(newTradeSpend);
    return newTradeSpend;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockTradeSpends.findIndex(t => t._id === id);
    if (index === -1) return null;
    mockTradeSpends[index] = { ...mockTradeSpends[index], ...update, updatedAt: new Date() };
    return mockTradeSpends[index];
  },

  async findByIdAndDelete(id) {
    const index = mockTradeSpends.findIndex(t => t._id === id);
    if (index === -1) return null;
    const deleted = mockTradeSpends[index];
    mockTradeSpends.splice(index, 1);
    return deleted;
  },

  async countDocuments(query = {}) {
    let items = [...mockTradeSpends];
    if (query.status) {
      items = items.filter(t => t.status === query.status);
    }
    if (query.company) {
      items = items.filter(t => t.company === query.company);
    }
    return items.length;
  },

  async aggregate(pipeline) {
    // Simple aggregation support for spending summary
    let items = [...mockTradeSpends];
    
    // Apply $match stage
    const matchStage = pipeline.find(stage => stage.$match);
    if (matchStage) {
      const match = matchStage.$match;
      if (match.company) items = items.filter(t => t.company === match.company);
      if (match.customer) items = items.filter(t => t.customer === match.customer);
      if (match.spendType) items = items.filter(t => t.spendType === match.spendType);
      if (match.status) items = items.filter(t => t.status === match.status);
    }
    
    // Apply $group stage for spending summary
    const groupStage = pipeline.find(stage => stage.$group);
    if (groupStage) {
      const totalRequested = items.reduce((sum, t) => sum + (t.amount?.requested || 0), 0);
      const totalApproved = items.reduce((sum, t) => sum + (t.amount?.approved || 0), 0);
      const totalSpent = items.reduce((sum, t) => sum + (t.amount?.spent || 0), 0);
      
      return [{
        _id: null,
        totalRequested,
        totalApproved,
        totalSpent
      }];
    }
    
    return items;
  }
};

module.exports = {
  mockDatabase,
  MockUser,
  MockBudget,
  MockCustomer,
  MockProduct,
  MockPromotion,
  MockTradeSpend
};