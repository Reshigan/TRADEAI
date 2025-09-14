# 👨‍💻 TRADEAI - Developer Guide

## Document Information
- **Document Type**: Developer Guide
- **Version**: 1.0
- **Date**: September 2024
- **Audience**: Developers, Technical Contributors
- **Repository**: https://github.com/Reshigan/TRADEAI

## 1. Development Environment Setup

### 1.1 Prerequisites

#### Required Software
- **Node.js**: 18.x or higher
- **Python**: 3.9 or higher
- **Docker**: 24.0 or higher
- **Docker Compose**: 2.20 or higher
- **Git**: Latest version
- **MongoDB**: 7.0+ (for local development)
- **Redis**: 7.0+ (for local development)

#### Recommended Tools
- **VS Code**: With recommended extensions
- **Postman**: For API testing
- **MongoDB Compass**: Database GUI
- **Redis Commander**: Redis GUI

### 1.2 Local Development Setup

#### Clone Repository
```bash
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables for local development
nano .env
```

#### Local Development Environment Variables
```bash
# Local development settings
NODE_ENV=development
DOMAIN=localhost
SERVER_IP=127.0.0.1

# Database connections
MONGODB_URL=mongodb://localhost:27017/tradeai_dev
REDIS_URL=redis://localhost:6379

# JWT secrets (use different values in production)
JWT_SECRET=dev_jwt_secret_key
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key

# API URLs for frontend
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_AI_API_URL=http://localhost:8000
```

#### Quick Start
```bash
# Start all services with Docker Compose
./quick-start.sh

# Or manually
docker compose up -d --build

# Check service status
docker compose ps
```

### 1.3 IDE Configuration

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "mongodb.mongodb-vscode",
    "ms-vscode.docker"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "python.defaultInterpreterPath": "./ai-services/venv/bin/python"
}
```

## 2. Project Structure

### 2.1 Repository Structure

```
TRADEAI/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── Dockerfile
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # CSS and themes
│   ├── public/              # Static assets
│   ├── package.json
│   └── Dockerfile
├── ai-services/             # Python ML services
│   ├── src/
│   │   ├── models/          # ML models
│   │   ├── services/        # AI services
│   │   └── utils/           # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── monitoring/              # Monitoring service
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Development compose
├── .env.example            # Environment template
└── README.md
```

### 2.2 Backend Architecture

#### Directory Structure
```
backend/src/
├── controllers/
│   ├── auth.controller.js
│   ├── budget.controller.js
│   ├── transaction.controller.js
│   └── user.controller.js
├── services/
│   ├── auth.service.js
│   ├── budget.service.js
│   └── email.service.js
├── models/
│   ├── User.js
│   ├── Budget.js
│   └── Transaction.js
├── middleware/
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── error.middleware.js
├── routes/
│   ├── auth.routes.js
│   ├── budget.routes.js
│   └── index.js
├── utils/
│   ├── logger.js
│   ├── database.js
│   └── helpers.js
└── config/
    ├── database.js
    ├── redis.js
    └── jwt.js
```

#### Key Technologies
- **Express.js**: Web framework
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **Joi**: Validation
- **Winston**: Logging
- **Jest**: Testing

### 2.3 Frontend Architecture

#### Directory Structure
```
frontend/src/
├── components/
│   ├── common/              # Reusable components
│   ├── forms/               # Form components
│   ├── charts/              # Chart components
│   └── layout/              # Layout components
├── pages/
│   ├── Dashboard/
│   ├── Budgets/
│   ├── Transactions/
│   └── Analytics/
├── hooks/
│   ├── useAuth.js
│   ├── useBudgets.js
│   └── useApi.js
├── services/
│   ├── api.js               # API client
│   ├── auth.service.js
│   └── budget.service.js
├── store/
│   ├── slices/              # Redux slices
│   ├── store.js
│   └── middleware.js
└── utils/
    ├── constants.js
    ├── formatters.js
    └── validators.js
