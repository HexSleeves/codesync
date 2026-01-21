import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ChatMessages, ChatMessage, CodeSnippet } from './chat';
import { Sessions } from '../sessions/sessions';
import { canAccessSession } from '../sessions/methods';
import { nanoid } from 'nanoid';

function extractMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.substring(1)) : [];
}

Meteor.methods({
  'chat.send'(data: {
    sessionId: string;
    message: string;
    code?: CodeSnippet;
  }) {
    check(data.sessionId, String);
    check(data.message, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const session = Sessions.findOneAsync(data.sessionId);
    if (!canAccessSession(session, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }
    
    const user = Meteor.users.findOneAsync(this.userId);
    const profile = user?.profile as any;
    const githubUsername = (user?.services as any)?.github?.username;
    
    const messageId = ChatMessages.insertAsync({
      _id: nanoid(),
      sessionId: data.sessionId,
      userId: this.userId,
      userName: profile?.name || githubUsername || user?.emails?.[0]?.address || 'Anonymous',
      userAvatar: profile?.avatar,
      message: data.message,
      type: data.code ? 'code_snippet' : 'text',
      code: data.code,
      mentions: extractMentions(data.message),
      reactions: [],
      createdAt: new Date()
    } as ChatMessage);
    
    return messageId;
  },
  
  'chat.edit'(messageId: string, message: string) {
    check(messageId, String);
    check(message, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const chatMessage = ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error('message-not-found');
    }
    
    if (chatMessage.userId !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    ChatMessages.updateAsync(messageId, {
      $set: {
        message,
        editedAt: new Date(),
        mentions: extractMentions(message)
      }
    });
  },
  
  'chat.delete'(messageId: string) {
    check(messageId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const chatMessage = ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error('message-not-found');
    }
    
    if (chatMessage.userId !== this.userId) {
      const session = Sessions.findOneAsync(chatMessage.sessionId);
      if (session?.createdBy !== this.userId) {
        throw new Meteor.Error('not-authorized');
      }
    }
    
    ChatMessages.updateAsync(messageId, {
      $set: { deletedAt: new Date() }
    });
  },
  
  'chat.addReaction'(messageId: string, emoji: string) {
    check(messageId, String);
    check(emoji, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    const chatMessage = ChatMessages.findOneAsync(messageId);
    if (!chatMessage) {
      throw new Meteor.Error('message-not-found');
    }
    
    const existingReaction = chatMessage.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      if (existingReaction.users.includes(this.userId)) {
        ChatMessages.updateAsync(
          { _id: messageId, 'reactions.emoji': emoji },
          { $pull: { 'reactions.$.users': this.userId } }
        );
        
        ChatMessages.updateAsync(
          { _id: messageId, 'reactions.emoji': emoji, 'reactions.users': { $size: 0 } },
          { $pull: { reactions: { emoji } } }
        );
      } else {
        ChatMessages.updateAsync(
          { _id: messageId, 'reactions.emoji': emoji },
          { $push: { 'reactions.$.users': this.userId } }
        );
      }
    } else {
      ChatMessages.updateAsync(messageId, {
        $push: {
          reactions: {
            emoji,
            users: [this.userId]
          }
        }
      });
    }
  },
  
  'chat.sendSystemMessage'(sessionId: string, message: string) {
    check(sessionId, String);
    check(message, String);
    
    // System messages can only be sent server-side
    if (!this.isSimulation) {
      ChatMessages.insertAsync({
        _id: nanoid(),
        sessionId,
        userId: 'system',
        userName: 'System',
        message,
        type: 'system',
        mentions: [],
        reactions: [],
        createdAt: new Date()
      } as ChatMessage);
    }
  }
});
