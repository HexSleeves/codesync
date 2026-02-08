/**
 * Auth routes - login, register, logout, me
 */

import { loginSchema, registerSchema } from '@codesync/shared';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { config } from '../config';
import { db } from '../db/client';
import { users } from '../db/schema';
import { type AuthVariables, authMiddleware, generateToken } from '../middleware/auth';

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
      .then((rows) => rows[0]);

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password using argon2id
    if (!user.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    const passwordValid = await Bun.password.verify(password, user.passwordHash);
    if (!passwordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = await generateToken(user.id);

    // Set cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * config.tokenExpiryDays,
      path: '/',
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
      .then((rows) => rows[0]);

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Create user with argon2id hashing
    const passwordHash = await Bun.password.hash(password, { algorithm: 'argon2id' });
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
      secure: !config.isDev,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * config.tokenExpiryDays,
      path: '/',
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
    deleteCookie(c, 'token', { path: '/' });
    return c.json({ success: true });
  })

  // GET /api/auth/me
  .get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });


