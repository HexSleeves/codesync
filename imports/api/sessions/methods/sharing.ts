import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Sessions } from '../collection';
import { SessionInvites } from '../invites';
import { canEditSession } from '../../shared/permissions';
import { nanoid } from 'nanoid';

Meteor.methods({
  async 'sessions.addUser'(sessionId: string, email: string) {
    check(sessionId, String);
    check(email, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    const user = await Meteor.users.findOneAsync({ 'emails.address': email });
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User with this email not found');
    }

    await Sessions.updateAsync(sessionId, {
      $addToSet: { allowedUsers: user._id },
    });
  },

  async 'sessions.inviteByEmail'(sessionId: string, email: string) {
    check(sessionId, String);
    check(email, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    // Check if user already exists
    const existingUser = await Meteor.users.findOneAsync({ 'emails.address': email });
    if (existingUser) {
      // Just add them directly
      await Sessions.updateAsync(sessionId, {
        $addToSet: { allowedUsers: existingUser._id },
      });
      return { status: 'added', userId: existingUser._id };
    }

    // Check for existing invite
    const existingInvite = await SessionInvites.findOneAsync({
      sessionId,
      email,
      acceptedAt: { $exists: false },
    });

    if (existingInvite) {
      return { status: 'already_invited', token: existingInvite.token };
    }

    // Create invite
    const inviteToken = nanoid(16);
    await SessionInvites.insertAsync({
      _id: nanoid(),
      sessionId,
      email,
      invitedBy: this.userId,
      invitedAt: new Date(),
      token: inviteToken,
    });

    // In production, you would send an email here
    // For now, return the invite link
    const inviteUrl = `${Meteor.absoluteUrl()}invite/${inviteToken}`;

    return { status: 'invited', token: inviteToken, inviteUrl };
  },

  async 'sessions.acceptInvite'(inviteToken: string) {
    check(inviteToken, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const invite = await SessionInvites.findOneAsync({
      token: inviteToken,
      acceptedAt: { $exists: false },
    });

    if (!invite) {
      throw new Meteor.Error('invalid-invite', 'Invalid or expired invite');
    }

    // Add user to session
    await Sessions.updateAsync(invite.sessionId, {
      $addToSet: { allowedUsers: this.userId },
    });

    // Mark invite as accepted
    await SessionInvites.updateAsync(invite._id, {
      $set: {
        acceptedAt: new Date(),
        acceptedBy: this.userId,
      },
    });

    return invite.sessionId;
  },

  async 'sessions.joinByToken'(shareToken: string) {
    check(shareToken, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync({ shareToken });
    if (!session) {
      throw new Meteor.Error('invalid-token', 'Invalid share link');
    }

    await Sessions.updateAsync(session._id, {
      $addToSet: { allowedUsers: this.userId },
    });

    return session._id;
  },

  async 'sessions.getPendingInvites'(sessionId: string) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    return SessionInvites.find({
      sessionId,
      acceptedAt: { $exists: false },
    }).fetchAsync();
  },

  async 'sessions.cancelInvite'(inviteId: string) {
    check(inviteId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const invite = await SessionInvites.findOneAsync(inviteId);
    if (!invite) {
      throw new Meteor.Error('invite-not-found');
    }

    if (!(await canEditSession(invite.sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    await SessionInvites.removeAsync(inviteId);
  },
});
