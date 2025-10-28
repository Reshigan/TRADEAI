const { protect, restrictTo, optionalAuth } = require('../../../middleware/auth');
const { generateAccessToken } = require('../../../utils/jwt');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should reject request with no token', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract token from Authorization header', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        changedPasswordAfter: jest.fn().mockReturnValue(false)
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should extract token from cookies', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        changedPasswordAfter: jest.fn().mockReturnValue(false)
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.cookies.token = token;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Create an expired token (this will throw TokenExpiredError when verified)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';
      
      req.headers.authorization = `Bearer ${expiredToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if user not found', async () => {
      const token = generateAccessToken({
        id: 'nonexistent',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found or token is invalid'
      });
    });

    it('should reject if user is inactive', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: false,
        isLocked: false
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User account is deactivated'
      });
    });

    it('should reject if user is locked', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: true
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account is locked due to multiple failed login attempts'
      });
    });

    it('should reject if password changed after token issued', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        changedPasswordAfter: jest.fn().mockReturnValue(true)
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password was recently changed. Please log in again.'
      });
    });
  });

  describe('restrictTo middleware', () => {
    it('should allow access to authorized role', () => {
      req.user = { role: 'admin' };
      const middleware = restrictTo('admin', 'superadmin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthorized role', () => {
      req.user = { role: 'user' };
      const middleware = restrictTo('admin', 'superadmin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to perform this action'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject if no user in request', () => {
      const middleware = restrictTo('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should continue without user if no token', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should attach user if valid token provided', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isActive: true
      };

      const token = generateAccessToken({
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      });

      req.headers.authorization = `Bearer ${token}`;
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
