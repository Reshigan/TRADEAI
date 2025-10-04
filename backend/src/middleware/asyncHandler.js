/**
 * Async handler middleware to wrap async route handlers
 * and catch any errors, passing them to the error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
module.exports.asyncHandler = asyncHandler;