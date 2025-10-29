const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken
} = require('../../../utils/jwt');

describe('JWT Utilities Tests', () => {
  const mockUser = {
    _id: 'user123',
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    tenant: 'tenant123'
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = { id: 'user123', email: 'test@example.com' };
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const payload = { id: 'user123', email: 'test@example.com', role: 'admin' };
      const token = generateAccessToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should include issuer and audience', () => {
      const payload = { id: 'user123' };
      const token = generateAccessToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.iss).toBe('tradeai-api');
      expect(decoded.aud).toBe('tradeai-client');
    });

    it('should have expiration time', () => {
      const payload = { id: 'user123' };
      const token = generateAccessToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = { id: 'user123' };
      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should have longer expiration than access token', () => {
      const payload = { id: 'user123' };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      const accessExpiry = accessDecoded.exp - accessDecoded.iat;
      const refreshExpiry = refreshDecoded.exp - refreshDecoded.iat;

      expect(refreshExpiry).toBeGreaterThan(accessExpiry);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = { id: 'user123', email: 'test@example.com' };
      const token = generateAccessToken(payload);

      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for token with wrong issuer', () => {
      const wrongToken = jwt.sign(
        { id: 'user123' },
        process.env.JWT_SECRET || 'default-secret-change-this',
        { issuer: 'wrong-issuer', expiresIn: '24h' }
      );

      expect(() => {
        verifyAccessToken(wrongToken);
      }).toThrow();
    });

    it('should throw error for token with wrong audience', () => {
      const wrongToken = jwt.sign(
        { id: 'user123' },
        process.env.JWT_SECRET || 'default-secret-change-this',
        { audience: 'wrong-audience', issuer: 'tradeai-api', expiresIn: '24h' }
      );

      expect(() => {
        verifyAccessToken(wrongToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'user123' },
        process.env.JWT_SECRET || 'default-secret-change-this',
        {
          expiresIn: '-1h', // Already expired
          issuer: 'tradeai-api',
          audience: 'tradeai-client'
        }
      );

      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const payload = { id: 'user123' };
      const token = generateRefreshToken(payload);

      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken({ id: 'user123' });

      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
    });

    it('should include user data in access token', () => {
      const tokens = generateTokenPair(mockUser);
      const decoded = jwt.decode(tokens.accessToken);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.tenant).toBe(mockUser.tenant);
    });

    it('should include only user ID in refresh token', () => {
      const tokens = generateTokenPair(mockUser);
      const decoded = jwt.decode(tokens.refreshToken);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBeUndefined();
      expect(decoded.role).toBeUndefined();
    });

    it('should work with user.id instead of user._id', () => {
      const userWithId = { ...mockUser, _id: undefined };
      const tokens = generateTokenPair(userWithId);
      const decoded = jwt.decode(tokens.accessToken);

      expect(decoded.id).toBe(mockUser.id);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = { id: 'user123', email: 'test@example.com' };
      const token = generateAccessToken(payload);

      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.payload.id).toBe(payload.id);
      expect(decoded.payload.email).toBe(payload.email);
    });

    it('should decode expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'user123' },
        'secret',
        { expiresIn: '0s' }
      );

      // decodeToken should work even for expired tokens
      const decoded = decodeToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded.payload.id).toBe('user123');
    });

    it('should return header, payload, and signature', () => {
      const token = generateAccessToken({ id: 'user123' });
      const decoded = decodeToken(token);

      expect(decoded).toHaveProperty('header');
      expect(decoded).toHaveProperty('payload');
      expect(decoded).toHaveProperty('signature');
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('Token Expiration - 24h Default', () => {
    it('should default to 24 hours for access token', () => {
      const payload = { id: 'user123' };
      const token = generateAccessToken(payload);
      const decoded = jwt.decode(token);

      const expiryTime = decoded.exp - decoded.iat;
      const hours = expiryTime / 3600;

      // Should be approximately 24 hours
      expect(hours).toBeGreaterThan(23);
      expect(hours).toBeLessThanOrEqual(24);
    });

    it('should default to 7 days for refresh token', () => {
      const payload = { id: 'user123' };
      const token = generateRefreshToken(payload);
      const decoded = jwt.decode(token);

      const expiryTime = decoded.exp - decoded.iat;
      const days = expiryTime / (3600 * 24);

      // Should be approximately 7 days
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThanOrEqual(7);
    });
  });

  describe('Token Security', () => {
    it('should generate different tokens for same payload', () => {
      const payload = { id: 'user123' };
      
      const token1 = generateAccessToken(payload);
      // Wait 1 second to ensure different iat timestamp
      const start = Date.now();
      while (Date.now() - start < 1100) {
        // Busy wait
      }
      const token2 = generateAccessToken(payload);
      
      expect(token1).not.toBe(token2);
    });

    it('should not include sensitive data in token', () => {
      const user = {
        ...mockUser,
        password: 'secret123',
        passwordResetToken: 'reset-token'
      };

      const tokens = generateTokenPair(user);
      const decoded = jwt.decode(tokens.accessToken);

      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordResetToken).toBeUndefined();
    });
  });
});
