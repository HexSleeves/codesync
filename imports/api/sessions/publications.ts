import { Meteor } from 'meteor/meteor';
import { Sessions } from './collection';

Meteor.publish('session', async function (sessionId: string) {
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

  return Sessions.find({ _id: sessionId });
});

Meteor.publish('sessions.mine', function () {
  if (!this.userId) return this.ready();

  return Sessions.find(
    {
      $or: [{ createdBy: this.userId }, { allowedUsers: this.userId }],
    },
    {
      sort: { updatedAt: -1 },
      limit: 50,
    }
  );
});

Meteor.publish('sessions.public', function (limit = 20) {
  return Sessions.find(
    { isPublic: true },
    {
      sort: { createdAt: -1 },
      limit,
      fields: {
        title: 1,
        description: 1,
        createdBy: 1,
        createdAt: 1,
        source: 1,
        status: 1,
        stats: 1,
      },
    }
  );
});
