const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't include password in queries by default
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: [
            'user',
            'admin',
            'super_admin',
            'sales_manager',    // Sales Manager - oversees sales team and strategies
            'kam',             // Key Account Manager - manages key customer accounts
            'finance_manager', // Finance Manager - financial oversight and budgets
            'inventory_manager', // Inventory Manager - stock and product management
            'analyst',         // Data Analyst - analytics and insights
            'manager'          // General Manager role
        ],
        default: 'user'
    },
    tenant: {
        type: String,
        default: 'mondelez',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    refreshToken: {
        type: String,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.refreshToken;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ tenant: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, rounds);
        
        // Update passwordChangedAt
        if (!this.isNew) {
            this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If lock has expired, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Lock account after max attempts
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { 
            loginAttempts: 0,
            lastLogin: Date.now()
        },
        $unset: { lockUntil: 1 }
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
