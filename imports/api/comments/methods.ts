import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Comments, Comment } from './comments';
import { Files } from '../files/files';
import { Sessions } from '../sessions/collection';
import { canAccessSession } from '../sessions/methods';
import { nanoid } from 'nanoid';

function extractMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.substring(1)) : [];
}

Meteor.methods({
  async 'comments.add'(data: {
    sessionId: string;
    fileId: string;
    lineNumber: number;
    text: string;
    parentId?: string;
  }) {
    check(data.sessionId, String);
    check(data.fileId, String);
    check(data.lineNumber, Number);
    check(data.text, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const hasAccess = await canAccessSession(data.sessionId, this.userId);
    if (!hasAccess) {
      throw new Meteor.Error('not-authorized');
    }
    
    const file = await Files.findOneAsync(data.fileId);
    if (!file || file.sessionId !== data.sessionId) {
      throw new Meteor.Error('file-not-found');
    }
    
    // Get code context
    const lines = file.content.split('\n');
    const lineIndex = data.lineNumber - 1;
    const codeContext = {
      before: lines.slice(Math.max(0, lineIndex - 3), lineIndex),
      line: lines[lineIndex] || '',
      after: lines.slice(lineIndex + 1, lineIndex + 4)
    };
    
    // Find parent comment if this is a reply
    let threadId = '';
    let depth = 0;
    
    if (data.parentId) {
      const parent = await Comments.findOneAsync(data.parentId);
      if (!parent) {
        throw new Meteor.Error('parent-not-found');
      }
      threadId = parent.threadId;
      depth = parent.depth + 1;
    }
    
    const commentId = nanoid();
    
    await Comments.insertAsync({
      _id: commentId,
      sessionId: data.sessionId,
      fileId: data.fileId,
      lineNumber: data.lineNumber,
      text: data.text,
      author: this.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: data.parentId,
      threadId: threadId || commentId, // If root comment, threadId is self
      depth,
      isResolved: false,
      isPinned: false,
      isOutdated: false,
      reactions: [],
      mentions: extractMentions(data.text),
      codeContext
    } as Comment);
    
    // Update session stats
    await Sessions.updateAsync(data.sessionId, {
      $inc: { 'stats.commentCount': 1 },
      $set: { updatedAt: new Date() }
    });
    
    return commentId;
  },
  
  async 'comments.update'(commentId: string, text: string) {
    check(commentId, String);
    check(text, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    if (comment.author !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You can only edit your own comments');
    }
    
    await Comments.updateAsync(commentId, {
      $set: {
        text,
        editedAt: new Date(),
        updatedAt: new Date(),
        mentions: extractMentions(text)
      }
    });
  },
  
  async 'comments.delete'(commentId: string) {
    check(commentId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    if (comment.author !== this.userId) {
      const session = await Sessions.findOneAsync(comment.sessionId);
      if (session?.createdBy !== this.userId) {
        throw new Meteor.Error('not-authorized');
      }
    }
    
    // If root comment, delete all replies
    if (comment.depth === 0) {
      const deleted = await Comments.removeAsync({ threadId: comment._id });
      await Sessions.updateAsync(comment.sessionId, {
        $inc: { 'stats.commentCount': -deleted }
      });
    } else {
      await Comments.removeAsync(commentId);
      await Sessions.updateAsync(comment.sessionId, {
        $inc: { 'stats.commentCount': -1 }
      });
    }
  },
  
  async 'comments.resolve'(commentId: string) {
    check(commentId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    const hasAccess = await canAccessSession(comment.sessionId, this.userId);
    if (!hasAccess) {
      throw new Meteor.Error('not-authorized');
    }
    
    // Resolve the entire thread
    await Comments.updateAsync(
      { threadId: comment.threadId },
      {
        $set: {
          isResolved: true,
          resolvedBy: this.userId,
          resolvedAt: new Date()
        }
      },
      { multi: true }
    );
  },
  
  async 'comments.unresolve'(commentId: string) {
    check(commentId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    const hasAccess = await canAccessSession(comment.sessionId, this.userId);
    if (!hasAccess) {
      throw new Meteor.Error('not-authorized');
    }
    
    // Unresolve the entire thread
    await Comments.updateAsync(
      { threadId: comment.threadId },
      {
        $unset: {
          resolvedBy: '',
          resolvedAt: ''
        },
        $set: {
          isResolved: false
        }
      },
      { multi: true }
    );
  },
  
  async 'comments.togglePin'(commentId: string) {
    check(commentId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    const hasAccess = await canAccessSession(comment.sessionId, this.userId);
    if (!hasAccess) {
      throw new Meteor.Error('not-authorized');
    }
    
    await Comments.updateAsync(commentId, {
      $set: { isPinned: !comment.isPinned }
    });
  },
  
  async 'comments.addReaction'(commentId: string, emoji: string) {
    check(commentId, String);
    check(emoji, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const comment = await Comments.findOneAsync(commentId);
    if (!comment) {
      throw new Meteor.Error('comment-not-found');
    }
    
    const existingReaction = comment.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      if (existingReaction.users.includes(this.userId)) {
        // Remove user from reaction
        await Comments.updateAsync(
          { _id: commentId, 'reactions.emoji': emoji },
          { $pull: { 'reactions.$.users': this.userId } }
        );
        
        // Remove reaction if no users left
        await Comments.updateAsync(
          { _id: commentId, 'reactions.emoji': emoji, 'reactions.users': { $size: 0 } },
          { $pull: { reactions: { emoji } } }
        );
      } else {
        // Add user to reaction
        await Comments.updateAsync(
          { _id: commentId, 'reactions.emoji': emoji },
          { $push: { 'reactions.$.users': this.userId } }
        );
      }
    } else {
      // Create new reaction
      await Comments.updateAsync(commentId, {
        $push: {
          reactions: {
            emoji,
            users: [this.userId]
          }
        }
      });
    }
  }
});