```

#### Key Technologies
- **React**: 18.x with hooks
- **Redux Toolkit**: State management
- **Material-UI**: Component library
- **React Router**: Navigation
- **Axios**: HTTP client
- **Chart.js**: Data visualization

## 3. Development Workflow

### 3.1 Git Workflow

#### Branch Strategy
```bash
main                    # Production branch
├── develop            # Development branch
├── feature/budget-ui  # Feature branches
├── bugfix/auth-fix    # Bug fix branches
└── hotfix/security    # Hotfix branches
```

#### Commit Convention
```bash
# Format: type(scope): description
feat(budget): add budget allocation feature
fix(auth): resolve JWT token expiration issue
docs(api): update API documentation
style(ui): improve button styling
refactor(db): optimize query performance
test(budget): add unit tests for budget service
```

#### Pull Request Process
1. **Create feature branch** from develop
2. **Implement changes** with tests
3. **Update documentation** if needed
4. **Create pull request** to develop
5. **Code review** by team members
6. **Merge after approval** and CI passes

### 3.2 Code Standards

#### JavaScript/TypeScript Standards
```javascript
// Use ES6+ features
const fetchBudgets = async (filters = {}) => {
  try {
    const response = await api.get('/budgets', { params: filters });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch budgets:', error);
    throw error;
  }
};

// Use destructuring
const { name, amount, currency } = budget;

// Use template literals
const message = `Budget ${name} has ${amount} ${currency} remaining`;
```

#### React Component Standards
```jsx
// Functional components with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const BudgetCard = ({ budget, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Effect logic here
  }, [budget.id]);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate(budget.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="budget-card">
      <h3>{budget.name}</h3>
      <button onClick={handleUpdate} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
};

BudgetCard.propTypes = {
  budget: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default BudgetCard;
```

#### Python Standards
```python
# Follow PEP 8 style guide
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class BudgetPredictor:
    """Budget prediction service using ML models."""
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
    
    def predict_spend(self, 
                     budget_data: Dict, 
                     time_horizon: int = 30) -> Optional[float]:
        """
        Predict budget spend for given time horizon.
        
        Args:
            budget_data: Historical budget data
            time_horizon: Prediction horizon in days
            
        Returns:
            Predicted spend amount or None if prediction fails
        """
        try:
            # Prediction logic here
            return predicted_amount
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return None
```

### 3.3 Testing Standards

#### Backend Testing
```javascript
// Unit tests with Jest
const budgetService = require('../services/budget.service');
const Budget = require('../models/Budget');

describe('Budget Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a new budget successfully', async () => {
      // Arrange
      const budgetData = {
        name: 'Test Budget',
        amount: 100000,
        companyId: 'company123'
      };
      
      Budget.create = jest.fn().mockResolvedValue(budgetData);

      // Act
      const result = await budgetService.createBudget(budgetData);

      // Assert
      expect(Budget.create).toHaveBeenCalledWith(budgetData);
      expect(result).toEqual(budgetData);
    });

    it('should throw error for invalid budget data', async () => {
      // Arrange
      const invalidData = { name: '' };

      // Act & Assert
      await expect(budgetService.createBudget(invalidData))
        .rejects.toThrow('Invalid budget data');
    });
  });
});
```

#### Frontend Testing
```jsx
// Component tests with React Testing Library
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import BudgetCard from '../BudgetCard';
import { store } from '../../store/store';

const mockBudget = {
  id: '1',
  name: 'Test Budget',
  amount: 100000,
  spent: 25000
};

