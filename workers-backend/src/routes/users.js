import { Hono } from 'hono';
import { getMongoClient } from '../services/mongodb.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

export const userRoutes = new Hono();

// Apply auth middleware to all routes
userRoutes.use('*', authMiddleware);

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
