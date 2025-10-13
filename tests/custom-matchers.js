// TRADEAI v2.0 - Custom Jest Matchers for Enhanced Testing

expect.extend({
  // Custom matcher for API responses
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 received.hasOwnProperty('success') &&
                 received.hasOwnProperty('data');
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid API response with 'success' and 'data' properties`,
        pass: false,
      };
    }
  },

  // Custom matcher for MongoDB ObjectIds
  toBeValidObjectId(received) {
    const ObjectId = require('mongoose').Types.ObjectId;
    const pass = ObjectId.isValid(received);
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },

  // Custom matcher for JWT tokens
  toBeValidJWT(received) {
    const jwt = require('jsonwebtoken');
    try {
      jwt.decode(received);
      return {
        message: () => `Expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },

  // Custom matcher for React components
  toRenderWithoutErrors(received) {
    const { render } = require('@testing-library/react');
    try {
      render(received);
      return {
        message: () => `Expected component to throw an error during rendering`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected component to render without errors, but got: ${error.message}`,
        pass: false,
      };
    }
  },

  // Custom matcher for HTTP status codes
  toHaveHttpStatus(received, expected) {
    const pass = received.status === expected;
    
    if (pass) {
      return {
        message: () => `Expected response not to have status ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected response to have status ${expected}, but got ${received.status}`,
        pass: false,
      };
    }
  },

  // Custom matcher for database records
  toExistInDatabase(received, model) {
    return new Promise(async (resolve) => {
      try {
        const record = await model.findById(received);
        if (record) {
          resolve({
            message: () => `Expected record ${received} not to exist in database`,
            pass: true,
          });
        } else {
          resolve({
            message: () => `Expected record ${received} to exist in database`,
            pass: false,
          });
        }
      } catch (error) {
        resolve({
          message: () => `Error checking database: ${error.message}`,
          pass: false,
        });
      }
    });
  },

  // Custom matcher for form validation
  toHaveValidationError(received, field) {
    const pass = received.errors && 
                 received.errors[field] && 
                 received.errors[field].length > 0;
    
    if (pass) {
      return {
        message: () => `Expected form not to have validation error for field '${field}'`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected form to have validation error for field '${field}'`,
        pass: false,
      };
    }
  },

  // Custom matcher for accessibility
  toBeAccessible(received) {
    const { axe } = require('jest-axe');
    return axe(received).then(results => {
      const pass = results.violations.length === 0;
      
      if (pass) {
        return {
          message: () => `Expected element to have accessibility violations`,
          pass: true,
        };
      } else {
        return {
          message: () => `Expected element to be accessible, but found ${results.violations.length} violations`,
          pass: false,
        };
      }
    });
  },

  // Custom matcher for performance
  toCompleteWithinTime(received, maxTime) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      Promise.resolve(received).then(() => {
        const executionTime = Date.now() - startTime;
        const pass = executionTime <= maxTime;
        
        if (pass) {
          resolve({
            message: () => `Expected operation to take longer than ${maxTime}ms, but completed in ${executionTime}ms`,
            pass: true,
          });
        } else {
          resolve({
            message: () => `Expected operation to complete within ${maxTime}ms, but took ${executionTime}ms`,
            pass: false,
          });
        }
      }).catch((error) => {
        resolve({
          message: () => `Operation failed with error: ${error.message}`,
          pass: false,
        });
      });
    });
  },

  // Custom matcher for memory usage
  toNotExceedMemoryLimit(received, limitMB) {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const pass = heapUsedMB <= limitMB;
    
    if (pass) {
      return {
        message: () => `Expected memory usage to exceed ${limitMB}MB, but used ${heapUsedMB.toFixed(2)}MB`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected memory usage not to exceed ${limitMB}MB, but used ${heapUsedMB.toFixed(2)}MB`,
        pass: false,
      };
    }
  }
});