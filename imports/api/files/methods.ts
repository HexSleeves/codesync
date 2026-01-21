import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Files, File, Hunk } from './files';
import { Sessions } from '../sessions/sessions';
import { canAccessSession, canEditSession } from '../sessions/methods';
import { nanoid } from 'nanoid';
import { detectLanguage } from '../../ui/utils/file-icons';

Meteor.methods({
  'files.add'(sessionId: string, fileData: Omit<File, '_id' | 'sessionId' | 'isReviewed' | 'reviewedBy' | 'createdAt' | 'updatedAt'>) {
    check(sessionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const session = Sessions.findOneAsync(sessionId);
    if (!canEditSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    const fileId = Files.insertAsync({
      _id: nanoid(),
      sessionId,
      ...fileData,
      isReviewed: false,
      reviewedBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as File);
    
    // Update session stats
    Sessions.updateAsync(sessionId, {
      $inc: { 'stats.fileCount': 1 },
      $set: { updatedAt: new Date() }
    });
    
    return fileId;
  },
  
  'files.addMultiple'(sessionId: string, filesData: Array<Omit<File, '_id' | 'sessionId' | 'isReviewed' | 'reviewedBy' | 'createdAt' | 'updatedAt'>>) {
    check(sessionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const session = Sessions.findOneAsync(sessionId);
    if (!canEditSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    const fileIds: string[] = [];
    const now = new Date();
    
    for (const fileData of filesData) {
      const fileId = Files.insertAsync({
        _id: nanoid(),
        sessionId,
        ...fileData,
        isReviewed: false,
        reviewedBy: [],
        createdAt: now,
        updatedAt: now
      } as File);
      fileIds.push(fileId);
    }
    
    // Update session stats
    Sessions.updateAsync(sessionId, {
      $inc: { 'stats.fileCount': filesData.length },
      $set: { updatedAt: now }
    });
    
    return fileIds;
  },
  
  'files.update'(fileId: string, updates: Partial<Pick<File, 'content' | 'originalContent' | 'hunks'>>) {
    check(fileId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const file = Files.findOneAsync(fileId);
    if (!file) {
      throw new Meteor.Error('file-not-found');
    }
    
    const session = Sessions.findOneAsync(file.sessionId);
    if (!canEditSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    Files.updateAsync(fileId, {
      $set: {
        ...updates,
        updatedAt: new Date()
      }
    });
  },
  
  'files.delete'(fileId: string) {
    check(fileId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const file = Files.findOneAsync(fileId);
    if (!file) {
      throw new Meteor.Error('file-not-found');
    }
    
    const session = Sessions.findOneAsync(file.sessionId);
    if (!canEditSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    Files.removeAsync(fileId);
    
    Sessions.updateAsync(file.sessionId, {
      $inc: { 'stats.fileCount': -1 },
      $set: { updatedAt: new Date() }
    });
  },
  
  'files.markReviewed'(fileId: string) {
    check(fileId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const file = Files.findOneAsync(fileId);
    if (!file) {
      throw new Meteor.Error('file-not-found');
    }
    
    const session = Sessions.findOneAsync(file.sessionId);
    if (!canAccessSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    Files.updateAsync(fileId, {
      $set: { isReviewed: true },
      $addToSet: { reviewedBy: this.userId }
    });
  },
  
  'files.unmarkReviewed'(fileId: string) {
    check(fileId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const file = Files.findOneAsync(fileId);
    if (!file) {
      throw new Meteor.Error('file-not-found');
    }
    
    const session = Sessions.findOneAsync(file.sessionId);
    if (!canAccessSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    Files.updateAsync(fileId, {
      $pull: { reviewedBy: this.userId }
    });
    
    // Check if any reviewers remain
    const updated = Files.findOneAsync(fileId);
    if (updated && updated.reviewedBy.length === 0) {
      Files.updateAsync(fileId, {
        $set: { isReviewed: false }
      });
    }
  }
});
