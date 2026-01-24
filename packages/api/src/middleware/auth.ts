/**
 * Authentication middleware using JWT
 */

import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@codesync/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
 * Middleware that requires authentication
 * Adds userId and user to context
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  // Check for JWT in Authorization header or cookie
  const authHeader = c.req.header('Authorization');
  const cookies = c.req.header('Cookie') || '';
  const cookieToken = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('token='))?.split('=')[1];
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized - no token provided' });
  }

  try {
    // Verify JWT using hono/jwt
    const payload = await verify(token, JWT_SECRET, 'HS256') as JWTPayload;
    
    if (!payload || !payload.sub) {
      throw new HTTPException(401, { message: 'Unauthorized - invalid token' });
    }

    // Fetch user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized - user not found' });
    }

    // Set user info in context
    c.set('userId', user.id);
    c.set('user', {
      id: user.id,
      email: user.email,
      name: user.name,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
      createdAt: user.createdAt,
    });

    await next();
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'token verification failed';
    throw new HTTPException(401, { message: `Unauthorized - ${message}` });
  }
});

/**
 * Optional auth middleware - doesn't throw if no token
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalAuthMiddleware = createMiddleware<{ Variables: Partial<AuthVariables> }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const cookies = c.req.header('Cookie') || '';
  const cookieToken = cookies.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('token='))?.split('=')[1];
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (token) {
    try {
      const payload = await verify(token, JWT_SECRET, 'HS256') as JWTPayload;
      
      if (payload?.sub) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.sub))
          .limit(1)
          .then(rows => rows[0]);

        if (user) {
          c.set('userId', user.id);
          c.set('user', {
            id: user.id,
            email: user.email,
            name: user.name,
            githubId: user.githubId,
            githubUsername: user.githubUsername,
            createdAt: user.createdAt,
          });
        }
      }
    } catch {
      // Ignore auth errors for optional auth
    }
  }

  await next();
});

/**
 * Generate JWT token for user
 */
export async function generateToken(userId: string): Promise<string> {
  const payload: JWTPayload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  
  return await sign(payload, JWT_SECRET);
}
