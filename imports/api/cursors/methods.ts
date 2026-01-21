import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Cursors, Cursor, Selection, Viewport } from './cursors';
import { Sessions } from '../sessions/collection';
import { canAccessSession } from '../sessions/methods';

Meteor.methods({
  async 'cursors.update'(data: {
    sessionId: string;
    fileId: string;
    line: number;
    column: number;
    selection?: Selection;
    viewport: Viewport;
  }) {
    if (!this.userId) return;
    
    check(data.sessionId, String);
    check(data.fileId, String);
    check(data.line, Number);
    check(data.column, Number);
    
    const hasAccess = await canAccessSession(data.sessionId, this.userId);
    if (!hasAccess) {
      return;
    }
    
    // Upsert cursor position
    await Cursors.upsertAsync(
      { sessionId: data.sessionId, userId: this.userId },
      {
        $set: {
          sessionId: data.sessionId,
          userId: this.userId,
          fileId: data.fileId,
          line: data.line,
          column: data.column,
          selection: data.selection,
          viewport: data.viewport,
          isActive: true,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    );
  },
  
  async 'cursors.setInactive'(sessionId: string) {
    if (!this.userId) return;
    
    check(sessionId, String);
    
    await Cursors.updateAsync(
      { sessionId, userId: this.userId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  },
  
  async 'cursors.remove'(sessionId: string) {
    if (!this.userId) return;
    
    check(sessionId, String);
    
    await Cursors.removeAsync({ sessionId, userId: this.userId });
  }
});

// Clean up old cursors periodically (server-side)
if (Meteor.isServer) {
  Meteor.setInterval(async () => {
    const cutoff = new Date(Date.now() - 60000); // 1 minute
    await Cursors.removeAsync({ updatedAt: { $lt: cutoff } });
  }, 30000); // Run every 30 seconds
}
