import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Files } from './files';
import { Sessions } from '../sessions/collection';

Meteor.publish('session.files', async function (sessionId: string) {
  check(sessionId, String);

  if (!this.userId) return this.ready();

  const session = await Sessions.findOneAsync(sessionId);
  if (!session) {
    return this.ready();
  }

  // Check access
  if (
    !session.isPublic &&
    session.createdBy !== this.userId &&
    !session.allowedUsers.includes(this.userId)
  ) {
    return this.ready();
  }

  return Files.find(
    { sessionId },
    {
      fields: {
        sessionId: 1,
        path: 1,
        name: 1,
        extension: 1,
        size: 1,
        language: 1,
        isDeleted: 1,
        isAdded: 1,
        isModified: 1,
        isRenamed: 1,
        oldPath: 1,
        isReviewed: 1,
        reviewedBy: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );
});

Meteor.publish('file', async function (fileId: string) {
  check(fileId, String);

  if (!this.userId) return this.ready();

  const file = await Files.findOneAsync(fileId);
  if (!file) return this.ready();

  const session = await Sessions.findOneAsync(file.sessionId);
  if (!session) {
    return this.ready();
  }

  // Check access
  if (
    !session.isPublic &&
    session.createdBy !== this.userId &&
    !session.allowedUsers.includes(this.userId)
  ) {
    return this.ready();
  }

  return Files.find({ _id: fileId });
});
