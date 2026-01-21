import { Meteor } from 'meteor/meteor';
import { ChatMessages } from './chat';
import { Sessions } from '../sessions/sessions';

Meteor.publish('session.chat', async function(sessionId: string, limit = 100) {
  if (!this.userId) return this.ready();
  
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  return ChatMessages.find(
    { sessionId, deletedAt: { $exists: false }},
    { sort: { createdAt: -1 }, limit }
  );
});
