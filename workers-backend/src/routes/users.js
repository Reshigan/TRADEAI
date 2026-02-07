import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

export const userRoutes = new Hono();

// Apply auth middleware to all routes
userRoutes.use('*', authMiddleware);

// Get current user profile
userRoutes.get('/profile', async (c) => {
  try {
    const user = c.get('user');
    return c.json({
      success: true,
      data: {
        id: user._id || user.id,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        role: user.role,
        companyId: user.companyId || user.company_id,
        permissions: user.permissions || [],
        lastLogin: user.lastLogin || user.last_login
      }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get profile', error: error.message }, 500);
  }
});

// Update current user profile
userRoutes.put('/profile', async (c) => {
  try {
    const user = c.get('user');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    delete updates.password;
    delete updates.refreshToken;
    delete updates.role;
    delete updates.email;

    const userId = user._id?.$oid || user._id || user.id;
    await mongodb.updateOne('users', { _id: { $oid: userId } }, updates);

    return c.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update profile', error: error.message }, 500);
  }
});

// Change password
userRoutes.put('/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    const user = c.get('user');
    const mongodb = getMongoClient(c);

    if (!currentPassword || !newPassword) {
      return c.json({ success: false, message: 'Current and new passwords are required' }, 400);
    }

    const encoder = new TextEncoder();
    const currentHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(currentPassword)))).map(b => b.toString(16).padStart(2, '0')).join('');

    if (currentHash !== user.password) {
      return c.json({ success: false, message: 'Current password is incorrect' }, 401);
    }

    const newHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(newPassword)))).map(b => b.toString(16).padStart(2, '0')).join('');

    const userId = user._id?.$oid || user._id || user.id;
    await mongodb.updateOne('users', { _id: { $oid: userId } }, {
      password: newHash,
      passwordChangedAt: new Date().toISOString(),
      refreshToken: null
    });

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to change password', error: error.message }, 500);
  }
});

// Get all users (admin only)
userRoutes.get('/', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await mongodb.find('users', filter, {
      projection: { password: 0, refreshToken: 0 },
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    const total = await mongodb.countDocuments('users', filter);

    return c.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ success: false, message: 'Failed to get users', error: error.message }, 500);
  }
});

// Create user (admin only)
userRoutes.post('/', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const userData = await c.req.json();

    // Validate required fields
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return c.json({ success: false, message: 'Email, password, firstName, and lastName are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await mongodb.findOne('users', { email: userData.email.toLowerCase() });
    if (existingUser) {
      return c.json({ success: false, message: 'User with this email already exists' }, 409);
    }

    // Hash password using SHA-256 (Workers-compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(userData.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create user object
    const newUser = {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'kam',
      companyId: tenantId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await mongodb.insertOne('users', newUser);

    // Return user without password
    delete newUser.password;
    newUser._id = result.insertedId;

    return c.json({ success: true, data: newUser, message: 'User created successfully' }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ success: false, message: 'Failed to create user', error: error.message }, 500);
  }
});

// Get user by ID
userRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const mongodb = getMongoClient(c);

    const user = await mongodb.findOne('users', { _id: { $oid: id } }, { password: 0, refreshToken: 0 });

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ success: false, message: 'Failed to get user', error: error.message }, 500);
  }
});

// Update user
userRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const currentUser = c.get('user');
    const mongodb = getMongoClient(c);

    // Users can only update themselves unless admin
    if (id !== (currentUser._id.$oid || currentUser._id) && !['admin', 'superadmin'].includes(currentUser.role)) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }

    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.refreshToken;
    delete updates.role; // Only admins can change roles

    await mongodb.updateOne('users', { _id: { $oid: id } }, updates);

    return c.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ success: false, message: 'Failed to update user', error: error.message }, 500);
  }
});

// Delete user (admin only)
userRoutes.delete('/:id', requireRole('admin', 'superadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('users', { _id: { $oid: id } });

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ success: false, message: 'Failed to delete user', error: error.message }, 500);
  }
});
