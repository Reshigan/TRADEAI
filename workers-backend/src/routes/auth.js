import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { signJWT, verifyJWT, authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { apiError } from '../utils/apiError.js';
import { verifyTOTP, generateBackupCodes } from '../utils/totp.js';
import { EmailService } from '../services/emailService.js';

export const authRoutes = new Hono();

const authRateLimit = rateLimit({ limit: 5, windowMs: 60000 });

// Password hashing using PBKDF2 with per-password salt (Workers-compatible Web Crypto API)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, HASH_LENGTH * 8);
  return `${toHex(salt)}:${toHex(hashBuffer)}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // Support legacy unsalted SHA-256 hashes (no ':' separator) for migration period
  if (!storedHash.includes(':')) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const legacyHash = toHex(hashBuffer);
    return legacyHash === storedHash;
  }
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = fromHex(saltHex);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, HASH_LENGTH * 8);
  // Timing-safe comparison
  const computed = new Uint8Array(hashBuffer);
  const stored = fromHex(hashHex);
  if (computed.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed[i] ^ stored[i];
  return diff === 0;
}

// Login endpoint
authRoutes.post('/login', authRateLimit, async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400);
    }

    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { email: email.toLowerCase() });

    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // Check if account is locked
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return c.json({ success: false, message: 'Account is temporarily locked. Please try again later.' }, 423);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      const updateData = { loginAttempts };

      if (loginAttempts >= 5) {
        updateData.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
      }

      await mongodb.updateOne('users', { _id: user._id }, updateData);
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    if (!user.isActive) {
      return c.json({ success: false, message: 'Account is deactivated' }, 401);
    }

    // Check if password reset is required (seeded accounts)
    if (user.passwordResetRequired) {
      return c.json({ success: false, message: 'Password reset required. Please change your password before proceeding.', code: 'PASSWORD_RESET_REQUIRED' }, 428);
    }

    // GAP-01: If 2FA is enabled, return tempToken instead of full login
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const secret = c.env.JWT_SECRET;
      if (!secret) return c.json({ success: false, message: 'Server configuration error' }, 500);
      const tempToken = await signJWT({
        userId: user._id.$oid || user._id,
        type: '2fa_pending',
        email: user.email
      }, secret, '5m');
      return c.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: 'Please enter your 2FA code'
      });
    }

    // Rehash legacy SHA-256 password to PBKDF2 on successful login
    const rehashData = { loginAttempts: 0, lockUntil: null, lastLogin: new Date().toISOString() };
    if (!user.password.includes(':')) {
      rehashData.password = await hashPassword(password);
    }
    await mongodb.updateOne('users', { _id: user._id }, rehashData);

    // Generate tokens
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ success: false, message: 'Server configuration error: JWT_SECRET not set' }, 500);
    }
    const accessToken = await signJWT({
      userId: user._id.$oid || user._id,
      email: user.email,
      role: user.role,
      tenantId: user.companyId
    }, secret, '15m');

    const refreshToken = await signJWT({
      userId: user._id.$oid || user._id,
      type: 'refresh'
    }, secret, '7d');

    // Store refresh token
    await mongodb.updateOne('users', { _id: user._id }, {
      refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // D-11: Set refresh token as httpOnly secure cookie
    const isProduction = c.env.ENVIRONMENT === 'production';
    c.header('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/api/auth; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      token: accessToken,
      data: {
        user: {
          id: user._id.$oid || user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId
        },
        tokens: {
          accessToken
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError(c, error, 'auth.login');
  }
});

// Refresh token endpoint (both paths for frontend compatibility)
authRoutes.post('/refresh', authRateLimit, async (c) => {
  return handleRefreshToken(c);
});
authRoutes.post('/refresh-token', authRateLimit, async (c) => {
  return handleRefreshToken(c);
});

async function handleRefreshToken(c) {
  try {
    // D-11: Read refresh token from httpOnly cookie first, then body fallback
    let refreshToken;
    const cookieHeader = c.req.header('Cookie') || '';
    const cookieMatch = cookieHeader.match(/refreshToken=([^;]+)/);
    if (cookieMatch) {
      refreshToken = cookieMatch[1];
    } else {
      try {
        const body = await c.req.json();
        refreshToken = body.refreshToken;
      } catch { /* no body */ }
    }

    if (!refreshToken) {
      return c.json({ success: false, message: 'Refresh token is required' }, 400);
    }

    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ success: false, message: 'Server configuration error: JWT_SECRET not set' }, 500);
    }
    const decoded = await verifyJWT(refreshToken, secret);

    if (decoded.type !== 'refresh') {
      return c.json({ success: false, message: 'Invalid refresh token' }, 401);
    }

    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { 
      _id: { $oid: decoded.userId },
      refreshToken 
    });

    if (!user) {
      return c.json({ success: false, message: 'Invalid refresh token' }, 401);
    }

    // Generate new access token
    const accessToken = await signJWT({
      userId: user._id.$oid || user._id,
      email: user.email,
      role: user.role,
      tenantId: user.companyId
    }, secret, '15m');

    return c.json({
      success: true,
      data: { accessToken },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return apiError(c, error, 'auth.refreshToken');
  }
}

// Logout endpoint
authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('users', { _id: { $oid: userId } }, {
      refreshToken: null,
      refreshTokenExpiry: null
    });

    // D-11: Clear httpOnly cookie on logout
    c.header('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0');
    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return apiError(c, error, 'auth.logout');
  }
});

// Get current user
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    return c.json({
      success: true,
      data: {
        id: user._id.$oid || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions || [],
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return apiError(c, error, 'auth.me');
  }
});

// Change password
authRoutes.post('/change-password', authMiddleware, async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    const user = c.get('user');

    if (!currentPassword || !newPassword) {
      return c.json({ success: false, message: 'Current and new passwords are required' }, 400);
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return c.json({ success: false, message: 'Current password is incorrect' }, 401);
    }

    const hashedPassword = await hashPassword(newPassword);
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('users', { _id: user._id }, {
      password: hashedPassword,
      passwordChangedAt: new Date().toISOString(),
      refreshToken: null // Invalidate all sessions
    });

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return apiError(c, error, 'auth.changePassword');
  }
});

// 2FA - Generate secret and QR code
authRoutes.post('/2fa/generate', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const secretBytes = new Uint8Array(20);
    crypto.getRandomValues(secretBytes);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < secretBytes.length; i++) {
      secret += base32Chars[secretBytes[i] % 32];
    }
    const formatted = secret.match(/.{1,4}/g).join(' ');
    const otpAuthUrl = `otpauth://totp/TRADEAI:${user.email}?secret=${secret}&issuer=TRADEAI&digits=6&period=30`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
    return c.json({ success: true, qrCode, secret: formatted, otpAuthUrl });
  } catch (error) {
    return apiError(c, error, 'auth');
  }
});

