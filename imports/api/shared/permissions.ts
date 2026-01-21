import { Sessions } from '../sessions/collection';

export async function canAccessSession(sessionId: string, userId: string): Promise<boolean> {
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) return false;
  if (session.isPublic) return true;
  if (session.createdBy === userId) return true;
  return session.allowedUsers.includes(userId);
}

export async function canEditSession(sessionId: string, userId: string): Promise<boolean> {
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) return false;
  return session.createdBy === userId;
}
