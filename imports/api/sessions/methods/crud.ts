import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Sessions, Session, SessionSource } from '../collection';
import { canEditSession } from '../../shared/permissions';
import { nanoid } from 'nanoid';

Meteor.methods({
  async 'sessions.create'(data: {
    title: string;
    description?: string;
    source: SessionSource;
    isPublic: boolean;
  }) {
    check(data.title, String);
    check(data.isPublic, Boolean);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const sessionId = nanoid();

    await Sessions.insertAsync({
      _id: sessionId,
      title: data.title,
      description: data.description,
      createdBy: this.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: data.isPublic,
      allowedUsers: [this.userId],
      shareToken: nanoid(12),
      source: data.source,
      status: 'draft',
      reviewers: [],
      settings: {
        diffMode: 'unified',
        theme: 'dark',
        showWhitespace: false,
        tabSize: 2
      },
      stats: {
        fileCount: 0,
        commentCount: 0,
        activeUsers: 1
      }
    } as Session);

    return sessionId;
  },

  async 'sessions.update'(sessionId: string, updates: Partial<Pick<Session, 'title' | 'description' | 'isPublic' | 'settings'>>) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!await canEditSession(sessionId, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }

    await Sessions.updateAsync(sessionId, {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    });
  },

  async 'sessions.delete'(sessionId: string) {
    check(sessionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!await canEditSession(sessionId, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }

    await Sessions.removeAsync(sessionId);
  }
});
