// Server-side startup
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

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
import '../../api/github/github';
import '../../api/github/methods';

// Configure accounts
Accounts.config({
  sendVerificationEmail: false
});

// On user creation, set profile defaults
Accounts.onCreateUser((options, user) => {
  // Default profile
  user.profile = options.profile || {};

  // If logging in with GitHub, extract profile info
  if ((user.services as any)?.github) {
    (user.profile as any).name = (user.services as any).github.username;
    // Store GitHub avatar URL
    if ((user.services as any).github.avatar_url) {
      (user.profile as any).avatar = (user.services as any).github.avatar_url;
    }
  }

  return user;
});

Meteor.startup(async () => {
  console.log('CodeSync server started');

  // Create indexes
  // Sessions indexes
  await Sessions.rawCollection().createIndex({ createdBy: 1, createdAt: -1 });
  await Sessions.rawCollection().createIndex({ allowedUsers: 1 });
  await Sessions.rawCollection().createIndex({ shareToken: 1 });

  // Files indexes
  await Files.rawCollection().createIndex({ sessionId: 1, path: 1 });
  await Files.rawCollection().createIndex({ sessionId: 1, isReviewed: 1 });

  // Comments indexes
  await Comments.rawCollection().createIndex({ fileId: 1, lineNumber: 1 });
  await Comments.rawCollection().createIndex({ threadId: 1, depth: 1 });
  await Comments.rawCollection().createIndex({ sessionId: 1, isResolved: 1 });

  // Cursors indexes
  await Cursors.rawCollection().createIndex({ sessionId: 1, userId: 1 });
  await Cursors.rawCollection().createIndex({ sessionId: 1, updatedAt: -1 });

  // Chat indexes
  await ChatMessages.rawCollection().createIndex({ sessionId: 1, createdAt: -1 });
});

ServiceConfiguration.configurations.upsertAsync(
  { service: 'github' },
  {
    $set: {
      loginStyle: 'popup',
      clientId: 'Ov23li8HongvGIUS6cgX',
      secret: '6abeb4e2a46727740b7293d4f6f7dc9d8bb3a522',
    },
  }
);
