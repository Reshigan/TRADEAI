const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EnhancedAuthService = require('../../../services/enhanced-auth.service');
const User = require('../../../models/User');
const RefreshToken = require('../../../models/RefreshToken');
const ActiveSession = require('../../../models/ActiveSession');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../models/User');
jest.mock('../../../models/RefreshToken');
jest.mock('../../../models/ActiveSession');

describe('EnhancedAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        organization: 'TestOrg'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const mockUser = {
        _id: 'user123',
        ...userData,
        password: 'hashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };
      User.mockImplementation(() => mockUser);

      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      const mockRefreshToken = {
        save: jest.fn().mockResolvedValue(true)
      };
      RefreshToken.mockImplementation(() => mockRefreshToken);

      const mockSession = {
        save: jest.fn().mockResolvedValue(true)
      };
      ActiveSession.mockImplementation(() => mockSession);

      const result = await EnhancedAuthService.register(userData, '127.0.0.1', 'Test Agent');

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('email', userData.email);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      User.findOne.mockResolvedValue({ email: userData.email });

      await expect(
        EnhancedAuthService.register(userData, '127.0.0.1', 'Test Agent')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: 'user123',
        email: credentials.email,
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      const mockRefreshToken = {
        save: jest.fn().mockResolvedValue(true)
      };
      RefreshToken.mockImplementation(() => mockRefreshToken);

      const mockSession = {
        save: jest.fn().mockResolvedValue(true)
      };
      ActiveSession.mockImplementation(() => mockSession);

      const result = await EnhancedAuthService.login(credentials, '127.0.0.1', 'Test Agent');

      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('email', credentials.email);
    });

    it('should throw error with invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        EnhancedAuthService.login({ email: 'invalid@example.com', password: 'test' }, '127.0.0.1', 'Test Agent')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: true
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        EnhancedAuthService.login({ email: 'test@example.com', password: 'wrong' }, '127.0.0.1', 'Test Agent')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const userId = 'user123';
      const accessToken = 'validToken';

      jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      RefreshToken.deleteMany.mockResolvedValue({ deletedCount: 1 });
      ActiveSession.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await EnhancedAuthService.logout(userId, accessToken);

      expect(RefreshToken.deleteMany).toHaveBeenCalledWith({ userId });
      expect(ActiveSession.deleteMany).toHaveBeenCalledWith({ userId });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = 'validToken';
      const decoded = { userId: 'user123' };

      jwt.verify.mockReturnValue(decoded);

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await EnhancedAuthService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('valid', true);
    });

    it('should return invalid for expired token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await EnhancedAuthService.verifyToken('expiredToken');

      expect(result).toHaveProperty('valid', false);
    });
  });
});
