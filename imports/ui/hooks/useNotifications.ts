import { useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { ChatMessages } from '../../api/chat/chat';
import { Comments } from '../../api/comments/comments';
import type { MeteorUser } from '../../types';

export function useNotifications(sessionId: string | undefined) {
  const currentUser = useTracker(() => Meteor.user() as MeteorUser | null, []);
  const currentUserId = currentUser?._id;
  const profile = currentUser?.profile;
  const services = currentUser?.services;
  const username = profile?.name || services?.github?.username;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in globalThis && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'codesync-mention',
      });
    }
  }, []);

  // Watch for new chat messages that mention the current user
  useTracker(() => {
    if (!sessionId || !username) return;

    const handle = Meteor.subscribe('session.chat', sessionId);
    if (!handle.ready()) return;

    // Get recent messages (last 5 seconds)
    const recentMessages = ChatMessages.find({
      sessionId,
      mentions: username,
      userId: { $ne: currentUserId },
      createdAt: { $gte: new Date(Date.now() - 5000) },
    }).fetch();

    for (const msg of recentMessages) {
      showNotification(`${msg.userName} mentioned you`, msg.message.substring(0, 100));
    }
  }, [sessionId, username, currentUserId, showNotification]);

  // Watch for new comments that mention the current user
  useTracker(() => {
    if (!sessionId || !username) return;

    const handle = Meteor.subscribe('session.comments', sessionId);
    if (!handle.ready()) return;

    // Get recent comments (last 5 seconds)
    const recentComments = Comments.find({
      sessionId,
      mentions: username,
      author: { $ne: currentUserId },
      createdAt: { $gte: new Date(Date.now() - 5000) },
    }).fetch();

    for (const comment of recentComments) {
      showNotification('New mention in comment', comment.text.substring(0, 100));
    }
  }, [sessionId, username, currentUserId, showNotification]);
}
