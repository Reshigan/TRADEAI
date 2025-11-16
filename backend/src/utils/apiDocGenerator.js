const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

class ApiDocGenerator {
  constructor() {
    this.routes = [];
    this.schemas = new Map();
    this.examples = new Map();
  }

  // Register a route for documentation
  registerRoute(config) {
    const {
      method,
      path: routePath,
      summary,
      description,
      tags = [],
      parameters = [],
      requestBody,
      responses = {},
      security = true,
      deprecated = false
    } = config;

    this.routes.push({
      method: method.toLowerCase(),
      path: routePath,
      summary,
      description,
      tags,
      parameters,
      requestBody,
      responses,
      security,
      deprecated
    });
  }

  // Register a schema for reuse
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  // Register an example
  registerExample(name, example) {
    this.examples.set(name, example);
  }

  // Generate OpenAPI paths from registered routes
  generatePaths() {
    const paths = {};

    this.routes.forEach((route) => {
      const { method, path: routePath, ...routeConfig } = route;

      if (!paths[routePath]) {
        paths[routePath] = {};
      }

      // Build operation object
      const operation = {
        summary: routeConfig.summary,
        description: routeConfig.description,
        tags: routeConfig.tags,
        parameters: routeConfig.parameters,
        responses: this.buildResponses(routeConfig.responses)
      };

      // Add request body if present
      if (routeConfig.requestBody) {
        operation.requestBody = routeConfig.requestBody;
      }

      // Add security if required
      if (routeConfig.security) {
        operation.security = [{ bearerAuth: [] }];
      } else {
        operation.security = [];
      }

      // Mark as deprecated if needed
      if (routeConfig.deprecated) {
        operation.deprecated = true;
      }

      paths[routePath][method] = operation;
    });

    return paths;
  }

  // Build standardized responses
  buildResponses(customResponses = {}) {
    const standardResponses = {
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '403': {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    };

    return { ...customResponses, ...standardResponses };
  }

  // Generate complete OpenAPI specification
  generateSpec(baseInfo = {}) {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'Trade AI Platform API',
        version: '2.0.0',
        description: 'Comprehensive API for the Trade AI Platform',
        ...baseInfo
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      security: [{ bearerAuth: [] }],
      paths: this.generatePaths(),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: Object.fromEntries(this.schemas),
        examples: Object.fromEntries(this.examples)
      }
    };

    return spec;
  }

  // Save specification to file
  saveSpec(filePath, format = 'yaml') {
    const spec = this.generateSpec();
    const dir = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (format === 'yaml') {
      fs.writeFileSync(filePath, YAML.stringify(spec, 4));
    } else {
      fs.writeFileSync(filePath, JSON.stringify(spec, null, 2));
    }

    console.log(`API specification saved to ${filePath}`);
  }

  // Generate documentation statistics
  getStats() {
    const stats = {
      totalRoutes: this.routes.length,
      routesByMethod: {},
      routesByTag: {},
      totalSchemas: this.schemas.size,
      totalExamples: this.examples.size,
      securedRoutes: this.routes.filter((r) => r.security).length,
      deprecatedRoutes: this.routes.filter((r) => r.deprecated).length
    };

    // Count by method
    this.routes.forEach((route) => {
      const method = route.method.toUpperCase();
      stats.routesByMethod[method] = (stats.routesByMethod[method] || 0) + 1;
    });

    // Count by tag
    this.routes.forEach((route) => {
      route.tags.forEach((tag) => {
        stats.routesByTag[tag] = (stats.routesByTag[tag] || 0) + 1;
      });
    });

    return stats;
  }

  // Validate route configuration
  validateRoute(config) {
    const required = ['method', 'path', 'summary'];
    const missing = required.filter((field) => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    const validMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    if (!validMethods.includes(config.method.toLowerCase())) {
      throw new Error(`Invalid HTTP method: ${config.method}`);
    }

    return true;
  }

  // Generate route from Express route object
  generateFromExpressRoute(expressRoute) {
    const { method, path: routePath, stack } = expressRoute;

    // Extract handler information
    const handlers = stack.map((layer) => layer.handle);
    const lastHandler = handlers[handlers.length - 1];

    // Try to extract documentation from handler
    const docs = lastHandler.apiDocs || {};

    return {
      method: method.toLowerCase(),
      path: routePath,
      summary: docs.summary || `${method.toUpperCase()} ${routePath}`,
      description: docs.description || '',
      tags: docs.tags || ['Undocumented'],
      parameters: docs.parameters || [],
      requestBody: docs.requestBody,
      responses: docs.responses || {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      },
      security: docs.security !== false,
      deprecated: docs.deprecated || false
    };
  }

  // Auto-generate documentation from Express app
  generateFromExpressApp(app) {
    const routes = [];

    // Extract routes from Express app
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // Direct route
        const route = this.generateFromExpressRoute(middleware.route);
        routes.push(route);
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach((routerLayer) => {
          if (routerLayer.route) {
            const route = this.generateFromExpressRoute(routerLayer.route);
            routes.push(route);
          }
        });
      }
    });

    // Register all found routes
    routes.forEach((route) => {
      this.registerRoute(route);
    });

    return routes;
  }

  // Generate Postman collection
  generatePostmanCollection() {
    const collection = {
      info: {
        name: 'Trade AI Platform API',
        description: 'API collection for Trade AI Platform',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000/api',
          type: 'string'
        },
        {
          key: 'authToken',
          value: '',
          type: 'string'
        }
      ],
      item: []
    };

    // Group routes by tags
    const routesByTag = {};
    this.routes.forEach((route) => {
      route.tags.forEach((tag) => {
        if (!routesByTag[tag]) {
          routesByTag[tag] = [];
        }
        routesByTag[tag].push(route);
      });
    });

    // Create folders for each tag
    Object.entries(routesByTag).forEach(([tag, routes]) => {
      const folder = {
        name: tag,
        item: routes.map((route) => ({
          name: route.summary,
          request: {
            method: route.method.toUpperCase(),
            header: [],
            url: {
              raw: `{{baseUrl}}${route.path}`,
              host: ['{{baseUrl}}'],
              path: route.path.split('/').filter((p) => p)
            },
            description: route.description
          }
        }))
      };

      collection.item.push(folder);
    });

    return collection;
  }

  // Save Postman collection
  savePostmanCollection(filePath) {
    const collection = this.generatePostmanCollection();
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    console.log(`Postman collection saved to ${filePath}`);
  }
}

// Create singleton instance
const apiDocGenerator = new ApiDocGenerator();

// Register common schemas
apiDocGenerator.registerSchema('Error', {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error message'
    },
    code: {
      type: 'string',
      description: 'Error code'
    },
    details: {
      type: 'object',
      description: 'Additional error details'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Error timestamp'
    }
  },
  required: ['error']
});

apiDocGenerator.registerSchema('Pagination', {
  type: 'object',
  properties: {
    currentPage: {
      type: 'integer',
      minimum: 1
    },
    totalPages: {
      type: 'integer',
      minimum: 0
    },
    totalCount: {
      type: 'integer',
      minimum: 0
    },
    hasNext: {
      type: 'boolean'
    },
    hasPrev: {
      type: 'boolean'
    }
  }
});

// Export the generator and utilities
module.exports = {
  ApiDocGenerator,
  apiDocGenerator
};