const renderWithProvider = (component) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('BudgetCard', () => {
  it('renders budget information correctly', () => {
    renderWithProvider(
      <BudgetCard budget={mockBudget} onUpdate={jest.fn()} />
    );

    expect(screen.getByText('Test Budget')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('calls onUpdate when update button is clicked', async () => {
    const mockOnUpdate = jest.fn();
    
    renderWithProvider(
      <BudgetCard budget={mockBudget} onUpdate={mockOnUpdate} />
    );

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('1');
    });
  });
});
```

## 4. API Development

### 4.1 API Design Principles

#### RESTful Design
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Use plural nouns for resource names
- Use consistent URL patterns
- Return appropriate HTTP status codes
- Include proper error messages

#### Example API Endpoints
```javascript
// Budget endpoints
GET    /api/v1/budgets              // List budgets
POST   /api/v1/budgets              // Create budget
GET    /api/v1/budgets/:id          // Get budget details
PUT    /api/v1/budgets/:id          // Update budget
DELETE /api/v1/budgets/:id          // Delete budget

// Nested resources
GET    /api/v1/budgets/:id/transactions  // Get budget transactions
POST   /api/v1/budgets/:id/transactions  // Create transaction
```

### 4.2 Request/Response Format

#### Request Format
```javascript
// POST /api/v1/budgets
{
  "name": "Q4 2024 Marketing Budget",
  "description": "Fourth quarter marketing budget",
  "type": "quarterly",
  "financial": {
    "totalAmount": 500000,
    "currency": "USD"
  },
  "period": {
    "startDate": "2024-10-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

#### Response Format
```javascript
// Success response
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123456",
    "name": "Q4 2024 Marketing Budget",
    "status": "draft",
    "createdAt": "2024-09-14T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-09-14T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid budget data",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
```

### 4.3 Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: 'Token verification failed'
      }
    });
  }
};

module.exports = { authenticateToken };
```

## 5. Database Development

### 5.1 MongoDB Best Practices

#### Schema Design
```javascript
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  financial: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'EUR', 'GBP', 'CAD']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
budgetSchema.index({ companyId: 1, 'period.startDate': -1 });
budgetSchema.index({ companyId: 1, status: 1 });

// Virtual fields
budgetSchema.virtual('utilizationRate').get(function() {
  return this.financial.spent / this.financial.totalAmount;
});

module.exports = mongoose.model('Budget', budgetSchema);
```

#### Query Optimization
```javascript
// Use projection to limit returned fields
const budgets = await Budget.find(
  { companyId: req.user.companyId },
  { name: 1, 'financial.totalAmount': 1, status: 1 }
);

// Use aggregation for complex queries
const budgetSummary = await Budget.aggregate([
  { $match: { companyId: mongoose.Types.ObjectId(companyId) } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    totalAmount: { $sum: '$financial.totalAmount' }
  }}
]);

// Use indexes for sorting
const recentBudgets = await Budget.find({ companyId })
  .sort({ createdAt: -1 })
  .limit(10);
```

### 5.2 Data Validation

```javascript
const Joi = require('joi');

const budgetValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  type: Joi.string().valid('annual', 'quarterly', 'campaign').required(),
  financial: Joi.object({
    totalAmount: Joi.number().positive().required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD').required()
  }).required(),
  period: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }).required()
});

