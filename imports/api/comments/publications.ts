import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Comments } from './comments';
import { Files } from '../files/files';
import { Sessions } from '../sessions/collection';

Meteor.publish('file.comments', async function(fileId: string) {
  check(fileId, String);
  
  if (!this.userId) return this.ready();
  
  const file = await Files.findOneAsync(fileId);
  if (!file) return this.ready();
  
  const session = await Sessions.findOneAsync(file.sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  return Comments.find({ fileId });
});

Meteor.publish('session.comments', async function(sessionId: string) {
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
  
  return Comments.find({ sessionId });
});

Meteor.publish('comment.thread', async function(threadId: string) {
  check(threadId, String);
  
  if (!this.userId) return this.ready();
  
  const comment = await Comments.findOneAsync(threadId);
  if (!comment) return this.ready();
  
  const session = await Sessions.findOneAsync(comment.sessionId);
  if (!session) {
    return this.ready();
  }
  
  // Check access
  if (!session.isPublic && session.createdBy !== this.userId && !session.allowedUsers.includes(this.userId)) {
    return this.ready();
  }
  
  return Comments.find({ threadId });
});
