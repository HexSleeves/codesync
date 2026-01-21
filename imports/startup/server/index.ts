// Server-side startup
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

// Import collections and methods
import '../../api/sessions/sessions';
import '../../api/sessions/methods';
import '../../api/sessions/publications';

import '../../api/files/files';
import '../../api/files/methods';
import '../../api/files/publications';

import '../../api/comments/comments';
import '../../api/comments/methods';
import '../../api/comments/publications';

import '../../api/cursors/cursors';
import '../../api/cursors/methods';
import '../../api/cursors/publications';

import '../../api/chat/chat';
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
  if (user.services?.github) {
    user.profile.name = user.services.github.username;
    // Store GitHub avatar URL
    if (user.services.github.avatar_url) {
      user.profile.avatar = user.services.github.avatar_url;
    }
  }

  return user;
});

Meteor.startup(() => {
  console.log('CodeSync server started');

  // Create indexes
  import { Sessions } from '../../api/sessions/sessions';
  import { Files } from '../../api/files/files';
  import { Comments } from '../../api/comments/comments';
  import { Cursors } from '../../api/cursors/cursors';
  import { ChatMessages } from '../../api/chat/chat';

  // Sessions indexes
  Sessions.rawCollection().createIndex({ createdBy: 1, createdAt: -1 });
  Sessions.rawCollection().createIndex({ allowedUsers: 1 });
  Sessions.rawCollection().createIndex({ shareToken: 1 });

  // Files indexes
  Files.rawCollection().createIndex({ sessionId: 1, path: 1 });
  Files.rawCollection().createIndex({ sessionId: 1, isReviewed: 1 });

  // Comments indexes
  Comments.rawCollection().createIndex({ fileId: 1, lineNumber: 1 });
  Comments.rawCollection().createIndex({ threadId: 1, depth: 1 });
  Comments.rawCollection().createIndex({ sessionId: 1, isResolved: 1 });

  // Cursors indexes
  Cursors.rawCollection().createIndex({ sessionId: 1, userId: 1 });
  Cursors.rawCollection().createIndex({ sessionId: 1, updatedAt: -1 });

  // Chat indexes
  ChatMessages.rawCollection().createIndex({ sessionId: 1, createdAt: -1 });
});

ServiceConfiguration.configurations.upsertAsync(
  { service: 'github' },
  {
    $set: {
      loginStyle: 'popup',
      clientId: 'Ov23li8HongvGIUS6cgX', // insert your clientId here
      secret: '6abeb4e2a46727740b7293d4f6f7dc9d8bb3a522', // insert your secret here
    },
  }
);
