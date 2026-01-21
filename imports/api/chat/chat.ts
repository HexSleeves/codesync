import { Mongo } from 'meteor/mongo';
import { Reaction } from '../comments/comments';

export interface CodeSnippet {
  content: string;
  language: string;
  fileName?: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  type: 'text' | 'system' | 'code_snippet';
  code?: CodeSnippet;
  mentions: string[];
  reactions: Reaction[];
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export const ChatMessages = new Mongo.Collection<ChatMessage>('chatMessages');

ChatMessages.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
