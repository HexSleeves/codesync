import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Cursors } from '../../api/cursors/cursors';

export interface UserPresence {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  currentFileId?: string;
  isActive: boolean;
}

export function usePresence(sessionId: string | undefined) {
  return useTracker(() => {
    if (!sessionId) {
      return { users: [], isLoading: false };
    }
    
    const cursorHandle = Meteor.subscribe('session.cursors', sessionId);
    const usersHandle = Meteor.subscribe('session.users', sessionId);
    
    const cursors = Cursors.find({ sessionId }).fetch();
    const cursorMap = new Map(cursors.map(c => [c.userId, c]));
    
    const users: UserPresence[] = Meteor.users.find({}).fetch().map(user => {
      const cursor = cursorMap.get(user._id);
      const profile = user.profile as any;
      const services = user.services as any;
      
      return {
        _id: user._id,
        name: profile?.name || services?.github?.username || user.emails?.[0]?.address || 'Anonymous',
        avatar: profile?.avatar,
        email: user.emails?.[0]?.address,
        currentFileId: cursor?.fileId,
        isActive: !!cursor && (Date.now() - cursor.updatedAt.getTime()) < 30000
      };
    });
    
    return {
      users,
      isLoading: !cursorHandle.ready() || !usersHandle.ready()
    };
  }, [sessionId]);
}
