import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { signJWT, verifyJWT, authMiddleware } from '../middleware/auth.js';

export const authRoutes = new Hono();

// Password hashing using Web Crypto API (bcrypt alternative for Workers)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Login endpoint
authRoutes.post('/login', async (c) => {
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

    // Reset login attempts on successful login
    await mongodb.updateOne('users', { _id: user._id }, {
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date().toISOString()
    });

    // Generate tokens
    const secret = c.env.JWT_SECRET || 'your-secret-key';
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

    return c.json({
      success: true,
      data: {
        user: {
          id: user._id.$oid || user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId
        },
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed', error: error.message }, 500);
  }
});

// Refresh token endpoint
authRoutes.post('/refresh-token', async (c) => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json({ success: false, message: 'Refresh token is required' }, 400);
    }

    const secret = c.env.JWT_SECRET || 'your-secret-key';
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
    return c.json({ success: false, message: 'Token refresh failed', error: error.message }, 401);
  }
});

// Logout endpoint
authRoutes.post('/logout', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('users', { _id: { $oid: userId } }, {
      refreshToken: null,
      refreshTokenExpiry: null
    });

    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, message: 'Logout failed', error: error.message }, 500);
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
    return c.json({ success: false, message: 'Failed to get user', error: error.message }, 500);
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
    return c.json({ success: false, message: 'Failed to change password', error: error.message }, 500);
  }
});

// Register (admin only)
authRoutes.post('/register', async (c) => {
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
    return c.json({ success: false, message: 'Registration failed', error: error.message }, 500);
  }
});