const validateBudget = (req, res, next) => {
  const { error } = budgetValidationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid budget data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    });
  }
  
  next();
};
```

## 6. Frontend Development

### 6.1 Component Development

#### Component Structure
```jsx
// BudgetCard.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { formatCurrency } from '../../utils/formatters';
import { useBudgets } from '../../hooks/useBudgets';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateBudget } = useBudgets();

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    try {
      await updateBudget(budget.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update budget status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const utilizationPercentage = (budget.financial.spent / budget.financial.totalAmount) * 100;

  return (
    <Card className="budget-card">
      <CardContent>
        <Typography variant="h6" component="h2">
          {budget.name}
        </Typography>
        
        <Typography color="textSecondary" gutterBottom>
          {budget.type} • {budget.status}
        </Typography>

        <div className="budget-metrics">
          <div className="metric">
            <Typography variant="body2">Total Budget</Typography>
            <Typography variant="h6">
              {formatCurrency(budget.financial.totalAmount, budget.financial.currency)}
            </Typography>
          </div>
          
          <div className="metric">
            <Typography variant="body2">Spent</Typography>
            <Typography variant="h6">
              {formatCurrency(budget.financial.spent, budget.financial.currency)}
            </Typography>
          </div>
          
          <div className="metric">
            <Typography variant="body2">Utilization</Typography>
            <Typography variant="h6">
              {utilizationPercentage.toFixed(1)}%
            </Typography>
          </div>
        </div>

        <div className="budget-actions">
          <Button onClick={() => onEdit(budget)} disabled={isLoading}>
            Edit
          </Button>
          <Button 
            onClick={() => onDelete(budget)} 
            color="error" 
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

BudgetCard.propTypes = {
  budget: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    financial: PropTypes.shape({
      totalAmount: PropTypes.number.isRequired,
      spent: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default BudgetCard;
```

### 6.2 State Management

#### Redux Slice Example
```javascript
// budgetSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import budgetService from '../services/budget.service';

// Async thunks
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await budgetService.getBudgets(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budgetData, { rejectWithValue }) => {
    try {
      const response = await budgetService.createBudget(budgetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Slice
const budgetSlice = createSlice({
  name: 'budgets',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBudgetInList: (state, action) => {
      const index = state.items.findIndex(budget => budget.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.items.unshift(action.payload.data);
      });
  }
});

export const { clearError, updateBudgetInList } = budgetSlice.actions;
export default budgetSlice.reducer;
```

### 6.3 Custom Hooks

```javascript
// useBudgets.js
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { fetchBudgets, createBudget, updateBudgetInList } from '../store/slices/budgetSlice';
import budgetService from '../services/budget.service';

export const useBudgets = () => {
  const dispatch = useDispatch();
  const { items, loading, error, pagination } = useSelector(state => state.budgets);

  const getBudgets = useCallback((filters) => {
    dispatch(fetchBudgets(filters));
  }, [dispatch]);

  const addBudget = useCallback((budgetData) => {
    return dispatch(createBudget(budgetData));
  }, [dispatch]);

  const updateBudget = useCallback(async (budgetId, updates) => {
    try {
      const response = await budgetService.updateBudget(budgetId, updates);
      dispatch(updateBudgetInList(response.data));
      return response.data;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  return {
    budgets: items,
    loading,
    error,
    pagination,
    getBudgets,
    addBudget,
    updateBudget
  };
};
```

## 7. Deployment and DevOps

### 7.1 Docker Development

#### Multi-stage Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "src/server.js"]
```

#### Docker Compose for Development
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URL: mongodb://admin:password@mongodb:27017/tradeai?authSource=admin
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongodb_data:
  redis_data:
```

### 7.2 CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
        ports:
          - 27017:27017
      
      redis:
        image: redis:7.0
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm test
        env:
          MONGODB_URL: mongodb://admin:password@localhost:27017/tradeai_test?authSource=admin
          REDIS_URL: redis://localhost:6379
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t tradeai/backend ./backend
          docker build -t tradeai/frontend ./frontend
      
      - name: Test Docker images
        run: |
          docker run --rm tradeai/backend node --version
          docker run --rm tradeai/frontend node --version

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Add deployment script here
          echo "Deploying to production..."
```

## 8. Debugging and Troubleshooting

### 8.1 Backend Debugging

#### Logging Setup
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tradeai-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

#### Error Handling Middleware
```javascript
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID'
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
};

module.exports = errorHandler;
```

### 8.2 Frontend Debugging

#### Error Boundary
```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send error to logging service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Debug Utilities
```javascript
// Debug utilities
export const debugLog = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}:`, data);
  }
};

export const performanceLog = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    debugLog(`Performance: ${name}`, `${end - start}ms`);
    return result;
  };
};

// Usage
const fetchBudgetsWithLogging = performanceLog('fetchBudgets', fetchBudgets);
```

---

**Developer Guide Maintenance**

This guide should be updated with each major release or when development practices change.

**Next Review Date**: December 2024  
**Document Owner**: Development Team  
**Contributors**: All developers working on TRADEAI