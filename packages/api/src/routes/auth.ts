/**
 * Auth routes - login, register, logout, me
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { loginSchema, registerSchema } from '@codesync/shared';
import { authMiddleware, generateToken, type AuthVariables } from '../middleware/auth';

export const authRoutes = new Hono<{ Variables: AuthVariables }>()
  // POST /api/auth/login
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password (simplified - use bcrypt in production)
    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = await generateToken(user.id);

    // Set cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        githubUsername: user.githubUsername,
      },
      token,
    });
  })

  // POST /api/auth/register
  .post('/register', zValidator('json', registerSchema), async (c) => {
    const { email, password, name } = c.req.valid('json');

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0]);

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
      })
      .returning();

    // Generate JWT token
    const token = await generateToken(user.id);

    // Set cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      201
    );
  })

  // POST /api/auth/logout
  .post('/logout', async (c) => {
    deleteCookie(c, 'token');
    return c.json({ success: true });
  })

  // GET /api/auth/me
  .get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });

/**
 * Simple password hashing (use bcrypt in production)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.PASSWORD_SALT || 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
