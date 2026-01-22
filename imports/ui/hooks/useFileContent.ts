import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Files } from '../../api/files/files';

export function useFiles(sessionId: string | undefined) {
  return useTracker(() => {
    if (!sessionId) {
      return { files: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('session.files', sessionId);
    
    return {
      files: Files.find({ sessionId }, { sort: { path: 1 }}).fetch(),
      isLoading: !handle.ready()
    };
  }, [sessionId]);
}

export function useFile(fileId: string | null) {
  return useTracker(() => {
    if (!fileId) {
      return { file: null, isLoading: false };
    }
    
    const handle = Meteor.subscribe('file', fileId);
    
    return {
      file: Files.findOne(fileId) || null,
      isLoading: !handle.ready()
    };
  }, [fileId]);
}
