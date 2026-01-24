import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Cursors, Selection, Viewport } from '../../api/cursors/cursors';
import { useEffect, useRef, useCallback } from 'react';

export function useCursors(sessionId: string | undefined, fileId: string | null) {
  const throttleRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  // Subscribe to cursors
  const { cursors, isLoading } = useTracker(() => {
    if (!sessionId) {
      return { cursors: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('session.cursors', sessionId);
    
    const currentUserId = Meteor.userId();
    return {
      cursors: Cursors.find({
        sessionId,
        ...(fileId ? { fileId } : {}),
        ...(currentUserId ? { userId: { $ne: currentUserId } } : {})
      }).fetch(),
      isLoading: !handle.ready()
    };
  }, [sessionId, fileId]);
  
  // Update own cursor position (throttled)
  const updateCursor = useCallback((
    line: number,
    column: number,
    selection?: Selection,
    viewport?: Viewport
  ) => {
    if (!sessionId || !fileId) return;
    
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }
    
    throttleRef.current = setTimeout(() => {
      Meteor.call('cursors.update', {
        sessionId,
        fileId,
        line,
        column,
        selection,
        viewport: viewport || { topLine: 0, bottomLine: 50 }
      });
    }, 100); // Throttle to 100ms
  }, [sessionId, fileId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (sessionId) {
        Meteor.call('cursors.remove', sessionId);
      }
    };
  }, [sessionId]);
  
  return { cursors, updateCursor, isLoading };
}

export function useAllSessionCursors(sessionId: string | undefined) {
  return useTracker(() => {
    if (!sessionId) {
      return { cursors: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('session.cursors', sessionId);
    
    return {
      cursors: Cursors.find({ sessionId }).fetch(),
      isLoading: !handle.ready()
    };
  }, [sessionId]);
}
