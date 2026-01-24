import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Sessions } from '../collection';
import { canEditSession } from '../../shared/permissions';

Meteor.methods({
  async 'sessions.submitReview'(sessionId: string, status: 'approved' | 'changes_requested') {
    check(sessionId, String);
    check(status, Match.OneOf('approved', 'changes_requested'));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found');
    }

    const isReviewer = session.reviewers.some(r => r.userId === this.userId);
    if (!isReviewer && session.createdBy !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You are not a reviewer');
    }

    await Sessions.updateAsync(
      { _id: sessionId, 'reviewers.userId': this.userId },
      {
        $set: {
          'reviewers.$.status': status,
          'reviewers.$.reviewedAt': new Date(),
        },
      }
    );

    const updatedSession = await Sessions.findOneAsync(sessionId);
    if (updatedSession) {
      const allReviewed = updatedSession.reviewers.every(r => r.status !== 'pending');
      if (allReviewed) {
        const allApproved = updatedSession.reviewers.every(r => r.status === 'approved');
        await Sessions.updateAsync(sessionId, {
          $set: { status: allApproved ? 'approved' : 'changes_requested' },
        });
      }
    }
  },

  async 'sessions.startReview'(sessionId: string) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found');
    }

    if (session.status !== 'draft') {
      throw new Meteor.Error('invalid-status', 'Session is already in review');
    }

    await Sessions.updateAsync(sessionId, {
      $set: {
        status: 'in_review',
        updatedAt: new Date(),
      },
    });
  },

  async 'sessions.addReviewer'(sessionId: string, email: string) {
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

    const session = await Sessions.findOneAsync(sessionId);
    if (session?.reviewers.some(r => r.userId === user._id)) {
      throw new Meteor.Error('already-reviewer', 'User is already a reviewer');
    }

    await Sessions.updateAsync(sessionId, {
      $addToSet: {
        allowedUsers: user._id,
        reviewers: {
          userId: user._id,
          status: 'pending',
          reviewedAt: undefined,
        },
      },
    });
  },

  async 'sessions.removeReviewer'(sessionId: string, userId: string) {
    check(sessionId, String);
    check(userId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    await Sessions.updateAsync(sessionId, {
      $pull: { reviewers: { userId } },
    });
  },

  async 'sessions.merge'(sessionId: string) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found');
    }

    if (session.status !== 'approved') {
      throw new Meteor.Error('not-approved', 'Session must be approved before merging');
    }

    await Sessions.updateAsync(sessionId, {
      $set: {
        status: 'merged',
        updatedAt: new Date(),
      },
    });
  },

  async 'sessions.reopen'(sessionId: string) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!(await canEditSession(sessionId, this.userId))) {
      throw new Meteor.Error('not-authorized');
    }

    const session = await Sessions.findOneAsync(sessionId);
    if (!session) {
      throw new Meteor.Error('session-not-found');
    }

    if (session.status === 'merged') {
      throw new Meteor.Error('already-merged', 'Cannot reopen a merged session');
    }

    // Reset all reviewer statuses to pending
    const resetReviewers = session.reviewers.map(r => ({
      ...r,
      status: 'pending' as const,
      reviewedAt: undefined,
    }));

    await Sessions.updateAsync(sessionId, {
      $set: {
        status: 'in_review',
        reviewers: resetReviewers,
        updatedAt: new Date(),
      },
    });
  },
});
