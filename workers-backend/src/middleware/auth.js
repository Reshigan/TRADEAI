import { getMongoClient } from '../services/mongodb.js';

// JWT verification for Cloudflare Workers
// Using Web Crypto API instead of jsonwebtoken

async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

async function signJWT(payload, secret, expiresIn = '15m') {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // Calculate expiration
  let exp;
  if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      exp = Math.floor(Date.now() / 1000) + value * multipliers[unit];
    }
  } else {
    exp = Math.floor(Date.now() / 1000) + expiresIn;
  }

  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Authentication middleware
export async function authMiddleware(c, next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET || 'your-secret-key';

    const decoded = await verifyJWT(token, secret);
    
    // Get user from database
    const mongodb = getMongoClient(c);
    const user = await mongodb.findOne('users', { _id: { $oid: decoded.userId } });

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 401);
    }

    if (!user.isActive) {
      return c.json({ success: false, message: 'Account is deactivated' }, 401);
    }

    // Set user and tenant context
    c.set('user', user);
    c.set('userId', decoded.userId);
    c.set('tenantId', user.companyId || decoded.tenantId);
    c.set('tenant', { id: user.companyId || decoded.tenantId });

    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ success: false, message: error.message || 'Authentication failed' }, 401);
  }
}

// Role-based authorization middleware
export function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, message: 'Authentication required' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ success: false, message: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}

// Tenant isolation middleware
export async function tenantMiddleware(c, next) {
  const tenantId = c.get('tenantId') || 
                   c.req.header('X-Tenant-Id') || 
                   c.req.header('X-Company-Code') ||
                   c.req.query('tenantId');

  if (!tenantId) {
    return c.json({ success: false, message: 'Tenant context required' }, 400);
  }

  c.set('tenantId', tenantId);
  c.set('tenant', { id: tenantId });

  await next();
}

export { verifyJWT, signJWT };
