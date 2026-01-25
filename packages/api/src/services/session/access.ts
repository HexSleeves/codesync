/**
 * Session Access Control Service
 * Helpers for checking session ownership and access rights
 */

import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { sessions } from '../../db/schema';

/**
 * Session access result
 */
export interface SessionAccessResult {
  session: typeof sessions.$inferSelect | null;
  hasAccess: boolean;
  isOwner: boolean;
  error?: 'not_found' | 'access_denied';
}

/**
 * Get session by ID
 */
export async function getSessionById(
  sessionId: string
): Promise<typeof sessions.$inferSelect | null> {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

/**
 * Check if user has access to a session
 * Returns session data and access info
 */
export async function checkSessionAccess(
  sessionId: string,
  userId: string | undefined
): Promise<SessionAccessResult> {
  const session = await getSessionById(sessionId);

  if (!session) {
    return { session: null, hasAccess: false, isOwner: false, error: 'not_found' };
  }

  const isOwner = session.createdBy === userId;
  const hasAccess = session.isPublic || isOwner;

  if (!hasAccess) {
    return { session, hasAccess: false, isOwner, error: 'access_denied' };
  }

  return { session, hasAccess: true, isOwner };
}

/**
 * Check if user owns a session
 * Stricter than checkSessionAccess - requires ownership
 */
export async function checkSessionOwnership(
  sessionId: string,
  userId: string
): Promise<SessionAccessResult> {
  const session = await getSessionById(sessionId);

  if (!session) {
    return { session: null, hasAccess: false, isOwner: false, error: 'not_found' };
  }

  const isOwner = session.createdBy === userId;

  if (!isOwner) {
    return { session, hasAccess: false, isOwner: false, error: 'access_denied' };
  }

  return { session, hasAccess: true, isOwner: true };
}
