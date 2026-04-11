// D-09: Sanitized error response utility
// Prevents leaking internal D1/SQL error details to API consumers

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  D1_ERROR: 'D1_ERROR',
  AI_ERROR: 'AI_ERROR'
};

const SAFE_MESSAGES = new Set([
  'Not found',
  'Budget insufficient',
  'Validation failed',
  'Invalid credentials',
  'Account is deactivated',
  'Account is temporarily locked. Please try again later.',
  'Authentication required',
  'Insufficient permissions',
  'Too many requests. Please try again later.',
  'Email and password are required',
  'Password reset required. Please change your password before proceeding.',
  'Invalid or expired token',
  'Invalid or expired refresh token',
  'Email already exists',
  'User not found',
  'Company not found',
  'Budget not found',
  'Promotion not found',
  'Customer not found',
  'Claim not found',
  'Settlement not found',
  'Deduction not found',
  'Trade spend not found',
  'Rebate not found',
  'Campaign not found',
  'Vendor not found',
  'Workflow not found',
  'Template not found',
  'Record not found',
  'Duplicate entry',
  'Start date must be before end date',
  'Amount must be positive',
  'Invalid status transition',
  'Approval already processed',
  'Cannot modify approved record',
  'Insufficient budget',
  'Budget exceeded',
  'Tenant context not found'
]);

function isSafeMessage(msg) {
  if (!msg || typeof msg !== 'string') return false;
  // Check exact matches
  if (SAFE_MESSAGES.has(msg)) return true;
  // Check safe prefixes
  if (msg.startsWith('Validation failed')) return true;
  if (msg.startsWith('Budget ') && (msg.includes('insufficient') || msg.includes('exceeded'))) return true;
  if (msg.endsWith(' not found')) return true;
  if (msg.startsWith('Invalid ') && !msg.includes('SQL') && !msg.includes('D1') && !msg.includes('table')) return true;
  return false;
}

export function apiError(c, error, context = 'unknown') {
  const message = error?.message || '';
  const safeMessage = isSafeMessage(message) ? message : 'An internal error occurred';
  const status = error?.status || 500;

  // Map status to error code
  let code = ErrorCodes.INTERNAL_ERROR;
  if (status === 400) code = ErrorCodes.VALIDATION_ERROR;
  else if (status === 401) code = ErrorCodes.UNAUTHORIZED;
  else if (status === 403) code = ErrorCodes.FORBIDDEN;
  else if (status === 404) code = ErrorCodes.NOT_FOUND;
  else if (status === 409) code = ErrorCodes.CONFLICT;
  else if (status === 429) code = ErrorCodes.RATE_LIMITED;
  else if (message.includes('D1') || message.includes('SQL')) code = ErrorCodes.D1_ERROR;
  else if (context === 'ai') code = ErrorCodes.AI_ERROR;

  // Log full error for debugging (structured logging will capture this)
  if (typeof console !== 'undefined') {
    console.error(JSON.stringify({
      level: 'error',
      requestId: c.get('requestId'),
      context,
      message: message,
      stack: error?.stack?.substring(0, 500)
    }));
  }

  return c.json({
    success: false,
    error: {
      code: code,
      message: safeMessage,
      details: error?.details || {}
    }
  }, status >= 400 && status < 600 ? status : 500);
}
