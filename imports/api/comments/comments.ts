import { Mongo } from 'meteor/mongo';

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface CodeContext {
  before: string[];
  line: string;
  after: string[];
}

export interface Comment {
  _id: string;
  sessionId: string;
  fileId: string;
  lineNumber: number;
  lineNumberOld?: number;
  position?: number;
  text: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  parentId?: string;
  threadId: string;
  depth: number;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  isPinned: boolean;
  isOutdated: boolean;
  reactions: Reaction[];
  mentions: string[];
  codeContext?: CodeContext;
}

export const Comments = new Mongo.Collection<Comment>('comments');

Comments.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});