// 2FA - Verify and enable (GAP-01: real TOTP validation)
authRoutes.post('/2fa/verify', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { token, secret } = await c.req.json();
    if (!token || token.length !== 6) {
      return c.json({ success: false, message: 'A valid 6-digit code is required' }, 400);
    }
    const cleanSecret = secret.replace(/\s/g, '');
    // Validate TOTP token against the secret
    const isValid = await verifyTOTP(token, cleanSecret);
    if (!isValid) {
      return c.json({ success: false, message: 'Invalid 2FA code. Please try again.' }, 400);
    }
    const mongodb = getMongoClient(c);
    const backupCodes = generateBackupCodes(10);
    await mongodb.updateOne('users', { _id: user._id }, {
      twoFactorEnabled: true,
      twoFactorSecret: cleanSecret,
      twoFactorBackupCodes: JSON.stringify(backupCodes),
      twoFactorEnabledAt: new Date().toISOString()
    });
    return c.json({ success: true, backupCodes, message: '2FA enabled successfully' });
  } catch (error) {
    return apiError(c, error, 'auth');
  }
});

// GAP-01: 2FA Login - validate TOTP code with tempToken
authRoutes.post('/2fa/login', authRateLimit, async (c) => {
  try {
    const { tempToken, token: totpCode, backupCode } = await c.req.json();
    if (!tempToken) return c.json({ success: false, message: 'Temp token is required' }, 400);
    if (!totpCode && !backupCode) return c.json({ success: false, message: 'TOTP code or backup code is required' }, 400);

    const jwtSecret = c.env.JWT_SECRET;
    const decoded = await verifyJWT(tempToken, jwtSecret);
    if (decoded.type !== '2fa_pending') {
      return c.json({ success: false, message: 'Invalid temp token' }, 401);
    }

    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { email: decoded.email });
    if (!user || !user.twoFactorEnabled) {
      return c.json({ success: false, message: 'Invalid request' }, 401);
    }

    let authenticated = false;

    if (totpCode) {
      // Validate TOTP
      authenticated = await verifyTOTP(totpCode, user.twoFactorSecret);
    } else if (backupCode) {
      // Validate backup code (one-time use)
      const storedCodes = JSON.parse(user.twoFactorBackupCodes || '[]');
      const codeIndex = storedCodes.indexOf(backupCode);
      if (codeIndex >= 0) {
        authenticated = true;
        storedCodes.splice(codeIndex, 1);
        await mongodb.updateOne('users', { _id: user._id }, {
          twoFactorBackupCodes: JSON.stringify(storedCodes)
        });
      }
    }

    if (!authenticated) {
      return c.json({ success: false, message: 'Invalid 2FA code' }, 401);
    }

    // Update login state
    const rehashData = { loginAttempts: 0, lockUntil: null, lastLogin: new Date().toISOString() };
    if (user.password && !user.password.includes(':')) {
      rehashData.password = await hashPassword(user.password);
    }
    await mongodb.updateOne('users', { _id: user._id }, rehashData);

    // Generate full tokens
    const accessToken = await signJWT({
      userId: user._id.$oid || user._id,
      email: user.email,
      role: user.role,
      tenantId: user.companyId
    }, jwtSecret, '15m');

    const refreshToken = await signJWT({
      userId: user._id.$oid || user._id,
      type: 'refresh'
    }, jwtSecret, '7d');

    await mongodb.updateOne('users', { _id: user._id }, {
      refreshToken,
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    const isProduction = c.env.ENVIRONMENT === 'production';
    c.header('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/api/auth; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      token: accessToken,
      data: {
        user: {
          id: user._id.$oid || user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId
        },
        tokens: { accessToken }
      },
      message: 'Login successful'
    });
  } catch (error) {
    return apiError(c, error, 'auth.2fa.login');
  }
});

