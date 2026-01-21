import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Cursors } from './cursors';
import { Sessions } from '../sessions/sessions';

Meteor.publish('session.cursors', async function(sessionId: string) {
  check(sessionId, String);
  
  if (!this.userId) return this.ready();
  
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  // Publish all active cursors for the session
  // The cleanup job in methods.ts handles removing stale cursors
  return Cursors.find({
    sessionId,
    isActive: true
  });
});

Meteor.publish('session.users', async function(sessionId: string) {
  check(sessionId, String);
  
  if (!this.userId) return this.ready();
  
  const session = await Sessions.findOneAsync(sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  // Collect user IDs
  const userIds = [session.createdBy, ...session.allowedUsers];
  
  return Meteor.users.find(
    { _id: { $in: [...new Set(userIds)] }},
    { fields: { 'profile': 1, 'emails': 1, 'services.github.username': 1, 'services.github.avatar_url': 1 }}
  );
});
