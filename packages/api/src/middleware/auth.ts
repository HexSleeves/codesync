/**
 * Authentication middleware using JWT
 */

import type { User } from '@codesync/shared';
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { sign, verify } from 'hono/jwt';
import { config } from '../config';
import { db } from '../db/client';
import { users } from '../db/schema';

export type AuthVariables = {
  userId: string;
  user: User;
};

type JWTPayload = {
  sub: string;
  iat: number;
  exp: number;
};

/**
 * Extract token from request (Authorization header or cookie)
 */
function extractToken(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookies = c.req.header('Cookie') || '';
  const tokenCookie = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));

  return tokenCookie?.split('=')[1] || null;
}

/**
 * Fetch user from database and create User object
 */
async function fetchUser(userId: string): Promise<User | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    githubId: user.githubId,
    githubUsername: user.githubUsername,
    createdAt: user.createdAt,
  };
}

/**
 * Middleware that requires authentication
 * Adds userId and user to context
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const token = extractToken(c);

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized - no token provided' });
  }

  try {
    const payload = (await verify(token, config.jwtSecret, 'HS256')) as JWTPayload;

    if (!payload?.sub) {
      throw new HTTPException(401, { message: 'Unauthorized - invalid token' });
    }

    const user = await fetchUser(payload.sub);
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized - user not found' });
    }

    c.set('userId', user.id);
    c.set('user', user);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error('Auth error:', error);
    throw new HTTPException(401, { message: 'Unauthorized - token verification failed' });
  }
});

/**
 * Optional auth middleware - doesn't throw if no token
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalAuthMiddleware = createMiddleware<{ Variables: Partial<AuthVariables> }>(
  async (c, next) => {
    const token = extractToken(c);

    if (token) {
      try {
        const payload = (await verify(token, config.jwtSecret, 'HS256')) as JWTPayload;

        if (payload?.sub) {
          const user = await fetchUser(payload.sub);
          if (user) {
            c.set('userId', user.id);
            c.set('user', user);
          }
        }
      } catch {
        // Ignore auth errors for optional auth
      }
    }

    await next();
  }
);

/**
 * Generate JWT token for user
 */
export async function generateToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: userId,
    iat: now,
    exp: now + 60 * 60 * 24 * config.tokenExpiryDays,
  };

  return await sign(payload, config.jwtSecret);
}
