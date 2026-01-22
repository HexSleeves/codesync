import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { ChatMessages } from '../../api/chat/chat';
import { useCallback } from 'react';

export function useChat(sessionId: string | undefined, limit = 100) {
  const { messages, isLoading } = useTracker(() => {
    if (!sessionId) {
      return { messages: [], isLoading: false };
    }
    
    const handle = Meteor.subscribe('session.chat', sessionId, limit);
    
    return {
      messages: ChatMessages.find(
        { sessionId, deletedAt: { $exists: false }},
        { sort: { createdAt: 1 }}
      ).fetch(),
      isLoading: !handle.ready()
    };
  }, [sessionId, limit]);
  
  const sendMessage = useCallback((message: string, code?: { content: string; language: string }) => {
    if (!sessionId) return;
    
    Meteor.call('chat.send', {
      sessionId,
      message,
      code
    });
  }, [sessionId]);
  
  const editMessage = useCallback((messageId: string, message: string) => {
    Meteor.call('chat.edit', messageId, message);
  }, []);
  
  const deleteMessage = useCallback((messageId: string) => {
    Meteor.call('chat.delete', messageId);
  }, []);
  
  const addReaction = useCallback((messageId: string, emoji: string) => {
    Meteor.call('chat.addReaction', messageId, emoji);
  }, []);
  
  return {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction
  };
}
