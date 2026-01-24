// Server-side startup
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { Mongo } from 'meteor/mongo';

import type { MeteorUser, UserServices, UserProfile } from '../../types';

// Import collections and methods
import { Sessions } from '../../api/sessions/collection';
import '../../api/sessions/invites';
import '../../api/sessions/methods/index';
import '../../api/sessions/publications';

import { Files } from '../../api/files/files';
import '../../api/files/methods';
import '../../api/files/publications';

import { Comments } from '../../api/comments/comments';
import '../../api/comments/methods';
import '../../api/comments/publications';

import { Cursors } from '../../api/cursors/cursors';
import '../../api/cursors/methods';
import '../../api/cursors/publications';

import { ChatMessages } from '../../api/chat/chat';
import '../../api/chat/methods';
import '../../api/chat/publications';

// GitHub integration
import '../api/github';

// Configure accounts
Accounts.config({
  sendVerificationEmail: false
});

// On user creation, set profile defaults
Accounts.onCreateUser((options, user) => {
  const meteorUser = user as MeteorUser;
  const services = meteorUser.services as UserServices | undefined;

  // Default profile
  meteorUser.profile = (options.profile || {}) as UserProfile;

  // If logging in with GitHub, extract profile info
  if (services?.github) {
    meteorUser.profile.name = services.github.username;
    if (services.github.avatar_url) {
      meteorUser.profile.avatar = services.github.avatar_url;
    }
  }

  return meteorUser;
});

Meteor.startup(async () => {
  console.log('CodeSync server started');

  // Create indexes with error handling (may fail on restart race conditions)
  const createIndexSafe = async <T extends { _id?: string }>(
    collection: Mongo.Collection<T>,
    index: Record<string, 1 | -1>
  ) => {
    try {
      await collection.rawCollection().createIndex(index);
    } catch (err: unknown) {
      const error = err as Error;
      // Ignore "already exists" and topology errors on startup
      if (!error.message?.includes('already exists') && !error.message?.includes('Topology')) {
        console.warn('Index creation warning:', error.message);
      }
    }
  };

  // Sessions indexes
  await createIndexSafe(Sessions, { createdBy: 1, createdAt: -1 });
  await createIndexSafe(Sessions, { allowedUsers: 1 });
  await createIndexSafe(Sessions, { shareToken: 1 });

  // Files indexes
  await createIndexSafe(Files, { sessionId: 1, path: 1 });
  await createIndexSafe(Files, { sessionId: 1, isReviewed: 1 });

  // Comments indexes
  await createIndexSafe(Comments, { fileId: 1, lineNumber: 1 });
  await createIndexSafe(Comments, { threadId: 1, depth: 1 });
  await createIndexSafe(Comments, { sessionId: 1, isResolved: 1 });

  // Cursors indexes
  await createIndexSafe(Cursors, { sessionId: 1, userId: 1 });
  await createIndexSafe(Cursors, { sessionId: 1, updatedAt: -1 });

  // Chat indexes
  await createIndexSafe(ChatMessages, { sessionId: 1, createdAt: -1 });
});

// Configure GitHub OAuth from environment variables
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

console.log('GitHub OAuth config check:', {
  hasClientId: !!githubClientId,
  hasClientSecret: !!githubClientSecret,
  clientIdPrefix: githubClientId?.substring(0, 8)
});

if (githubClientId && githubClientSecret) {
  ServiceConfiguration.configurations.upsertAsync(
    { service: 'github' },
    {
      $set: {
        loginStyle: 'popup',
        clientId: githubClientId,
        secret: githubClientSecret,
      },
    }
  ).then(() => {
    console.log('GitHub OAuth configured successfully');
  }).catch((err: unknown) => {
    console.error('GitHub OAuth config error:', err);
  });
} else {
  console.warn('GitHub OAuth not configured: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required');
}
