import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Comments, Comment } from '../../api/comments/comments';

export function useFileComments(fileId: string | null) {
  return useTracker(() => {
    if (!fileId) {
      return { comments: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('file.comments', fileId);
    
    return {
      comments: Comments.find({ fileId }, { sort: { lineNumber: 1, createdAt: 1 }}).fetch(),
      isLoading: !handle.ready()
    };
  }, [fileId]);
}

export function useLineComments(fileId: string | null, lineNumber: number) {
  return useTracker(() => {
    if (!fileId) {
      return { comments: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('file.comments', fileId);
    
    return {
      comments: Comments.find(
        { fileId, lineNumber, depth: 0 },
        { sort: { createdAt: 1 }}
      ).fetch(),
      isLoading: !handle.ready()
    };
  }, [fileId, lineNumber]);
}

export function useThreadComments(threadId: string | null) {
  return useTracker(() => {
    if (!threadId) {
      return { comments: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('comment.thread', threadId);
    
    return {
      comments: Comments.find(
        { threadId },
        { sort: { depth: 1, createdAt: 1 }}
      ).fetch(),
      isLoading: !handle.ready()
    };
  }, [threadId]);
}

export function useCommentsByLine(fileId: string | null) {
  return useTracker(() => {
    if (!fileId) {
      return { commentsByLine: new Map<number, Comment[]>(), isLoading: false };
    }
    
    const handle = Meteor.subscribe('file.comments', fileId);
    const comments = Comments.find({ fileId, depth: 0 }).fetch();
    
    const commentsByLine = new Map<number, Comment[]>();
    for (const comment of comments) {
      const existing = commentsByLine.get(comment.lineNumber) || [];
      existing.push(comment);
      commentsByLine.set(comment.lineNumber, existing);
    }
    
    return {
      commentsByLine,
      isLoading: !handle.ready()
    };
  }, [fileId]);
}
