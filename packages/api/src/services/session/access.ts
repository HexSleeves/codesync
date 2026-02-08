/**
 * Session Access Control Service
 * Helpers for checking session ownership and access rights
 */

import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { files, sessionParticipants, sessions } from '../../db/schema';

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
 * Check if user is a participant (or owner) of a session
 */
async function isParticipant(sessionId: string, userId: string): Promise<boolean> {
  const row = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, userId))
    )
    .limit(1)
    .then((rows) => rows[0]);
  return !!row;
}

/**
 * Check if user has access to a session.
 * Access is granted if: user is owner, user is participant, or session is public.
 */
export async function checkSessionAccess(
  sessionId: string,
  userId: string | undefined
): Promise<SessionAccessResult> {
  const session = await getSessionById(sessionId);

  if (!session) {
    return { session: null, hasAccess: false, isOwner: false, error: 'not_found' };
  }

  const isOwner = !!userId && session.createdBy === userId;

  if (isOwner) {
    return { session, hasAccess: true, isOwner: true };
  }

  // Check participant table
  if (userId) {
    const participant = await isParticipant(sessionId, userId);
    if (participant) {
      return { session, hasAccess: true, isOwner: false };
    }
  }

  // Public sessions allow read access
  if (session.isPublic) {
    return { session, hasAccess: true, isOwner: false };
  }

  return { session, hasAccess: false, isOwner: false, error: 'access_denied' };
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

/**
 * Check session access given a fileId (look up the session from the file).
 * Returns the file's sessionId on success.
 */
export async function checkFileAccess(
  fileId: string,
  userId: string
): Promise<{ sessionId: string } | { error: string; status: 404 | 403 }> {
  const file = await db
    .select({ sessionId: files.sessionId })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!file) {
    return { error: 'File not found', status: 404 };
  }

  const access = await checkSessionAccess(file.sessionId, userId);
  if (!access.hasAccess) {
    return { error: 'Access denied', status: 403 };
  }

  return { sessionId: file.sessionId };
}
