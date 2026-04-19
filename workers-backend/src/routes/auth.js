import { Hono } from 'hono';
import { getD1Client, rowToDocument } from '../services/d1.js';
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

    const db = getD1Client(c);
    
    // Find user by email
    const result = await db.rawExecute(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    
    if (!result.results || result.results.length === 0) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }
    
    const user = rowToDocument(result.results[0]);
    const userId = user.id;

    // Check if account is locked
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return c.json({ success: false, message: 'Account is temporarily locked. Please try again later.' }, 423);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      const updateData = { login_attempts: loginAttempts };

      if (loginAttempts >= 5) {
        updateData.lock_until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      }

      await db.rawExecute(
        "UPDATE users SET login_attempts = ?, lock_until = ? WHERE id = ?",
        [loginAttempts, updateData.lock_until || null, userId]
      );
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
        userId: userId,
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
    const updateFields = ['login_attempts = 0', 'lock_until = NULL', `last_login = '${new Date().toISOString()}'`];
    const params = [];
    if (!user.password.includes(':')) {
      const newHash = await hashPassword(password);
      updateFields.push('password = ?');
      params.push(newHash);
    }
    params.push(userId);
    await db.rawExecute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    // Generate tokens
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ success: false, message: 'Server configuration error: JWT_SECRET not set' }, 500);
    }
    const accessToken = await signJWT({
      userId: userId,
      email: user.email,
      role: user.role,
      tenantId: user.companyId
    }, secret, '15m');

    const refreshToken = await signJWT({
      userId: userId,
      type: 'refresh'
    }, secret, '7d');

    // Store refresh token
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.rawExecute(
      "UPDATE users SET refresh_token = ?, refresh_token_expiry = ? WHERE id = ?",
      [refreshToken, refreshExpiry, userId]
    );

    // D-11: Set refresh token as httpOnly secure cookie
    const isProduction = c.env.ENVIRONMENT === 'production';
    c.header('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/api/auth; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      token: accessToken,
      data: {
        user: {
          id: userId,
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

    const db = getD1Client(c);
    const result = await db.rawExecute(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.userId, refreshToken]
    );

    if (!result.results || result.results.length === 0) {
      return c.json({ success: false, message: 'Invalid refresh token' }, 401);
    }

    const user = rowToDocument(result.results[0]);

    // Generate new access token
    const accessToken = await signJWT({
      userId: user.id,
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
    const db = getD1Client(c);

    await db.rawExecute(
      "UPDATE users SET refresh_token = NULL, refresh_token_expiry = NULL WHERE id = ?",
      [userId]
    );

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
        id: user.id,
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
    const db = getD1Client(c);

    await db.rawExecute(
      "UPDATE users SET password = ?, password_changed_at = ?, refresh_token = NULL, refresh_token_expiry = NULL WHERE id = ?",
      [hashedPassword, new Date().toISOString(), user.id]
    );

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
    const db = getD1Client(c);
    const backupCodes = generateBackupCodes(10);
    await db.rawExecute(
      "UPDATE users SET two_factor_enabled = 1, two_factor_secret = ?, two_factor_backup_codes = ?, two_factor_enabled_at = ? WHERE id = ?",
      [cleanSecret, JSON.stringify(backupCodes), new Date().toISOString(), user.id]
    );
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

    const db = getD1Client(c);
    const result = await db.rawExecute(
      "SELECT * FROM users WHERE email = ?",
      [decoded.email]
    );
    if (!result.results || result.results.length === 0 || !result.results[0].two_factor_enabled) {
      return c.json({ success: false, message: 'Invalid request' }, 401);
    }
    const user = rowToDocument(result.results[0]);

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
        await db.rawExecute(
          "UPDATE users SET two_factor_backup_codes = ? WHERE id = ?",
          [JSON.stringify(storedCodes), user.id]
        );
      }
    }

    if (!authenticated) {
      return c.json({ success: false, message: 'Invalid 2FA code' }, 401);
    }

    // Update login state
    const loginUpdates = { login_attempts: 0, lock_until: null, last_login: new Date().toISOString() };
    if (user.password && !user.password.includes(':')) {
      loginUpdates.password = await hashPassword(user.password);
    }
    
    // Build UPDATE query dynamically
    const updateFields = Object.keys(loginUpdates).map(k => `${k} = ?`).join(', ');
    const updateValues = [...Object.values(loginUpdates), user.id];
    await db.rawExecute(
      `UPDATE users SET ${updateFields} WHERE id = ?`,
      updateValues
    );

    // Generate full tokens
    const accessToken = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.companyId
    }, jwtSecret, '15m');

    const refreshToken = await signJWT({
      userId: user.id,
      type: 'refresh'
    }, jwtSecret, '7d');

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await db.rawExecute(
      "UPDATE users SET refresh_token = ?, refresh_token_expiry = ? WHERE id = ?",
      [refreshToken, refreshExpiry, user.id]
    );

    const isProduction = c.env.ENVIRONMENT === 'production';
    c.header('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/api/auth; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      token: accessToken,
      data: {
        user: {
          id: user.id,
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
    const db = getD1Client(c);
    await db.rawExecute(
      "UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?",
      [user.id]
    );
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

    const db = getD1Client(c);
    const result = await db.rawExecute(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    const user = result.results && result.results.length > 0 ? rowToDocument(result.results[0]) : null;

    if (!user) {
      return c.json({ success: true, message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    await db.rawExecute(
      "UPDATE users SET reset_password_token = ?, reset_password_expiry = ? WHERE id = ?",
      [resetToken, new Date(Date.now() + 60 * 60 * 1000).toISOString(), user.id]
    );

    // Send password reset email via configured provider (Microsoft Graph / Resend / SendGrid)
    const emailService = new EmailService(c.env);
    const frontendUrl = c.env.FRONTEND_URL || 'https://tradeai.vantax.co.za';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const emailSent = await emailService.sendPasswordReset(email, {
      firstName: user.firstName || 'User',
      resetUrl,
      token: resetToken,
    });

    if (!emailSent) {
      console.error(JSON.stringify({ level: 'error', action: 'password_reset_email_failed', email: email.toLowerCase() }));
    }

    return c.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
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

    const db = getD1Client(c);
    const result = await db.rawExecute(
      "SELECT * FROM users WHERE reset_password_token = ?",
      [token]
    );
    const user = result.results && result.results.length > 0 ? rowToDocument(result.results[0]) : null;

    if (!user) {
      return c.json({ success: false, message: 'Invalid or expired reset token' }, 400);
    }

    if (user.resetPasswordExpiry && new Date(user.resetPasswordExpiry) < new Date()) {
      return c.json({ success: false, message: 'Reset token has expired. Please request a new one.' }, 400);
    }

    const hashedPassword = await hashPassword(password);
    await db.rawExecute(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expiry = NULL, password_changed_at = ?, refresh_token = NULL, refresh_token_expiry = NULL, login_attempts = 0, lock_until = NULL WHERE id = ?",
      [hashedPassword, new Date().toISOString(), user.id]
    );

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

    const db = getD1Client(c);

    // Check if user exists
    const existingResult = await db.rawExecute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (existingResult.results && existingResult.results.length > 0) {
      return c.json({ success: false, message: 'User already exists' }, 409);
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateId();
    const now = new Date().toISOString();

    await db.rawExecute(
      `INSERT INTO users (id, company_id, email, password, first_name, last_name, role, is_active, login_attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [userId, companyId || null, email.toLowerCase(), hashedPassword, firstName, lastName, role || 'user', now, now]
    );

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
