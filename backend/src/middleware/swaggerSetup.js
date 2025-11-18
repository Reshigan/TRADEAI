const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

// Swagger JSDoc options for inline documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Trade AI Platform API',
      version: '2.0.0',
      description: 'Comprehensive API for the Trade AI Platform'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../models/*.js')
  ]
};

// Generate specs from JSDoc comments
const specs = swaggerJsdoc(swaggerOptions);

// Merge with main OpenAPI document
const mergedSpecs = {
  ...swaggerDocument,
  paths: {
    ...swaggerDocument.paths,
    ...specs.paths
  },
  components: {
    ...swaggerDocument.components,
    ...specs.components
  }
};

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 50px 0 }
  .swagger-ui .info .title { color: #2c3e50 }
  .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 5px }
  .swagger-ui .btn.authorize { background-color: #3498db; border-color: #3498db }
  .swagger-ui .btn.authorize:hover { background-color: #2980b9; border-color: #2980b9 }
`;

// Swagger UI options
const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'Trade AI API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// Setup function to configure Swagger middleware
const setupSwagger = (app) => {
  // Serve API documentation at /api-docs
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(mergedSpecs, swaggerUiOptions));

  // Serve raw OpenAPI spec at /api-docs/json
  app.get('/api-docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(mergedSpecs);
  });

  // Serve raw OpenAPI spec at /api-docs/yaml
  app.get('/api-docs/yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(YAML.stringify(mergedSpecs, 4));
  });

  // Health check endpoint for API documentation
  app.get('/api-docs/health', (req, res) => {
    res.json({
      status: 'healthy',
      documentation: {
        swagger: '/api-docs',
        json: '/api-docs/json',
        yaml: '/api-docs/yaml'
      },
      timestamp: new Date().toISOString()
    });
  });

  console.log('📚 API Documentation available at /api-docs');
  console.log('📄 OpenAPI JSON spec available at /api-docs/json');
  console.log('📄 OpenAPI YAML spec available at /api-docs/yaml');
};

// Validation middleware for API requests
const validateApiRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

// Generate API documentation from routes
const generateRouteDocumentation = (routes) => {
  const documentation = {
    endpoints: [],
    totalEndpoints: 0,
    endpointsByMethod: {},
    endpointsByTag: {}
  };

  routes.forEach((route) => {
    const { method, path, description, tags = [] } = route;

    documentation.endpoints.push({
      method: method.toUpperCase(),
      path,
      description,
      tags
    });

    // Count by method
    documentation.endpointsByMethod[method.toUpperCase()] =
      (documentation.endpointsByMethod[method.toUpperCase()] || 0) + 1;

    // Count by tag
    tags.forEach((tag) => {
      documentation.endpointsByTag[tag] =
        (documentation.endpointsByTag[tag] || 0) + 1;
    });
  });

  documentation.totalEndpoints = documentation.endpoints.length;
  return documentation;
};

// API versioning helper
const createVersionedSpec = (version, baseSpec) => {
  return {
    ...baseSpec,
    info: {
      ...baseSpec.info,
      version
    },
    servers: baseSpec.servers.map((server) => ({
      ...server,
      url: server.url.replace('/api', `/api/v${version}`)
    }))
  };
};

// Export utilities
module.exports = {
  setupSwagger,
  validateApiRequest,
  generateRouteDocumentation,
  createVersionedSpec,
  swaggerDocument: mergedSpecs,
  swaggerOptions,
  swaggerUiOptions
};
