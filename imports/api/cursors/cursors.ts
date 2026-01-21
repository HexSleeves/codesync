import { Mongo } from 'meteor/mongo';

export interface Selection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface Viewport {
  topLine: number;
  bottomLine: number;
}

export interface Cursor {
  _id: string;
  sessionId: string;
  userId: string;
  fileId: string;
  line: number;
  column: number;
  selection?: Selection;
  viewport: Viewport;
  isActive: boolean;
  lastActivity: Date;
  updatedAt: Date;
}

export const Cursors = new Mongo.Collection<Cursor>('cursors');

Cursors.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
