#!/usr/bin/env node

/**
 * CRUD Operations Audit and Implementation Script
 * Systematically checks and implements missing CRUD operations
 */

const fs = require('fs');
const path = require('path');

// Define all entities and their expected CRUD operations
const ENTITIES = {
  'User': {
    controller: 'userController.js',
    model: 'User.js',
    frontend: 'users',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Company': {
    controller: 'companyController.js',
    model: 'Company.js',
    frontend: 'companies',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Customer': {
    controller: 'customerController.js',
    model: 'Customer.js',
    frontend: 'customers',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Product': {
    controller: 'productController.js',
    model: 'Product.js',
    frontend: 'products',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Budget': {
    controller: 'budgetController.js',
    model: 'Budget.js',
    frontend: 'budgets',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'TradeSpend': {
    controller: 'tradeSpendController.js',
    model: 'TradeSpend.js',
    frontend: 'tradeSpends',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Promotion': {
    controller: 'promotionController.js',
    model: 'Promotion.js',
    frontend: 'promotions',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'TradingTerms': {
    controller: 'tradingTermsController.js',
    model: 'TradingTerms.js',
    frontend: 'tradingTerms',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'ActivityGrid': {
    controller: 'activityGridController.js',
    model: 'ActivityGrid.js',
    frontend: 'activityGrid',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  },
  'Report': {
    controller: 'reportController.js',
    model: 'Report.js',
    frontend: 'reports',
    operations: ['create', 'read', 'update', 'delete', 'list'],
    routes: ['POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'GET /']
  }
};

const BACKEND_PATH = '/workspace/project/TRADEAI/backend';
const FRONTEND_PATH = '/workspace/project/TRADEAI/frontend';

class CRUDAuditor {
  constructor() {
    this.auditResults = {};
    this.missingOperations = [];
  }

  async auditBackendControllers() {
    console.log('🔍 Auditing Backend Controllers...\n');
    
    for (const [entityName, config] of Object.entries(ENTITIES)) {
      const controllerPath = path.join(BACKEND_PATH, 'src/controllers', config.controller);
      const auditResult = {
        entity: entityName,
        controller: config.controller,
        exists: false,
        operations: {
          create: false,
          read: false,
          update: false,
          delete: false,
          list: false
        },
        missing: []
      };

      if (fs.existsSync(controllerPath)) {
        auditResult.exists = true;
        const controllerContent = fs.readFileSync(controllerPath, 'utf8');
        
        // Check for CRUD operations
        auditResult.operations.create = /exports\.(create|add|new)/i.test(controllerContent);
        auditResult.operations.read = /exports\.(get|read|find|show)(?!.*list|.*all)/i.test(controllerContent);
        auditResult.operations.update = /exports\.(update|edit|modify|put|patch)/i.test(controllerContent);
        auditResult.operations.delete = /exports\.(delete|remove|destroy)/i.test(controllerContent);
        auditResult.operations.list = /exports\.(list|getAll|findAll|index)/i.test(controllerContent);
        
        // Identify missing operations
        for (const [op, exists] of Object.entries(auditResult.operations)) {
          if (!exists) {
            auditResult.missing.push(op);
          }
        }
      } else {
        auditResult.missing = ['create', 'read', 'update', 'delete', 'list'];
      }

      this.auditResults[entityName] = auditResult;
      
      // Print results
      console.log(`📋 ${entityName}:`);
      console.log(`   Controller: ${auditResult.exists ? '✅' : '❌'} ${config.controller}`);
      if (auditResult.exists) {
        console.log(`   Operations:`);
        console.log(`     Create: ${auditResult.operations.create ? '✅' : '❌'}`);
        console.log(`     Read:   ${auditResult.operations.read ? '✅' : '❌'}`);
        console.log(`     Update: ${auditResult.operations.update ? '✅' : '❌'}`);
        console.log(`     Delete: ${auditResult.operations.delete ? '✅' : '❌'}`);
        console.log(`     List:   ${auditResult.operations.list ? '✅' : '❌'}`);
      }
      if (auditResult.missing.length > 0) {
        console.log(`   Missing: ${auditResult.missing.join(', ')}`);
      }
      console.log('');
    }
  }

  async auditFrontendComponents() {
    console.log('🔍 Auditing Frontend Components...\n');
    
    for (const [entityName, config] of Object.entries(ENTITIES)) {
      const componentDir = path.join(FRONTEND_PATH, 'src/components', config.frontend);
      const auditResult = {
        entity: entityName,
        directory: config.frontend,
        exists: false,
        components: {
          list: false,
          form: false,
          detail: false
        },
        missing: []
      };

      if (fs.existsSync(componentDir)) {
        auditResult.exists = true;
        const files = fs.readdirSync(componentDir);
        
        // Check for component files
        auditResult.components.list = files.some(f => /list/i.test(f) && f.endsWith('.js'));
        auditResult.components.form = files.some(f => /form/i.test(f) && f.endsWith('.js'));
        auditResult.components.detail = files.some(f => /detail/i.test(f) && f.endsWith('.js'));
        
        // Identify missing components
        for (const [comp, exists] of Object.entries(auditResult.components)) {
          if (!exists) {
            auditResult.missing.push(comp);
          }
        }
      } else {
        auditResult.missing = ['list', 'form', 'detail'];
      }

      this.auditResults[entityName].frontend = auditResult;
      
      // Print results
      console.log(`📋 ${entityName} Frontend:`);
      console.log(`   Directory: ${auditResult.exists ? '✅' : '❌'} ${config.frontend}`);
      if (auditResult.exists) {
        console.log(`   Components:`);
        console.log(`     List:   ${auditResult.components.list ? '✅' : '❌'}`);
        console.log(`     Form:   ${auditResult.components.form ? '✅' : '❌'}`);
        console.log(`     Detail: ${auditResult.components.detail ? '✅' : '❌'}`);
      }
      if (auditResult.missing.length > 0) {
        console.log(`   Missing: ${auditResult.missing.join(', ')}`);
      }
      console.log('');
    }
  }

  generateMissingControllerOperation(entityName, operation) {
    const templates = {
      create: `
// Create ${entityName.toLowerCase()}
exports.create${entityName} = asyncHandler(async (req, res, next) => {
  const ${entityName.toLowerCase()}Data = {
    ...req.body,
    company: req.user.company,
    createdBy: req.user._id
  };

  const ${entityName.toLowerCase()} = await ${entityName}.create(${entityName.toLowerCase()}Data);

  res.status(201).json({
    success: true,
    data: ${entityName.toLowerCase()}
  });
});`,

      read: `
// Get single ${entityName.toLowerCase()}
exports.get${entityName} = asyncHandler(async (req, res, next) => {
  const ${entityName.toLowerCase()} = await ${entityName}.findById(req.params.id)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName');

  if (!${entityName.toLowerCase()}) {
    throw new AppError('${entityName} not found', 404);
  }

  res.json({
    success: true,
    data: ${entityName.toLowerCase()}
  });
});`,

      update: `
// Update ${entityName.toLowerCase()}
exports.update${entityName} = asyncHandler(async (req, res, next) => {
  const ${entityName.toLowerCase()} = await ${entityName}.findById(req.params.id);

  if (!${entityName.toLowerCase()}) {
    throw new AppError('${entityName} not found', 404);
  }

  Object.assign(${entityName.toLowerCase()}, req.body);
  ${entityName.toLowerCase()}.lastModifiedBy = req.user._id;
  
  await ${entityName.toLowerCase()}.save();

  res.json({
    success: true,
    data: ${entityName.toLowerCase()}
  });
});`,

      delete: `
// Delete ${entityName.toLowerCase()}
exports.delete${entityName} = asyncHandler(async (req, res, next) => {
  const ${entityName.toLowerCase()} = await ${entityName}.findById(req.params.id);

  if (!${entityName.toLowerCase()}) {
    throw new AppError('${entityName} not found', 404);
  }

  await ${entityName.toLowerCase()}.deleteOne();

  res.json({
    success: true,
    message: '${entityName} deleted successfully'
  });
});`,

      list: `
// Get all ${entityName.toLowerCase()}s
exports.get${entityName}s = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    ...filters
  } = req.query;

  // Build query
  const query = { company: req.user.company };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  // Apply additional filters
  Object.assign(query, filters);

  const ${entityName.toLowerCase()}s = await ${entityName}.find(query)
    .populate('company', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ${entityName}.countDocuments(query);

  res.json({
    success: true,
    data: ${entityName.toLowerCase()}s,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});`
    };

    return templates[operation] || '';
  }

  generateMissingFrontendComponent(entityName, componentType) {
    const entityLower = entityName.toLowerCase();
    const entityPlural = entityLower + 's';
    
    const templates = {
      list: `import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { ${entityName.toLowerCase()}Service } from '../../services/api';
import ${entityName}Form from './${entityName}Form';
import ${entityName}Detail from './${entityName}Detail';

const ${entityName}List = () => {
  const [${entityPlural}, set${entityName}s] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetch${entityName}s();
  }, [page, rowsPerPage, search]);

  const fetch${entityName}s = async () => {
    try {
      setLoading(true);
      const response = await ${entityName.toLowerCase()}Service.get${entityName}s({
        page: page + 1,
        limit: rowsPerPage,
        search
      });
      
      set${entityName}s(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching ${entityPlural}:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ${entityLower}?')) {
      try {
        await ${entityName.toLowerCase()}Service.delete${entityName}(id);
        fetch${entityName}s();
      } catch (error) {
        console.error('Error deleting ${entityLower}:', error);
      }
    }
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedItem) {
        await ${entityName.toLowerCase()}Service.update${entityName}(selectedItem._id, data);
      } else {
        await ${entityName.toLowerCase()}Service.create${entityName}(data);
      }
      setFormOpen(false);
      setSelectedItem(null);
      fetch${entityName}s();
    } catch (error) {
      console.error('Error saving ${entityLower}:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">${entityName}s</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedItem(null);
            setFormOpen(true);
          }}
        >
          Add ${entityName}
        </Button>
      </Box>

      <Box mb={2}>
        <TextField
          placeholder="Search ${entityPlural}..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {${entityPlural}.map((item) => (
              <TableRow key={item._id} hover onClick={() => handleView(item)} sx={{ cursor: 'pointer' }}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.status} 
                    color={item.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>

      {formOpen && (
        <${entityName}Form
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedItem(null);
          }}
          onSubmit={handleFormSubmit}
          ${entityLower}={selectedItem}
        />
      )}

      {detailOpen && (
        <${entityName}Detail
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedItem(null);
          }}
          ${entityLower}={selectedItem}
        />
      )}
    </Box>
  );
};

export default ${entityName}List;`,

      form: `import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ${entityName}Form = ({ open, onClose, onSubmit, ${entityLower} }) => {
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    description: Yup.string(),
    status: Yup.string().required('Status is required')
  });

  const formik = useFormik({
    initialValues: {
      name: ${entityLower}?.name || '',
      description: ${entityLower}?.description || '',
      status: ${entityLower}?.status || 'active'
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          {${entityLower} ? 'Edit ${entityName}' : 'Add ${entityName}'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="name"
                label="Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {${entityLower} ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ${entityName}Form;`,

      detail: `import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Box
} from '@mui/material';

const ${entityName}Detail = ({ open, onClose, ${entityLower} }) => {
  if (!${entityLower}) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        ${entityName} Details
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {${entityLower}.name}
            </Typography>
            <Chip 
              label={${entityLower}.status} 
              color={${entityLower}.status === 'active' ? 'success' : 'default'}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {${entityLower}.description && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2">
                {${entityLower}.description}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Created
            </Typography>
            <Typography variant="body2">
              {new Date(${entityLower}.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(${entityLower}.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ${entityName}Detail;`
    };

    return templates[componentType] || '';
  }

  async generateImplementationPlan() {
    console.log('📋 CRUD Implementation Plan\n');
    console.log('==========================\n');

    const plan = {
      backend: {
        missingControllers: [],
        missingOperations: []
      },
      frontend: {
        missingDirectories: [],
        missingComponents: []
      }
    };

    for (const [entityName, auditResult] of Object.entries(this.auditResults)) {
      // Backend analysis
      if (!auditResult.exists) {
        plan.backend.missingControllers.push(entityName);
      } else if (auditResult.missing.length > 0) {
        plan.backend.missingOperations.push({
          entity: entityName,
          operations: auditResult.missing
        });
      }

      // Frontend analysis
      if (!auditResult.frontend.exists) {
        plan.frontend.missingDirectories.push(entityName);
      } else if (auditResult.frontend.missing.length > 0) {
        plan.frontend.missingComponents.push({
          entity: entityName,
          components: auditResult.frontend.missing
        });
      }
    }

    // Print implementation plan
    console.log('🔧 Backend Implementation Needed:');
    if (plan.backend.missingControllers.length > 0) {
      console.log(`   Missing Controllers: ${plan.backend.missingControllers.join(', ')}`);
    }
    if (plan.backend.missingOperations.length > 0) {
      console.log('   Missing Operations:');
      plan.backend.missingOperations.forEach(item => {
        console.log(`     ${item.entity}: ${item.operations.join(', ')}`);
      });
    }

    console.log('\n🎨 Frontend Implementation Needed:');
    if (plan.frontend.missingDirectories.length > 0) {
      console.log(`   Missing Directories: ${plan.frontend.missingDirectories.join(', ')}`);
    }
    if (plan.frontend.missingComponents.length > 0) {
      console.log('   Missing Components:');
      plan.frontend.missingComponents.forEach(item => {
        console.log(`     ${item.entity}: ${item.components.join(', ')}`);
      });
    }

    return plan;
  }

  async generateSummaryReport() {
    console.log('\n📊 CRUD AUDIT SUMMARY\n');
    console.log('=====================\n');

    let totalEntities = Object.keys(ENTITIES).length;
    let completeBackend = 0;
    let completeFrontend = 0;
    let totalMissingOps = 0;
    let totalMissingComps = 0;

    for (const [entityName, auditResult] of Object.entries(this.auditResults)) {
      if (auditResult.exists && auditResult.missing.length === 0) {
        completeBackend++;
      }
      if (auditResult.frontend.exists && auditResult.frontend.missing.length === 0) {
        completeFrontend++;
      }
      totalMissingOps += auditResult.missing.length;
      totalMissingComps += auditResult.frontend.missing.length;
    }

    console.log(`Total Entities: ${totalEntities}`);
    console.log(`Backend Complete: ${completeBackend}/${totalEntities} (${Math.round(completeBackend/totalEntities*100)}%)`);
    console.log(`Frontend Complete: ${completeFrontend}/${totalEntities} (${Math.round(completeFrontend/totalEntities*100)}%)`);
    console.log(`Missing Backend Operations: ${totalMissingOps}`);
    console.log(`Missing Frontend Components: ${totalMissingComps}`);
    
    const overallCompletion = Math.round(((completeBackend + completeFrontend) / (totalEntities * 2)) * 100);
    console.log(`\nOverall CRUD Completion: ${overallCompletion}%`);
  }
}

async function main() {
  console.log('🚀 Starting CRUD Operations Audit...\n');
  
  const auditor = new CRUDAuditor();
  
  // Run audits
  await auditor.auditBackendControllers();
  await auditor.auditFrontendComponents();
  
  // Generate implementation plan
  const plan = await auditor.generateImplementationPlan();
  
  // Generate summary
  await auditor.generateSummaryReport();
  
  console.log('\n✅ CRUD Audit completed!');
  console.log('\nNext steps:');
  console.log('1. Review the implementation plan above');
  console.log('2. Implement missing controllers and operations');
  console.log('3. Create missing frontend components');
  console.log('4. Test all CRUD operations end-to-end');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CRUDAuditor, main };