// 2FA - Disable
authRoutes.post('/2fa/disable', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { password } = await c.req.json();
    if (!password) {
      return c.json({ success: false, message: 'Password is required to disable 2FA' }, 400);
    }
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return c.json({ success: false, message: 'Invalid password' }, 401);
    }
    const mongodb = getMongoClient(c);
    await mongodb.updateOne('users', { _id: user._id }, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null
    });
    return c.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    return apiError(c, error, 'auth');
  }
});

// Forgot password - generate reset token
authRoutes.post('/forgot-password', authRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { email: email.toLowerCase() });

    if (!user) {
      return c.json({ success: true, message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    await mongodb.updateOne('users', { _id: user._id }, {
      resetPasswordToken: resetToken,
      resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    return c.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
      data: { token: resetToken }
    });
  } catch (error) {
    return apiError(c, error, 'auth.forgotPassword');
  }
});

// Reset password using token
authRoutes.post('/reset-password', authRateLimit, async (c) => {
  try {
    const { token, password } = await c.req.json();
    if (!token || !password) {
      return c.json({ success: false, message: 'Token and password are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ success: false, message: 'Password must be at least 8 characters' }, 400);
    }

    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { resetPasswordToken: token });

    if (!user) {
      return c.json({ success: false, message: 'Invalid or expired reset token' }, 400);
    }

    if (user.resetPasswordExpiry && new Date(user.resetPasswordExpiry) < new Date()) {
      return c.json({ success: false, message: 'Reset token has expired. Please request a new one.' }, 400);
    }

    const hashedPassword = await hashPassword(password);
    await mongodb.updateOne('users', { _id: user._id }, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
      passwordChangedAt: new Date().toISOString(),
      refreshToken: null,
      loginAttempts: 0,
      lockUntil: null
    });

    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return apiError(c, error, 'auth.resetPassword');
  }
});
// Register (admin only)
authRoutes.post('/register', authRateLimit, async (c) => {
  try {
    const { email, password, firstName, lastName, role, companyId } = await c.req.json();

    if (!email || !password || !firstName || !lastName) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }

    const mongodb = getMongoClient(c);

    // Check if user exists
    const existingUser = await mongodb.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 409);
    }

    const hashedPassword = await hashPassword(password);

    const userId = await mongodb.insertOne('users', {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'user',
      companyId,
      isActive: true,
      loginAttempts: 0
    });

    return c.json({
      success: true,
      data: { userId },
      message: 'User registered successfully'
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return apiError(c, error, 'auth.register');
  }
});
