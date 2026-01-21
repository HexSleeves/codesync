import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ChatMessages } from './chat';
import { Sessions } from '../sessions/collection';

Meteor.publish('session.chat', async function(sessionId: string, limit: number = 100) {
  check(sessionId, String);
  check(limit, Match.Maybe(Number));
  
  if (!this.userId) return this.ready();
  
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  // Ensure limit is reasonable
  const safeLimit = Math.min(Math.max(limit || 100, 1), 500);
  
  return ChatMessages.find(
    { sessionId, deletedAt: { $exists: false }},
    { sort: { createdAt: -1 }, limit: safeLimit }
  );
});
