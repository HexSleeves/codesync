import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Comment } from '../../../api/comments/comments';
import type { MeteorUser, UserProfile, UserServices, MeteorError } from '../../../types';
import { Avatar } from '../common/Avatar';
import { ReactionPicker } from './ReactionPicker';

interface CommentItemProps {
  comment: Comment;
  onReply?: () => void;
  onResolve?: () => void;
  compact?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onResolve,
  compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReactions, setShowReactions] = useState(false);
  
  const author = useTracker(() => {
    return Meteor.users.findOne(comment.author) as MeteorUser | undefined;
  }, [comment.author]);
  
  const currentUserId = useTracker(() => Meteor.userId(), []);
  const isAuthor = currentUserId === comment.author;
  
  const profile = author?.profile as UserProfile | undefined;
  const services = author?.services as UserServices | undefined;
  const authorName = profile?.name || services?.github?.username || author?.emails?.[0]?.address || 'Anonymous';
  
  const handleSaveEdit = () => {
    Meteor.call('comments.update', comment._id, editText, (error: MeteorError | null) => {
      if (!error) {
        setIsEditing(false);
      }
    });
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      Meteor.call('comments.delete', comment._id);
    }
  };
  
  const handleReaction = (emoji: string) => {
    Meteor.call('comments.addReaction', comment._id, emoji);
    setShowReactions(false);
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className={`group ${comment.isResolved ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        <Avatar name={authorName} size={compact ? 'sm' : 'md'} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {authorName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {comment.isResolved && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Resolved
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.text}
            </p>
          )}
          
          {/* Reactions */}
          {comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {comment.reactions.map(reaction => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                    reaction.users.includes(currentUserId || '')
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'bg-gray-100 dark:bg-gray-700'
                  } hover:bg-gray-200 dark:hover:bg-gray-600`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="ml-1 text-gray-600 dark:text-gray-300">{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {!compact && !isEditing && (
            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReply && (
                <button
                  onClick={onReply}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Reply
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  React
                </button>
                {showReactions && (
                  <ReactionPicker
                    onSelect={handleReaction}
                    onClose={() => setShowReactions(false)}
                  />
                )}
              </div>
              
              {onResolve && (
                <button
                  onClick={onResolve}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {comment.isResolved ? 'Unresolve' : 'Resolve'}
                </button>
              )}
              
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
