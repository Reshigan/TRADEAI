/**
 * Async handler middleware to wrap async route handlers
 * and catch any errors, passing them to the error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export as default (for: require('...'))
module.exports = asyncHandler;
// Also export as named export (for: const { asyncHandler } = require('...'))
module.exports.asyncHandler = asyncHandler;